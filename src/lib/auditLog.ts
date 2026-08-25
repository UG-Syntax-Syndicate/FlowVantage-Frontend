import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { AuditAction } from '../types/audit'

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
