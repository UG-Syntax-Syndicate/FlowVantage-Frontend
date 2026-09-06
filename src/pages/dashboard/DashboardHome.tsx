import { Layers, CheckCircle2, Clock, AlertTriangle, Plus, UserPlus, TrendingUp } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useMeetings, useMembers, useProjects, useTasks } from '../../hooks/useProjectsData'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { StatCard } from '../../components/dashboard/StatCard'
import { AvatarStack } from '../../components/dashboard/AvatarStack'
import { DeliveriesChart } from '../../components/dashboard/DeliveriesChart'
import { MeetingReminderCard } from '../../components/dashboard/MeetingReminderCard'
import { ProjectAnalyticsGauge } from '../../components/dashboard/ProjectAnalyticsGauge'
import { MiniCalendar } from '../../components/dashboard/MiniCalendar'
import { ProjectCountdownSlider } from '../../components/dashboard/ProjectCountdownSlider'
import { EmailSlider } from '../../components/dashboard/EmailSlider'
import { Card } from '../../components/ui/card'
import { TASK_STATUS_META } from '../../types/statusMeta'
import { computeProjectStats } from '../../lib/taskStats'
import { formatShortDate } from '../../lib/formatDate'
import { showToast } from '../../lib/toast'

const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS

export function DashboardHome() {
  const { userProfile } = useAuth()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks()
  const { data: projects = [] } = useProjects()
  const { data: members = [] } = useMembers()
  const { data: meetings = [] } = useMeetings()

  const projectStats = computeProjectStats(projects)
  const memberById = new Map(members.map((m) => [m.id, m]))
  const projectById = new Map(projects.map((p) => [p.id, p]))

  const inProgressTasks = tasks
    .filter((t) => t.status === 'in_progress')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2)

  // Deliveries chart: done tasks bucketed into the last 6 weeks by due date.
  const now = Date.now()
  const weekBuckets = Array.from({ length: 6 }, (_, i) => {
    const weekStart = now - (5 - i) * WEEK_MS
    const weekEnd = weekStart + WEEK_MS
    const count = tasks.filter((t) => {
      if (t.status !== 'done') return false
      const due = new Date(t.dueDate).getTime()
      return due >= weekStart && due < weekEnd
    }).length
    return { label: formatShortDate(new Date(weekStart).toISOString()), value: count }
  })

  // Analytics gauge: real status breakdown across every task.
  const gaugeCounts = tasks.reduce(
    (acc, t) => {
      if (t.status === 'done') acc.completed += 1
      else if (t.status === 'in_progress' || t.status === 'in_review') acc.inProgress += 1
      else acc.pending += 1
      return acc
    },
    { completed: 0, inProgress: 0, pending: 0 },
  )

  // Meeting reminder: soonest upcoming meeting, or the most recent past one.
  const upcomingMeetings = meetings
    .filter((m) => new Date(m.startTime).getTime() >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  const pastMeetings = meetings
    .filter((m) => new Date(m.startTime).getTime() < now)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  const nextMeeting = upcomingMeetings[0] ?? pastMeetings[0] ?? null
  const meetingProject = nextMeeting ? (projectById.get(nextMeeting.projectId) ?? null) : null

  const latestProjectsFirst = [...projects].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar title={`Hi ${userProfile?.name?.split(' ')[0] ?? 'there'}!`} showUserMeta />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-400">A quick view of your tasks and team updates.</p>
            </div>
            <div className="flex items-center gap-3">
              <AvatarStack members={members} size={30} max={4} />
              <button
                type="button"
                onClick={() => showToast('info', 'Invites aren’t wired up yet')}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <UserPlus size={15} strokeWidth={2} />
                Invite
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:brightness-95"
              >
                <Plus size={16} strokeWidth={2} />
                Add Project
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
            <StatCard
              icon={Layers}
              label="Total Projects"
              value={projectStats.total}
              variant="primary"
              shadowClass="shadow-[0px_16px_40px_20px_rgba(236,114,29,0.18)]"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed Projects"
              value={projectStats.completed}
              variant="default"
              shadowClass="shadow-[0px_10px_32px_4px_rgba(148,163,184,0.35)]"
            />
            <StatCard
              icon={Clock}
              label="Pending Projects"
              value={projectStats.pending}
              variant="default"
              shadowClass="shadow-[0px_10px_40px_4px_rgba(148,163,184,0.3)]"
            />
            <StatCard
              icon={AlertTriangle}
              label="Overdue Projects"
              value={projectStats.overdue}
              variant="default"
              shadowClass="shadow-[0px_10px_40px_16px_rgba(152,150,163,0.2)]"
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-9">
            <div className="flex flex-col gap-6 lg:col-span-5">
              <Card className="gap-4 overflow-visible rounded-2xl border border-line bg-white p-6 shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)] ring-0">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <TrendingUp size={18} strokeWidth={1.9} className="text-primary" />
                    Project Deliveries
                  </h2>
                  <span className="text-xs text-slate-400">Last 6 weeks</span>
                </div>
                <DeliveriesChart data={weekBuckets} />
              </Card>

              <Card className="gap-4 overflow-visible rounded-2xl border border-line bg-white p-6 shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)] ring-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Team Collaboration</h2>
                  <button
                    type="button"
                    onClick={() => showToast('info', 'Adding members isn’t wired up yet')}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <UserPlus size={13} strokeWidth={2} />
                    Add Member
                  </button>
                </div>

                {tasksLoading && <p className="text-sm text-slate-400">Loading…</p>}

                <div className="flex max-h-[280px] flex-col gap-3 overflow-y-auto pr-1">
                  {inProgressTasks.map((task) => {
                    const meta = TASK_STATUS_META[task.status]
                    const project = projectById.get(task.projectId)
                    const assignees = task.assigneeIds
                      .map((id) => memberById.get(id))
                      .filter((m): m is NonNullable<typeof m> => Boolean(m))

                    return (
                      <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                          <p className="truncate text-xs text-slate-400">{project?.name}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <AvatarStack members={assignees} size={26} />
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`}>
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {!tasksLoading && inProgressTasks.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">Nothing in progress right now.</p>
                  )}
                </div>
              </Card>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-4">
              <MeetingReminderCard meeting={nextMeeting} project={meetingProject} />

              <Card className="items-center gap-2 overflow-visible rounded-2xl border border-line bg-white p-6 shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)] ring-0">
                <h2 className="self-start text-base font-semibold text-slate-900">Project Analytics</h2>
                <ProjectAnalyticsGauge {...gaugeCounts} />
              </Card>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-3">
          <EmailSlider />

          <MiniCalendar tasks={tasks} />

          <ProjectCountdownSlider projects={latestProjectsFirst} />
        </div>
      </div>
    </div>
  )
}
