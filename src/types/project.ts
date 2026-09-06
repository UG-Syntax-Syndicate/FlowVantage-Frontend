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
  startDate: z.string(),
  dueDate: z.string(),
  createdAt: z.string(),
})
export type Task = z.infer<typeof TaskSchema>

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  status: ProjectStatusSchema,
  color: z.string(),
  image: z.string().nullable(),
  coverGradient: z.string(),
  tags: z.array(z.string()),
  category: z.string(),
  folderId: z.string(),
  priority: PrioritySchema,
  trackedSeconds: z.number(),
  memberIds: z.array(z.string()),
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
})
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>

export const FolderIconSchema = z.enum(['users', 'handshake', 'user', 'heart', 'sparkles', 'megaphone'])
export type FolderIcon = z.infer<typeof FolderIconSchema>

export const FolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: FolderIconSchema,
  color: z.string(),
  createdAt: z.string(),
})
export type Folder = z.infer<typeof FolderSchema>

export const CreateFolderInputSchema = FolderSchema.pick({ name: true, icon: true, color: true })
export type CreateFolderInput = z.infer<typeof CreateFolderInputSchema>

export const CreateTaskInputSchema = TaskSchema.pick({
  title: true,
  priority: true,
  assigneeIds: true,
  startDate: true,
  dueDate: true,
})
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>

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

export const NoteInputSchema = NoteSchema.pick({ title: true, body: true, color: true })
export type NoteInput = z.infer<typeof NoteInputSchema>

export const EmailFolderSchema = z.enum(['inbox', 'pending', 'drafts', 'spam', 'trash'])
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
  dataUrl: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
})
export type ProjectDocument = z.infer<typeof DocumentSchema>

export const UploadDocumentInputSchema = DocumentSchema.pick({
  projectId: true,
  name: true,
  mimeType: true,
  dataUrl: true,
  size: true,
})
export type UploadDocumentInput = z.infer<typeof UploadDocumentInputSchema>

export const ContactStatusSchema = z.enum(['new_client', 'potential_client', 'old_client', 'blacklist'])
export type ContactStatus = z.infer<typeof ContactStatusSchema>

export const ContactStageSchema = z.enum(['in_progress', 'proposal_sent', 'completed', 'rejected'])
export type ContactStage = z.infer<typeof ContactStageSchema>

export const ContactSchema = z.object({
  id: z.string(),
  company: z.string(),
  contactName: z.string(),
  role: z.string(),
  email: z.string(),
  photoURL: z.string().nullable(),
  status: ContactStatusSchema,
  niche: z.string(),
  stage: ContactStageSchema,
  createdAt: z.string(),
})
export type Contact = z.infer<typeof ContactSchema>

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
  projectId: z.string(),
  title: z.string(),
  withCompany: z.string(),
  startTime: z.string(),
  endTime: z.string(),
})
export type Meeting = z.infer<typeof MeetingSchema>
