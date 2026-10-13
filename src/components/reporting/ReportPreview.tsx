import { Skeleton } from '../ui/skeleton'
import { formatMoneyMinor } from '../../lib/money'
import { formatDateTime } from '../../lib/formatDate'
import type { ProjectReportData } from '../../types/report'

/**
 * An in-app preview of a project report.
 *
 * Rendered from GET /report-data - the exact payload the DOCX and PDF
 * renderers consume - so the preview cannot show figures the download then
 * contradicts. That is the whole reason that endpoint exists; building this
 * from the projects API instead would reintroduce the drift it was added to
 * prevent.
 */

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/60 py-1.5 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  )
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {title}
        {count !== undefined && <span className="ml-1.5 font-normal normal-case">({count})</span>}
      </h3>
      {children}
    </section>
  )
}

export function ReportPreviewSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  )
}

export function ReportPreview({ data }: { data: ProjectReportData }) {
  const { summary, inventory } = data

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">{data.project.name}</h2>
        <p className="text-xs text-slate-400">
          Generated {formatDateTime(data.generatedAt)} · {summary.memberCount} member
          {summary.memberCount === 1 ? '' : 's'}
        </p>
      </header>

      <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
        <Row label="Status" value={summary.status} />
        <Row label="Client" value={summary.client} />
        <Row label="Start date" value={summary.startDate} />
        <Row label="Due date" value={summary.dueDate} />
        <Row label="Tasks" value={`${summary.tasksDone} / ${summary.taskCount} (${summary.taskCompletion}%)`} />
        <Row label="Checklist" value={`${summary.todosDone} / ${summary.todoCount} (${summary.todoCompletion}%)`} />
        <Row label="Overdue tasks" value={summary.overdueTasks} />
        <Row label="Tracked time" value={summary.trackedTime} />
        <Row label="Documents" value={summary.documentCount} />
        <Row label="Notes" value={summary.noteCount} />
        <Row label="Materials consumed" value={summary.inventoryCostFormatted} />
      </div>

      {inventory.consumption.length > 0 && (
        <Section title="Materials consumed" count={inventory.consumption.length}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-slate-400">
                <th className="py-1.5 font-medium">Item</th>
                <th className="py-1.5 text-right font-medium">Quantity</th>
                <th className="py-1.5 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {inventory.consumption.map((line) => (
                <tr key={line.item_id} className="border-b border-line/60 last:border-0">
                  <td className="py-1.5 text-slate-900">
                    {line.item_name}
                    {line.sku ? <span className="text-slate-400"> · {line.sku}</span> : null}
                  </td>
                  <td className="py-1.5 text-right text-slate-600">
                    {Number(line.quantity_consumed)} {line.unit}
                  </td>
                  <td className="py-1.5 text-right text-slate-600">
                    {formatMoneyMinor(Number(line.cost_minor), line.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {inventory.allocations.length > 0 && (
        <Section title="Still reserved" count={inventory.allocations.length}>
          <ul className="flex flex-col gap-1 text-sm text-slate-600">
            {inventory.allocations.map((allocation) => (
              <li key={allocation.id}>
                {allocation.item_name} — {Number(allocation.quantity)} {allocation.unit}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {data.tasks.length > 0 && (
        <Section title="Tasks" count={data.tasks.length}>
          <ul className="flex flex-col gap-1 text-sm">
            {data.tasks.slice(0, 12).map((task) => (
              <li key={task.id} className="flex items-baseline justify-between gap-3">
                <span className={task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}>
                  {task.title}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {[task.assignee_name, task.due_date].filter(Boolean).join(' · ') || task.status}
                </span>
              </li>
            ))}
          </ul>
          {data.tasks.length > 12 && (
            <p className="text-xs text-slate-400">
              The download lists all {data.tasks.length}; this preview shows the first 12.
            </p>
          )}
        </Section>
      )}

      {data.milestones.length > 0 && (
        <Section title="Timeline" count={data.milestones.length}>
          <ul className="flex flex-col gap-1 text-sm text-slate-600">
            {data.milestones.map((milestone, index) => (
              <li key={`${milestone.title}-${index}`}>
                {milestone.title} — {formatDateTime(milestone.start_time)}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="border-t border-line pt-3 text-xs text-slate-400">
        The downloaded document also carries the activity trail, notes, documents and the “Powered by FlowVantage”
        attribution.
      </p>
    </div>
  )
}
