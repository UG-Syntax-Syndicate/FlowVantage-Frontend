import {
  GRADIENT_PALETTE,
  MOCK_CHAT_MESSAGES,
  MOCK_CONTACTS,
  MOCK_DOCUMENTS,
  MOCK_EMAILS,
  MOCK_FOLDERS,
  MOCK_MEETINGS,
  MOCK_MEMBERS,
  MOCK_NOTES,
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_TODOS,
  PROJECT_COLOR_PALETTE,
} from '../mocks/seedData'
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

/**
 * DEMO DATA LAYER - no network calls.
 *
 * This module is the ONLY place that knows the data is fake. Every function
 * here mirrors the shape a real backend call will have (async, same
 * inputs/outputs) so that when the real Firestore/REST endpoints land, only
 * the function bodies below change - src/hooks/useProjects.ts and every
 * component that consumes it stay untouched.
 */

let projects: Project[] = MOCK_PROJECTS.map((p) => ({ ...p }))
let tasks: Task[] = MOCK_TASKS.map((t) => ({ ...t }))
let todos: Todo[] = MOCK_TODOS.map((t) => ({ ...t }))
let folders: Folder[] = MOCK_FOLDERS.map((f) => ({ ...f }))
const members: Member[] = MOCK_MEMBERS
let notes: Note[] = MOCK_NOTES.map((n) => ({ ...n }))
const meetings: Meeting[] = MOCK_MEETINGS
let emails: Email[] = MOCK_EMAILS.map((e) => ({ ...e }))
const contacts: Contact[] = MOCK_CONTACTS
let documents: ProjectDocument[] = MOCK_DOCUMENTS.map((d) => ({ ...d }))
let chatMessages: ChatMessage[] = MOCK_CHAT_MESSAGES.map((m) => ({ ...m }))
let nextEmailId = emails.length + 1
let nextNoteId = notes.length + 1
let nextDocumentId = documents.length + 1
let nextChatMessageId = chatMessages.length + 1

const NETWORK_DELAY_MS = 350

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS))
}

let nextProjectId = projects.length + 1
let nextTaskId = tasks.length + 1
let nextFolderId = folders.length + 1

export async function fetchMembers(): Promise<Member[]> {
  return delay(members)
}

export async function fetchContacts(): Promise<Contact[]> {
  return delay(contacts.map((c) => ({ ...c })))
}

export async function fetchProjects(): Promise<Project[]> {
  return delay(projects.map((p) => ({ ...p })))
}

export async function fetchTasks(): Promise<Task[]> {
  return delay(tasks.map((t) => ({ ...t })))
}

export async function fetchProjectById(id: string): Promise<Project | undefined> {
  return delay(projects.find((p) => p.id === id))
}

export async function fetchFolders(): Promise<Folder[]> {
  return delay(folders)
}

export async function fetchTodos(): Promise<Todo[]> {
  return delay(todos.map((t) => ({ ...t })))
}

export async function fetchNotes(): Promise<Note[]> {
  return delay(notes.map((n) => ({ ...n })))
}

function excerptFromBody(body: string): string {
  return body.length > 120 ? `${body.slice(0, 120).trimEnd()}…` : body
}

export async function createNote(input: NoteInput): Promise<Note> {
  const note: Note = {
    ...input,
    id: `n${nextNoteId++}`,
    projectId: null,
    excerpt: excerptFromBody(input.body),
    pinned: false,
    tags: [],
    createdAt: new Date().toISOString(),
  }
  notes = [note, ...notes]
  const result = await delay(note)
  emitProjectsChanged()
  return result
}

export async function updateNote(noteId: string, input: NoteInput): Promise<void> {
  notes = notes.map((n) => (n.id === noteId ? { ...n, ...input, excerpt: excerptFromBody(input.body) } : n))
  await delay(undefined)
  emitProjectsChanged()
}

export async function deleteNote(noteId: string): Promise<void> {
  notes = notes.filter((n) => n.id !== noteId)
  await delay(undefined)
  emitProjectsChanged()
}

export async function toggleNotePinned(noteId: string): Promise<void> {
  notes = notes.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n))
  await delay(undefined)
  emitProjectsChanged()
}

export async function fetchMeetings(): Promise<Meeting[]> {
  return delay(meetings)
}

export async function toggleTodo(todoId: string): Promise<void> {
  todos = todos.map((t) => (t.id === todoId ? { ...t, done: !t.done } : t))
  await delay(undefined)
  emitProjectsChanged()
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

const DEFAULT_FOLDER_ID = 'f1'

export async function createFolder(input: CreateFolderInput): Promise<Folder> {
  const folder: Folder = { ...input, id: `f${nextFolderId++}`, createdAt: new Date().toISOString() }
  folders = [...folders, folder]
  const result = await delay(folder)
  emitProjectsChanged()
  return result
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const index = projects.length
  const project: Project = {
    ...input,
    id: `p${nextProjectId++}`,
    tagline: input.description.length > 0 ? input.description.slice(0, 60) : 'A new project',
    status: 'planning',
    color: PROJECT_COLOR_PALETTE[index % PROJECT_COLOR_PALETTE.length],
    coverGradient: GRADIENT_PALETTE[index % GRADIENT_PALETTE.length],
    tags: [],
    category: 'General',
    folderId: DEFAULT_FOLDER_ID,
    priority: 'medium',
    trackedSeconds: 0,
    createdAt: new Date().toISOString(),
  }
  projects = [project, ...projects]
  const result = await delay(project)
  emitProjectsChanged()
  return result
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
  projects = projects.map((p) => (p.id === projectId ? { ...p, status } : p))
  await delay(undefined)
  emitProjectsChanged()
}

export async function updateProjectImage(projectId: string, image: string | null): Promise<void> {
  projects = projects.map((p) => (p.id === projectId ? { ...p, image } : p))
  await delay(undefined)
  emitProjectsChanged()
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  tasks = tasks.map((t) => (t.id === taskId ? { ...t, status } : t))
  await delay(undefined)
  emitProjectsChanged()
}

export async function createTask(input: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
  const task: Task = { ...input, id: `t${nextTaskId++}`, createdAt: new Date().toISOString() }
  tasks = [task, ...tasks]
  const result = await delay(task)
  emitProjectsChanged()
  return result
}

export async function fetchDocuments(): Promise<ProjectDocument[]> {
  return delay(documents.map((d) => ({ ...d })))
}

export async function uploadDocument(input: UploadDocumentInput): Promise<ProjectDocument> {
  const document: ProjectDocument = {
    ...input,
    id: `d${nextDocumentId++}`,
    uploadedAt: new Date().toISOString(),
  }
  documents = [document, ...documents]
  const result = await delay(document)
  emitProjectsChanged()
  return result
}

export async function deleteDocument(documentId: string): Promise<void> {
  documents = documents.filter((d) => d.id !== documentId)
  await delay(undefined)
  emitProjectsChanged()
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
