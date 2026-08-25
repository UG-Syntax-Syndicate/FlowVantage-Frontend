import { useState } from 'react'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth'
import { googleProvider, microsoftProvider } from '../../../lib/firebase'
import { getAuthErrorMessage } from '../../../lib/authErrors'
import { useAuth } from '../../../hooks/useAuth'
import { Alert } from '../../common/Alert'

interface ReauthModalProps {
  open: boolean
  onCancel: () => void
  onSuccess: () => void
}

export function ReauthModal({ open, onCancel, onSuccess }: ReauthModalProps) {
  const { currentUser } = useAuth()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open || !currentUser) return null

  const isPasswordAccount = currentUser.providerData.some((p) => p.providerId === 'password')
  const isMicrosoftAccount = currentUser.providerData.some((p) => p.providerId === 'microsoft.com')

  const handlePasswordReauth = async () => {
    if (!currentUser.email) return
    setLoading(true)
    setError('')
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, password)
      await reauthenticateWithCredential(currentUser, credential)
      setPassword('')
      onSuccess()
    } catch (caught) {
      setError(getAuthErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  const handleProviderReauth = async () => {
    setLoading(true)
    setError('')
    try {
      await reauthenticateWithPopup(currentUser, isMicrosoftAccount ? microsoftProvider : googleProvider)
      onSuccess()
    } catch (caught) {
      setError(getAuthErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Confirm it&apos;s you</h3>
        <p className="mt-1 text-sm text-slate-500">
          For your security, please confirm your identity to continue.
        </p>

        {isPasswordAccount ? (
          <div className="mt-4 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Current password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
            />
            {error && <Alert variant="error">{error}</Alert>}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordReauth}
                disabled={loading || !password}
                className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Confirm'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {error && <Alert variant="error">{error}</Alert>}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProviderReauth}
                disabled={loading}
                className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Verifying…' : `Re-authenticate with ${isMicrosoftAccount ? 'Microsoft' : 'Google'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
