import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { CreateTaskModal } from '../projects/CreateTaskModal'
import { useProjectMembers } from '../../hooks/useWorkspacesData'
import type { Member, Project } from '../../types/project'

interface AddTaskFlowProps {
  projects: Project[]
}

/**
 * "+ Add task" for the global calendar page: CreateTaskModal needs a projectId
 * up front, so this asks which project first, then hands off to it unmodified.
 */
export function AddTaskFlow({ projects }: AddTaskFlowProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => p.name.toLowerCase().includes(q))
  }, [projects, query])

  return (
    <>
      <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
        <Plus size={14} strokeWidth={2} />
        Add task
      </Button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Choose a project</DialogTitle>
          </DialogHeader>
          <label className="flex items-center gap-2 rounded-lg border border-input px-2.5 py-1.5">
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>
          <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
            {filtered.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  setPickerOpen(false)
                  setQuery('')
                  setProjectId(project.id)
                }}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-100"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                <span className="truncate font-medium text-slate-800">{project.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No projects match.</p>}
          </div>
        </DialogContent>
      </Dialog>

      {projectId && <ProjectScopedCreateTask projectId={projectId} onClose={() => setProjectId(null)} />}
    </>
  )
}

function ProjectScopedCreateTask({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { data: projectMembers = [] } = useProjectMembers(projectId)
  const members: Member[] = projectMembers.map((pm) => ({ id: pm.userId, name: pm.name, photoURL: pm.photoURL }))
  return <CreateTaskModal projectId={projectId} members={members} onClose={onClose} />
}
