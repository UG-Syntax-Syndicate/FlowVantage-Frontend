import { createContext } from 'react'
import type { Workspace } from '../types/workspace'

export interface WorkspaceContextValue {
  workspaces: Workspace[]
  isLoading: boolean
  /**
   * True when the workspace list could not be loaded. Previously this state was
   * dropped on the floor: the provider read only `data` and `isLoading`, so a
   * failed load was indistinguishable from an empty one and consumers rendered
   * a loading shimmer forever. Surfacing it is what lets the UI offer a retry.
   */
  isError: boolean
  /** Re-runs the workspace query, for a retry affordance. */
  retry: () => void
  /** The currently active workspace, or undefined until workspaces have loaded. */
  activeWorkspace: Workspace | undefined
  activeWorkspaceId: string | null
  setActiveWorkspaceId: (workspaceId: string) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined)
