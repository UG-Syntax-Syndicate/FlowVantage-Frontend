import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaces } from '../hooks/useWorkspacesData'
import { WorkspaceContext } from './WorkspaceContext'

const STORAGE_KEY = 'flowvantage.activeWorkspaceId'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: workspaces = [], isLoading } = useWorkspaces()
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })

  // Falls back to the personal workspace whenever the stored id doesn't
  // match any workspace the signed-in user actually belongs to - covers a
  // first visit (nothing stored yet) and a stale id left over from a
  // previous account on the same browser.
  const activeWorkspace = useMemo(() => {
    const stored = workspaces.find((workspace) => workspace.id === activeWorkspaceId)
    if (stored) return stored
    return workspaces.find((workspace) => workspace.isPersonal) ?? workspaces[0]
  }, [workspaces, activeWorkspaceId])

  useEffect(() => {
    if (activeWorkspace && activeWorkspace.id !== activeWorkspaceId) {
      setActiveWorkspaceIdState(activeWorkspace.id)
    }
  }, [activeWorkspace, activeWorkspaceId])

  function setActiveWorkspaceId(workspaceId: string) {
    setActiveWorkspaceIdState(workspaceId)
    try {
      window.localStorage.setItem(STORAGE_KEY, workspaceId)
    } catch {
      // Best-effort only - in-memory state still switches correctly.
    }
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        isLoading,
        activeWorkspace,
        activeWorkspaceId: activeWorkspace?.id ?? null,
        setActiveWorkspaceId,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
