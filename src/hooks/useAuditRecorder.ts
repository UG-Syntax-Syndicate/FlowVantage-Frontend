import { useCallback } from 'react'
import { useAuth } from './useAuth'
import { logRecordChange } from '../lib/auditLog'
import type { RecordChangeAction } from '../types/audit'

/**
 * Returns a fire-and-forget audit recorder bound to the current user, for the
 * create/update/delete record-change trail (PRD §8 Auditability). No-ops when
 * signed out. Toggles (pin/star/read/done) are intentionally not audited —
 * they're transient view state, not record changes worth tracing.
 */
export function useAuditRecorder() {
  const { currentUser } = useAuth()
  return useCallback(
    (
      action: RecordChangeAction,
      resourceType: string,
      resourceId?: string,
      metadata?: Record<string, unknown>,
    ) => {
      if (!currentUser) return
      void logRecordChange(currentUser.uid, action, resourceType, resourceId, metadata)
    },
    [currentUser],
  )
}
