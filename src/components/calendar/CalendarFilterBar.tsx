import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import type { Project } from '../../types/project'
import type { WorkspaceMember } from '../../types/workspace'

export const ALL_PROJECTS = 'All projects'

interface CalendarFilterBarProps {
  projects: Project[]
  workspaceMembers: WorkspaceMember[]
  projectFilter: string
  onProjectFilterChange: (id: string) => void
  memberFilter: Set<string>
  onMemberFilterChange: (next: Set<string>) => void
}

export function CalendarFilterBar({
  projects,
  workspaceMembers,
  projectFilter,
  onProjectFilterChange,
  memberFilter,
  onMemberFilterChange,
}: CalendarFilterBarProps) {
  const projectLabel = projectFilter === ALL_PROJECTS ? ALL_PROJECTS : (projects.find((p) => p.id === projectFilter)?.name ?? ALL_PROJECTS)
  const memberLabel =
    memberFilter.size === 0
      ? 'All members'
      : memberFilter.size === 1
        ? (workspaceMembers.find((m) => memberFilter.has(m.userId))?.name ?? '1 member')
        : `${memberFilter.size} members`

  function toggleMember(userId: string) {
    const next = new Set(memberFilter)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    onMemberFilterChange(next)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm outline-none hover:bg-slate-50">
          {projectLabel}
          <ChevronDown size={14} strokeWidth={2} className="text-slate-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuRadioGroup value={projectFilter} onValueChange={onProjectFilterChange}>
            <DropdownMenuRadioItem value={ALL_PROJECTS} className="px-2 py-1.5">
              {ALL_PROJECTS}
            </DropdownMenuRadioItem>
            {projects.map((project) => (
              <DropdownMenuRadioItem key={project.id} value={project.id} className="px-2 py-1.5">
                <span className="mr-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                {project.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm outline-none hover:bg-slate-50">
          {memberLabel}
          <ChevronDown size={14} strokeWidth={2} className="text-slate-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {workspaceMembers.map((member) => (
            <DropdownMenuCheckboxItem
              key={member.userId}
              checked={memberFilter.has(member.userId)}
              onCheckedChange={() => toggleMember(member.userId)}
              onSelect={(e) => e.preventDefault()}
              className="px-2 py-1.5"
            >
              {member.name}
            </DropdownMenuCheckboxItem>
          ))}
          {workspaceMembers.length === 0 && <p className="px-2 py-1.5 text-xs text-slate-400">No members yet.</p>}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
