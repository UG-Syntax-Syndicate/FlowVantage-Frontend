import { useMemo, useState } from 'react'
import { ArrowDownUp, Filter, ListTree } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { formatShortDate } from '../../lib/formatDate'
import { isTaskOverdue } from '../../lib/taskStats'
import type { Task } from '../../types/project'

type SortKey = 'progress' | 'due' | 'name'

/**
 * A phase of the project: one group of tasks that share a tag.
 *
 * Tags are the grouping because they are the only thing in the data model
 * that says "these tasks belong together" - there is no milestone table, and
 * inventing one would mean every existing project showed an empty timeline.
 * Tasks with no tag collect under a single "Untagged" phase rather than
 * becoming one phase each.
 */
interface Phase {
  name: string
  tasks: Task[]
  completed: number
  progress: number
  endDate: string | null
  overdue: boolean
}

const UNTAGGED = 'Untagged'

function buildPhases(tasks: Task[]): Phase[] {
  const byTag = new Map<string, Task[]>()

  for (const task of tasks) {
    // First tag only. A task tagged both "design" and "urgent" belongs to one
    // phase, and counting it in two would make the percentages add up to more
    // than the work that exists.
    const tag = task.tags[0]?.trim() || UNTAGGED
    const existing = byTag.get(tag)
    if (existing) existing.push(task)
    else byTag.set(tag, [task])
  }

  return [...byTag.entries()].map(([name, phaseTasks]) => {
    const completed = phaseTasks.filter((task) => task.status === 'done').length
    const dueDates = phaseTasks
      .map((task) => task.dueDate)
      .filter(Boolean)
      .sort()

    return {
      name,
      tasks: phaseTasks,
      completed,
      progress: Math.round((completed / phaseTasks.length) * 100),
      endDate: dueDates.at(-1) ?? null,
      overdue: phaseTasks.some((task) => isTaskOverdue(task)),
    }
  })
}

function phaseStatus(phase: Phase): { label: string; className: string } {
  if (phase.progress === 100) return { label: 'Completed', className: 'bg-emerald-50 text-emerald-700' }
  if (phase.overdue) return { label: 'Overdue', className: 'bg-rose-50 text-rose-700' }
  if (phase.completed > 0 || phase.tasks.some((task) => task.status !== 'todo')) {
    return { label: 'In Progress', className: 'bg-accent-100 text-accent-700' }
  }
  return { label: 'Not started', className: 'bg-slate-100 text-slate-500' }
}

interface ProjectTimelinePanelProps {
  tasks: Task[]
}

export function ProjectTimelinePanel({ tasks }: ProjectTimelinePanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>('due')
  const [hideCompleted, setHideCompleted] = useState(false)

  const phases = useMemo(() => {
    const built = buildPhases(tasks)
    const visible = hideCompleted ? built.filter((phase) => phase.progress < 100) : built

    return visible.sort((a, b) => {
      if (sortKey === 'progress') return b.progress - a.progress
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      // By due date, and a phase with no dated tasks sorts last rather than
      // first - an empty string would otherwise sort above every real date.
      if (!a.endDate) return 1
      if (!b.endDate) return -1
      return a.endDate.localeCompare(b.endDate)
    })
  }, [tasks, sortKey, hideCompleted])

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Timeline and Progress</h2>

        <div className="flex items-center gap-1 text-slate-400">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Sort phases"
              className="rounded-lg p-1.5 outline-none hover:bg-slate-100 hover:text-slate-600"
            >
              <ArrowDownUp size={15} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                <DropdownMenuRadioItem value="due">Due date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="progress">Progress</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Filter phases"
              className="rounded-lg p-1.5 outline-none hover:bg-slate-100 hover:text-slate-600"
            >
              <Filter size={15} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={hideCompleted}
                onCheckedChange={(checked) => setHideCompleted(Boolean(checked))}
              >
                Hide completed phases
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {phases.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <ListTree size={22} strokeWidth={1.8} className="text-slate-300" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600">
            {tasks.length === 0 ? 'No tasks yet' : 'Every phase is complete'}
          </p>
          <p className="max-w-[18rem] text-xs text-slate-400">
            {tasks.length === 0
              ? 'Add tasks to this project and tag them, and each tag becomes a phase here.'
              : 'Clear the filter to see the finished phases again.'}
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {phases.map((phase) => {
            const status = phaseStatus(phase)
            return (
              <li
                key={phase.name}
                className="rounded-xl border border-line bg-surface/60 px-4 py-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">{phase.name}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <p className="mt-2 text-lg font-bold text-slate-900">{phase.progress}%</p>
                <div
                  className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
                  role="progressbar"
                  aria-valuenow={phase.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${phase.name} progress`}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>

                <p className="mt-1.5 text-[11px] text-slate-400">
                  {phase.completed} of {phase.tasks.length} done
                  {phase.endDate && ` · ends ${formatShortDate(phase.endDate)}`}
                </p>

                <ol className="mt-3 flex list-inside list-decimal flex-col gap-1">
                  {/* Capped: a phase with forty tasks would push every other
                      phase off the panel, and this is a summary rather than
                      the task list, which the Timeline tab holds in full. */}
                  {phase.tasks.slice(0, 4).map((task) => (
                    <li
                      key={task.id}
                      className={`text-xs ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-600'}`}
                    >
                      {task.title}
                      {task.dueDate && (
                        <span className="text-slate-400"> (Due: {formatShortDate(task.dueDate)})</span>
                      )}
                    </li>
                  ))}
                </ol>
                {phase.tasks.length > 4 && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    +{phase.tasks.length - 4} more in this phase
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
