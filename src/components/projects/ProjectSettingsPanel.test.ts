import { describe, expect, it } from 'vitest'
import { canLeaveProject } from './ProjectSettingsPanel'
import { queryKeys } from '../../lib/queryClient'

describe('canLeaveProject', () => {
  it('lets a member who did not create the project leave', () => {
    expect(canLeaveProject({ currentUserId: 'u2', ownerId: 'u1', isMember: true })).toBe(true)
  })

  it('hides Leave for the creator, who deletes the project instead', () => {
    expect(canLeaveProject({ currentUserId: 'u1', ownerId: 'u1', isMember: true })).toBe(false)
  })

  it('hides Leave for someone who can see the project but is not on it', () => {
    expect(canLeaveProject({ currentUserId: 'u3', ownerId: 'u1', isMember: false })).toBe(false)
  })
})

describe('pending invite keys', () => {
  it('nest a project under its workspace, so invalidating the workspace refreshes both', () => {
    const workspaceKey = queryKeys.pendingInvites('w1')
    const projectKey = queryKeys.pendingInvites('w1', 'p1')
    expect(projectKey.slice(0, workspaceKey.length)).toEqual([...workspaceKey])
    expect(projectKey).not.toEqual(workspaceKey)
  })
})
