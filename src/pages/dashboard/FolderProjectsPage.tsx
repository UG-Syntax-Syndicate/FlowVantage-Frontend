import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useFolders, useProjects } from '../../hooks/useProjectsData'
import { ProjectCard } from '../../components/projects/ProjectCard'
import { FOLDER_ICONS } from '../../lib/folderIcons'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { CardGridSkeleton } from '../../components/common/skeletons/CardGridSkeleton'
import { Skeleton } from '../../components/ui/skeleton'

export function FolderProjectsPage() {
  const { folderId } = useParams<{ folderId: string }>()
  const { data: folders = [], isLoading: foldersLoading } = useFolders()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()

  const folder = folders.find((f) => f.id === folderId)
  const folderProjects = projects.filter((p) => folderId && p.folderIds.includes(folderId))

  if (!foldersLoading && !folder) {
    return <Navigate to="/dashboard/projects" replace />
  }

  if (!folder) {
    return (
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-64" />
        <CardGridSkeleton count={6} />
      </div>
    )
  }

  const Icon = FOLDER_ICONS[folder.icon]

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link to="/dashboard/projects" className="hover:text-slate-700">
          Projects
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="font-medium text-slate-900">{folder.name}</span>
      </nav>

      <PageHeaderBar
        title={folder.name}
        subtitle={`${folderProjects.length} project${folderProjects.length === 1 ? '' : 's'} in this folder`}
        actions={
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: folder.color }}
          >
            <Icon size={17} strokeWidth={1.9} />
          </div>
        }
      />

      {projectsLoading ? (
        <CardGridSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {folderProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {folderProjects.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-slate-400">
              No projects in this folder yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
