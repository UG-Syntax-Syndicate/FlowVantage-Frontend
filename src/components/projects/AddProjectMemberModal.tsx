import { useMemo, useState } from 'react'
import { Copy, Mail, UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Avatar } from '../common/Avatar'
import { showToast } from '../../lib/toast'
import { useAddProjectMember, useCreateInvite, useWorkspaceMembers } from '../../hooks/useWorkspacesData'
import type { ProjectMember, ProjectRole } from '../../types/workspace'

const PROJECT_ROLES: ProjectRole[] = ['contributor', 'viewer', 'owner']

interface AddProjectMemberModalProps {
  projectId: string
  workspaceId: string
  /** Who is already on the project, so they are not offered twice. */
  currentMembers: ProjectMember[]
  onClose: () => void
}

/**
 * Two genuinely different actions behind one button, which is why they are
 * tabs rather than one form that guesses.
 *
 * Someone already in the workspace is added immediately - there is nothing to
 * accept, and sending them an email to join a workspace they are in would be
 * nonsense. Someone outside it has to be invited, which creates a pending
 * invitation scoped to both the workspace and this project, so accepting it
 * lands them straight on the team rather than in the workspace with no
 * project.
 */
export function AddProjectMemberModal({
  projectId,
  workspaceId,
  currentMembers,
  onClose,
}: AddProjectMemberModalProps) {
  const { data: workspaceMembers = [], isLoading } = useWorkspaceMembers(workspaceId)
  const addMember = useAddProjectMember(projectId)
  const createInvite = useCreateInvite(workspaceId)

  const [selectedUserId, setSelectedUserId] = useState('')
  const [role, setRole] = useState<ProjectRole>('contributor')
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<ProjectRole>('contributor')
  const [manualLink, setManualLink] = useState<string | null>(null)

  const available = useMemo(() => {
    const onProject = new Set(currentMembers.map((member) => member.userId))
    return workspaceMembers.filter((member) => !onProject.has(member.userId))
  }, [workspaceMembers, currentMembers])

  async function handleAdd() {
    if (!selectedUserId) return
    try {
      await addMember.mutateAsync({ userId: selectedUserId, role })
      showToast('success', 'Added to the project')
      onClose()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not add them to the project')
    }
  }

  async function handleInvite() {
    const trimmed = email.trim()
    if (!trimmed) return
    try {
      const invite = await createInvite.mutateAsync({
        workspaceId,
        projectId,
        email: trimmed,
        workspaceRole: 'member',
        projectRole: inviteRole,
      })
      if (invite.inviteLink) {
        // No SMTP configured, so the server handed the link back instead of
        // sending it. Saying "invite sent" here would be a lie.
        setManualLink(invite.inviteLink)
        showToast('info', 'Invite created', 'Email is not configured, so share the link below.')
      } else {
        showToast('success', 'Invite sent', `${trimmed} will get an email with a link to join.`)
        onClose()
      }
      setEmail('')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not send the invite')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a team member</DialogTitle>
          <DialogDescription>
            Add someone already in this workspace, or invite a new person by email.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="existing">
          <TabsList>
            <TabsTrigger value="existing">
              <UserPlus size={14} strokeWidth={2} />
              From workspace
            </TabsTrigger>
            <TabsTrigger value="invite">
              <Mail size={14} strokeWidth={2} />
              Invite by email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="mt-4 flex flex-col gap-4">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
            ) : available.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Everyone in this workspace is already on the project. Invite someone new from the
                other tab.
              </p>
            ) : (
              <>
                <div className="max-h-56 overflow-y-auto">
                  <ul className="flex flex-col gap-1">
                    {available.map((member) => (
                      <li key={member.userId}>
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(member.userId)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                            selectedUserId === member.userId
                              ? 'bg-accent-50 ring-1 ring-primary'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <Avatar photoURL={member.photoURL} name={member.name} size={32} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-slate-800">
                              {member.name}
                            </span>
                            <span className="block truncate text-xs text-slate-400">{member.email}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label>Project role</Label>
                    <Select value={role} onValueChange={(value) => setRole(value as ProjectRole)}>
                      <SelectTrigger className="mt-1 w-full capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_ROLES.map((projectRole) => (
                          <SelectItem key={projectRole} value={projectRole} className="capitalize">
                            {projectRole}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAdd}
                    loading={addMember.isPending}
                    disabled={addMember.isPending || !selectedUserId}
                  >
                    Add to project
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="invite" className="mt-4 flex flex-col gap-4">
            <div>
              <Label>Email address</Label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@company.com"
                className="mt-1"
              />
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label>Project role</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as ProjectRole)}>
                  <SelectTrigger className="mt-1 w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_ROLES.map((projectRole) => (
                      <SelectItem key={projectRole} value={projectRole} className="capitalize">
                        {projectRole}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={handleInvite}
                loading={createInvite.isPending}
                disabled={createInvite.isPending || email.trim().length === 0}
              >
                Send invite
              </Button>
            </div>

            <p className="text-xs text-slate-400">
              They will join the workspace as a member and this project in the role above, once they
              accept. The invitation expires after seven days.
            </p>

            {manualLink && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-medium text-amber-900">
                  No mail server is configured, so nothing was emailed. Send them this link yourself:
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2.5 py-1.5 text-[11px] text-slate-600">
                    {manualLink}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(manualLink)
                        .then(() => showToast('success', 'Link copied'))
                        .catch(() => showToast('error', 'Could not copy the link'))
                    }}
                  >
                    <Copy size={13} strokeWidth={2} />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
