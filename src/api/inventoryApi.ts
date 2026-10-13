import { getJson, deleteJson, postJsonAuthed, putJson } from '../lib/backendApi'
import { readBackendSessionToken } from '../lib/backendSession'
import { toMinorUnits } from '../lib/money'
import type {
  AllocationInput,
  AllocationStatus,
  InventoryAllocation,
  InventoryItem,
  InventoryItemInput,
  InventoryLocation,
  InventoryMovement,
  InventoryValuation,
  LocationInput,
  MovementInput,
  MovementKind,
  ProjectConsumptionLine,
  Supplier,
  SupplierInput,
  TransferInput,
} from '../types/inventory'

/**
 * Client for /api/v1/inventory.
 *
 * Every endpoint here takes an EXPLICIT workspace id and the backend returns
 * 400 without one - it is never inferred, so a mis-set client cannot write
 * stock into another organisation's books. That is why each function demands
 * `workspaceId` as a required argument rather than defaulting it.
 */

function authToken(): string {
  const token = readBackendSessionToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  return token
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

function workspaceQuery(workspaceId: string, extra: Record<string, string | boolean | undefined> = {}): string {
  const params = new URLSearchParams({ workspace_id: workspaceId })
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== false) params.set(key, String(value))
  }
  return `?${params.toString()}`
}

/**
 * NUMERIC columns arrive as strings from node-postgres - it will not silently
 * narrow an arbitrary-precision number to a float64. Every quantity, threshold
 * and summed cost in this module is NUMERIC, so they all pass through here;
 * skipping it is how `onHand` ends up being string-concatenated in arithmetic.
 */
function num(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function nullableNum(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// ---------------------------------------------------------------------------
// Mapping: backend rows (snake_case, NUMERIC as strings) -> frontend types
// ---------------------------------------------------------------------------

interface ItemRow {
  id: string
  workspace_id: string
  sku: string | null
  name: string
  description: string | null
  unit: string
  unit_cost_minor: number
  currency: string
  category: string | null
  reorder_threshold: string | number | null
  supplier_id: string | null
  archived_at: string | null
  created_at: string
  on_hand?: string | number
  allocated?: string | number
}

function mapItem(row: ItemRow): InventoryItem {
  const onHand = num(row.on_hand)
  const allocated = num(row.allocated)
  const reorderThreshold = nullableNum(row.reorder_threshold)

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    unit: row.unit,
    unitCostMinor: num(row.unit_cost_minor),
    currency: row.currency,
    category: row.category,
    reorderThreshold,
    supplierId: row.supplier_id,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    onHand,
    allocated,
    // Derived here rather than server-side: it is a subtraction of two figures
    // the API already returns, and the reservation rule (availability is
    // on-hand minus reserved) is the same one the backend enforces on write.
    available: onHand - allocated,
    lowStock: reorderThreshold !== null && onHand <= reorderThreshold,
  }
}

interface MovementRow {
  id: string
  item_id: string
  location_id: string | null
  location_name?: string | null
  project_id: string | null
  project_name?: string | null
  kind: MovementKind
  quantity: string | number
  unit_cost_minor: number | null
  note: string | null
  created_by: string | null
  created_by_name?: string | null
  created_at: string
}

function mapMovement(row: MovementRow): InventoryMovement {
  return {
    id: row.id,
    itemId: row.item_id,
    locationId: row.location_id,
    locationName: row.location_name ?? null,
    projectId: row.project_id,
    projectName: row.project_name ?? null,
    kind: row.kind,
    quantity: num(row.quantity),
    unitCostMinor: nullableNum(row.unit_cost_minor),
    note: row.note,
    createdBy: row.created_by,
    createdByName: row.created_by_name ?? null,
    createdAt: row.created_at,
  }
}

interface AllocationRow {
  id: string
  item_id: string
  item_name?: string
  sku?: string | null
  unit?: string
  project_id: string
  quantity: string | number
  status: AllocationStatus
  note: string | null
  created_at: string
}

function mapAllocation(row: AllocationRow): InventoryAllocation {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name ?? '',
    sku: row.sku ?? null,
    unit: row.unit ?? 'each',
    projectId: row.project_id,
    quantity: num(row.quantity),
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
  }
}

interface ConsumptionRow {
  item_id: string
  item_name: string
  sku: string | null
  unit: string
  currency: string
  quantity_consumed: string | number
  cost_minor: string | number
}

function mapConsumption(row: ConsumptionRow): ProjectConsumptionLine {
  return {
    itemId: row.item_id,
    itemName: row.item_name,
    sku: row.sku,
    unit: row.unit,
    currency: row.currency,
    quantityConsumed: num(row.quantity_consumed),
    costMinor: num(row.cost_minor),
  }
}

/** Form values to the request body. `unitCost` is major units on the form; the API takes minor. */
function itemBody(input: InventoryItemInput) {
  return {
    name: input.name,
    sku: input.sku || null,
    category: input.category || null,
    unit: input.unit,
    description: input.description || null,
    unitCostMinor: toMinorUnits(input.unitCost),
    currency: input.currency.toUpperCase(),
    // '' means "stop tracking", which has to reach the API as null rather than 0.
    reorderThreshold: input.reorderThreshold === '' || input.reorderThreshold === undefined ? null : input.reorderThreshold,
    supplierId: input.supplierId || null,
  }
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

export async function fetchInventoryItems(workspaceId: string, includeArchived = false): Promise<InventoryItem[]> {
  const { data } = await getJson<ApiEnvelope<ItemRow[]>>(
    `/inventory/items${workspaceQuery(workspaceId, { include_archived: includeArchived })}`,
    authToken(),
  )
  return data.map(mapItem)
}

export async function createInventoryItem(workspaceId: string, input: InventoryItemInput): Promise<InventoryItem> {
  const { data } = await postJsonAuthed<ApiEnvelope<ItemRow>>(
    `/inventory/items${workspaceQuery(workspaceId)}`,
    itemBody(input),
    authToken(),
  )
  return mapItem(data)
}

export async function updateInventoryItem(
  workspaceId: string,
  itemId: string,
  input: InventoryItemInput,
): Promise<InventoryItem> {
  const { data } = await putJson<ApiEnvelope<ItemRow>>(
    `/inventory/items/${itemId}${workspaceQuery(workspaceId)}`,
    itemBody(input),
    authToken(),
  )
  return mapItem(data)
}

/** Archive, not delete - an item's ledger history is what makes past reports reproducible. */
export async function archiveInventoryItem(workspaceId: string, itemId: string): Promise<InventoryItem> {
  const { data } = await deleteJson<ApiEnvelope<ItemRow>>(
    `/inventory/items/${itemId}${workspaceQuery(workspaceId)}`,
    authToken(),
  )
  return mapItem(data)
}

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

export async function fetchItemMovements(
  workspaceId: string,
  itemId: string,
  limit = 100,
): Promise<InventoryMovement[]> {
  const { data } = await getJson<ApiEnvelope<MovementRow[]>>(
    `/inventory/items/${itemId}/movements${workspaceQuery(workspaceId, { limit: String(limit) })}`,
    authToken(),
  )
  return data.map(mapMovement)
}

export async function recordMovement(workspaceId: string, input: MovementInput): Promise<InventoryMovement> {
  const { data } = await postJsonAuthed<ApiEnvelope<MovementRow>>(
    '/inventory/movements',
    {
      workspaceId,
      itemId: input.itemId,
      kind: input.kind,
      quantity: input.quantity,
      locationId: input.locationId || null,
      projectId: input.projectId || null,
      note: input.note || null,
    },
    authToken(),
  )
  return mapMovement(data)
}

export async function transferStock(workspaceId: string, input: TransferInput): Promise<InventoryMovement[]> {
  const { data } = await postJsonAuthed<ApiEnvelope<MovementRow[]>>(
    '/inventory/transfers',
    {
      workspaceId,
      itemId: input.itemId,
      fromLocationId: input.fromLocationId,
      toLocationId: input.toLocationId,
      quantity: input.quantity,
      note: input.note || null,
    },
    authToken(),
  )
  return data.map(mapMovement)
}

// ---------------------------------------------------------------------------
// Allocations (reservations)
// ---------------------------------------------------------------------------

export async function createAllocation(workspaceId: string, input: AllocationInput): Promise<InventoryAllocation> {
  const { data } = await postJsonAuthed<ApiEnvelope<AllocationRow>>(
    '/inventory/allocations',
    {
      workspaceId,
      itemId: input.itemId,
      projectId: input.projectId,
      quantity: input.quantity,
      note: input.note || null,
    },
    authToken(),
  )
  return mapAllocation(data)
}

export async function fetchProjectAllocations(projectId: string): Promise<InventoryAllocation[]> {
  const { data } = await getJson<ApiEnvelope<AllocationRow[]>>(
    `/inventory/projects/${projectId}/allocations`,
    authToken(),
  )
  return data.map(mapAllocation)
}

/** Issues the reserved stock and closes the reservation in one server-side transaction. */
export async function consumeAllocation(allocationId: string): Promise<void> {
  await postJsonAuthed(`/inventory/allocations/${allocationId}/consume`, {}, authToken())
}

export async function releaseAllocation(allocationId: string): Promise<void> {
  await postJsonAuthed(`/inventory/allocations/${allocationId}/release`, {}, authToken())
}

export async function fetchProjectConsumption(projectId: string): Promise<ProjectConsumptionLine[]> {
  const { data } = await getJson<ApiEnvelope<ConsumptionRow[]>>(
    `/inventory/projects/${projectId}/consumption`,
    authToken(),
  )
  return data.map(mapConsumption)
}

// ---------------------------------------------------------------------------
// Summaries
// ---------------------------------------------------------------------------

export async function fetchLowStock(workspaceId: string): Promise<InventoryItem[]> {
  const { data } = await getJson<ApiEnvelope<ItemRow[]>>(
    `/inventory/low-stock${workspaceQuery(workspaceId)}`,
    authToken(),
  )
  return data.map(mapItem)
}

export async function fetchValuation(workspaceId: string): Promise<InventoryValuation[]> {
  const { data } = await getJson<ApiEnvelope<{ currency: string; value_minor: string | number }[]>>(
    `/inventory/valuation${workspaceQuery(workspaceId)}`,
    authToken(),
  )
  return data.map((row) => ({ currency: row.currency, valueMinor: num(row.value_minor) }))
}

// ---------------------------------------------------------------------------
// Locations and suppliers
// ---------------------------------------------------------------------------

export async function fetchLocations(workspaceId: string): Promise<InventoryLocation[]> {
  const { data } = await getJson<ApiEnvelope<{ id: string; name: string; kind: string; address: string | null }[]>>(
    `/inventory/locations${workspaceQuery(workspaceId)}`,
    authToken(),
  )
  return data.map((row) => ({ id: row.id, name: row.name, kind: row.kind, address: row.address }))
}

export async function createLocation(workspaceId: string, input: LocationInput): Promise<InventoryLocation> {
  const { data } = await postJsonAuthed<ApiEnvelope<{ id: string; name: string; kind: string; address: string | null }>>(
    '/inventory/locations',
    { workspaceId, name: input.name, kind: input.kind, address: input.address || null },
    authToken(),
  )
  return { id: data.id, name: data.name, kind: data.kind, address: data.address }
}

export async function fetchSuppliers(workspaceId: string): Promise<Supplier[]> {
  const { data } = await getJson<
    ApiEnvelope<{ id: string; name: string; email: string | null; phone: string | null; notes: string | null }[]>
  >(`/inventory/suppliers${workspaceQuery(workspaceId)}`, authToken())
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
  }))
}

export async function createSupplier(workspaceId: string, input: SupplierInput): Promise<Supplier> {
  const { data } = await postJsonAuthed<
    ApiEnvelope<{ id: string; name: string; email: string | null; phone: string | null; notes: string | null }>
  >(
    '/inventory/suppliers',
    { workspaceId, name: input.name, email: input.email || null, phone: input.phone || null, notes: input.notes || null },
    authToken(),
  )
  return { id: data.id, name: data.name, email: data.email, phone: data.phone, notes: data.notes }
}
