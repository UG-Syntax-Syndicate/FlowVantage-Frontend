import { ArrowDownLeft, ArrowUpRight, Pencil, Archive } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { useItemMovements } from '../../hooks/useInventoryData'
import { MOVEMENT_KIND_LABELS, type InventoryItem } from '../../types/inventory'
import { formatMoneyMinor } from '../../lib/money'
import { formatDateTime } from '../../lib/formatDate'

interface ItemDetailSheetProps {
  item: InventoryItem
  onClose: () => void
  onEdit: () => void
  onArchive: () => void
}

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-slate-50/60 px-3 py-2.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

/**
 * One item, with its movement ledger.
 *
 * The ledger is the point of this view: on-hand is not a stored number, it is
 * the sum of these rows. Showing them is what lets someone answer "why does it
 * say 40?" without a database query - every entry carries who recorded it,
 * when, what kind of movement it was and which project it was for.
 */
export function ItemDetailSheet({ item, onClose, onEdit, onArchive }: ItemDetailSheetProps) {
  const { data: movements = [], isLoading } = useItemMovements(item.id)

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b border-line px-5 py-4">
          <SheetTitle className="text-base font-semibold text-slate-900">{item.name}</SheetTitle>
          <SheetDescription className="text-xs text-slate-400">
            {[item.sku, item.category].filter(Boolean).join(' · ') || 'No SKU or category'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            <Figure label="On hand" value={`${item.onHand}`} hint={item.unit} />
            <Figure label="Reserved" value={`${item.allocated}`} hint={item.unit} />
            <Figure label="Available" value={`${item.available}`} hint={item.unit} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Figure label="Unit cost" value={formatMoneyMinor(item.unitCostMinor, item.currency)} />
            <Figure
              label="Stock value"
              value={formatMoneyMinor(item.onHand * item.unitCostMinor, item.currency)}
              hint="On hand × unit cost"
            />
          </div>

          {item.reorderThreshold !== null && (
            <p className={`text-xs ${item.lowStock ? 'text-rose-600' : 'text-slate-400'}`}>
              {item.lowStock ? 'Below' : 'Reorder at'} {item.reorderThreshold} {item.unit}
            </p>
          )}

          {item.description && <p className="text-sm text-slate-600">{item.description}</p>}

          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              <Pencil size={14} strokeWidth={2} />
              Edit
            </Button>
            {!item.archivedAt && (
              <Button type="button" size="sm" variant="ghost" onClick={onArchive}>
                <Archive size={14} strokeWidth={2} />
                Archive
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-line px-5 py-4">
          <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Movement history</p>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No movements yet. Record a receipt to put this item into stock.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {movements.map((movement) => {
                const incoming = movement.quantity > 0
                return (
                  <li key={movement.id} className="flex gap-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        incoming ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}
                      aria-hidden
                    >
                      {incoming ? <ArrowDownLeft size={14} strokeWidth={2.2} /> : <ArrowUpRight size={14} strokeWidth={2.2} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">
                          {incoming ? '+' : ''}
                          {movement.quantity} {item.unit}
                        </span>
                        <span className="text-slate-500"> · {MOVEMENT_KIND_LABELS[movement.kind]}</span>
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {[
                          formatDateTime(movement.createdAt),
                          movement.createdByName,
                          movement.projectName,
                          movement.locationName,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {movement.note && <p className="mt-0.5 text-xs text-slate-500">{movement.note}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
