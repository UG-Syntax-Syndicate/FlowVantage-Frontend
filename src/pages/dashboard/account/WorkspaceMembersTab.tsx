import { useState } from 'react'
import { Building2, Mail, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Avatar } from '../../../components/common/Avatar'
import { showToast } from '../../../lib/toast'
import { useWorkspace, useWorkspaceRole } from '../../../hooks/useWorkspace'
import {
  useCreateInvite,
  usePendingInvites,
  useRevokeInvite,
  useRemoveWorkspaceMember,
  useUpdateWorkspaceMemberRole,
  useWorkspaceMembers,
} from '../../../hooks/useWorkspacesData'
import type { WorkspaceRole } from '../../../types/workspace'

const WORKSPACE_ROLES: WorkspaceRole[] = ['admin', 'member']

function InviteForm({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WorkspaceRole>('member')
  const createInvite = useCreateInvite(workspaceId)

  async function handleSubmit() {
    const trimmed = email.trim()
    if (!trimmed) return
    try {
      await createInvite.mutateAsync({ workspaceId, email: trimmed, workspaceRole: role })
      showToast('success', 'Invite sent', `${trimmed} can accept it from their email.`)
      setEmail('')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not send invite')
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label>Invite by email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className="mt-1"
        />
      </div>
      <div className="w-32">
        <Label>Role</Label>
        <Select value={role} onValueChange={(value) => setRole(value as WorkspaceRole)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WORKSPACE_ROLES.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        onClick={handleSubmit}
        loading={createInvite.isPending}
        disabled={createInvite.isPending || email.trim().length === 0}
      >
        Send invite
      </Button>
    </div>
  )
}

function PendingInvites({ workspaceId }: { workspaceId: string }) {
  const { data: invites = [], isLoading } = usePendingInvites(workspaceId)
  const revokeInvite = useRevokeInvite(workspaceId)

  if (isLoading) return <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
  if (invites.length === 0) return null

  return (
    <div className="divide-y divide-slate-100">
      {invites.map((invite) => (
        <div key={invite.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Mail size={14} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{invite.email}</p>
              <p className="text-xs text-slate-400 capitalize">Invited as {invite.workspaceRole} · pending</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              revokeInvite.mutate(invite.id, {
                onSuccess: () => showToast('success', 'Invite revoked'),
                onError: () => showToast('error', 'Could not revoke invite'),
              })
            }
            title="Revoke invite"
          >
            <X size={14} strokeWidth={2} />
          </Button>
        </div>
      ))}
    </div>
  )
}

export function WorkspaceMembersTab() {
  const { activeWorkspace } = useWorkspace()
  const role = useWorkspaceRole()
  const canManage = role === 'owner' || role === 'admin'

  const workspaceId = activeWorkspace?.id
  const { data: members = [], isLoading } = useWorkspaceMembers(workspaceId)
  const updateRole = useUpdateWorkspaceMemberRole(workspaceId ?? '')
  const removeMember = useRemoveWorkspaceMember(workspaceId ?? '')

  if (!activeWorkspace) {
    return null
  }

  if (activeWorkspace.isPersonal) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Building2 size={20} strokeWidth={2} />
          </div>
          <p className="text-sm font-medium text-slate-800">Personal workspaces are just for you</p>
          <p className="max-w-sm text-sm text-slate-500">
            Nobody else can ever be added here. Create an organization from the workspace switcher to invite
            teammates.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Invite teammates</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <InviteForm workspaceId={activeWorkspace.id} />
            <PendingInvites workspaceId={activeWorkspace.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
          ) : (
            members.map((member) => (
              <div key={member.userId} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div className="flex items-center gap-3">
                  <Avatar photoURL={member.photoURL} name={member.name} size={32} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.email}</p>
                  </div>
                </div>

                {canManage ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        updateRole.mutate(
                          { userId: member.userId, role: value as WorkspaceRole },
                          { onError: (error) => showToast('error', error instanceof Error ? error.message : 'Could not change role') },
                        )
                      }
                    >
                      <SelectTrigger size="sm" className="w-28 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['owner', 'admin', 'member'] as WorkspaceRole[]).map((r) => (
                          <SelectItem key={r} value={r} className="capitalize">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        removeMember.mutate(member.userId, {
                          onSuccess: () => showToast('success', 'Member removed'),
                          onError: (error) =>
                            showToast('error', error instanceof Error ? error.message : 'Could not remove member'),
                        })
                      }
                      title="Remove member"
                    >
                      <X size={14} strokeWidth={2} />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-500 capitalize">{member.role}</span>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
