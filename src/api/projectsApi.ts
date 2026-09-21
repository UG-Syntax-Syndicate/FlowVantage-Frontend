import { getJson, patchJson, deleteJson, postJsonAuthed, fetchBackendMe } from '../lib/backendApi'
import { readBackendSessionToken } from '../lib/backendSession'
import { pickAvatar } from '../lib/avatars'
import { GRADIENT_PALETTE, PROJECT_COLOR_PALETTE } from '../lib/constants'
import { MOCK_CHAT_MESSAGES, MOCK_EMAILS } from '../mocks/seedData'
import type {
  ChatMessage,
  ComposeEmailInput,
  Contact,
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
import { deleteObject, ref } from 'firebase/storage'
import { storage } from '../lib/firebase'

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
  company: string | null
  role: string | null
  niche: string | null
  status: Contact['status']
  stage: Contact['stage']
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
    photoURL: pickAvatar(row.email || row.id),
    status: row.status,
    niche: row.niche || '',
    stage: row.stage,
    createdAt: row.created_at,
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

export async function fetchContacts(): Promise<Contact[]> {
  const { data } = await getJson<ApiEnvelope<ContactRow[]>>('/contacts', authToken())
  return data.map(mapContact)
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
    { title: input.title, content: input.body, color: input.color },
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
  // Best-effort cleanup of the underlying Storage object, same pattern as
  // AvatarUploader.tsx - the backend only ever tracked the metadata row.
  if (data.storagePath) {
    deleteObject(ref(storage, data.storagePath)).catch(() => {})
  }
}

// ---------------------------------------------------------------------------
// Email / AI Assistant - deliberately still mock. Both features are locked
// behind the "coming soon" nav treatment (no backend endpoint exists for
// either), but their pages/hooks stay in the tree for a fast follow-up.
// ---------------------------------------------------------------------------

let emails: Email[] = MOCK_EMAILS.map((e) => ({ ...e }))
let nextEmailId = emails.length + 1
let chatMessages: ChatMessage[] = MOCK_CHAT_MESSAGES.map((m) => ({ ...m }))
let nextChatMessageId = chatMessages.length + 1

const NETWORK_DELAY_MS = 350

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS))
}

export async function fetchEmails(): Promise<Email[]> {
  return delay(emails.map((e) => ({ ...e })))
}

export async function toggleEmailStar(emailId: string): Promise<void> {
  emails = emails.map((e) => (e.id === emailId ? { ...e, starred: !e.starred } : e))
  await delay(undefined)
  emitProjectsChanged()
}

export async function markEmailsRead(emailIds: string[]): Promise<void> {
  emails = emails.map((e) => (emailIds.includes(e.id) ? { ...e, read: true } : e))
  await delay(undefined)
  emitProjectsChanged()
}

export async function moveEmailsToFolder(emailIds: string[], folder: EmailFolder): Promise<void> {
  emails = emails.map((e) => (emailIds.includes(e.id) ? { ...e, folder } : e))
  await delay(undefined)
  emitProjectsChanged()
}

export async function composeEmail(input: ComposeEmailInput): Promise<Email> {
  const email: Email = {
    id: `e${nextEmailId++}`,
    projectId: null,
    folder: 'drafts',
    senderName: 'You',
    senderColor: '#94a3b8',
    subject: input.subject,
    snippet: input.snippet,
    body: input.snippet,
    receivedAt: new Date().toISOString(),
    starred: false,
    read: true,
  }
  emails = [email, ...emails]
  const result = await delay(email)
  emitProjectsChanged()
  return result
}

export async function fetchChatMessages(): Promise<ChatMessage[]> {
  return delay(chatMessages.map((m) => ({ ...m })))
}

const ASSISTANT_REPLY_DELAY_MS = 900

function cannedAssistantReply(userMessage: string): string {
  const text = userMessage.toLowerCase()
  if (text.includes('overdue') || text.includes('risk') || text.includes('billing')) {
    return [
      '**Billing Migration** is the one to watch.',
      '',
      '- "Reconcile historic ledger data" is **overdue**',
      '- The project deadline is only **5 days** out',
      '',
      'Everything else across your projects is on track for now.',
    ].join('\n')
  }
  if (text.includes('progress') || text.includes('summary') || text.includes('status')) {
    return [
      '### Project status',
      '',
      '1. **Hikoko Design System** — 2 tasks in progress',
      '2. **Mobile App Revamp** — 2 tasks in progress',
      '3. **Q3 Marketing Site** — still in planning',
      '4. **Billing Migration** — 1 overdue task',
      '',
      '---',
      '',
      'Hikoko Design System and Mobile App Revamp are the most active projects this week.',
    ].join('\n')
  }
  if (text.includes('marketing') || text.includes('draft') || text.includes('note')) {
    return [
      "Here's a short draft you can send as-is or adjust:",
      '',
      '> Hi team — quick update on Q3 Marketing Site: design review wrapped this week and development kicks off Monday. No blockers so far.',
      '',
      'Let me know if you would rather I adjust the tone or add specific numbers before you send it.',
    ].join('\n')
  }
  if (text.includes('meeting') || text.includes('calendar')) {
    return [
      'Your next meeting is the **Mobile revamp check-in** with the Field Ops Team.',
      '',
      'I can draft an agenda if that would help.',
    ].join('\n')
  }
  return "I don't have live access to your workspace yet in this demo, but based on your recent activity, **Hikoko Design System** and **Mobile App Revamp** are the most active projects this week. Ask me about a specific project and I will do my best with what's here."
}

export async function sendChatMessage(content: string): Promise<ChatMessage> {
  const userMessage: ChatMessage = {
    id: `cm${nextChatMessageId++}`,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  }
  chatMessages = [...chatMessages, userMessage]
  const result = await delay(userMessage)
  emitProjectsChanged()

  // Simulate an async assistant reply arriving a moment later, same as a
  // real backend would push one over a socket/webhook.
  setTimeout(() => {
    const reply: ChatMessage = {
      id: `cm${nextChatMessageId++}`,
      role: 'assistant',
      content: cannedAssistantReply(content),
      createdAt: new Date().toISOString(),
    }
    chatMessages = [...chatMessages, reply]
    emitProjectsChanged()
  }, ASSISTANT_REPLY_DELAY_MS)

  return result
}
