import { createContext } from 'react'
import type { Workspace } from '../types/workspace'

export interface WorkspaceContextValue {
  workspaces: Workspace[]
  isLoading: boolean
  /** The currently active workspace, or undefined until workspaces have loaded. */
  activeWorkspace: Workspace | undefined
  activeWorkspaceId: string | null
  setActiveWorkspaceId: (workspaceId: string) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined)
