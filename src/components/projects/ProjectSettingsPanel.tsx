import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Pencil, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { ProjectTeamTable } from './ProjectTeamTable'
import { ProjectStatusBadge, PriorityBadge } from './StatusBadge'
import { useRemoveProjectMember } from '../../hooks/useWorkspacesData'
import { formatShortDate } from '../../lib/formatDate'
import { showToast } from '../../lib/toast'
import type { Project, Task } from '../../types/project'

const CARD = 'rounded-2xl border border-line bg-white p-6 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]'

/**
 * Whether the signed-in user may leave this project: they are on it and did
 * not create it. The creator is the project's anchor (the backend refuses to
 * remove them); they delete the project instead.
 */
export function canLeaveProject({
  currentUserId,
  ownerId,
  isMember,
}: {
  currentUserId: string | undefined
  ownerId: string
  isMember: boolean
}): boolean {
  return Boolean(currentUserId) && isMember && currentUserId !== ownerId
}

interface ProjectSettingsPanelProps {
  project: Project
  tasks: Task[]
  canManage: boolean
  currentUserId: string | undefined
  isMember: boolean
  onEdit: () => void
  onDelete: () => void
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-slate-400 uppercase">{label}</dt>
      <dd className="text-sm text-slate-700">{children}</dd>
    </div>
  )
}

/**
 * One place for everything about the project itself rather than its work:
 * its details, who is on it, and deleting it. Managers can change all of it;
 * everyone else can read it and leave.
 */
export function ProjectSettingsPanel({
  project,
  tasks,
  canManage,
  currentUserId,
  isMember,
  onEdit,
  onDelete,
}: ProjectSettingsPanelProps) {
  const navigate = useNavigate()
  const removeMember = useRemoveProjectMember(project.id)
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const showLeave = canLeaveProject({ currentUserId, ownerId: project.ownerId, isMember })

  return (
    <div className="flex flex-col gap-6">
      <section className={CARD} aria-labelledby="project-settings-general">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="project-settings-general" className="text-base font-semibold text-slate-900">
              General
            </h2>
            <p className="mt-1 text-sm text-slate-500">The project's name, status and schedule.</p>
          </div>
          {canManage && (
            <Button type="button" variant="outline" onClick={onEdit}>
              <Pencil size={14} strokeWidth={2} />
              Edit details
            </Button>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Name">{project.name}</Detail>
          <Detail label="Status">
            <ProjectStatusBadge status={project.status} />
          </Detail>
          <Detail label="Priority">
            <PriorityBadge priority={project.priority} />
          </Detail>
          <Detail label="Visibility">
            {project.visibility === 'workspace' ? 'Everyone in the workspace' : 'Project members only'}
          </Detail>
          <Detail label="Start date">{project.startDate ? formatShortDate(project.startDate) : 'Not set'}</Detail>
          <Detail label="Due date">{project.dueDate ? formatShortDate(project.dueDate) : 'Not set'}</Detail>
          {project.description && (
            <div className="sm:col-span-2 lg:col-span-3">
              <Detail label="Description">
                <span className="whitespace-pre-line">{project.description}</span>
              </Detail>
            </div>
          )}
        </dl>
      </section>

      <section className={CARD} aria-labelledby="project-settings-members">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="project-settings-members" className="text-base font-semibold text-slate-900">
              Members
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {canManage
                ? 'Invite people, change what they can do, or take them off the project.'
                : 'Who is on this project.'}
            </p>
          </div>
          {showLeave && (
            <Button type="button" variant="outline" onClick={() => setConfirmingLeave(true)}>
              <LogOut size={14} strokeWidth={2} />
              Leave project
            </Button>
          )}
        </div>
        <ProjectTeamTable
          projectId={project.id}
          projectName={project.name}
          workspaceId={project.workspaceId}
          ownerId={project.ownerId}
          tasks={tasks}
          canManage={canManage}
          showInvites
        />
      </section>

      {canManage && (
        <section className={`${CARD} border-rose-200`} aria-labelledby="project-settings-danger">
          <h2 id="project-settings-danger" className="text-base font-semibold text-rose-700">
            Danger zone
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-slate-800">Delete this project</p>
              <p className="mt-1 text-sm text-slate-500">
                Removes the project with its tasks, todos, notes, documents and chat for everyone on it. Members are
                notified. This cannot be undone.
              </p>
            </div>
            <Button type="button" variant="destructive" onClick={onDelete}>
              <Trash2 size={14} strokeWidth={2} />
              Delete project
            </Button>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmingLeave}
        title="Leave this project?"
        description={`You will lose access to "${project.name}" until someone adds you again.`}
        confirmLabel="Leave project"
        danger
        loading={removeMember.isPending}
        onCancel={() => setConfirmingLeave(false)}
        onConfirm={async () => {
          if (!currentUserId) return
          try {
            await removeMember.mutateAsync(currentUserId)
            showToast('success', `You left ${project.name}`)
            navigate('/dashboard/projects')
          } catch (error) {
            showToast('error', error instanceof Error ? error.message : 'Could not leave this project')
          }
        }}
      />
    </div>
  )
}
