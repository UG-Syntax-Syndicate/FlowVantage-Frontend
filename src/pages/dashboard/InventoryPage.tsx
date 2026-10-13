import { useMemo, useState } from 'react'
import { ArrowUpDown, ChevronDown, MapPin, Package, PackagePlus, Plus, Repeat, TriangleAlert } from 'lucide-react'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { StatCard } from '../../components/dashboard/StatCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Switch } from '../../components/ui/switch'
import { Label } from '../../components/ui/label'
import { TableRowsSkeleton } from '../../components/common/skeletons/TableRowsSkeleton'
import { Pagination, type PageSize } from '../../components/common/Pagination'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { ItemFormModal } from '../../components/inventory/ItemFormModal'
import { ItemDetailSheet } from '../../components/inventory/ItemDetailSheet'
import { RecordMovementModal } from '../../components/inventory/RecordMovementModal'
import { TransferStockModal } from '../../components/inventory/TransferStockModal'
import { ReserveStockModal } from '../../components/inventory/ReserveStockModal'
import { LocationsSuppliersSheet } from '../../components/inventory/LocationsSuppliersSheet'
import {
  useArchiveInventoryItem,
  useInventoryItems,
  useInventoryValuation,
  useLowStock,
} from '../../hooks/useInventoryData'
import { formatMoneyMinor } from '../../lib/money'
import { showToast } from '../../lib/toast'
import type { InventoryItem } from '../../types/inventory'

const ALL_CATEGORIES = 'All categories'

type SortField = 'name' | 'sku' | 'category' | 'onHand' | 'available' | 'unitCostMinor'
type SortDir = 'asc' | 'desc'

const COLUMNS: { key: SortField; label: string; numeric?: boolean }[] = [
  { key: 'name', label: 'Item' },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'onHand', label: 'On hand', numeric: true },
  { key: 'available', label: 'Available', numeric: true },
  { key: 'unitCostMinor', label: 'Unit cost', numeric: true },
]

/** Which modal is open. One piece of state rather than six booleans, so two cannot open at once. */
type ActiveModal =
  | { kind: 'none' }
  | { kind: 'item'; item: InventoryItem | null }
  | { kind: 'movement'; itemId?: string }
  | { kind: 'transfer'; itemId?: string }
  | { kind: 'reserve'; itemId?: string }
  | { kind: 'references' }

function compare(a: InventoryItem, b: InventoryItem, field: SortField): number {
  const left = a[field]
  const right = b[field]
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left ?? '').localeCompare(String(right ?? ''))
}

export function InventoryPage() {
  const [includeArchived, setIncludeArchived] = useState(false)
  const { data: items = [], isLoading } = useInventoryItems(includeArchived)
  const { data: lowStock = [] } = useLowStock()
  const { data: valuation = [] } = useInventoryValuation()
  const archiveItem = useArchiveInventoryItem()

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pageSize, setPageSize] = useState<PageSize>(25)
  const [page, setPage] = useState(1)
  const [viewingItemId, setViewingItemId] = useState<string | null>(null)
  const [modal, setModal] = useState<ActiveModal>({ kind: 'none' })
  const [archivingItem, setArchivingItem] = useState<InventoryItem | null>(null)

  const categories = useMemo(
    () => [ALL_CATEGORIES, ...Array.from(new Set(items.map((item) => item.category).filter(Boolean) as string[])).sort()],
    [items],
  )

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return items.filter((item) => {
      if (categoryFilter !== ALL_CATEGORIES && item.category !== categoryFilter) return false
      if (!query) return true
      return `${item.name} ${item.sku ?? ''} ${item.category ?? ''}`.toLowerCase().includes(query)
    })
  }, [items, categoryFilter, searchQuery])

  const sorted = useMemo(() => {
    if (!sortField) return filtered
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => compare(a, b, sortField) * dir)
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const viewingItem = items.find((item) => item.id === viewingItemId)

  // Valuation comes back per currency, because a workspace can hold stock
  // priced in more than one. Summing across currencies would be meaningless, so
  // they are joined for display instead.
  const valuationLabel =
    valuation.length === 0
      ? formatMoneyMinor(0)
      : valuation.map((entry) => formatMoneyMinor(entry.valueMinor, entry.currency)).join(' · ')

  function updateFilters(update: () => void) {
    update()
    setPage(1)
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  async function confirmArchive() {
    if (!archivingItem) return
    try {
      await archiveItem.mutateAsync(archivingItem.id)
      showToast('success', `“${archivingItem.name}” archived`)
      // Closing the detail sheet too: it is showing a row that has just left
      // the default list.
      setViewingItemId(null)
    } catch {
      showToast('error', 'Could not archive this item')
    } finally {
      setArchivingItem(null)
    }
  }

  const hasNoItems = !isLoading && items.length === 0

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar
        title="Inventory"
        subtitle="Stock, movements and what each project has consumed."
        searchPlaceholder="Search items, SKUs, categories..."
        searchValue={searchQuery}
        onSearchChange={(value) => updateFilters(() => setSearchQuery(value))}
        actions={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                  <Plus size={14} strokeWidth={2} />
                  Record
                  <ChevronDown size={14} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => setModal({ kind: 'movement' })}>
                  <PackagePlus size={14} strokeWidth={2} />
                  Stock movement
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setModal({ kind: 'transfer' })}>
                  <Repeat size={14} strokeWidth={2} />
                  Transfer between locations
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setModal({ kind: 'reserve' })}>
                  <Package size={14} strokeWidth={2} />
                  Reserve for a project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setModal({ kind: 'references' })}>
                  <MapPin size={14} strokeWidth={2} />
                  Locations &amp; suppliers
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" size="sm" onClick={() => setModal({ kind: 'item', item: null })}>
              <Plus size={14} strokeWidth={2} />
              Add Item
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-4">
        <StatCard
          icon={Package}
          label="Items in catalogue"
          value={items.filter((item) => !item.archivedAt).length}
          variant="primary"
          shadowClass="shadow-[0px_10px_30px_0px_rgba(236,114,29,0.28)]"
        />
        <StatCard
          icon={TriangleAlert}
          label="Items low on stock"
          value={lowStock.length}
          variant="default"
          shadowClass="shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)]"
        />
        <StatCard
          icon={PackagePlus}
          label="Stock on hand, at cost"
          value={valuationLabel}
          variant="default"
          shadowClass="shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)]"
        />
      </div>

      {lowStock.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <TriangleAlert size={16} strokeWidth={2} className="shrink-0" />
          <span>
            {lowStock.length === 1
              ? `${lowStock[0].name} is at or below its reorder threshold.`
              : `${lowStock.length} items are at or below their reorder threshold:`}
          </span>
          {lowStock.length > 1 && (
            <span className="font-medium">
              {lowStock
                .slice(0, 4)
                .map((item) => item.name)
                .join(', ')}
              {lowStock.length > 4 ? ` and ${lowStock.length - 4} more` : ''}
            </span>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-white shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 text-base font-semibold text-slate-900 outline-none">
              {categoryFilter}
              <ChevronDown size={16} strokeWidth={2} className="text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 w-52 overflow-y-auto">
              <DropdownMenuRadioGroup
                value={categoryFilter}
                onValueChange={(value) => updateFilters(() => setCategoryFilter(value))}
              >
                {categories.map((category) => (
                  <DropdownMenuRadioItem key={category} value={category} className="px-2 py-1.5">
                    {category}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="include-archived"
                checked={includeArchived}
                onCheckedChange={(checked) => updateFilters(() => setIncludeArchived(checked))}
              />
              <Label htmlFor="include-archived" className="text-xs text-slate-500">
                Show archived
              </Label>
            </div>
            <span className="text-xs text-slate-400">{sorted.length} items</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow className="border-b border-line text-left text-xs font-medium text-slate-400 hover:bg-transparent">
                {COLUMNS.map((column) => (
                  <TableHead key={column.key} className={column.numeric ? 'text-right' : undefined}>
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={`flex items-center gap-1 font-medium hover:text-slate-600 ${
                        column.numeric ? 'ml-auto' : ''
                      } ${sortField === column.key ? 'text-slate-700' : ''}`}
                    >
                      {column.label}
                      <ArrowUpDown size={12} strokeWidth={2} />
                    </button>
                  </TableHead>
                ))}
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRowsSkeleton rows={8} columns={8} />
              ) : (
                pageItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer border-b border-line/70 text-sm hover:bg-slate-50"
                    onClick={() => setViewingItemId(item.id)}
                  >
                    <TableCell className="font-medium text-slate-900">
                      {item.name}
                      <span className="block text-xs font-normal text-slate-400">per {item.unit}</span>
                    </TableCell>
                    <TableCell className="text-slate-500">{item.sku || '—'}</TableCell>
                    <TableCell className="text-slate-500">{item.category || '—'}</TableCell>
                    <TableCell className="text-right text-slate-900">{item.onHand}</TableCell>
                    <TableCell className="text-right text-slate-900">
                      {item.available}
                      {item.allocated > 0 && (
                        <span className="block text-xs font-normal text-slate-400">{item.allocated} reserved</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-slate-500">
                      {formatMoneyMinor(item.unitCostMinor, item.currency)}
                    </TableCell>
                    <TableCell>
                      {item.archivedAt ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          Archived
                        </span>
                      ) : item.lowStock ? (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                          Low stock
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                          In stock
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Stops a menu click bubbling up into the row's open-detail handler. */}
                      <div onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 outline-none hover:bg-slate-100">
                            Actions
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={() => setModal({ kind: 'movement', itemId: item.id })}>
                              Record movement
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setModal({ kind: 'reserve', itemId: item.id })}>
                              Reserve for a project
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setModal({ kind: 'transfer', itemId: item.id })}>
                              Transfer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setModal({ kind: 'item', item })}>Edit item</DropdownMenuItem>
                            {!item.archivedAt && (
                              <DropdownMenuItem onSelect={() => setArchivingItem(item)}>Archive</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {hasNoItems && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
                <Package size={24} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">No items yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  Add what you keep in stock, then record a receipt to put it on hand. Nothing here sets a quantity
                  directly — every figure comes from a movement.
                </p>
              </div>
              <Button type="button" size="sm" onClick={() => setModal({ kind: 'item', item: null })}>
                <Plus size={14} strokeWidth={2} />
                Add your first item
              </Button>
            </div>
          )}

          {!isLoading && items.length > 0 && pageItems.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">No items match your filters.</p>
          )}
        </div>

        {sorted.length > 0 && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => updateFilters(() => setPageSize(size))}
          />
        )}
      </div>

      {viewingItem && (
        <ItemDetailSheet
          item={viewingItem}
          onClose={() => setViewingItemId(null)}
          onEdit={() => setModal({ kind: 'item', item: viewingItem })}
          onArchive={() => setArchivingItem(viewingItem)}
        />
      )}

      {modal.kind === 'item' && <ItemFormModal item={modal.item} onClose={() => setModal({ kind: 'none' })} />}
      {modal.kind === 'movement' && (
        <RecordMovementModal items={items} initialItemId={modal.itemId} onClose={() => setModal({ kind: 'none' })} />
      )}
      {modal.kind === 'transfer' && (
        <TransferStockModal items={items} initialItemId={modal.itemId} onClose={() => setModal({ kind: 'none' })} />
      )}
      {modal.kind === 'reserve' && (
        <ReserveStockModal items={items} initialItemId={modal.itemId} onClose={() => setModal({ kind: 'none' })} />
      )}
      {modal.kind === 'references' && <LocationsSuppliersSheet onClose={() => setModal({ kind: 'none' })} />}

      {archivingItem && (
        <ConfirmDialog
          open
          title={`Archive “${archivingItem.name}”?`}
          description="Archived items stay out of the catalogue but keep their movement history, so past project reports stay reproducible. You can show them again with the “Show archived” toggle."
          confirmLabel="Archive"
          loading={archiveItem.isPending}
          onConfirm={confirmArchive}
          onCancel={() => setArchivingItem(null)}
        />
      )}
    </div>
  )
}
