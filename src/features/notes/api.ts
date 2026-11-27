import {
  getJson,
  patchJson,
  deleteJson,
  postJsonAuthed,
} from '../../lib/backendApi'
import type { Note, NoteInput } from '../../types/project'
import { emitProjectsChanged } from '../../api/mockRealtimeBus'
import { authToken } from '../../lib/authedRequest'

interface NoteRow {
  id: string
  title: string | null
  content: string
  project_id: string | null
  color: Note['color']
  pinned: boolean
  tags: string[]
  created_at: string
}

function excerptFromBody(body: string): string {
  return body.length > 120 ? `${body.slice(0, 120).trimEnd()}…` : body
}

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title || '',
    body: row.content,
    excerpt: excerptFromBody(row.content),
    color: row.color,
    pinned: row.pinned,
    tags: row.tags || [],
    createdAt: row.created_at,
  }
}

export async function fetchNotes(workspaceId?: string): Promise<Note[]> {
  const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
  const { notes } = await getJson<{ success: boolean; notes: NoteRow[] }>(`/notes${query}`, authToken())
  return notes.map(mapNote)
}

/**
 * Server-side note search (backend NOTE-04): matches title, content and tags,
 * and respects the same visibility and workspace scoping as fetchNotes. The
 * Notes page filters its already-loaded list client-side; this is for searching
 * across everything without loading it all.
 */
export async function searchNotes(query: string, workspaceId?: string): Promise<Note[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  const params = new URLSearchParams({ q: trimmed })
  if (workspaceId) params.set('workspace_id', workspaceId)
  const { notes } = await getJson<{ success: boolean; notes: NoteRow[] }>(
    `/notes/search?${params.toString()}`,
    authToken(),
  )
  return notes.map(mapNote)
}

export async function createNote(input: NoteInput): Promise<Note> {
  const { note } = await postJsonAuthed<{ success: boolean; note: NoteRow }>(
    '/notes',
    { title: input.title, content: input.body, color: input.color, projectId: input.projectId },
    authToken(),
  )
  emitProjectsChanged()
  return mapNote(note)
}

export async function updateNote(noteId: string, input: NoteInput): Promise<void> {
  await patchJson(`/notes/${noteId}`, { title: input.title, content: input.body, color: input.color }, authToken())
  emitProjectsChanged()
}

export async function deleteNote(noteId: string): Promise<void> {
  await deleteJson(`/notes/${noteId}`, authToken())
  emitProjectsChanged()
}

export async function toggleNotePinned(noteId: string): Promise<void> {
  const token = authToken()
  const { note: current } = await getJson<{ success: boolean; note: NoteRow }>(`/notes/${noteId}`, token)
  await patchJson(`/notes/${noteId}`, { pinned: !current.pinned }, token)
  emitProjectsChanged()
}
