import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteUser } from 'firebase/auth'
import { deleteDoc, doc } from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import { db, storage } from '../../../lib/firebase'
import { getAuthErrorMessage } from '../../../lib/authErrors'
import { logAuditEvent } from '../../../lib/auditLog'
import { showToast } from '../../../lib/toast'
import { useAuth } from '../../../hooks/useAuth'
import { Alert } from '../../common/Alert'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { ReauthModal } from './ReauthModal'

export function DeleteAccountSection() {
  const { currentUser, userProfile } = useAuth()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reauthOpen, setReauthOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const performDeletion = async () => {
    if (!currentUser) return
    setDeleting(true)
    setError('')
    try {
      await logAuditEvent(currentUser.uid, 'account_deletion_initiated')

      if (userProfile?.photoURL?.includes('/avatars%2F')) {
        await deleteObject(ref(storage, userProfile.photoURL)).catch(() => {})
      }

      await deleteDoc(doc(db, 'users', currentUser.uid))
      await deleteUser(currentUser)

      showToast('success', 'Your account has been deleted.')
      navigate('/login', { replace: true })
    } catch (caught) {
      const code = caught && typeof caught === 'object' && 'code' in caught ? (caught as { code: string }).code : ''
      if (code === 'auth/requires-recent-login') {
        setDeleting(false)
        setConfirmOpen(false)
        setReauthOpen(true)
        return
      }
      setError(getAuthErrorMessage(caught))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="space-y-3 py-8">
      <div>
        <h2 className="text-base font-semibold text-rose-700">Delete account</h2>
        <p className="text-sm text-slate-500">
          Permanently delete your Flow Vantage account and all associated data. This cannot be undone.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
      >
        Delete my account
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete your account?"
        description="This permanently deletes your profile, photo, and access to Flow Vantage. Type your email to confirm."
        confirmLabel="Delete account"
        confirmationPhrase={currentUser?.email ?? undefined}
        danger
        loading={deleting}
        error={error}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={performDeletion}
      />

      <ReauthModal
        open={reauthOpen}
        onCancel={() => setReauthOpen(false)}
        onSuccess={() => {
          setReauthOpen(false)
          performDeletion()
        }}
      />
    </section>
  )
}
