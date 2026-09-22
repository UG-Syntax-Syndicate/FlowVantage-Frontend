import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ChevronsUpDown, Plus, User } from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace'
import { useCreateOrganization } from '../../hooks/useWorkspacesData'
import { showToast } from '../../lib/toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useWorkspace()
  const [creatingOrg, setCreatingOrg] = useState(false)

  if (!activeWorkspace) {
    return <div className="h-10 w-full animate-pulse rounded-[10px] bg-white/5" />
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-2.5 py-2 text-left transition hover:bg-white/10"
          >
            {activeWorkspace.isPersonal ? (
              <User size={16} strokeWidth={2} className="shrink-0 text-[#a0a0a3]" />
            ) : (
              <Building2 size={16} strokeWidth={2} className="shrink-0 text-[#a0a0a3]" />
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
              {activeWorkspace.isPersonal ? 'Personal' : activeWorkspace.name}
            </span>
            <ChevronsUpDown size={14} strokeWidth={2} className="shrink-0 text-[#a0a0a3]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onSelect={() => setActiveWorkspaceId(workspace.id)}
              className="gap-2"
            >
              {workspace.isPersonal ? (
                <User size={15} strokeWidth={2} className="text-slate-400" />
              ) : (
                <Building2 size={15} strokeWidth={2} className="text-slate-400" />
              )}
              <span className="min-w-0 flex-1 truncate">{workspace.isPersonal ? 'Personal' : workspace.name}</span>
              {workspace.id === activeWorkspace.id && <span className="text-xs text-primary">Current</span>}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {!activeWorkspace.isPersonal && (
            <DropdownMenuItem asChild>
              <Link to="/dashboard/account/workspace/members">Manage members</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setCreatingOrg(true)} className="gap-2">
            <Plus size={15} strokeWidth={2} />
            Create organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {creatingOrg && (
        <CreateOrganizationModal
          onClose={() => setCreatingOrg(false)}
          onCreated={(workspaceId) => setActiveWorkspaceId(workspaceId)}
        />
      )}
    </>
  )
}

function CreateOrganizationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (workspaceId: string) => void
}) {
  const [name, setName] = useState('')
  const createOrganization = useCreateOrganization()

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      const workspace = await createOrganization.mutateAsync(trimmed)
      showToast('success', 'Organization created')
      onCreated(workspace.id)
      onClose()
    } catch {
      showToast('error', 'Could not create organization')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <Label>Organization name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              placeholder="e.g. Acme Inc"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              loading={createOrganization.isPending}
              disabled={createOrganization.isPending || name.trim().length === 0}
            >
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
