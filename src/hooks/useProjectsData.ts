import { useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import * as projectsApi from '../api/projectsApi'
import { subscribeToProjectsChanged } from '../api/mockRealtimeBus'
import { useAuth } from './useAuth'
import { useWorkspace } from './useWorkspace'
import { logRecordChange } from '../lib/auditLog'
import type { RecordChangeAction } from '../types/audit'
import type {
  ComposeEmailInput,
  ContactInput,
  CreateFolderInput,
  CreateProjectInput,
  CreateTaskInput,
  EmailFolder,
  NoteInput,
  ProjectStatus,
  TaskStatus,
  UploadDocumentInput,
} from '../types/project'

/**
 * Chat (still mock-backed) needs its own subscription because the assistant's
 * reply lands via a second emitProjectsChanged() call a moment after the
 * user's message is sent (projectsApi.sendChatMessage), with no other
 * invalidation path for that delayed second message.
 */
function useChatRealtimeInvalidation() {
  const queryClient = useQueryClient()
  useEffect(() => {
    return subscribeToProjectsChanged(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages })
    })
  }, [queryClient])
}

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

export function useProjects() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.fetchProjects,
    enabled: Boolean(backendSessionToken),
  })
}

export function useTasks() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: projectsApi.fetchTasks,
    enabled: Boolean(backendSessionToken),
  })
}

export function useMembers() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: projectsApi.fetchMembers,
    enabled: Boolean(backendSessionToken),
  })
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

export function useBulkImportContacts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, contacts }: { workspaceId: string | undefined; contacts: ContactInput[] }) =>
      projectsApi.bulkImportContacts(workspaceId, contacts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    },
  })
}

export function useFolders() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.folders,
    queryFn: projectsApi.fetchFolders,
    enabled: Boolean(backendSessionToken),
  })
}

export function useNotes() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.notes,
    queryFn: projectsApi.fetchNotes,
    enabled: Boolean(backendSessionToken),
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
  return useQuery({
    queryKey: queryKeys.todos,
    queryFn: projectsApi.fetchTodos,
    enabled: Boolean(backendSessionToken),
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
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      projectsApi.updateTaskStatus(taskId, status),
    onSuccess: (_data, { taskId, status }) => {
      recordAudit('update', 'task', taskId, { status })
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

export function useCreateProject() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.createProject(input),
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

export function useDocuments() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.documents,
    queryFn: projectsApi.fetchDocuments,
    enabled: Boolean(backendSessionToken),
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
  useChatRealtimeInvalidation()
  return useQuery({ queryKey: queryKeys.chatMessages, queryFn: projectsApi.fetchChatMessages })
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => projectsApi.sendChatMessage(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages })
    },
  })
}
