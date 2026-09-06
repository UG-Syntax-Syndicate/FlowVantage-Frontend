import { useRef, useState, type ChangeEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ChevronRight,
  Calendar,
  Tag,
  UserRound,
  FolderKanban,
  Flag,
  Pencil,
  MoreHorizontal,
  Clock,
  Triangle,
  ImagePlus,
  Loader2,
  X,
} from 'lucide-react'
import { useFolders, useMembers, useProjects, useUpdateProjectImage } from '../../hooks/useProjectsData'
import { useEnrichedTasks } from '../../hooks/useEnrichedTasks'
import { ProjectTaskWidget } from '../../components/projects/ProjectTaskWidget'
import { TodosPanel } from '../../components/projects/TodosPanel'
import { NotesPanel } from '../../components/projects/NotesPanel'
import { EmailsPanel } from '../../components/projects/EmailsPanel'
import { DocumentsSection } from '../../components/projects/DocumentsSection'
import { AvatarStack } from '../../components/dashboard/AvatarStack'
import { ProjectStatusBadge, PriorityBadge } from '../../components/projects/StatusBadge'
import { formatShortDate, formatDateTime, formatDuration } from '../../lib/formatDate'
import { convertImageToWebp, validateImageFile } from '../../lib/images'
import { showToast } from '../../lib/toast'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: folders = [] } = useFolders()
  const { data: members = [] } = useMembers()
  const { tasks } = useEnrichedTasks()
  const [taskExpandSignal, setTaskExpandSignal] = useState(0)
  const taskWidgetRef = useRef<HTMLDivElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const updateProjectImage = useUpdateProjectImage()

  const project = projects.find((p) => p.id === projectId)
  const folder = folders.find((f) => f.id === project?.folderId)
  const projectTasks = tasks.filter((t) => t.projectId === projectId)
  const projectMembers = members.filter((m) => project?.memberIds.includes(m.id))
  const assignee = members.find((m) => m.id === project?.memberIds[0])

  if (!projectsLoading && !project) {
    return <Navigate to="/dashboard/projects" replace />
  }

  if (!project) {
    return <div className="p-8 text-sm text-slate-400">Loading project…</div>
  }

  const currentProjectId = project.id

  function handleTodosViewAll() {
    setTaskExpandSignal((s) => s + 1)
    taskWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      showToast('error', validationError)
      return
    }
    try {
      const image = await convertImageToWebp(file)
      await updateProjectImage.mutateAsync({ projectId: currentProjectId, image })
      showToast('success', 'Cover image updated')
    } catch {
      showToast('error', 'Could not update cover image')
    }
  }

  function handleRemoveCover() {
    updateProjectImage.mutate(
      { projectId: currentProjectId, image: null },
      {
        onSuccess: () => showToast('success', 'Cover image removed'),
        onError: () => showToast('error', 'Could not remove cover image'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link to="/dashboard/projects" className="hover:text-slate-700">
            Projects
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          {folder ? (
            <Link to={`/dashboard/projects/folders/${folder.id}`} className="hover:text-slate-700">
              {folder.name}
            </Link>
          ) : (
            <span>Folder</span>
          )}
          <ChevronRight size={14} className="text-slate-300" />
          <span className="font-medium text-slate-900">{project.category}</span>
        </nav>
        <div className="flex items-center gap-2 text-slate-400">
          <button type="button" className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Edit project">
            <Pencil size={16} />
          </button>
          <button type="button" className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="More options">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div
            className="relative h-[220px] overflow-hidden rounded-2xl bg-cover bg-center shadow-[0px_16px_40px_10px_rgba(0,0,0,0.18)]"
            style={
              project.image
                ? { backgroundImage: `url(${project.image})` }
                : { background: project.coverGradient }
            }
          >
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={updateProjectImage.isPending}
                aria-label="Change cover image"
                className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {updateProjectImage.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <ImagePlus size={14} />
                    Change cover
                  </>
                )}
              </button>
              {project.image && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  disabled={updateProjectImage.isPending}
                  aria-label="Remove cover image"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <X size={14} />
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-4 rounded-b-2xl bg-white/30 px-6 py-4 backdrop-blur-md">
              <div className="-mt-9 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 shadow-lg ring-4 ring-white/50">
                <Triangle size={20} className="fill-primary text-primary" strokeWidth={0} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-semibold text-slate-900">{project.name}</h1>
                <p className="truncate text-sm text-slate-600">{project.tagline}</p>
              </div>
              <div className="flex flex-wrap gap-6 text-xs sm:gap-8">
                <div>
                  <p className="font-medium tracking-wide text-rose-500/80 uppercase">Created</p>
                  <p className="mt-0.5 font-semibold text-slate-900">{formatDateTime(project.createdAt)}</p>
                </div>
                <div>
                  <p className="font-medium tracking-wide text-rose-500/80 uppercase">Deadline</p>
                  <p className="mt-0.5 font-semibold text-slate-900">{formatDateTime(project.dueDate)}</p>
                </div>
                <div>
                  <p className="font-medium tracking-wide text-rose-500/80 uppercase">Tracked Time</p>
                  <p className="mt-0.5 font-semibold text-slate-900">
                    {formatDuration(project.trackedSeconds).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 rounded-2xl border border-line bg-white p-6 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)] md:grid-cols-[minmax(0,260px)_1px_1fr]">
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="shrink-0 text-slate-400" />
                <span className="text-slate-500">Created At</span>
                <span className="ml-auto font-medium text-slate-900">{formatShortDate(project.createdAt)}</span>
              </div>
              <div className="flex items-start gap-3">
                <Tag size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <span className="text-slate-500">Tags</span>
                <div className="ml-auto flex flex-wrap justify-end gap-1.5">
                  {project.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserRound size={16} className="shrink-0 text-slate-400" />
                <span className="text-slate-500">Assign</span>
                <div className="ml-auto flex items-center gap-2">
                  <AvatarStack members={assignee ? [assignee] : []} size={22} max={1} />
                  <span className="font-medium text-slate-900">{assignee?.name ?? 'Unassigned'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FolderKanban size={16} className="shrink-0 text-slate-400" />
                <span className="text-slate-500">Group</span>
                <span className="ml-auto font-medium text-slate-900">{folder?.name ?? '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Flag size={16} className="shrink-0 text-slate-400" />
                <span className="text-slate-500">Priority</span>
                <span className="ml-auto">
                  <PriorityBadge priority={project.priority} />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="shrink-0 text-slate-400" />
                <span className="text-slate-500">Status</span>
                <span className="ml-auto">
                  <ProjectStatusBadge status={project.status} />
                </span>
              </div>
            </div>

            <div className="hidden bg-line md:block" />

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">Description</h2>
                <Pencil size={13} className="text-slate-300" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{project.description}</p>
            </div>

            <div className="md:col-span-3">
              <DocumentsSection projectId={project.id} />
            </div>
          </div>

          <div ref={taskWidgetRef}>
            <ProjectTaskWidget
              projectId={project.id}
              members={projectMembers}
              tasks={projectTasks}
              expandSignal={taskExpandSignal}
            />
          </div>
        </div>

        <aside className="hidden w-[300px] shrink-0 flex-col gap-4 lg:flex">
          <TodosPanel projectId={project.id} onViewAll={handleTodosViewAll} />
          <NotesPanel projectId={project.id} />
          <EmailsPanel projectId={project.id} />
        </aside>
      </div>
    </div>
  )
}
