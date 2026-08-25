import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { logAuditEvent } from '../../../lib/auditLog'
import { showToast } from '../../../lib/toast'
import { useAuth } from '../../../hooks/useAuth'
import type { NotificationPreferences } from '../../../types/user'

const TOGGLES: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  {
    key: 'emailOnAssignment',
    label: 'Task assignments',
    description: 'Email me when I’m assigned to a task.',
  },
  {
    key: 'emailOnMention',
    label: 'Mentions',
    description: 'Email me when I’m mentioned in a note or comment.',
  },
  {
    key: 'weeklyDigest',
    label: 'Weekly digest',
    description: 'A weekly summary of activity across your workspace.',
  },
  {
    key: 'productUpdates',
    label: 'Product updates',
    description: 'Occasional emails about new Flow Vantage features.',
  },
]

export function NotificationPreferencesSection() {
  const { currentUser, userProfile } = useAuth()
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!currentUser) return
    setSavingKey(key)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        [`notificationPreferences.${key}`]: value,
      })
      await logAuditEvent(currentUser.uid, 'notification_preferences_updated', { key, value })
      showToast('success', 'Preference saved.')
    } catch {
      showToast('error', 'Could not update preference.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <section className="space-y-4 border-b border-slate-100 py-8">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
        <p className="text-sm text-slate-500">Choose what Flow Vantage emails you about.</p>
      </div>

      <div className="max-w-md space-y-3">
        {TOGGLES.map((toggle) => {
          const checked = userProfile?.notificationPreferences?.[toggle.key] ?? false
          return (
            <label
              key={toggle.key}
              className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{toggle.label}</p>
                <p className="text-xs text-slate-500">{toggle.description}</p>
              </div>
              <input
                type="checkbox"
                checked={checked}
                disabled={savingKey === toggle.key}
                onChange={(event) => handleToggle(toggle.key, event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-orange-500"
              />
            </label>
          )
        })}
      </div>
    </section>
  )
}
