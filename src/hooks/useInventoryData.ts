import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import * as inventoryApi from '../api/inventoryApi'
import { useAuth } from './useAuth'
import { useWorkspace } from './useWorkspace'
import type {
  AllocationInput,
  InventoryItemInput,
  LocationInput,
  MovementInput,
  SupplierInput,
  TransferInput,
} from '../types/inventory'

/**
 * Inventory is workspace-scoped on the server with no fallback: every endpoint
 * requires an explicit `workspace_id` and 400s without one. So every hook here
 * is gated on `activeWorkspaceId` as well as the session token, and the
 * workspace id is part of the query key - without that, switching workspace
 * would serve the previous organisation's stock from cache (the same bug the
 * projects/tasks hooks were fixed for).
 */

/** Anything that changes stock can change the catalogue figures, the low-stock list and the valuation, so they invalidate together. */
function useInvalidateInventory() {
  const queryClient = useQueryClient()
  return () => {
    // The bare base keys: React Query prefix-matches, so this also covers the
    // workspace-scoped list key and the per-item movement ledgers.
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory })
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLowStock })
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryValuation })
  }
}

export function useInventoryItems(includeArchived = false) {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.inventory, activeWorkspaceId, includeArchived],
    queryFn: () => inventoryApi.fetchInventoryItems(activeWorkspaceId as string, includeArchived),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useInventoryLocations() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.inventoryLocations, activeWorkspaceId],
    queryFn: () => inventoryApi.fetchLocations(activeWorkspaceId as string),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useSuppliers() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.inventorySuppliers, activeWorkspaceId],
    queryFn: () => inventoryApi.fetchSuppliers(activeWorkspaceId as string),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useLowStock() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.inventoryLowStock, activeWorkspaceId],
    queryFn: () => inventoryApi.fetchLowStock(activeWorkspaceId as string),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useInventoryValuation() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.inventoryValuation, activeWorkspaceId],
    queryFn: () => inventoryApi.fetchValuation(activeWorkspaceId as string),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

/**
 * One item's movement ledger. Only fetched when a detail view is open, which is
 * why `itemId` is nullable - the alternative is a hook per row.
 */
export function useItemMovements(itemId: string | null) {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: queryKeys.itemMovements(itemId ?? 'none'),
    queryFn: () => inventoryApi.fetchItemMovements(activeWorkspaceId as string, itemId as string),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId) && Boolean(itemId),
  })
}

export function useProjectAllocations(projectId: string | null) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.projectAllocations(projectId ?? 'none'),
    queryFn: () => inventoryApi.fetchProjectAllocations(projectId as string),
    enabled: Boolean(backendSessionToken) && Boolean(projectId),
  })
}

export function useProjectConsumption(projectId: string | null) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.projectConsumption(projectId ?? 'none'),
    queryFn: () => inventoryApi.fetchProjectConsumption(projectId as string),
    enabled: Boolean(backendSessionToken) && Boolean(projectId),
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateInventoryItem() {
  const { activeWorkspaceId } = useWorkspace()
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: (input: InventoryItemInput) => inventoryApi.createInventoryItem(activeWorkspaceId as string, input),
    onSuccess: invalidate,
  })
}

export function useUpdateInventoryItem() {
  const { activeWorkspaceId } = useWorkspace()
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: InventoryItemInput }) =>
      inventoryApi.updateInventoryItem(activeWorkspaceId as string, itemId, input),
    onSuccess: invalidate,
  })
}

export function useArchiveInventoryItem() {
  const { activeWorkspaceId } = useWorkspace()
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: (itemId: string) => inventoryApi.archiveInventoryItem(activeWorkspaceId as string, itemId),
    onSuccess: invalidate,
  })
}

export function useRecordMovement() {
  const { activeWorkspaceId } = useWorkspace()
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: (input: MovementInput) => inventoryApi.recordMovement(activeWorkspaceId as string, input),
    onSuccess: invalidate,
  })
}

export function useTransferStock() {
  const { activeWorkspaceId } = useWorkspace()
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: (input: TransferInput) => inventoryApi.transferStock(activeWorkspaceId as string, input),
    onSuccess: invalidate,
  })
}

export function useCreateAllocation() {
  const { activeWorkspaceId } = useWorkspace()
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: (input: AllocationInput) => inventoryApi.createAllocation(activeWorkspaceId as string, input),
    onSuccess: invalidate,
  })
}

/** Issues reserved stock and closes the reservation - one server-side transaction, so they cannot drift apart. */
export function useConsumeAllocation() {
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: (allocationId: string) => inventoryApi.consumeAllocation(allocationId),
    onSuccess: invalidate,
  })
}

export function useReleaseAllocation() {
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: (allocationId: string) => inventoryApi.releaseAllocation(allocationId),
    onSuccess: invalidate,
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspace()
  return useMutation({
    mutationFn: (input: LocationInput) => inventoryApi.createLocation(activeWorkspaceId as string, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLocations }),
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspace()
  return useMutation({
    mutationFn: (input: SupplierInput) => inventoryApi.createSupplier(activeWorkspaceId as string, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventorySuppliers }),
  })
}
