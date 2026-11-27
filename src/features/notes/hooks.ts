import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryClient'
import * as notesApi from './api'
import { useAuth } from '../../hooks/useAuth'
import { useWorkspace } from '../../hooks/useWorkspace'
import type { NoteInput } from '../../types/project'
import { useAuditRecorder } from '../../hooks/useAuditRecorder'

export function useNotes() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.notes, activeWorkspaceId],
    // An arrow function, not a bare reference: React Query calls queryFn with a
    // QueryFunctionContext, which would otherwise arrive as the workspaceId
    // argument and serialise into ?workspace_id=[object Object].
    queryFn: () => notesApi.fetchNotes(activeWorkspaceId ?? undefined),
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
    queryFn: () => notesApi.searchNotes(trimmed, activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId) && trimmed.length > 0,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: NoteInput) => notesApi.createNote(input),
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
    mutationFn: ({ noteId, input }: { noteId: string; input: NoteInput }) => notesApi.updateNote(noteId, input),
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
    mutationFn: (noteId: string) => notesApi.deleteNote(noteId),
    onSuccess: (_data, noteId) => {
      recordAudit('delete', 'note', noteId)
      queryClient.invalidateQueries({ queryKey: queryKeys.notes })
    },
  })
}

export function useToggleNotePinned() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => notesApi.toggleNotePinned(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes })
      const previousNotes = queryClient.getQueryData(queryKeys.notes)
      queryClient.setQueryData(queryKeys.notes, (old: Awaited<ReturnType<typeof notesApi.fetchNotes>> = []) =>
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
