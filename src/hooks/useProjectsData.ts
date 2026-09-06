import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import * as projectsApi from '../api/projectsApi'
import { subscribeToProjectsChanged } from '../api/mockRealtimeBus'
import type {
  ComposeEmailInput,
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
 * Chat messages get their own realtime subscription (rather than sharing
 * useRealtimeInvalidation) because the assistant's reply lands via a second
 * emitProjectsChanged() call a moment after the user's message is sent, and
 * we don't want every unrelated mutation in the app also refetching chat.
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
 * Bridges the realtime push channel into the React Query cache: any mutation
 * (here or from another tab/component) invalidates these keys, so every
 * consumer of useProjects/useTasks re-renders with fresh data automatically.
 * This is the same shape a Firestore `onSnapshot` bridge will use later.
 */
function useRealtimeInvalidation() {
  const queryClient = useQueryClient()
  useEffect(() => {
    return subscribeToProjectsChanged(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    })
  }, [queryClient])
}

export function useProjects() {
  useRealtimeInvalidation()
  return useQuery({ queryKey: queryKeys.projects, queryFn: projectsApi.fetchProjects })
}

export function useTasks() {
  useRealtimeInvalidation()
  return useQuery({ queryKey: queryKeys.tasks, queryFn: projectsApi.fetchTasks })
}

export function useMembers() {
  return useQuery({ queryKey: queryKeys.members, queryFn: projectsApi.fetchMembers })
}

export function useContacts() {
  return useQuery({ queryKey: queryKeys.contacts, queryFn: projectsApi.fetchContacts })
}

export function useFolders() {
  return useQuery({ queryKey: queryKeys.folders, queryFn: projectsApi.fetchFolders })
}

export function useNotes() {
  return useQuery({ queryKey: queryKeys.notes, queryFn: projectsApi.fetchNotes })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NoteInput) => projectsApi.createNote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ noteId, input }: { noteId: string; input: NoteInput }) => projectsApi.updateNote(noteId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => projectsApi.deleteNote(noteId),
    onSuccess: () => {
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
  return useQuery({ queryKey: queryKeys.todos, queryFn: projectsApi.fetchTodos })
}

export function useMeetings() {
  return useQuery({ queryKey: queryKeys.meetings, queryFn: projectsApi.fetchMeetings })
}

export function useEmails() {
  return useQuery({ queryKey: queryKeys.emails, queryFn: projectsApi.fetchEmails })
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
  return useMutation({
    mutationFn: (input: ComposeEmailInput) => projectsApi.composeEmail(input),
    onSuccess: () => {
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
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      projectsApi.updateTaskStatus(taskId, status),
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
  return useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: ProjectStatus }) =>
      projectsApi.updateProjectStatus(projectId, status),
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
  return useMutation({
    mutationFn: ({ projectId, image }: { projectId: string; image: string | null }) =>
      projectsApi.updateProjectImage(projectId, image),
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
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateFolderInput) => projectsApi.createFolder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders })
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: CreateTaskInput }) =>
      projectsApi.createTask({ ...input, projectId, status: 'todo' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

export function useDocuments() {
  return useQuery({ queryKey: queryKeys.documents, queryFn: projectsApi.fetchDocuments })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UploadDocumentInput) => projectsApi.uploadDocument(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => projectsApi.deleteDocument(documentId),
    onSuccess: () => {
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
