import { getJson, patchJson, deleteJson, postJsonAuthed, postJsonAuthedWithTimeout } from '../lib/backendApi'
import { readBackendSessionToken } from '../lib/backendSession'
import { pickAvatar } from '../lib/avatars'
import { GRADIENT_PALETTE, PROJECT_COLOR_PALETTE, pickProjectColorIndex } from '../lib/constants'
import type {
  BulkImportContactsResult,
  BulkImportSkippedRow,
  ComposeEmailInput,
  Contact,
  ContactInput,
  CreateFolderInput,
  CreateProjectInput,
  CreateTaskInput,
  CreateTodoInput,
  Email,
  EmailFolder,
  Folder,
  Meeting,
  MeetingInput,
  Note,
  NoteInput,
  Project,
  ProjectDocument,
  Task,
  TaskStatus,
  ProjectStatus,
  Todo,
  UpdateFolderInput,
  UpdateProjectInput,
  UpdateTaskInput,
  UpdateTodoInput,
  UploadDocumentInput,
} from '../types/project'
import { emitProjectsChanged } from './mockRealtimeBus'
import { destroyCloudinaryAsset } from '../lib/cloudinaryUpload'

/**
 * REAL DATA LAYER. Every function mirrors the shape the mock layer used to
 * have (async, same inputs/outputs), so src/hooks/useProjectsData.ts and every
 * component that consumes it stay untouched.
 *
 * The "except Email/AI Assistant, still mock" note that used to live here was
 * stale: emails go through /emails and the assistant through /ai-assistant
 * (src/api/aiApi.ts). Nothing in this file returns fabricated data.
 */

function authToken(): string {
  const token = readBackendSessionToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  return token
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

// ---------------------------------------------------------------------------
// Mapping: backend row shapes (snake_case) -> frontend types (camelCase)
// ---------------------------------------------------------------------------

interface ContactRow {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  role: string | null
  niche: string | null
  notes: string | null
  status: Contact['status']
  stage: Contact['stage']
  workspace_id: string
  visibility: Contact['visibility']
  project_id: string | null
  created_at: string
}

function mapContact(row: ContactRow): Contact {
  const contactName = [row.first_name, row.last_name].filter(Boolean).join(' ')
  return {
    id: row.id,
    company: row.company || '',
    contactName,
    role: row.role || '',
    email: row.email || '',
    phone: row.phone || '',
    photoURL: pickAvatar(row.email || row.id),
    status: row.status,
    niche: row.niche || '',
    notes: row.notes || '',
    stage: row.stage,
    workspaceId: row.workspace_id,
    visibility: row.visibility || 'private',
    projectId: row.project_id,
    createdAt: row.created_at,
  }
}

function contactInputBody(input: ContactInput) {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone,
    company: input.company,
    role: input.role,
    niche: input.niche,
    notes: input.notes,
    workspace_id: input.workspaceId,
    visibility: input.visibility,
    project_id: input.projectId,
    allow_duplicate: input.allowDuplicate,
  }
}

interface ProjectRow {
  id: string
  name: string
  description: string | null
  client: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  tags: string[]
  tagline: string | null
  image: string | null
  color: string | null
  cover_gradient: string | null
  category: string | null
  folder_ids: string[]
  objectives: string[] | null
  owner_id: string
  priority: Project['priority']
  tracked_seconds: number
  memberIds: string[]
  workspace_id: string
  visibility: Project['visibility']
  created_at: string
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline || '',
    description: row.description || '',
    client: row.client || '',
    status: row.status,
    color: row.color || PROJECT_COLOR_PALETTE[0],
    image: row.image,
    coverGradient: row.cover_gradient || GRADIENT_PALETTE[0],
    tags: row.tags || [],
    category: row.category || 'General',
    folderIds: row.folder_ids || [],
    objectives: row.objectives || [],
    ownerId: row.owner_id,
    priority: row.priority,
    trackedSeconds: row.tracked_seconds ?? 0,
    memberIds: row.memberIds || [],
    workspaceId: row.workspace_id,
    visibility: row.visibility || 'private',
    startDate: row.start_date || row.created_at,
    dueDate: row.end_date || row.created_at,
    createdAt: row.created_at,
  }
}

interface TaskRow {
  id: string
  project_id: string
  title: string
  status: TaskStatus
  priority: Task['priority']
  assignee_id: string | null
  tags: string[]
  start_date: string | null
  due_date: string | null
  created_at: string
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    assigneeIds: row.assignee_id ? [row.assignee_id] : [],
    tags: row.tags || [],
    startDate: row.start_date || row.created_at,
    dueDate: row.due_date || row.created_at,
    createdAt: row.created_at,
  }
}

interface FolderRow {
  id: string
  name: string
  icon: Folder['icon']
  color: string | null
  workspace_id: string
  created_at: string
}

function mapFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color || '#94a3b8',
    workspaceId: row.workspace_id,
    createdAt: row.created_at,
  }
}

interface TodoRow {
  id: string
  project_id: string
  title: string
  done: boolean
  tags: string[]
  due_date: string | null
  created_at: string
}

function mapTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    done: row.done,
    tags: row.tags || [],
    dueDate: row.due_date || row.created_at,
    createdAt: row.created_at,
  }
}

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

interface DocumentRow {
  id: string
  project_id: string
  name: string
  mime_type: string
  url: string
  storage_path: string
  size: number
  created_at: string
}

function mapDocument(row: DocumentRow): ProjectDocument {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    mimeType: row.mime_type,
    url: row.url,
    storagePath: row.storage_path,
    size: row.size,
    uploadedAt: row.created_at,
  }
}

interface CalendarEventRow {
  id: string
  title: string
  location: string | null
  projectId: string | null
  startTime: string
  endTime: string
}

function mapMeeting(row: CalendarEventRow): Meeting {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    location: row.location,
    startTime: row.startTime,
    endTime: row.endTime,
  }
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export async function fetchContacts(workspaceId?: string): Promise<Contact[]> {
  const path = workspaceId ? `/contacts?workspace_id=${encodeURIComponent(workspaceId)}` : '/contacts'
  const { data } = await getJson<ApiEnvelope<ContactRow[]>>(path, authToken())
  return data.map(mapContact)
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const { data } = await postJsonAuthed<ApiEnvelope<ContactRow>>('/contacts', contactInputBody(input), authToken())
  emitProjectsChanged()
  return mapContact(data)
}

export async function updateContact(contactId: string, input: ContactInput): Promise<Contact> {
  const { data } = await patchJson<ApiEnvelope<ContactRow>>(
    `/contacts/${contactId}`,
    contactInputBody(input),
    authToken(),
  )
  emitProjectsChanged()
  return mapContact(data)
}

export async function deleteContact(contactId: string): Promise<void> {
  await deleteJson(`/contacts/${contactId}`, authToken())
  emitProjectsChanged()
}

export interface BulkDeleteContactsResult {
  deleted: number
  /** Ids that were not the caller's to delete, or had already gone. */
  skipped: number
}

/**
 * Deletes several contacts in one request.
 *
 * One call rather than N: deleting fifty contacts one at a time means fifty
 * round trips, fifty audit entries and a partially-applied result if the tab
 * is closed halfway. The server checks ownership per id and reports how many
 * it actually removed.
 */
export async function bulkDeleteContacts(contactIds: string[]): Promise<BulkDeleteContactsResult> {
  const { data } = await postJsonAuthed<ApiEnvelope<BulkDeleteContactsResult>>(
    '/contacts/bulk-delete',
    { ids: contactIds },
    authToken(),
  )
  emitProjectsChanged()
  return data
}

interface BulkImportSkippedRowPayload {
  input: Record<string, unknown>
  existingContact?: ContactRow
  message?: string
}

/**
 * Maps a skipped row back to the camelCase shape the UI works in. The server
 * echoes the snake_case body it received, so this is the inverse of
 * contactInputBody.
 */
function mapSkippedRow(row: BulkImportSkippedRowPayload): BulkImportSkippedRow {
  const input = row.input ?? {}
  return {
    contact: {
      firstName: String(input.firstName ?? ''),
      lastName: (input.lastName as string | undefined) ?? undefined,
      email: (input.email as string | undefined) ?? undefined,
      phone: (input.phone as string | undefined) ?? undefined,
      company: (input.company as string | undefined) ?? undefined,
      role: (input.role as string | undefined) ?? undefined,
      niche: (input.niche as string | undefined) ?? undefined,
      notes: (input.notes as string | undefined) ?? undefined,
      visibility: input.visibility as ContactInput['visibility'],
      projectId: (input.projectId as string | null | undefined) ?? undefined,
    },
    existingContact: row.existingContact ? mapContact(row.existingContact) : undefined,
    message: row.message,
  }
}

export async function bulkImportContacts(
  workspaceId: string | undefined,
  contacts: ContactInput[],
  allowDuplicates = false,
): Promise<BulkImportContactsResult> {
  // The backend inserts rows sequentially (several DB round trips each), so
  // the default 5s request timeout routinely aborts a real batch before the
  // backend finishes - the contacts still get created, but the frontend
  // never sees the response and shows a false "Import failed". Scale the
  // timeout with batch size instead.
  const importTimeoutMs = Math.min(60000, 15000 + contacts.length * 400)
  const { data } = await postJsonAuthedWithTimeout<ApiEnvelope<{
    created: ContactRow[]
    createdCount: number
    duplicateCount: number
    failedCount: number
    duplicates?: BulkImportSkippedRowPayload[]
    failed?: BulkImportSkippedRowPayload[]
  }>>(
    '/contacts/bulk-import',
    {
      workspace_id: workspaceId,
      contacts: contacts.map(contactInputBody),
      allow_duplicates: allowDuplicates || undefined,
    },
    authToken(),
    importTimeoutMs,
  )
  emitProjectsChanged()
  return {
    created: data.created.map(mapContact),
    createdCount: data.createdCount,
    duplicateCount: data.duplicateCount,
    failedCount: data.failedCount,
    duplicates: (data.duplicates ?? []).map(mapSkippedRow),
    failed: (data.failed ?? []).map(mapSkippedRow),
  }
}

// Raised from 25. At 25 a 2,000-contact import was 80 separate requests, which
// both ate into the API's rate-limit budget and made the import needlessly slow
// through round-trip latency alone. 100 still keeps each request well inside
// its scaled timeout and the 1mb body limit, while cutting the request count
// fourfold.
const IMPORT_CHUNK_SIZE = 100

/**
 * Splits a large import into fixed-size chunks and sends them sequentially,
 * reporting real progress after each one completes. This is what makes the
 * import progress ring genuine rather than simulated, and independently
 * hardens the timeout fix above further - no single request ever has to
 * carry more than IMPORT_CHUNK_SIZE rows, so it stays fast regardless of
 * how large the overall import is.
 */
export async function bulkImportContactsChunked(
  workspaceId: string | undefined,
  contacts: ContactInput[],
  onProgress?: (done: number, total: number) => void,
  allowDuplicates = false,
): Promise<BulkImportContactsResult> {
  const total = contacts.length
  const aggregate: BulkImportContactsResult = {
    created: [],
    createdCount: 0,
    duplicateCount: 0,
    failedCount: 0,
    duplicates: [],
    failed: [],
  }

  for (let i = 0; i < contacts.length; i += IMPORT_CHUNK_SIZE) {
    const chunk = contacts.slice(i, i + IMPORT_CHUNK_SIZE)

    // Each chunk is isolated. An unhandled throw here used to abandon the whole
    // import and discard the aggregate - while every chunk already sent had
    // been committed server-side. The user saw a flat "Import failed", and
    // retrying the same file then reported all the committed rows as
    // duplicates, which looked exactly like the import silently refusing to
    // work. Recording the chunk as failed instead keeps the run going and
    // reports honestly at the end.
    try {
      const result = await bulkImportContacts(workspaceId, chunk, allowDuplicates)
      aggregate.created.push(...result.created)
      aggregate.createdCount += result.createdCount
      aggregate.duplicateCount += result.duplicateCount
      aggregate.failedCount += result.failedCount
      aggregate.duplicates.push(...result.duplicates)
      aggregate.failed.push(...result.failed)
    } catch (error) {
      aggregate.failedCount += chunk.length
      aggregate.failed.push(
        ...chunk.map((contact) => ({
          contact,
          message: error instanceof Error ? error.message : 'Could not import this batch',
        })),
      )
    }

    onProgress?.(Math.min(i + chunk.length, total), total)
  }

  return aggregate
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

/**
 * `workspaceId` scopes the list to one workspace. Omitting it returns every
 * project the caller can see, across all their workspaces - which is what this
 * always did, and why switching workspace in the UI did not re-scope the list.
 */
export async function fetchProjects(workspaceId?: string): Promise<Project[]> {
  const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
  const { data } = await getJson<ApiEnvelope<ProjectRow[]>>(`/projects${query}`, authToken())
  return data.map(mapProject)
}

export async function fetchProjectById(id: string): Promise<Project | undefined> {
  try {
    const { data } = await getJson<ApiEnvelope<ProjectRow>>(`/projects/${id}`, authToken())
    return mapProject(data)
  } catch {
    return undefined
  }
}

export async function createProject(input: CreateProjectInput, existingColors: string[] = []): Promise<Project> {
  const paletteIndex = pickProjectColorIndex(existingColors)
  const { data } = await postJsonAuthed<ApiEnvelope<ProjectRow>>(
    '/projects',
    {
      name: input.name,
      description: input.description,
      client: input.client,
      tagline: input.description.length > 0 ? input.description.slice(0, 60) : 'A new project',
      status: 'planning',
      color: PROJECT_COLOR_PALETTE[paletteIndex % PROJECT_COLOR_PALETTE.length],
      coverGradient: GRADIENT_PALETTE[paletteIndex % GRADIENT_PALETTE.length],
      category: 'General',
      priority: input.priority ?? 'medium',
      image: input.image,
      memberIds: input.memberIds,
      workspaceId: input.workspaceId,
      visibility: input.visibility,
      startDate: input.startDate,
      dueDate: input.dueDate,
    },
    authToken(),
  )
  emitProjectsChanged()
  return mapProject(data)
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
  await patchJson(`/projects/${projectId}`, { status }, authToken())
  emitProjectsChanged()
}

export async function updateProjectImage(projectId: string, image: string | null): Promise<void> {
  await patchJson(`/projects/${projectId}`, { image }, authToken())
  emitProjectsChanged()
}

/**
 * General project edit. Only the fields present in `input` are sent, so the
 * backend keeps the rest untouched - the narrower updateProjectStatus /
 * updateProjectImage above stay as they are because their call sites only ever
 * change that one field.
 */
export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  const { data } = await patchJson<ApiEnvelope<ProjectRow>>(`/projects/${projectId}`, input, authToken())
  emitProjectsChanged()
  return mapProject(data)
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteJson(`/projects/${projectId}`, authToken())
  emitProjectsChanged()
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export async function fetchFolders(workspaceId?: string): Promise<Folder[]> {
  const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
  const { data } = await getJson<ApiEnvelope<FolderRow[]>>(`/folders${query}`, authToken())
  return data.map(mapFolder)
}

export async function createFolder(input: CreateFolderInput): Promise<Folder> {
  const { data } = await postJsonAuthed<ApiEnvelope<FolderRow>>('/folders', input, authToken())
  emitProjectsChanged()
  return mapFolder(data)
}

export async function updateFolder(folderId: string, input: UpdateFolderInput): Promise<Folder> {
  const { data } = await patchJson<ApiEnvelope<FolderRow>>(`/folders/${folderId}`, input, authToken())
  emitProjectsChanged()
  return mapFolder(data)
}

export async function deleteFolder(folderId: string): Promise<void> {
  await deleteJson(`/folders/${folderId}`, authToken())
  emitProjectsChanged()
}

export async function attachProjectToFolder(projectId: string, folderId: string): Promise<Project> {
  const { data } = await postJsonAuthed<ApiEnvelope<ProjectRow>>(`/projects/${projectId}/folders`, { folderId }, authToken())
  emitProjectsChanged()
  return mapProject(data)
}

export async function detachProjectFromFolder(projectId: string, folderId: string): Promise<Project> {
  const { data } = await deleteJson<ApiEnvelope<ProjectRow>>(`/projects/${projectId}/folders/${folderId}`, authToken())
  emitProjectsChanged()
  return mapProject(data)
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function fetchTasks(workspaceId?: string): Promise<Task[]> {
  const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
  const { data } = await getJson<ApiEnvelope<TaskRow[]>>(`/tasks${query}`, authToken())
  return data.map(mapTask)
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  await patchJson(`/tasks/${taskId}`, { status }, authToken())
  emitProjectsChanged()
}

export async function createTask(
  input: CreateTaskInput & { projectId: string; status: TaskStatus },
): Promise<Task> {
  const { data } = await postJsonAuthed<ApiEnvelope<TaskRow>>(
    '/tasks',
    {
      title: input.title,
      priority: input.priority,
      status: input.status,
      startDate: input.startDate,
      dueDate: input.dueDate,
      projectId: input.projectId,
      assigneeId: input.assigneeId,
      tags: input.tags,
    },
    authToken(),
  )
  emitProjectsChanged()
  return mapTask(data)
}

/** Full task edit. Only the fields present in `input` are sent. */
export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  const { data } = await patchJson<ApiEnvelope<TaskRow>>(`/tasks/${taskId}`, input, authToken())
  emitProjectsChanged()
  return mapTask(data)
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteJson(`/tasks/${taskId}`, authToken())
  emitProjectsChanged()
}

// ---------------------------------------------------------------------------
// Todos
// ---------------------------------------------------------------------------

export async function fetchTodos(workspaceId?: string): Promise<Todo[]> {
  const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
  const { data } = await getJson<ApiEnvelope<TodoRow[]>>(`/todos${query}`, authToken())
  return data.map(mapTodo)
}

export async function toggleTodo(todoId: string): Promise<void> {
  const token = authToken()
  const { data: current } = await getJson<ApiEnvelope<TodoRow>>(`/todos/${todoId}`, token)
  await patchJson(`/todos/${todoId}`, { done: !current.done }, token)
  emitProjectsChanged()
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const { data } = await postJsonAuthed<ApiEnvelope<TodoRow>>('/todos', input, authToken())
  emitProjectsChanged()
  return mapTodo(data)
}

export async function updateTodo(todoId: string, input: UpdateTodoInput): Promise<Todo> {
  const { data } = await patchJson<ApiEnvelope<TodoRow>>(`/todos/${todoId}`, input, authToken())
  emitProjectsChanged()
  return mapTodo(data)
}

export async function deleteTodo(todoId: string): Promise<void> {
  await deleteJson(`/todos/${todoId}`, authToken())
  emitProjectsChanged()
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Meetings - real backend Google-Calendar-backed events, mapped into the
// lighter-weight Meeting shape the dashboard reminder card/mini calendar use.
// ---------------------------------------------------------------------------

export async function fetchMeetings(): Promise<Meeting[]> {
  const { events } = await getJson<{ success: boolean; events: CalendarEventRow[] }>('/calendar', authToken())
  return events.map(mapMeeting)
}

/**
 * Calendar events are the one module whose responses are not wrapped in the
 * { success, data } envelope - they return { success, event } (and the push to
 * Google is best-effort, reported back as `syncedToGoogle`, which the UI does
 * not currently surface).
 */
interface CalendarEventEnvelope {
  success: boolean
  event: CalendarEventRow
  syncedToGoogle: boolean
}

/** The wire body for both create and update - the backend PATCH replaces rather than merges. */
function meetingBody(input: MeetingInput) {
  return {
    title: input.title,
    startTime: input.startTime,
    endTime: input.endTime,
    location: input.location ?? undefined,
    description: input.description ?? undefined,
    projectId: input.projectId ?? null,
  }
}

export async function createMeeting(input: MeetingInput): Promise<Meeting> {
  const { event } = await postJsonAuthed<CalendarEventEnvelope>('/calendar', meetingBody(input), authToken())
  emitProjectsChanged()
  return mapMeeting(event)
}

export async function updateMeeting(meetingId: string, input: MeetingInput): Promise<Meeting> {
  const { event } = await patchJson<CalendarEventEnvelope>(`/calendar/${meetingId}`, meetingBody(input), authToken())
  emitProjectsChanged()
  return mapMeeting(event)
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  await deleteJson(`/calendar/${meetingId}`, authToken())
  emitProjectsChanged()
}

// ---------------------------------------------------------------------------
// Documents - metadata only; bytes already live in Firebase Storage by the
// time uploadDocument is called (see src/lib/documentUpload.ts).
// ---------------------------------------------------------------------------

export async function fetchDocuments(workspaceId?: string): Promise<ProjectDocument[]> {
  const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
  const { data } = await getJson<ApiEnvelope<DocumentRow[]>>(`/documents${query}`, authToken())
  return data.map(mapDocument)
}

export async function uploadDocument(input: UploadDocumentInput): Promise<ProjectDocument> {
  const { data } = await postJsonAuthed<ApiEnvelope<DocumentRow>>('/documents', input, authToken())
  emitProjectsChanged()
  return mapDocument(data)
}

export async function deleteDocument(documentId: string): Promise<void> {
  const { data } = await deleteJson<ApiEnvelope<{ id: string; storagePath: string }>>(
    `/documents/${documentId}`,
    authToken(),
  )
  emitProjectsChanged()
  // Best-effort cleanup of the underlying Cloudinary asset, same pattern as
  // AvatarUploader.tsx - the backend only ever tracked the metadata row.
  // storagePath is "<resourceType>:<publicId>" (see documentUpload.ts).
  const [resourceType, publicId] = data.storagePath?.split(':') ?? []
  if (publicId) {
    destroyCloudinaryAsset(publicId, resourceType)
  }
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

interface EmailRow {
  id: string
  project_id: string | null
  folder: EmailFolder
  sender_name: string | null
  sender_email: string
  sender_color: string | null
  subject: string | null
  body: string | null
  sent_at: string
  starred: boolean
  read: boolean
}

function excerptFromEmailBody(body: string): string {
  return body.length > 120 ? `${body.slice(0, 120).trimEnd()}…` : body
}

function mapEmail(row: EmailRow): Email {
  const body = row.body || ''
  return {
    id: row.id,
    projectId: row.project_id,
    folder: row.folder,
    senderName: row.sender_name || row.sender_email,
    senderColor: row.sender_color || '#94a3b8',
    subject: row.subject || '',
    snippet: excerptFromEmailBody(body),
    body,
    receivedAt: row.sent_at,
    starred: row.starred,
    read: row.read,
  }
}

export async function fetchEmails(): Promise<Email[]> {
  const { data } = await getJson<ApiEnvelope<EmailRow[]>>('/emails', authToken())
  return data.map(mapEmail)
}

export async function toggleEmailStar(emailId: string): Promise<void> {
  const token = authToken()
  const { data: current } = await getJson<ApiEnvelope<EmailRow>>(`/emails/${emailId}`, token)
  await patchJson(`/emails/${emailId}`, { starred: !current.starred }, token)
  emitProjectsChanged()
}

export async function markEmailsRead(emailIds: string[]): Promise<void> {
  const token = authToken()
  await Promise.all(emailIds.map((id) => patchJson(`/emails/${id}`, { read: true }, token)))
  emitProjectsChanged()
}

export async function moveEmailsToFolder(emailIds: string[], folder: EmailFolder): Promise<void> {
  const token = authToken()
  await Promise.all(emailIds.map((id) => patchJson(`/emails/${id}`, { folder }, token)))
  emitProjectsChanged()
}

export async function composeEmail(input: ComposeEmailInput): Promise<Email> {
  const { data } = await postJsonAuthed<ApiEnvelope<EmailRow>>(
    '/emails',
    { to: input.to, subject: input.subject, snippet: input.snippet },
    authToken(),
  )
  emitProjectsChanged()
  return mapEmail(data)
}

// ---------------------------------------------------------------------------
// AI Assistant (Venon) - real backend calls now live in src/api/aiApi.ts
// (fetchChatMessages/sendChatMessage), not here. See that file for why: it
// needs a longer request timeout than the rest of this API client, plus a
// provider (OpenAI/Gemini) and workspaceId that this module's other
// functions don't deal with.
// ---------------------------------------------------------------------------
