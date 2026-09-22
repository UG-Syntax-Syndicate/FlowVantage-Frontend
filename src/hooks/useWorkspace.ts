import { useContext } from 'react'
import { WorkspaceContext } from '../context/WorkspaceContext'

export function useWorkspace() {
  const context = useContext(WorkspaceContext)

  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }

  return context
}

/** The active workspace's role for the signed-in user, or null before workspaces have loaded. */
export function useWorkspaceRole() {
  const { activeWorkspace } = useWorkspace()
  return activeWorkspace?.memberRole ?? null
}
