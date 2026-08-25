import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { logAuditEvent } from './auditLog'

export async function exportUserDataAsJson(uid: string): Promise<void> {
  const snapshot = await getDoc(doc(db, 'users', uid))
  const profile = snapshot.exists() ? snapshot.data() : null

  const payload = {
    profile,
    exportedAt: new Date().toISOString(),
    note: 'Project, contact, and note data will be included here once those modules launch.',
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `flowvantage-account-data-${uid}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  await logAuditEvent(uid, 'data_exported')
}
