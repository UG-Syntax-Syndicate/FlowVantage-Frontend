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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'

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
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm it&apos;s you</DialogTitle>
          <DialogDescription>For your security, please confirm your identity to continue.</DialogDescription>
        </DialogHeader>

        {isPasswordAccount ? (
          <div className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Current password"
            />
            {error && <Alert variant="error">{error}</Alert>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={handlePasswordReauth} disabled={loading || !password}>
                {loading ? 'Verifying…' : 'Confirm'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {error && <Alert variant="error">{error}</Alert>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={handleProviderReauth} disabled={loading}>
                {loading ? 'Verifying…' : `Re-authenticate with ${isMicrosoftAccount ? 'Microsoft' : 'Google'}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
