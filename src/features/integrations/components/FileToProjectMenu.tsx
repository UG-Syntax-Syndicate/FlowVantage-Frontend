import type { ReactNode } from 'react'
import { FolderInput, Inbox } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { useProjects } from '../../../hooks/useProjectsData'

interface FileToProjectMenuProps {
  trigger: ReactNode
  /** Offer "Back to inbox" for items that already have a project. */
  canUnfile?: boolean
  disabled?: boolean
  onSelect: (projectId: string | null) => void
}

/** Picks the project to file synced items into, from the active workspace. */
export function FileToProjectMenu({ trigger, canUnfile = false, disabled = false, onSelect }: FileToProjectMenuProps) {
  const { data: projects = [] } = useProjects()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={disabled} asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 w-56 overflow-y-auto">
        {projects.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-slate-500">No projects in this workspace yet</div>
        )}
        {projects.map((project) => (
          <DropdownMenuItem key={project.id} className="gap-2 px-2 py-1.5" onSelect={() => onSelect(project.id)}>
            <FolderInput size={14} strokeWidth={2} className="text-slate-400" />
            <span className="truncate">{project.name}</span>
          </DropdownMenuItem>
        ))}
        {canUnfile && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 px-2 py-1.5" onSelect={() => onSelect(null)}>
              <Inbox size={14} strokeWidth={2} className="text-slate-400" />
              Back to inbox
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
