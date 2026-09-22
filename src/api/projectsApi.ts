import { getJson, patchJson, deleteJson, postJsonAuthed, fetchBackendMe } from '../lib/backendApi'
import { readBackendSessionToken } from '../lib/backendSession'
import { pickAvatar } from '../lib/avatars'
import { GRADIENT_PALETTE, PROJECT_COLOR_PALETTE } from '../lib/constants'
import type {
  BulkImportContactsResult,
  ComposeEmailInput,
  Contact,
  ContactInput,
  CreateFolderInput,
  CreateProjectInput,
  Email,
  EmailFolder,
  Folder,
  Meeting,
  Member,
  Note,
  NoteInput,
  Project,
  ProjectDocument,
  Task,
  TaskStatus,
  ProjectStatus,
  Todo,
  UploadDocumentInput,
} from '../types/project'
import { emitProjectsChanged } from './mockRealtimeBus'
import { destroyCloudinaryAsset } from '../lib/cloudinaryUpload'

/**
 * REAL DATA LAYER (except Email/AI Assistant, deliberately still mock — see
 * below). Every function mirrors the shape the mock layer used to have
 * (async, same inputs/outputs), so src/hooks/useProjectsData.ts and every
 * component that consumes it stay untouched.
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
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  tags: string[]
  tagline: string | null
  image: string | null
  color: string | null
  cover_gradient: string | null
  category: string | null
  folder_id: string | null
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
    status: row.status,
    color: row.color || PROJECT_COLOR_PALETTE[0],
    image: row.image,
    coverGradient: row.cover_gradient || GRADIENT_PALETTE[0],
    tags: row.tags || [],
    category: row.category || 'General',
    folderId: row.folder_id,
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
  created_at: string
}

function mapFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color || '#94a3b8',
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
// Members - no team/invite system exists on the backend, so the only real
// "member" of any project is the signed-in user themself.
// ---------------------------------------------------------------------------

export async function fetchMembers(): Promise<Member[]> {
  const me = await fetchBackendMe(authToken())
  return [{ id: me.uid, name: me.name || me.email, photoURL: me.picture }]
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

export async function bulkImportContacts(
  workspaceId: string | undefined,
  contacts: ContactInput[],
): Promise<BulkImportContactsResult> {
  const { data } = await postJsonAuthed<ApiEnvelope<{
    created: ContactRow[]
    createdCount: number
    duplicateCount: number
    failedCount: number
  }>>(
    '/contacts/bulk-import',
    { workspace_id: workspaceId, contacts: contacts.map(contactInputBody) },
    authToken(),
  )
  emitProjectsChanged()
  return {
    created: data.created.map(mapContact),
    createdCount: data.createdCount,
    duplicateCount: data.duplicateCount,
    failedCount: data.failedCount,
  }
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await getJson<ApiEnvelope<ProjectRow[]>>('/projects', authToken())
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

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const paletteIndex = Math.floor(Math.random() * PROJECT_COLOR_PALETTE.length)
  const { data } = await postJsonAuthed<ApiEnvelope<ProjectRow>>(
    '/projects',
    {
      name: input.name,
      description: input.description,
      tagline: input.description.length > 0 ? input.description.slice(0, 60) : 'A new project',
      status: 'planning',
      color: PROJECT_COLOR_PALETTE[paletteIndex % PROJECT_COLOR_PALETTE.length],
      coverGradient: GRADIENT_PALETTE[paletteIndex % GRADIENT_PALETTE.length],
      category: 'General',
      priority: 'medium',
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

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export async function fetchFolders(): Promise<Folder[]> {
  const { data } = await getJson<ApiEnvelope<FolderRow[]>>('/folders', authToken())
  return data.map(mapFolder)
}

export async function createFolder(input: CreateFolderInput): Promise<Folder> {
  const { data } = await postJsonAuthed<ApiEnvelope<FolderRow>>('/folders', input, authToken())
  emitProjectsChanged()
  return mapFolder(data)
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function fetchTasks(): Promise<Task[]> {
  const { data } = await getJson<ApiEnvelope<TaskRow[]>>('/tasks', authToken())
  return data.map(mapTask)
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  await patchJson(`/tasks/${taskId}`, { status }, authToken())
  emitProjectsChanged()
}

export async function createTask(input: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
  const { data } = await postJsonAuthed<ApiEnvelope<TaskRow>>(
    '/tasks',
    {
      title: input.title,
      priority: input.priority,
      status: input.status,
      startDate: input.startDate,
      dueDate: input.dueDate,
      projectId: input.projectId,
      assigneeId: input.assigneeIds[0],
    },
    authToken(),
  )
  emitProjectsChanged()
  return mapTask(data)
}

// ---------------------------------------------------------------------------
// Todos
// ---------------------------------------------------------------------------

export async function fetchTodos(): Promise<Todo[]> {
  const { data } = await getJson<ApiEnvelope<TodoRow[]>>('/todos', authToken())
  return data.map(mapTodo)
}

export async function toggleTodo(todoId: string): Promise<void> {
  const token = authToken()
  const { data: current } = await getJson<ApiEnvelope<TodoRow>>(`/todos/${todoId}`, token)
  await patchJson(`/todos/${todoId}`, { done: !current.done }, token)
  emitProjectsChanged()
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export async function fetchNotes(): Promise<Note[]> {
  const { notes } = await getJson<{ success: boolean; notes: NoteRow[] }>('/notes', authToken())
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

// ---------------------------------------------------------------------------
// Documents - metadata only; bytes already live in Firebase Storage by the
// time uploadDocument is called (see src/lib/documentUpload.ts).
// ---------------------------------------------------------------------------

export async function fetchDocuments(): Promise<ProjectDocument[]> {
  const { data } = await getJson<ApiEnvelope<DocumentRow[]>>('/documents', authToken())
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
