import { z } from 'zod'

export const ProjectStatusSchema = z.enum(['planning', 'in_progress', 'on_hold', 'completed'])
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>

export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'in_review', 'done'])
export type TaskStatus = z.infer<typeof TaskStatusSchema>

export const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])
export type Priority = z.infer<typeof PrioritySchema>

export const MemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  photoURL: z.string().nullable(),
})
export type Member = z.infer<typeof MemberSchema>

export const TaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  status: TaskStatusSchema,
  priority: PrioritySchema,
  assigneeIds: z.array(z.string()),
  tags: z.array(z.string()),
  startDate: z.string(),
  dueDate: z.string(),
  createdAt: z.string(),
})
export type Task = z.infer<typeof TaskSchema>

export const ProjectVisibilitySchema = z.enum(['private', 'workspace'])
export type ProjectVisibility = z.infer<typeof ProjectVisibilitySchema>

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  client: z.string(),
  status: ProjectStatusSchema,
  color: z.string(),
  image: z.string().nullable(),
  coverGradient: z.string(),
  tags: z.array(z.string()),
  category: z.string(),
  folderIds: z.array(z.string()),
  /** What the project is trying to achieve - shown on the overview. */
  objectives: z.array(z.string()),
  /** Whoever created it. Distinct from the project_members row with role 'owner'. */
  ownerId: z.string(),
  priority: PrioritySchema,
  trackedSeconds: z.number(),
  memberIds: z.array(z.string()),
  workspaceId: z.string(),
  visibility: ProjectVisibilitySchema,
  startDate: z.string(),
  dueDate: z.string(),
  createdAt: z.string(),
})
export type Project = z.infer<typeof ProjectSchema>

export const CreateProjectInputSchema = ProjectSchema.pick({
  name: true,
  description: true,
  image: true,
  memberIds: true,
  startDate: true,
  dueDate: true,
}).extend({
  workspaceId: z.string().optional(),
  visibility: ProjectVisibilitySchema.optional(),
  priority: PrioritySchema.optional(),
  client: z.string().trim().optional(),
})
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>

/**
 * The fields a project edit form may change. Everything is optional - the
 * backend PATCH keeps any field that isn't sent.
 */
export const UpdateProjectInputSchema = ProjectSchema.pick({
  name: true,
  description: true,
  tagline: true,
  status: true,
  category: true,
  priority: true,
  tags: true,
  objectives: true,
  startDate: true,
  dueDate: true,
  visibility: true,
}).partial()
export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>

export const FolderIconSchema = z.enum(['users', 'handshake', 'user', 'heart', 'sparkles', 'megaphone'])
export type FolderIcon = z.infer<typeof FolderIconSchema>

export const FolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: FolderIconSchema,
  color: z.string(),
  workspaceId: z.string(),
  createdAt: z.string(),
})
export type Folder = z.infer<typeof FolderSchema>

export const CreateFolderInputSchema = FolderSchema.pick({ name: true, icon: true, color: true }).extend({
  workspaceId: z.string().optional(),
})
export type CreateFolderInput = z.infer<typeof CreateFolderInputSchema>

export const UpdateFolderInputSchema = FolderSchema.pick({ name: true, icon: true, color: true }).partial()
export type UpdateFolderInput = z.infer<typeof UpdateFolderInputSchema>

// A standalone object rather than TaskSchema.pick(): the create shape sends a
// single assigneeId (matching the backend's one-assignee FK), while
// TaskSchema.assigneeIds stays an array for the read/board/calendar side.
export const CreateTaskInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  priority: PrioritySchema,
  assigneeId: z.string().min(1, 'Assignee is required'),
  tags: z.array(z.string()),
  startDate: z.string(),
  dueDate: z.string(),
})
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>

/** The fields a task edit form may change. */
// Mirrors CreateTaskInputSchema's single assigneeId rather than TaskSchema's
// assigneeIds array, for the same reason: the backend stores one assignee.
export const UpdateTaskInputSchema = CreateTaskInputSchema.extend({
  status: TaskStatusSchema,
}).partial()
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>

export const TodoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  done: z.boolean(),
  tags: z.array(z.string()),
  dueDate: z.string(),
  createdAt: z.string(),
})
export type Todo = z.infer<typeof TodoSchema>

export const CreateTodoInputSchema = TodoSchema.pick({ projectId: true, title: true }).extend({
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
})
export type CreateTodoInput = z.infer<typeof CreateTodoInputSchema>

export const UpdateTodoInputSchema = TodoSchema.pick({
  title: true,
  done: true,
  tags: true,
  dueDate: true,
}).partial()
export type UpdateTodoInput = z.infer<typeof UpdateTodoInputSchema>

export const NoteColorSchema = z.enum(['blue', 'green', 'purple', 'yellow', 'red', 'gray'])
export type NoteColor = z.infer<typeof NoteColorSchema>

export const NoteSchema = z.object({
  id: z.string(),
  projectId: z.string().nullable(),
  title: z.string(),
  body: z.string(),
  excerpt: z.string(),
  color: NoteColorSchema,
  pinned: z.boolean(),
  tags: z.array(z.string()),
  createdAt: z.string(),
})
export type Note = z.infer<typeof NoteSchema>

export const NoteInputSchema = NoteSchema.pick({ title: true, body: true, color: true }).extend({
  projectId: z.string().nullable().optional(),
})
export type NoteInput = z.infer<typeof NoteInputSchema>

// 'sent' arrived with real outbound mail; before that, composing only ever
// produced a draft, so nothing could be in a Sent folder.
export const EmailFolderSchema = z.enum(['inbox', 'pending', 'drafts', 'sent', 'spam', 'trash'])
export type EmailFolder = z.infer<typeof EmailFolderSchema>

export const EmailSchema = z.object({
  id: z.string(),
  projectId: z.string().nullable(),
  folder: EmailFolderSchema,
  senderName: z.string(),
  senderColor: z.string(),
  subject: z.string(),
  snippet: z.string(),
  body: z.string(),
  receivedAt: z.string(),
  starred: z.boolean(),
  read: z.boolean(),
})
export type Email = z.infer<typeof EmailSchema>

export const ComposeEmailInputSchema = EmailSchema.pick({ subject: true, snippet: true }).extend({
  to: z.string(),
})
export type ComposeEmailInput = z.infer<typeof ComposeEmailInputSchema>

export const DocumentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  mimeType: z.string(),
  url: z.string(),
  storagePath: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
})
export type ProjectDocument = z.infer<typeof DocumentSchema>

export const UploadDocumentInputSchema = DocumentSchema.pick({
  projectId: true,
  name: true,
  mimeType: true,
  url: true,
  storagePath: true,
  size: true,
})
export type UploadDocumentInput = z.infer<typeof UploadDocumentInputSchema>

export const ContactStatusSchema = z.enum(['new_client', 'potential_client', 'old_client', 'blacklist'])
export type ContactStatus = z.infer<typeof ContactStatusSchema>

export const ContactStageSchema = z.enum(['in_progress', 'proposal_sent', 'completed', 'rejected'])
export type ContactStage = z.infer<typeof ContactStageSchema>

export const ContactVisibilitySchema = z.enum(['private', 'shared'])
export type ContactVisibility = z.infer<typeof ContactVisibilitySchema>

export const ContactSchema = z.object({
  id: z.string(),
  company: z.string(),
  contactName: z.string(),
  role: z.string(),
  email: z.string(),
  phone: z.string(),
  photoURL: z.string().nullable(),
  status: ContactStatusSchema,
  niche: z.string(),
  notes: z.string(),
  stage: ContactStageSchema,
  workspaceId: z.string(),
  visibility: ContactVisibilitySchema,
  projectId: z.string().nullable(),
  createdAt: z.string(),
})
export type Contact = z.infer<typeof ContactSchema>

export const ContactInputSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  niche: z.string().optional(),
  notes: z.string().optional(),
  workspaceId: z.string().optional(),
  visibility: ContactVisibilitySchema.optional(),
  projectId: z.string().nullable().optional(),
  allowDuplicate: z.boolean().optional(),
})
export type ContactInput = z.infer<typeof ContactInputSchema>

/** A row the server declined to create, and what it collided with. */
export interface BulkImportSkippedRow {
  contact: ContactInput
  /** Present for a duplicate: the existing contact it matched. */
  existingContact?: Contact
  /** Present for a failure: why it could not be imported. */
  message?: string
}

export interface BulkImportContactsResult {
  created: Contact[]
  duplicateCount: number
  failedCount: number
  createdCount: number
  // The rows themselves, not just the counts. The import UI could previously
  // only report "N skipped as likely duplicates" and offer nothing to do about
  // it, which made a flagged import a dead end.
  duplicates: BulkImportSkippedRow[]
  failed: BulkImportSkippedRow[]
}

export const ChatRoleSchema = z.enum(['user', 'assistant'])
export type ChatRole = z.infer<typeof ChatRoleSchema>

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: ChatRoleSchema,
  content: z.string(),
  createdAt: z.string(),
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>

export const MeetingSchema = z.object({
  id: z.string(),
  projectId: z.string().nullable(),
  title: z.string(),
  location: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  /** A conferencing link, so the meeting can be joined from here. */
  joinUrl: z.string().nullable(),
  /** Which provider it was pulled from; null means it was created here. */
  source: z.string().nullable(),
})
export type Meeting = z.infer<typeof MeetingSchema>

/**
 * A calendar event as the form collects it, for both create and update.
 *
 * A standalone object rather than MeetingSchema.pick(): the form wants
 * location/projectId optional-and-nullable, while the read shape has them as
 * plain nullable (always present once the row exists).
 */
export const MeetingInputSchema = z
  .object({
    title: z.string().trim().min(1, 'Give the event a title').max(200, 'Title is too long'),
    startTime: z.string().min(1, 'Pick a start time'),
    endTime: z.string().min(1, 'Pick an end time'),
    location: z.string().max(200, 'Location is too long').nullable().optional(),
    description: z.string().max(2000, 'Description is too long').nullable().optional(),
    projectId: z.string().nullable().optional(),
    /**
     * Validated as a URL rather than free text, because it is rendered as an
     * href - and the server rejects anything that is not http(s) for the
     * same reason. Empty is allowed and means "no link".
     */
    joinUrl: z
      .string()
      .trim()
      .url('That does not look like a link')
      .nullable()
      .optional()
      .or(z.literal('')),
  })
  .refine((input) => new Date(input.endTime) >= new Date(input.startTime), {
    message: 'The event cannot end before it starts',
    path: ['endTime'],
  })
export type MeetingInput = z.infer<typeof MeetingInputSchema>

/**
 * The create-only alias kept for CreateProjectModal's kickoff meeting, which
 * predates the standalone event form. Same shape - update needs every field
 * too, because the backend PATCH replaces rather than merges.
 */
export type CreateMeetingInput = MeetingInput
