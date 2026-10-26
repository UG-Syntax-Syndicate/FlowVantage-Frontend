import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import * as projectsApi from '../api/projectsApi'
import * as aiApi from '../api/aiApi'
import { useAuth } from './useAuth'
import { useWorkspace } from './useWorkspace'
import { useWorkspaceMembers } from './useWorkspacesData'
import { logRecordChange } from '../lib/auditLog'
import { celebrate } from '../lib/celebrate'
import { showToast } from '../lib/toast'
import { useMarkMilestone } from './useOnboarding'
import type { RecordChangeAction } from '../types/audit'
import type {
  ComposeEmailInput,
  ContactInput,
  CreateFolderInput,
  CreateProjectInput,
  CreateTaskInput,
  CreateTodoInput,
  EmailFolder,
  MeetingInput,
  Member,
  NoteInput,
  Project,
  ProjectStatus,
  TaskStatus,
  UpdateFolderInput,
  UpdateProjectInput,
  UpdateTaskInput,
  UpdateTodoInput,
  UploadDocumentInput,
} from '../types/project'

/**
 * Returns a fire-and-forget audit recorder bound to the current user, for the
 * create/update/delete record-change trail (PRD §8 Auditability). No-ops when
 * signed out. Toggles (pin/star/read/done) are intentionally not audited —
 * they're transient view state, not record changes worth tracing.
 */
function useAuditRecorder() {
  const { currentUser } = useAuth()
  return useCallback(
    (
      action: RecordChangeAction,
      resourceType: string,
      resourceId?: string,
      metadata?: Record<string, unknown>,
    ) => {
      if (!currentUser) return
      void logRecordChange(currentUser.uid, action, resourceType, resourceId, metadata)
    },
    [currentUser],
  )
}

/**
 * Projects in the active workspace.
 *
 * The workspace id is part of the query key, not just the request: without it
 * React Query served one cache entry for every workspace, so switching
 * workspace left the previous workspace's projects on screen until something
 * else happened to invalidate them. `useContacts` below was already keyed this
 * way - projects, tasks, folders, notes, todos and documents were not, which is
 * the whole of bug C.
 */
export function useProjects() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.projects, activeWorkspaceId],
    queryFn: () => projectsApi.fetchProjects(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useTasks() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.tasks, activeWorkspaceId],
    // An arrow function, not a bare reference: React Query calls queryFn with a
    // QueryFunctionContext, which would otherwise arrive as the workspaceId
    // argument and serialise into ?workspace_id=[object Object].
    queryFn: () => projectsApi.fetchTasks(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

/**
 * Everyone in the active workspace, as the lightweight `Member` shape the
 * task/calendar/report views use to resolve an assignee id into a name and a
 * face.
 *
 * This used to be the signed-in user and nobody else - first as a second
 * GET /auth/me, then derived from the profile - which meant every task
 * assigned to a colleague rendered with no avatar and no name anywhere in the
 * app. GET /workspaces/:id/members is the list that actually answers "who
 * could this be assigned to", and it is already fetched and cached for the
 * members screen, so this usually costs nothing.
 *
 * The caller's own profile is folded in as a fallback: the list is empty
 * until it loads, and a personal workspace still has to resolve to the one
 * person in it.
 */
export function useMembers() {
  const { backendSessionToken, userProfile } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  const { data: workspaceMembers, isLoading } = useWorkspaceMembers(activeWorkspaceId ?? undefined)

  const data = useMemo<Member[]>(() => {
    if (!backendSessionToken) return []

    const members = (workspaceMembers ?? []).map((member) => ({
      id: member.userId,
      name: member.name || member.email,
      photoURL: member.photoURL,
    }))

    if (userProfile && !members.some((member) => member.id === userProfile.id)) {
      members.unshift({
        id: userProfile.id,
        name: userProfile.name || userProfile.email,
        photoURL: userProfile.photoURL,
      })
    }

    return members
  }, [backendSessionToken, userProfile, workspaceMembers])

  return { data, isLoading: Boolean(backendSessionToken) && isLoading && !userProfile }
}

export function useContacts() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.contacts, activeWorkspaceId],
    queryFn: () => projectsApi.fetchContacts(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: ContactInput) => projectsApi.createContact(input),
    onSuccess: (contact) => {
      recordAudit('create', 'contact', contact.id, { name: contact.contactName })
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ contactId, input }: { contactId: string; input: ContactInput }) =>
      projectsApi.updateContact(contactId, input),
    onSuccess: (_data, { contactId }) => {
      recordAudit('update', 'contact', contactId)
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (contactId: string) => projectsApi.deleteContact(contactId),
    onSuccess: (_data, contactId) => {
      recordAudit('delete', 'contact', contactId)
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    },
  })
}

export function useBulkDeleteContacts() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (contactIds: string[]) => projectsApi.bulkDeleteContacts(contactIds),
    onSuccess: (result, contactIds) => {
      recordAudit('delete', 'contact', undefined, { count: result.deleted, requested: contactIds.length })
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    },
  })
}

export function useBulkImportContacts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      workspaceId,
      contacts,
      onProgress,
      allowDuplicates,
    }: {
      workspaceId: string | undefined
      contacts: ContactInput[]
      onProgress?: (done: number, total: number) => void
      /** Import rows duplicate detection flags anyway (US-C1's "continue as a new contact"). */
      allowDuplicates?: boolean
    }) => projectsApi.bulkImportContactsChunked(workspaceId, contacts, onProgress, allowDuplicates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    },
  })
}

export function useFolders() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.folders, activeWorkspaceId],
    queryFn: () => projectsApi.fetchFolders(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useNotes() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.notes, activeWorkspaceId],
    // An arrow function, not a bare reference: React Query calls queryFn with a
    // QueryFunctionContext, which would otherwise arrive as the workspaceId
    // argument and serialise into ?workspace_id=[object Object].
    queryFn: () => projectsApi.fetchNotes(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

/**
 * Server-side note search (backend NOTE-04). Unlike useNotes, this does not
 * load the whole list and filter it in the browser - it asks the server, which
 * matches content and tags too, not just what a card happens to show.
 *
 * Disabled for a blank query so an empty search box costs nothing.
 */
export function useNoteSearch(query: string) {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  const trimmed = query.trim()
  return useQuery({
    queryKey: [...queryKeys.notes, 'search', activeWorkspaceId, trimmed],
    queryFn: () => projectsApi.searchNotes(trimmed, activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId) && trimmed.length > 0,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: NoteInput) => projectsApi.createNote(input),
    onSuccess: (note) => {
      recordAudit('create', 'note', note.id, { title: note.title })
      queryClient.invalidateQueries({ queryKey: queryKeys.notes })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ noteId, input }: { noteId: string; input: NoteInput }) => projectsApi.updateNote(noteId, input),
    onSuccess: (_data, { noteId }) => {
      recordAudit('update', 'note', noteId)
      queryClient.invalidateQueries({ queryKey: queryKeys.notes })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (noteId: string) => projectsApi.deleteNote(noteId),
    onSuccess: (_data, noteId) => {
      recordAudit('delete', 'note', noteId)
      queryClient.invalidateQueries({ queryKey: queryKeys.notes })
    },
  })
}

export function useToggleNotePinned() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => projectsApi.toggleNotePinned(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes })
      const previousNotes = queryClient.getQueryData(queryKeys.notes)
      queryClient.setQueryData(queryKeys.notes, (old: Awaited<ReturnType<typeof projectsApi.fetchNotes>> = []) =>
        old.map((note) => (note.id === noteId ? { ...note, pinned: !note.pinned } : note)),
      )
      return { previousNotes }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes, context.previousNotes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes })
    },
  })
}

export function useTodos() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.todos, activeWorkspaceId],
    // An arrow function, not a bare reference: React Query calls queryFn with a
    // QueryFunctionContext, which would otherwise arrive as the workspaceId
    // argument and serialise into ?workspace_id=[object Object].
    queryFn: () => projectsApi.fetchTodos(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useMeetings() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.meetings,
    queryFn: projectsApi.fetchMeetings,
    enabled: Boolean(backendSessionToken),
  })
}

export function useEmails() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.emails,
    queryFn: projectsApi.fetchEmails,
    enabled: Boolean(backendSessionToken),
  })
}

export function useToggleEmailStar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (emailId: string) => projectsApi.toggleEmailStar(emailId),
    onMutate: async (emailId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.emails })
      const previousEmails = queryClient.getQueryData(queryKeys.emails)
      queryClient.setQueryData(queryKeys.emails, (old: Awaited<ReturnType<typeof projectsApi.fetchEmails>> = []) =>
        old.map((email) => (email.id === emailId ? { ...email, starred: !email.starred } : email)),
      )
      return { previousEmails }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousEmails) {
        queryClient.setQueryData(queryKeys.emails, context.previousEmails)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emails })
    },
  })
}

export function useMarkEmailsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (emailIds: string[]) => projectsApi.markEmailsRead(emailIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emails })
    },
  })
}

export function useMoveEmailsToFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ emailIds, folder }: { emailIds: string[]; folder: EmailFolder }) =>
      projectsApi.moveEmailsToFolder(emailIds, folder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emails })
    },
  })
}

/**
 * Where a send would go from. Cached like any other read, and cheap - the
 * composer opens far more often than a mailbox is connected or disconnected.
 */
export function useEmailSender() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.emailSender,
    queryFn: projectsApi.fetchEmailSender,
    enabled: Boolean(backendSessionToken),
  })
}

/**
 * Sends, rather than filing a draft.
 *
 * Invalidates the email list because the server files a copy in `sent`, and
 * that copy is the only record the user has that the message left.
 */
export function useSendEmail() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: ComposeEmailInput & { contactId?: string | null; projectId?: string | null }) =>
      projectsApi.sendEmail(input),
    onSuccess: (email) => {
      recordAudit('create', 'email', email.id, { sent: true })
      queryClient.invalidateQueries({ queryKey: queryKeys.emails })
    },
  })
}

export function useComposeEmail() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: ComposeEmailInput) => projectsApi.composeEmail(input),
    onSuccess: (email) => {
      recordAudit('create', 'email', email.id, { subject: email.subject })
      queryClient.invalidateQueries({ queryKey: queryKeys.emails })
    },
  })
}

export function useToggleTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (todoId: string) => projectsApi.toggleTodo(todoId),
    onMutate: async (todoId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos })
      const previousTodos = queryClient.getQueryData(queryKeys.todos)
      queryClient.setQueryData(queryKeys.todos, (old: Awaited<ReturnType<typeof projectsApi.fetchTodos>> = []) =>
        old.map((todo) => (todo.id === todoId ? { ...todo, done: !todo.done } : todo)),
      )
      return { previousTodos }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKeys.todos, context.previousTodos)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos })
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  const markMilestone = useMarkMilestone()
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      projectsApi.updateTaskStatus(taskId, status),
    onSuccess: (_data, { taskId, status }) => {
      recordAudit('update', 'task', taskId, { status })

      // The first completed task is worth celebrating, and this is the only
      // place in the app where a task becomes done. New tasks are always
      // created as 'todo', so '-> done' is the transition that counts.
      //
      // The server decides whether this was genuinely the first: it answers
      // atomically, so two tabs completing tasks at the same moment produce one
      // celebration rather than two. There is no per-user task counter and
      // `tasks` has no completed_at, so this signal has to be derived here -
      // but the once-only guarantee does not.
      if (status !== 'done') return

      markMilestone.mutate('firstTaskCompletedAt', {
        onSuccess: ({ wasFirst }) => {
          if (!wasFirst) return

          const animated = celebrate()
          showToast(
            'success',
            'First task complete! 🎉',
            animated ? undefined : 'Nice work - that is the hard part over with.',
          )
        },
        // Deliberately silent on failure. A celebration that could not be
        // recorded must not turn a successful task update into an error toast.
        onError: () => {},
      })
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks })
      const previousTasks = queryClient.getQueryData(queryKeys.tasks)
      queryClient.setQueryData(queryKeys.tasks, (old: Awaited<ReturnType<typeof projectsApi.fetchTasks>> = []) =>
        old.map((task) => (task.id === taskId ? { ...task, status } : task)),
      )
      return { previousTasks }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks, context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: ProjectStatus }) =>
      projectsApi.updateProjectStatus(projectId, status),
    onSuccess: (_data, { projectId, status }) => {
      recordAudit('update', 'project', projectId, { status })
    },
    onMutate: async ({ projectId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects })
      const previousProjects = queryClient.getQueryData(queryKeys.projects)
      queryClient.setQueryData(
        queryKeys.projects,
        (old: Awaited<ReturnType<typeof projectsApi.fetchProjects>> = []) =>
          old.map((project) => (project.id === projectId ? { ...project, status } : project)),
      )
      return { previousProjects }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

export function useUpdateProjectImage() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, image }: { projectId: string; image: string | null }) =>
      projectsApi.updateProjectImage(projectId, image),
    onSuccess: (_data, { projectId }) => {
      recordAudit('update', 'project', projectId, { field: 'image' })
    },
    onMutate: async ({ projectId, image }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects })
      const previousProjects = queryClient.getQueryData(queryKeys.projects)
      queryClient.setQueryData(
        queryKeys.projects,
        (old: Awaited<ReturnType<typeof projectsApi.fetchProjects>> = []) =>
          old.map((project) => (project.id === projectId ? { ...project, image } : project)),
      )
      return { previousProjects }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

/**
 * General project edit, for the fields the status/image shortcuts above don't
 * cover. Not optimistic: an edit form stays open until the server answers, so
 * there is no stale frame to paper over.
 */
export function useUpdateProject() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: UpdateProjectInput }) =>
      projectsApi.updateProject(projectId, input),
    onSuccess: (project, { projectId, input }) => {
      recordAudit('update', 'project', projectId, { fields: Object.keys(input) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      queryClient.invalidateQueries({ queryKey: queryKeys.project(project.id) })
    },
  })
}

/**
 * Deleting a project cascades on the server to its tasks, todos, notes and
 * documents, so every one of those caches has to be dropped too - otherwise the
 * dashboard keeps counting work that no longer exists.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (projectId: string) => projectsApi.deleteProject(projectId),
    onSuccess: (_data, projectId) => {
      recordAudit('delete', 'project', projectId)
      for (const key of [
        queryKeys.projects,
        queryKeys.tasks,
        queryKeys.todos,
        queryKeys.notes,
        queryKeys.documents,
        queryKeys.folders,
        queryKeys.meetings,
      ]) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: CreateProjectInput) => {
      const existingColors = (queryClient.getQueryData<Project[]>(queryKeys.projects) ?? []).map((p) => p.color)
      return projectsApi.createProject(input, existingColors)
    },
    onSuccess: (project) => {
      recordAudit('create', 'project', project.id, { name: project.name })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: CreateFolderInput) => projectsApi.createFolder(input),
    onSuccess: (folder) => {
      recordAudit('create', 'folder', folder.id, { name: folder.name })
      queryClient.invalidateQueries({ queryKey: queryKeys.folders })
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ folderId, input }: { folderId: string; input: UpdateFolderInput }) => projectsApi.updateFolder(folderId, input),
    onSuccess: (folder) => {
      recordAudit('update', 'folder', folder.id, { name: folder.name })
      queryClient.invalidateQueries({ queryKey: queryKeys.folders })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (folderId: string) => projectsApi.deleteFolder(folderId),
    onSuccess: (_data, folderId) => {
      recordAudit('delete', 'folder', folderId)
      queryClient.invalidateQueries({ queryKey: queryKeys.folders })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

/** Adds a project to one more folder (a project can be in several at once) - not a replace. */
export function useAttachProjectToFolder() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, folderId }: { projectId: string; folderId: string }) =>
      projectsApi.attachProjectToFolder(projectId, folderId),
    onSuccess: (project, { folderId }) => {
      recordAudit('update', 'project', project.id, { attachedFolderId: folderId })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

export function useDetachProjectFromFolder() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, folderId }: { projectId: string; folderId: string }) =>
      projectsApi.detachProjectFromFolder(projectId, folderId),
    onSuccess: (project, { folderId }) => {
      recordAudit('update', 'project', project.id, { detachedFolderId: folderId })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: CreateTaskInput }) =>
      projectsApi.createTask({ ...input, projectId, status: 'todo' }),
    onSuccess: (task) => {
      recordAudit('create', 'task', task.id, { projectId: task.projectId })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

/**
 * Full task edit. The status-only shortcut above stays optimistic because it
 * fires from a drag or a checkbox; this one runs behind a form, so it waits.
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      projectsApi.updateTask(taskId, input),
    onSuccess: (_task, { taskId, input }) => {
      recordAudit('update', 'task', taskId, { fields: Object.keys(input) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (taskId: string) => projectsApi.deleteTask(taskId),
    onSuccess: (_data, taskId) => {
      recordAudit('delete', 'task', taskId)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      // Comments hang off the task and go with it.
      queryClient.removeQueries({ queryKey: queryKeys.taskComments(taskId) })
    },
  })
}

export function useCreateTodo() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: CreateTodoInput) => projectsApi.createTodo(input),
    onSuccess: (todo) => {
      recordAudit('create', 'todo', todo.id, { projectId: todo.projectId })
      queryClient.invalidateQueries({ queryKey: queryKeys.todos })
    },
  })
}

/**
 * Edits a todo's title/tags/due date. The done flag has its own optimistic
 * toggle above - this is the form path.
 */
export function useUpdateTodo() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ todoId, input }: { todoId: string; input: UpdateTodoInput }) =>
      projectsApi.updateTodo(todoId, input),
    onSuccess: (_todo, { todoId, input }) => {
      recordAudit('update', 'todo', todoId, { fields: Object.keys(input) })
      queryClient.invalidateQueries({ queryKey: queryKeys.todos })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (todoId: string) => projectsApi.deleteTodo(todoId),
    onSuccess: (_data, todoId) => {
      recordAudit('delete', 'todo', todoId)
      queryClient.invalidateQueries({ queryKey: queryKeys.todos })
    },
  })
}

// ---------------------------------------------------------------------------
// Calendar events ("meetings")
// ---------------------------------------------------------------------------

export function useCreateMeeting() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: MeetingInput) => projectsApi.createMeeting(input),
    onSuccess: (meeting) => {
      recordAudit('create', 'meeting', meeting.id, { projectId: meeting.projectId })
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings })
    },
  })
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ meetingId, input }: { meetingId: string; input: MeetingInput }) =>
      projectsApi.updateMeeting(meetingId, input),
    onSuccess: (_meeting, { meetingId, input }) => {
      recordAudit('update', 'meeting', meetingId, { fields: Object.keys(input) })
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings })
    },
  })
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (meetingId: string) => projectsApi.deleteMeeting(meetingId),
    onSuccess: (_data, meetingId) => {
      recordAudit('delete', 'meeting', meetingId)
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings })
    },
  })
}

export function useDocuments() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.documents, activeWorkspaceId],
    // An arrow function, not a bare reference: React Query calls queryFn with a
    // QueryFunctionContext, which would otherwise arrive as the workspaceId
    // argument and serialise into ?workspace_id=[object Object].
    queryFn: () => projectsApi.fetchDocuments(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: UploadDocumentInput) => projectsApi.uploadDocument(input),
    onSuccess: (document) => {
      recordAudit('create', 'document', document.id, { fileName: document.name })
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (documentId: string) => projectsApi.deleteDocument(documentId),
    onSuccess: (_data, documentId) => {
      recordAudit('delete', 'document', documentId)
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
    },
  })
}

export function useChatMessages() {
  return useQuery({ queryKey: queryKeys.chatMessages, queryFn: aiApi.fetchChatMessages })
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspace()
  return useMutation({
    mutationFn: ({ content, provider }: { content: string; provider: aiApi.AiProvider }) => {
      if (!activeWorkspaceId) {
        throw new Error('No active workspace')
      }
      return aiApi.sendChatMessage(content, { provider, workspaceId: activeWorkspaceId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages })
    },
  })
}
