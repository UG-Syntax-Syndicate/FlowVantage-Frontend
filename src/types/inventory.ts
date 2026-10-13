import { z } from 'zod'

/**
 * Inventory is an append-only movement ledger: nothing updates a stock
 * quantity in place. On-hand is derived server-side as SUM(quantity) over the
 * ledger, with the sign coming from the movement kind, so every figure in this
 * module traces back to an entry someone made.
 *
 * Money is in minor units (cents) as an integer throughout, matching the
 * backend - a float amount silently loses fractions once it is summed across a
 * report.
 */

export const MovementKindSchema = z.enum([
  'receipt',
  'issue',
  'return',
  'adjustment',
  'write_off',
  'transfer_out',
  'transfer_in',
])
export type MovementKind = z.infer<typeof MovementKindSchema>

/** The kinds a user can record directly. Transfers go through their own endpoint, which writes both sides in one transaction. */
export const RECORDABLE_MOVEMENT_KINDS = ['receipt', 'issue', 'return', 'adjustment', 'write_off'] as const
export type RecordableMovementKind = (typeof RECORDABLE_MOVEMENT_KINDS)[number]

export const MOVEMENT_KIND_LABELS: Record<MovementKind, string> = {
  receipt: 'Received',
  issue: 'Issued',
  return: 'Returned',
  adjustment: 'Adjusted',
  write_off: 'Written off',
  transfer_out: 'Transferred out',
  transfer_in: 'Transferred in',
}

export const AllocationStatusSchema = z.enum(['reserved', 'consumed', 'released'])
export type AllocationStatus = z.infer<typeof AllocationStatusSchema>

export interface InventoryItem {
  id: string
  workspaceId: string
  sku: string | null
  name: string
  description: string | null
  unit: string
  unitCostMinor: number
  currency: string
  category: string | null
  reorderThreshold: number | null
  supplierId: string | null
  archivedAt: string | null
  createdAt: string
  /** Derived from the ledger. */
  onHand: number
  /** Reserved but not yet issued. */
  allocated: number
  /** `onHand - allocated` - what another project could still claim. */
  available: number
  /** True when a threshold is set and on-hand has reached it. */
  lowStock: boolean
}

export interface InventoryMovement {
  id: string
  itemId: string
  locationId: string | null
  locationName: string | null
  projectId: string | null
  projectName: string | null
  kind: MovementKind
  /** Signed: negative for issues, write-offs and transfers out. */
  quantity: number
  unitCostMinor: number | null
  note: string | null
  createdBy: string | null
  createdByName: string | null
  createdAt: string
}

export interface InventoryAllocation {
  id: string
  itemId: string
  itemName: string
  sku: string | null
  unit: string
  projectId: string
  quantity: number
  status: AllocationStatus
  note: string | null
  createdAt: string
}

export interface InventoryLocation {
  id: string
  name: string
  kind: string
  address: string | null
}

export interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
}

/** One line of what a project has consumed, valued at the cost recorded on each movement. */
export interface ProjectConsumptionLine {
  itemId: string
  itemName: string
  sku: string | null
  unit: string
  currency: string
  quantityConsumed: number
  costMinor: number
}

export interface InventoryValuation {
  currency: string
  valueMinor: number
}

// ---------------------------------------------------------------------------
// Form inputs
// ---------------------------------------------------------------------------

/**
 * Cost is entered as a major-unit amount ("12.50") because that is how people
 * think about money, and converted to minor units at the API boundary. The
 * backend rejects a fractional minor unit outright, so the conversion has to
 * round rather than pass a float through.
 */
const optionalText = z.string().trim().max(200).optional()

export const InventoryItemInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  sku: optionalText,
  category: optionalText,
  unit: z.string().trim().min(1, 'Unit is required').max(40),
  description: z.string().trim().max(2000).optional(),
  unitCost: z.coerce.number().min(0, 'Cost cannot be negative'),
  currency: z.string().trim().length(3, 'Use a 3-letter currency code'),
  // Empty means "do not track", which is distinct from a threshold of zero.
  reorderThreshold: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  supplierId: z.string().optional(),
})
export type InventoryItemInput = z.infer<typeof InventoryItemInputSchema>

export const MovementInputSchema = z.object({
  itemId: z.string().min(1, 'Pick an item'),
  kind: z.enum(RECORDABLE_MOVEMENT_KINDS),
  // Signed only for an adjustment, which is a stock-take correction; the
  // backend applies the sign for every other kind from the movement type.
  quantity: z.coerce.number().refine((value) => value !== 0, 'Quantity must not be zero'),
  locationId: z.string().optional(),
  projectId: z.string().optional(),
  note: z.string().trim().max(500).optional(),
})
export type MovementInput = z.infer<typeof MovementInputSchema>

export const TransferInputSchema = z
  .object({
    itemId: z.string().min(1, 'Pick an item'),
    fromLocationId: z.string().min(1, 'Pick where the stock is now'),
    toLocationId: z.string().min(1, 'Pick where it is going'),
    quantity: z.coerce.number().positive('Quantity must be positive'),
    note: z.string().trim().max(500).optional(),
  })
  .refine((value) => value.fromLocationId !== value.toLocationId, {
    message: 'Pick two different locations',
    path: ['toLocationId'],
  })
export type TransferInput = z.infer<typeof TransferInputSchema>

export const AllocationInputSchema = z.object({
  itemId: z.string().min(1, 'Pick an item'),
  projectId: z.string().min(1, 'Pick a project'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  note: z.string().trim().max(500).optional(),
})
export type AllocationInput = z.infer<typeof AllocationInputSchema>

export const LocationInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  kind: z.enum(['warehouse', 'site', 'vehicle', 'other']),
  address: z.string().trim().max(300).optional(),
})
export type LocationInput = z.infer<typeof LocationInputSchema>

export const SupplierInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email: z.union([z.string().trim().email('Enter a valid email'), z.literal('')]).optional(),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1000).optional(),
})
export type SupplierInput = z.infer<typeof SupplierInputSchema>
