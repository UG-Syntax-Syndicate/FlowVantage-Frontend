import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { useProjects } from '../../hooks/useProjectsData'

/** The sentinel for "no project filter". A real project id can never be this, since ids are UUIDs. */
export const ALL_PROJECTS = 'all-projects'

interface ProjectFilterSelectProps {
  value: string
  onChange: (value: string) => void
  allLabel?: string
  className?: string
}

/**
 * A project picker used as a list filter.
 *
 * Reads the project list itself rather than taking it as a prop: every caller
 * wants the active workspace's projects, `useProjects` is already cached, and
 * threading the list through means each page has to remember to scope it.
 */
export function ProjectFilterSelect({
  value,
  onChange,
  allLabel = 'All projects',
  className,
}: ProjectFilterSelectProps) {
  const { data: projects = [] } = useProjects()
  const selectedName = projects.find((project) => project.id === value)?.name

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          className ??
          'flex items-center gap-1.5 text-sm font-medium text-slate-500 outline-none hover:text-slate-700'
        }
      >
        {value === ALL_PROJECTS ? allLabel : selectedName ?? allLabel}
        <ChevronDown size={14} strokeWidth={2} className="text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-52 overflow-y-auto">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuRadioItem value={ALL_PROJECTS} className="px-2 py-1.5">
            {allLabel}
          </DropdownMenuRadioItem>
          {projects.map((project) => (
            <DropdownMenuRadioItem key={project.id} value={project.id} className="px-2 py-1.5">
              {project.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
