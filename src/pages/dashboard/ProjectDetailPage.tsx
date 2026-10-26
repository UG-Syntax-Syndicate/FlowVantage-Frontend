import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ChevronRight,
  Calendar,
  Tag,
  UserRound,
  FolderKanban,
  Flag,
  FileDown,
  Clock,
  Timer,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  X,
  LayoutDashboard,
  GanttChartSquare,
  Users,
  Files,
  MessagesSquare,
  Package,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react'
import {
  useAttachProjectToFolder,
  useDeleteProject,
  useDetachProjectFromFolder,
  useFolders,
  useMeetings,
  useMembers,
  useProjects,
  useTodos,
  useUpdateProjectImage,
} from '../../hooks/useProjectsData'
import { useProjectMembers } from '../../hooks/useWorkspacesData'
import { useWorkspaceRole } from '../../hooks/useWorkspace'
import { useAuth } from '../../hooks/useAuth'
import { useUnreadMessageCounts } from '../../hooks/useCollaborationData'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Button } from '../../components/ui/button'
import { useEnrichedTasks } from '../../hooks/useEnrichedTasks'
import { ProjectTaskWidget } from '../../components/projects/ProjectTaskWidget'
import { ProjectOverviewCard } from '../../components/projects/ProjectOverviewCard'
import { ProjectTeamTable } from '../../components/projects/ProjectTeamTable'
import { ProjectTimelinePanel } from '../../components/projects/ProjectTimelinePanel'
import { ProjectSourcesPanel } from '../../components/projects/ProjectSourcesPanel'
import { TodosPanel } from '../../components/projects/TodosPanel'
import { NotesPanel } from '../../components/projects/NotesPanel'
import { EmailsPanel } from '../../components/projects/EmailsPanel'
import { DocumentsSection } from '../../components/projects/DocumentsSection'
import { ProjectInventoryPanel } from '../../components/projects/ProjectInventoryPanel'
import { ProjectWhatsAppPanel } from '../../components/projects/ProjectWhatsAppPanel'
import { ProjectMessagesPanel } from '../../components/collaboration/ProjectMessagesPanel'
import { ImageCropModal } from '../../components/projects/ImageCropModal'
import { EditProjectModal } from '../../components/projects/EditProjectModal'
import { CreateProjectModal } from '../../components/projects/CreateProjectModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { AvatarStack } from '../../components/dashboard/AvatarStack'
import { ProjectStatusBadge, PriorityBadge } from '../../components/projects/StatusBadge'
import { formatShortDate, formatDuration } from '../../lib/formatDate'
import { convertImageToWebp, validateImageFile } from '../../lib/images'
import { useDownloadProjectReport } from '../../hooks/useReportingData'
import { showToast } from '../../lib/toast'
import type { ReportFormat } from '../../types/report'
import type { Member } from '../../types/project'
import { Skeleton } from '../../components/ui/skeleton'

/**
 * The tabs, in the order they appear. `Overview` first because it is the
 * answer to "what is this project"; everything after it is a place you go to
 * do one specific thing.
 */
const TABS = ['overview', 'timeline', 'team', 'documents', 'chat', 'materials'] as const
type TabValue = (typeof TABS)[number]

function isTabValue(value: string | null): value is TabValue {
  return value !== null && (TABS as readonly string[]).includes(value)
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: folders = [] } = useFolders()
  const { data: members = [] } = useMembers()
  const { data: todos = [] } = useTodos()
  const { data: meetings = [] } = useMeetings()
  const { tasks } = useEnrichedTasks()
  const { data: projectMembers = [] } = useProjectMembers(projectId)
  const { data: unreadCounts = {} } = useUnreadMessageCounts()
  const { userProfile } = useAuth()
  const workspaceRole = useWorkspaceRole()
  const attachFolder = useAttachProjectToFolder()
  const detachFolder = useDetachProjectFromFolder()
  const [taskExpandSignal, setTaskExpandSignal] = useState(0)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const updateProjectImage = useUpdateProjectImage()
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const downloadReport = useDownloadProjectReport()
  const deleteProject = useDeleteProject()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const project = projects.find((p) => p.id === projectId)
  const projectFolders = folders.filter((f) => project?.folderIds.includes(f.id))
  const folder = projectFolders[0]
  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === projectId), [tasks, projectId])
  const projectTodos = todos.filter((t) => t.projectId === projectId)
  const projectMeetings = meetings.filter((m) => m.projectId === projectId)
  const assignee = members.find((m) => m.id === project?.memberIds[0])
  const unread = projectId ? (unreadCounts[projectId] ?? 0) : 0

  // The widget wants the light `Member` shape; the project roster is the
  // authoritative list of who is on this project, so it is preferred over the
  // workspace-wide one for assignment.
  const widgetMembers = useMemo<Member[]>(
    () =>
      projectMembers.map((member) => ({
        id: member.userId,
        name: member.name,
        photoURL: member.photoURL,
      })),
    [projectMembers],
  )

  /**
   * Who may change the team and the project itself: a workspace owner/admin,
   * the project's creator, or whoever holds the `owner` role on the project.
   * Mirrors the backend's canManageProject, so the UI does not offer actions
   * the API will refuse.
   */
  const canManage =
    workspaceRole === 'owner' ||
    workspaceRole === 'admin' ||
    (userProfile?.id !== undefined && project?.ownerId === userProfile.id) ||
    projectMembers.some((member) => member.userId === userProfile?.id && member.role === 'owner')

  const ownerName =
    projectMembers.find((member) => member.userId === project?.ownerId)?.name ??
    (project?.ownerId === userProfile?.id ? (userProfile?.name ?? 'You') : 'Unassigned')

  const tabParam = searchParams.get('tab')
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : 'overview'

  function handleTabChange(value: string) {
    // In the URL so a tab can be linked to and survives a reload - a
    // notification that points at a project's chat is otherwise impossible to
    // write. `replace` keeps the back button meaning "the previous page"
    // rather than "the previous tab".
    const next = new URLSearchParams(searchParams)
    if (value === 'overview') next.delete('tab')
    else next.set('tab', value)
    setSearchParams(next, { replace: true })
  }

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
  const currentProjectName = project.name

  // "View all" on the todos panel sends you to the tab that holds the full
  // task list. No scrollIntoView any more: the widget lives in a tab that is
  // unmounted at the moment this runs, so the ref would be null - switching
  // to it puts it at the top of the view anyway.
  function handleTodosViewAll() {
    handleTabChange('timeline')
    setTaskExpandSignal((signal) => signal + 1)
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

  async function exportReport(format: ReportFormat) {
    try {
      await downloadReport.mutateAsync({
        projectId: currentProjectId,
        format,
        fallbackName: currentProjectName.replace(/[^a-z0-9]+/gi, '-').toLowerCase(),
      })
      showToast('success', `${format.toUpperCase()} report downloaded`)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not generate this report')
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

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Project</h1>

        <div className="flex items-center gap-2">
          {/* Export lives here as well as on the Reporting page: this is where
              someone looks for "give me this project as a document". */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" disabled={downloadReport.isPending}>
                <FileDown size={15} strokeWidth={2} />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => exportReport('pdf')}>
                <FileDown size={14} strokeWidth={2} />
                Export report (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport('docx')}>
                <FileDown size={14} strokeWidth={2} />
                Export report (DOCX)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="button" onClick={() => setCreatingProject(true)}>
            <Plus size={15} strokeWidth={2} />
            Add Project
          </Button>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="More options"
                className="rounded-lg p-2 text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-600"
              >
                <MoreHorizontal size={18} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {/* The banner these used to sit on is gone, but the cover
                    image itself is not - ProjectCard still renders it on the
                    projects list, so there has to be somewhere to set it. */}
                <DropdownMenuItem
                  onClick={() => coverInputRef.current?.click()}
                  disabled={updateProjectImage.isPending}
                >
                  {updateProjectImage.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ImagePlus size={14} strokeWidth={2} />
                  )}
                  {project.image ? 'Change cover image' : 'Add a cover image'}
                </DropdownMenuItem>
                {project.image && (
                  <DropdownMenuItem onClick={handleRemoveCover} disabled={updateProjectImage.isPending}>
                    <X size={14} strokeWidth={2} />
                    Remove cover image
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setConfirmingDelete(true)}
                  className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                >
                  <Trash2 size={14} strokeWidth={2} />
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Scrolls rather than wraps: a wrapped tab bar changes height as the
            active tab moves, which shifts the whole page under the cursor. */}
        <TabsList className="max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">
            <LayoutDashboard size={14} strokeWidth={2} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <GanttChartSquare size={14} strokeWidth={2} />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users size={14} strokeWidth={2} />
            Team
            {projectMembers.length > 0 && (
              <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-slate-500">
                {projectMembers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Files size={14} strokeWidth={2} />
            Documents
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessagesSquare size={14} strokeWidth={2} />
            Chat
            {unread > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Package size={14} strokeWidth={2} />
            Materials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-6">
              <ProjectOverviewCard
                project={project}
                members={projectMembers}
                ownerName={ownerName}
                canManage={canManage}
                onEdit={() => setEditing(true)}
              />

              <div className="rounded-2xl border border-line bg-white p-6 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
                <ProjectTeamTable
                  projectId={project.id}
                  projectName={project.name}
                  workspaceId={project.workspaceId}
                  ownerId={project.ownerId}
                  tasks={projectTasks}
                  canManage={canManage}
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-6">
              <ProjectTimelinePanel tasks={projectTasks} />

              <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 text-sm shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
                <h2 className="text-base font-semibold text-slate-900">Details</h2>
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
                    {project.tags.length === 0 && <span className="text-xs text-slate-300">None</span>}
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
                {/* Moved here from the banner, which is gone. The number was
                    only ever shown there, and dropping the banner should not
                    quietly drop a fact with it. */}
                <div className="flex items-center gap-3">
                  <Timer size={16} className="shrink-0 text-slate-400" />
                  <span className="text-slate-500">Tracked</span>
                  <span className="ml-auto font-medium text-slate-900">
                    {formatDuration(project.trackedSeconds)}
                  </span>
                </div>
              </div>

              <ProjectSourcesPanel projectId={project.id} canManage={canManage} />

              <TodosPanel projectId={project.id} onViewAll={handleTodosViewAll} />
              <NotesPanel projectId={project.id} />
              <EmailsPanel projectId={project.id} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6 flex flex-col gap-6">
          <ProjectTaskWidget
            projectId={project.id}
            members={widgetMembers}
            tasks={projectTasks}
            todos={projectTodos}
            meetings={projectMeetings}
            project={project}
            expandSignal={taskExpandSignal}
          />
          <ProjectTimelinePanel tasks={projectTasks} />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
            <ProjectTeamTable
              projectId={project.id}
              projectName={project.name}
              workspaceId={project.workspaceId}
              ownerId={project.ownerId}
              tasks={projectTasks}
              canManage={canManage}
              showInvites
            />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
            <DocumentsSection projectId={project.id} />
          </div>
        </TabsContent>

        <TabsContent value="chat" className="mt-6 flex flex-col gap-6">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
            <ProjectMessagesPanel projectId={project.id} />
          </div>
          {/* The WhatsApp group sits with the in-app thread rather than in a
              tab of its own: both answer "where does this project talk", and
              a tab for one settings panel is a tab nobody opens twice. */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle size={15} strokeWidth={2} className="text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">WhatsApp</h2>
            </div>
            <ProjectWhatsAppPanel projectId={project.id} />
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
            <ProjectInventoryPanel projectId={project.id} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Mounted at the page root, not inside a tab: the menu that triggers it
          is always visible, so the input it clicks has to be too. */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleCoverChange}
      />

      {pendingCoverFile && (
        <ImageCropModal
          file={pendingCoverFile}
          onCancel={() => setPendingCoverFile(null)}
          onCropped={handleCoverCropped}
        />
      )}

      {editing && <EditProjectModal project={project} onClose={() => setEditing(false)} />}
      {creatingProject && <CreateProjectModal onClose={() => setCreatingProject(false)} />}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this project?"
        description={`Deleting "${project.name}" also deletes its tasks, todos, notes and documents. This cannot be undone.`}
        confirmLabel="Delete project"
        confirmationPhrase={project.name}
        danger
        loading={deleteProject.isPending}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={async () => {
          try {
            await deleteProject.mutateAsync(project.id)
            showToast('success', 'Project deleted')
            // This page is about to render a project that no longer exists.
            navigate('/dashboard/projects')
          } catch {
            showToast('error', 'Could not delete this project')
          }
        }}
      />
    </div>
  )
}
