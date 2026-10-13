import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PROJECT_STATUS_META } from '../../types/statusMeta'
import { isTaskOverdue } from '../../lib/taskStats'
import type { Member, Project, ProjectStatus, Task } from '../../types/project'

/**
 * Cross-project analytics, computed in the browser.
 *
 * The reporting API is deliberately per-project, and adding a portfolio
 * aggregation endpoint for figures that are a `filter().length` over data the
 * dashboard already has in cache would be a server round trip bought for
 * nothing. That trade stops holding at the point where a workspace has more
 * projects than a client should be loading at once, which is why a server-side
 * aggregation endpoint stays on the roadmap rather than being dismissed.
 */

/** Mirrors PROJECT_STATUS_META's palette, since the badge colours are what a reader has already learned. */
const STATUS_FILL: Record<ProjectStatus, string> = {
  planning: '#8b5cf6',
  in_progress: '#f59e0b',
  on_hold: '#94a3b8',
  completed: '#10b981',
}

const CHART_HEIGHT = 260

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border border-line bg-white p-5 shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)]">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      <div className="mt-3" style={{ height: CHART_HEIGHT }}>
        {children}
      </div>
    </div>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return <p className="flex h-full items-center justify-center text-sm text-slate-400">{message}</p>
}

interface PortfolioChartsProps {
  projects: Project[]
  tasks: Task[]
  members: Member[]
}

export function PortfolioCharts({ projects, tasks, members }: PortfolioChartsProps) {
  const statusBreakdown = useMemo(() => {
    const counts = new Map<ProjectStatus, number>()
    for (const project of projects) {
      counts.set(project.status, (counts.get(project.status) ?? 0) + 1)
    }
    return [...counts.entries()].map(([status, value]) => ({
      status,
      name: PROJECT_STATUS_META[status].label,
      value,
    }))
  }, [projects])

  const completionByProject = useMemo(() => {
    const byProject = new Map<string, { done: number; open: number; overdue: number }>()
    const now = new Date()

    for (const task of tasks) {
      const entry = byProject.get(task.projectId) ?? { done: 0, open: 0, overdue: 0 }
      if (task.status === 'done') entry.done += 1
      else if (isTaskOverdue(task, now)) entry.overdue += 1
      else entry.open += 1
      byProject.set(task.projectId, entry)
    }

    return projects
      .map((project) => ({
        name: project.name,
        ...(byProject.get(project.id) ?? { done: 0, open: 0, overdue: 0 }),
      }))
      .filter((row) => row.done + row.open + row.overdue > 0)
      // Busiest first, capped: a stacked bar chart with forty categories is
      // unreadable, and the long tail is where the least is happening.
      .sort((a, b) => b.done + b.open + b.overdue - (a.done + a.open + a.overdue))
      .slice(0, 8)
  }, [projects, tasks])

  const workload = useMemo(() => {
    const nameById = new Map(members.map((member) => [member.id, member.name]))
    const counts = new Map<string, number>()
    let unassigned = 0

    for (const task of tasks) {
      if (task.status === 'done') continue
      if (task.assigneeIds.length === 0) {
        unassigned += 1
        continue
      }
      // A task with two assignees counts for both: this answers "how much is on
      // this person's plate", not "how many tasks exist".
      for (const assigneeId of task.assigneeIds) {
        counts.set(assigneeId, (counts.get(assigneeId) ?? 0) + 1)
      }
    }

    const rows = [...counts.entries()]
      .map(([id, open]) => ({ name: nameById.get(id) ?? 'Unknown', open }))
      .sort((a, b) => b.open - a.open)
      .slice(0, 10)

    if (unassigned > 0) rows.push({ name: 'Unassigned', open: unassigned })
    return rows
  }, [members, tasks])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Panel title="Projects by status" subtitle="Across the active workspace.">
          {statusBreakdown.length === 0 ? (
            <EmptyPanel message="No projects yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_FILL[entry.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Open workload by assignee" subtitle="Tasks not yet done. A shared task counts for everyone on it.">
          {workload.length === 0 ? (
            <EmptyPanel message="Nothing outstanding." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workload} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="#eef0f4" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="open" name="Open tasks" fill="#ec721d" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <Panel
        title="Task completion by project"
        subtitle="The eight busiest projects. Overdue is split out of open, since it is the half that needs attention."
      >
        {completionByProject.length === 0 ? (
          <EmptyPanel message="No tasks yet." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completionByProject} margin={{ left: 0, right: 16 }}>
              <CartesianGrid vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} />
              <Bar dataKey="done" name="Done" stackId="tasks" fill="#10b981" />
              <Bar dataKey="open" name="Open" stackId="tasks" fill="#38bdf8" />
              <Bar dataKey="overdue" name="Overdue" stackId="tasks" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>
    </div>
  )
}
