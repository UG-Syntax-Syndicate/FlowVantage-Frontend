import { z } from 'zod'

export const WorkspaceRoleSchema = z.enum(['owner', 'admin', 'member'])
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>

export const ProjectRoleSchema = z.enum(['owner', 'contributor', 'viewer'])
export type ProjectRole = z.infer<typeof ProjectRoleSchema>

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  isPersonal: z.boolean(),
  memberRole: WorkspaceRoleSchema,
  createdAt: z.string(),
})
export type Workspace = z.infer<typeof WorkspaceSchema>

export const WorkspaceMemberSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  role: WorkspaceRoleSchema,
  name: z.string(),
  email: z.string(),
  photoURL: z.string().nullable(),
  joinedAt: z.string(),
})
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>

export const ProjectMemberSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  role: ProjectRoleSchema,
  name: z.string(),
  email: z.string(),
  photoURL: z.string().nullable(),
  joinedAt: z.string(),
})
export type ProjectMember = z.infer<typeof ProjectMemberSchema>

export const InvitationStatusSchema = z.enum(['pending', 'accepted', 'revoked', 'expired'])
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>

export const InvitationSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  projectId: z.string().nullable(),
  email: z.string(),
  workspaceRole: WorkspaceRoleSchema,
  projectRole: ProjectRoleSchema.nullable(),
  token: z.string(),
  status: InvitationStatusSchema,
  expiresAt: z.string(),
  createdAt: z.string(),
})
export type Invitation = z.infer<typeof InvitationSchema>

export const CreateInviteInputSchema = z.object({
  workspaceId: z.string(),
  projectId: z.string().nullable().optional(),
  email: z.string().email(),
  workspaceRole: WorkspaceRoleSchema.default('member'),
  projectRole: ProjectRoleSchema.optional(),
})
export type CreateInviteInput = z.infer<typeof CreateInviteInputSchema>
