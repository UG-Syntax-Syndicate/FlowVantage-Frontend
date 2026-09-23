import { postAuditEvent } from './backendApi'
import { readBackendSessionToken } from './backendSession'
import type { AuditAction, RecordChangeAction } from '../types/audit'

/**
 * `uid` is kept as a parameter (unused here) rather than dropped, so every
 * existing call site across the app keeps working unmodified - the backend
 * derives the actor from the session token itself, the same way every other
 * authenticated endpoint does.
 */
export async function logAuditEvent(
  uid: string,
  action: AuditAction,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const sessionToken = readBackendSessionToken()
  if (!sessionToken) return

  try {
    await postAuditEvent(sessionToken, action, metadata ?? {})
  } catch {
    // Audit logging must never block the user-facing action it's attached to.
  }
}

const RECORD_CHANGE_ACTIONS: Record<RecordChangeAction, AuditAction> = {
  create: 'record_created',
  update: 'record_updated',
  delete: 'record_deleted',
}

/**
 * Logs a create/update/delete on a domain record (project, note, task, …) with
 * the acting user (`uid`) — PRD §8 Auditability. `resourceType` / `resourceId`
 * and any extra context go into the metadata.
 */
export async function logRecordChange(
  uid: string,
  action: RecordChangeAction,
  resourceType: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await logAuditEvent(uid, RECORD_CHANGE_ACTIONS[action], {
    resourceType,
    resourceId: resourceId ?? null,
    ...metadata,
  })
}
