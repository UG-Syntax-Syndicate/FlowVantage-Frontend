import { useMemo, useState } from 'react'
import { ArrowDownUp, Download, Filter, Mail, UserPlus, Users, X } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Button } from '../ui/button'
import { Avatar } from '../common/Avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
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
import { ConfirmDialog } from '../common/ConfirmDialog'
import { AddProjectMemberModal } from './AddProjectMemberModal'
import { showToast } from '../../lib/toast'
import {
  usePendingInvites,
  useProjectMembers,
  useRemoveProjectMember,
  useRevokeInvite,
  useUpdateProjectMemberRole,
} from '../../hooks/useWorkspacesData'
import type { ProjectMember, ProjectRole } from '../../types/workspace'
import type { Task } from '../../types/project'

const PROJECT_ROLES: ProjectRole[] = ['owner', 'contributor', 'viewer']

type SortKey = 'name' | 'progress' | 'role'

interface MemberProgress {
  assigned: number
  completed: number
  percent: number
}

/**
 * How far through their own share of the project each person is.
 *
 * Tasks assigned to them, not tasks they can see: a progress bar that counts
 * the whole project would read the same for everyone and tell you nothing.
 * Someone with no tasks shows a dash rather than 0%, which would imply they
 * are behind.
 */
function progressByMember(tasks: Task[]): Map<string, MemberProgress> {
  const result = new Map<string, MemberProgress>()

  for (const task of tasks) {
    for (const assigneeId of task.assigneeIds) {
      const current = result.get(assigneeId) ?? { assigned: 0, completed: 0, percent: 0 }
      current.assigned += 1
      if (task.status === 'done') current.completed += 1
      current.percent = Math.round((current.completed / current.assigned) * 100)
      result.set(assigneeId, current)
    }
  }

  return result
}

function toCsv(members: ProjectMember[], progress: Map<string, MemberProgress>): string {
  // Quoted and escaped: a display name containing a comma would otherwise
  // shift every later column by one.
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const rows = [
    ['Name', 'Email', 'Role', 'Tasks assigned', 'Tasks completed', 'Progress'],
    ...members.map((member) => {
      const stats = progress.get(member.userId)
      return [
        member.name,
        member.email,
        member.role,
        String(stats?.assigned ?? 0),
        String(stats?.completed ?? 0),
        stats ? `${stats.percent}%` : '',
      ]
    }),
  ]
  return rows.map((row) => row.map(escape).join(',')).join('\n')
}

interface ProjectTeamTableProps {
  projectId: string
  projectName: string
  workspaceId: string
  ownerId: string
  tasks: Task[]
  canManage: boolean
  /** The overview shows a read-only summary; the Team tab shows the full thing. */
  showInvites?: boolean
}

export function ProjectTeamTable({
  projectId,
  projectName,
  workspaceId,
  ownerId,
  tasks,
  canManage,
  showInvites = false,
}: ProjectTeamTableProps) {
  const { data: members = [], isLoading } = useProjectMembers(projectId)
  const { data: invites = [] } = usePendingInvites(showInvites && canManage ? workspaceId : undefined)
  const updateRole = useUpdateProjectMemberRole(projectId)
  const removeMember = useRemoveProjectMember(projectId)
  const revokeInvite = useRevokeInvite(workspaceId)

  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<ProjectMember | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [onlyWithTasks, setOnlyWithTasks] = useState(false)

  const progress = useMemo(() => progressByMember(tasks), [tasks])

  const visibleMembers = useMemo(() => {
    const filtered = onlyWithTasks
      ? members.filter((member) => (progress.get(member.userId)?.assigned ?? 0) > 0)
      : members

    return [...filtered].sort((a, b) => {
      if (sortKey === 'progress') {
        return (progress.get(b.userId)?.percent ?? -1) - (progress.get(a.userId)?.percent ?? -1)
      }
      if (sortKey === 'role') return a.role.localeCompare(b.role)
      return a.name.localeCompare(b.name)
    })
  }, [members, progress, sortKey, onlyWithTasks])

  // Only invitations that were scoped to this project - the workspace list
  // also carries invites for other projects and for the workspace alone.
  const projectInvites = invites.filter((invite) => invite.projectId === projectId)

  function handleExport() {
    const blob = new Blob([toCsv(visibleMembers, progress)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${projectName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-team.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Team Members and Collaborators</h2>

        <div className="flex items-center gap-1 text-slate-400">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Sort team members"
              className="rounded-lg p-1.5 outline-none hover:bg-slate-100 hover:text-slate-600"
            >
              <ArrowDownUp size={15} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="progress">Progress</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="role">Role</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Filter team members"
              className="rounded-lg p-1.5 outline-none hover:bg-slate-100 hover:text-slate-600"
            >
              <Filter size={15} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={onlyWithTasks}
                onCheckedChange={(checked) => setOnlyWithTasks(Boolean(checked))}
              >
                Only people with tasks
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {canManage && (
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
              <UserPlus size={14} strokeWidth={2} />
              Add member
            </Button>
          )}

          <button
            type="button"
            onClick={handleExport}
            disabled={visibleMembers.length === 0}
            aria-label="Download the team list as CSV"
            title="Download as CSV"
            className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={15} strokeWidth={2} />
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-slate-400">Loading the team…</p>
      ) : visibleMembers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 px-4 py-10 text-center">
          <Users size={22} strokeWidth={1.8} className="text-slate-300" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600">
            {members.length === 0 ? 'Nobody is on this project yet' : 'Nobody matches that filter'}
          </p>
          {canManage && members.length === 0 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
              <UserPlus size={14} strokeWidth={2} />
              Add the first member
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-40">Progress</TableHead>
                <TableHead className="w-36">Role</TableHead>
                {canManage && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleMembers.map((member) => {
                const stats = progress.get(member.userId)
                const isOwner = member.userId === ownerId

                return (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar photoURL={member.photoURL} name={member.name} size={30} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{member.name}</p>
                          {isOwner && <p className="text-[11px] text-slate-400">Project owner</p>}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-slate-500">{member.email}</TableCell>

                    <TableCell>
                      {stats ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200"
                            role="progressbar"
                            aria-valuenow={stats.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${member.name}'s progress`}
                          >
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${stats.percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">
                            {stats.completed}/{stats.assigned}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">No tasks</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {canManage && !isOwner ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) =>
                            updateRole.mutate(
                              { userId: member.userId, role: value as ProjectRole },
                              {
                                onError: (error) =>
                                  showToast(
                                    'error',
                                    error instanceof Error ? error.message : 'Could not change the role',
                                  ),
                              },
                            )
                          }
                        >
                          <SelectTrigger size="sm" className="w-32 capitalize">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_ROLES.map((role) => (
                              <SelectItem key={role} value={role} className="capitalize">
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-slate-500 capitalize">{member.role}</span>
                      )}
                    </TableCell>

                    {canManage && (
                      <TableCell>
                        {/* The project owner is not removable here: the row
                            references projects.owner_id, and removing it
                            would leave the project with an owner who is not
                            on its team. */}
                        {!isOwner && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setRemoving(member)}
                            title={`Remove ${member.name}`}
                            aria-label={`Remove ${member.name}`}
                          >
                            <X size={14} strokeWidth={2} />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {showInvites && canManage && projectInvites.length > 0 && (
        <div className="rounded-xl border border-line bg-surface/60 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Invited, not yet accepted</h3>
          <ul className="mt-2 divide-y divide-slate-100">
            {projectInvites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Mail size={14} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{invite.email}</p>
                    <p className="text-xs text-slate-400 capitalize">
                      {invite.projectRole ?? 'contributor'} · pending
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    revokeInvite.mutate(invite.id, {
                      onSuccess: () => showToast('success', 'Invite revoked'),
                      onError: () => showToast('error', 'Could not revoke the invite'),
                    })
                  }
                  title="Revoke invite"
                  aria-label={`Revoke the invite to ${invite.email}`}
                >
                  <X size={14} strokeWidth={2} />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {adding && (
        <AddProjectMemberModal
          projectId={projectId}
          workspaceId={workspaceId}
          currentMembers={members}
          onClose={() => setAdding(false)}
        />
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Remove from this project?"
        description={
          removing
            ? `${removing.name} will lose access to this project. Their tasks stay, but unassigned to anyone on the team.`
            : ''
        }
        confirmLabel="Remove"
        danger
        loading={removeMember.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return
          try {
            await removeMember.mutateAsync(removing.userId)
            showToast('success', `${removing.name} removed from the project`)
            setRemoving(null)
          } catch (error) {
            showToast('error', error instanceof Error ? error.message : 'Could not remove them')
          }
        }}
      />
    </section>
  )
}
