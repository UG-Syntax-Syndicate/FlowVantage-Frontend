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
  Plus,
  X,
} from 'lucide-react'
import {
  useAttachProjectToFolder,
  useDetachProjectFromFolder,
  useFolders,
  useMeetings,
  useMembers,
  useProjects,
  useTodos,
  useUpdateProjectImage,
} from '../../hooks/useProjectsData'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { useEnrichedTasks } from '../../hooks/useEnrichedTasks'
import { ProjectTaskWidget } from '../../components/projects/ProjectTaskWidget'
import { TodosPanel } from '../../components/projects/TodosPanel'
import { NotesPanel } from '../../components/projects/NotesPanel'
import { EmailsPanel } from '../../components/projects/EmailsPanel'
import { DocumentsSection } from '../../components/projects/DocumentsSection'
import { ImageCropModal } from '../../components/projects/ImageCropModal'
import { AvatarStack } from '../../components/dashboard/AvatarStack'
import { ProjectStatusBadge, PriorityBadge } from '../../components/projects/StatusBadge'
import { formatShortDate, formatDateTime, formatDuration } from '../../lib/formatDate'
import { convertImageToWebp, validateImageFile } from '../../lib/images'
import { showToast } from '../../lib/toast'
import { Skeleton } from '../../components/ui/skeleton'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: folders = [] } = useFolders()
  const { data: members = [] } = useMembers()
  const { data: todos = [] } = useTodos()
  const { data: meetings = [] } = useMeetings()
  const { tasks } = useEnrichedTasks()
  const attachFolder = useAttachProjectToFolder()
  const detachFolder = useDetachProjectFromFolder()
  const [taskExpandSignal, setTaskExpandSignal] = useState(0)
  const taskWidgetRef = useRef<HTMLDivElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const updateProjectImage = useUpdateProjectImage()
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)

  const project = projects.find((p) => p.id === projectId)
  const projectFolders = folders.filter((f) => project?.folderIds.includes(f.id))
  const folder = projectFolders[0]
  const projectTasks = tasks.filter((t) => t.projectId === projectId)
  const projectTodos = todos.filter((t) => t.projectId === projectId)
  const projectMeetings = meetings.filter((m) => m.projectId === projectId)
  const projectMembers = members.filter((m) => project?.memberIds.includes(m.id))
  const assignee = members.find((m) => m.id === project?.memberIds[0])

  if (!projectsLoading && !project) {
    return <Navigate to="/dashboard/projects" replace />
  }

  if (!project) {
    return (
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-[220px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const currentProjectId = project.id

  function handleTodosViewAll() {
    setTaskExpandSignal((s) => s + 1)
    taskWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      showToast('error', validationError)
      return
    }
    setPendingCoverFile(file)
  }

  async function handleCoverCropped(croppedFile: File) {
    setPendingCoverFile(null)
    try {
      const image = await convertImageToWebp(croppedFile)
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
            className="relative aspect-[3/1] min-h-[180px] overflow-hidden rounded-2xl bg-cover bg-center shadow-[0px_16px_40px_10px_rgba(0,0,0,0.18)]"
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
              <div className="flex items-start gap-3">
                <FolderKanban size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <span className="text-slate-500">Folders</span>
                <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
                  {projectFolders.map((f) => (
                    <span
                      key={f.id}
                      className="flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pr-1 pl-2 text-[11px] font-medium text-slate-600"
                    >
                      {f.name}
                      <button
                        type="button"
                        onClick={() => detachFolder.mutate({ projectId: project.id, folderId: f.id })}
                        aria-label={`Remove from ${f.name}`}
                        className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-slate-200"
                      >
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="Add to a folder"
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 outline-none hover:border-primary hover:text-primary"
                    >
                      <Plus size={11} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {folders
                        .filter((f) => !project.folderIds.includes(f.id))
                        .map((f) => (
                          <DropdownMenuItem key={f.id} onClick={() => attachFolder.mutate({ projectId: project.id, folderId: f.id })}>
                            {f.name}
                          </DropdownMenuItem>
                        ))}
                      {folders.every((f) => project.folderIds.includes(f.id)) && (
                        <p className="px-2 py-1.5 text-xs text-slate-400">No more folders</p>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
              todos={projectTodos}
              meetings={projectMeetings}
              project={project}
              expandSignal={taskExpandSignal}
            />
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0">
          <TodosPanel projectId={project.id} onViewAll={handleTodosViewAll} />
          <NotesPanel projectId={project.id} />
          <EmailsPanel projectId={project.id} />
        </aside>
      </div>

      {pendingCoverFile && (
        <ImageCropModal
          file={pendingCoverFile}
          onCancel={() => setPendingCoverFile(null)}
          onCropped={handleCoverCropped}
        />
      )}
    </div>
  )
}
