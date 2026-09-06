import { useState } from 'react'
import { Plus, FolderPlus } from 'lucide-react'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { FolderCard } from '../../components/projects/FolderCard'
import { ProjectCard } from '../../components/projects/ProjectCard'
import { TodosPanel } from '../../components/projects/TodosPanel'
import { NotesPanel } from '../../components/projects/NotesPanel'
import { EmailsPanel } from '../../components/projects/EmailsPanel'
import { AllTodosModal } from '../../components/projects/AllTodosModal'
import { CreateProjectModal } from '../../components/projects/CreateProjectModal'
import { CreateFolderModal } from '../../components/projects/CreateFolderModal'
import { useFolders, useProjects } from '../../hooks/useProjectsData'
import { Reveal } from '../../components/motion/Reveal'
import { staggerDelay } from '../../lib/motion'

export function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects()
  const { data: folders = [] } = useFolders()
  const [searchQuery, setSearchQuery] = useState('')
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [allTodosOpen, setAllTodosOpen] = useState(false)

  const visibleProjects = projects.filter((project) =>
    searchQuery.trim()
      ? `${project.name} ${project.tags.join(' ')}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true,
  )

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar
        title="Projects"
        subtitle="Track projects, tasks, and timelines in one place."
        searchPlaceholder="Search projects or tags..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <button
            type="button"
            onClick={() => setCreateProjectOpen(true)}
            className="hidden items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:brightness-95 sm:flex"
          >
            <Plus size={16} strokeWidth={2} />
            Add Project
          </button>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Folders</h2>
              <button
                type="button"
                onClick={() => setCreateFolderOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <FolderPlus size={14} />
                Add Folder
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {folders.map((folder, i) => (
                <Reveal key={folder.id} delay={staggerDelay(i, 0.04, 0.3)}>
                  <FolderCard folder={folder} />
                </Reveal>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Latest Projects</h2>
            {isLoading ? (
              <p className="text-sm text-slate-400">Loading projects…</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProjects.map((project, i) => (
                  <Reveal key={project.id} delay={staggerDelay(i, 0.04, 0.3)}>
                    <ProjectCard project={project} />
                  </Reveal>
                ))}
                {visibleProjects.length === 0 && (
                  <p className="col-span-full py-8 text-center text-sm text-slate-400">No projects match.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="hidden w-[300px] shrink-0 flex-col gap-4 lg:flex">
          <TodosPanel onViewAll={() => setAllTodosOpen(true)} />
          <NotesPanel />
          <EmailsPanel />
        </aside>
      </div>

      {createProjectOpen && <CreateProjectModal onClose={() => setCreateProjectOpen(false)} />}
      {createFolderOpen && <CreateFolderModal onClose={() => setCreateFolderOpen(false)} />}
      {allTodosOpen && <AllTodosModal onClose={() => setAllTodosOpen(false)} />}
    </div>
  )
}
