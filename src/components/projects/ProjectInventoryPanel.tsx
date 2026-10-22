import { useState } from 'react'
import { Package, PackageCheck, PackageX, Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { ReserveStockModal } from '../inventory/ReserveStockModal'
import {
  useConsumeAllocation,
  useInventoryItems,
  useProjectAllocations,
  useProjectConsumption,
  useReleaseAllocation,
} from '../../hooks/useInventoryData'
import { formatMoneyMinor } from '../../lib/money'
import { showToast } from '../../lib/toast'

interface ProjectInventoryPanelProps {
  projectId: string
}

/**
 * What a project has reserved, and what it has actually used.
 *
 * The two are deliberately separate lists rather than one: a reservation is
 * intent and moves no stock, consumption is a ledger entry that did. Showing
 * them together as a single "materials" number is how a project ends up
 * appearing to have spent money it has only earmarked.
 */
export function ProjectInventoryPanel({ projectId }: ProjectInventoryPanelProps) {
  const { data: allocations = [], isLoading: allocationsLoading } = useProjectAllocations(projectId)
  const { data: consumption = [], isLoading: consumptionLoading } = useProjectConsumption(projectId)
  const { data: items = [] } = useInventoryItems()
  const consumeAllocation = useConsumeAllocation()
  const releaseAllocation = useReleaseAllocation()
  const [reserving, setReserving] = useState(false)

  const reserved = allocations.filter((allocation) => allocation.status === 'reserved')
  const totalCostMinor = consumption.reduce((sum, line) => sum + line.costMinor, 0)
  const currency = consumption[0]?.currency ?? 'EUR'
  const loading = allocationsLoading || consumptionLoading

  async function consume(allocationId: string, label: string) {
    try {
      await consumeAllocation.mutateAsync(allocationId)
      showToast('success', `${label} issued to this project`)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not issue this stock')
    }
  }

  async function release(allocationId: string, label: string) {
    try {
      await releaseAllocation.mutateAsync(allocationId)
      showToast('success', `${label} released back to stock`)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not release this reservation')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Materials</h3>
          <p className="text-xs text-slate-400">
            {consumption.length > 0
              ? `${formatMoneyMinor(totalCostMinor, currency)} consumed so far`
              : 'Nothing consumed yet.'}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setReserving(true)}>
          <Plus size={14} strokeWidth={2} />
          Reserve stock
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Reserved {reserved.length > 0 && <span className="font-normal normal-case">({reserved.length})</span>}
            </p>

            {reserved.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-slate-400">
                Nothing reserved. Reserving earmarks stock so another project cannot plan to use the same of it.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {reserved.map((allocation) => {
                  const label = `${allocation.quantity} ${allocation.unit} of ${allocation.itemName}`
                  return (
                    <li
                      key={allocation.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3 py-2.5"
                    >
                      <Package size={15} strokeWidth={2} className="shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-900">
                          {allocation.itemName}
                          {allocation.sku ? <span className="text-slate-400"> · {allocation.sku}</span> : null}
                        </p>
                        <p className="text-xs text-slate-400">
                          {allocation.quantity} {allocation.unit}
                          {allocation.note ? ` · ${allocation.note}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={consumeAllocation.isPending}
                          onClick={() => consume(allocation.id, label)}
                        >
                          <PackageCheck size={13} strokeWidth={2} />
                          Issue
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={releaseAllocation.isPending}
                          onClick={() => release(allocation.id, label)}
                        >
                          <PackageX size={13} strokeWidth={2} />
                          Release
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Consumed</p>

            {consumption.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-slate-400">
                Issue a reservation, or record an issue movement against this project, and it appears here — and in the
                project report.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-slate-400">
                      <th className="py-2 font-medium">Item</th>
                      <th className="py-2 text-right font-medium">Quantity</th>
                      <th className="py-2 text-right font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumption.map((line) => (
                      <tr key={line.itemId} className="border-b border-line/60 last:border-0">
                        <td className="py-2 text-slate-900">
                          {line.itemName}
                          {line.sku ? <span className="text-slate-400"> · {line.sku}</span> : null}
                        </td>
                        <td className="py-2 text-right text-slate-600">
                          {line.quantityConsumed} {line.unit}
                        </td>
                        <td className="py-2 text-right text-slate-600">
                          {formatMoneyMinor(line.costMinor, line.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="pt-2 text-xs text-slate-400" colSpan={2}>
                        Valued at the cost recorded on each movement, not today's price.
                      </td>
                      <td className="pt-2 text-right text-sm font-semibold text-slate-900">
                        {formatMoneyMinor(totalCostMinor, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {reserving && (
        <ReserveStockModal items={items} initialProjectId={projectId} onClose={() => setReserving(false)} />
      )}
    </div>
  )
}
