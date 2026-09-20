import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { AuditAction, RecordChangeAction } from '../types/audit'

export async function logAuditEvent(
  uid: string,
  action: AuditAction,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      uid,
      action,
      metadata: metadata ?? {},
      timestamp: serverTimestamp(),
    })
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
 * the acting user (`uid`) and a server `timestamp` — PRD §8 Auditability.
 * `resourceType` / `resourceId` and any extra context go into the metadata.
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
