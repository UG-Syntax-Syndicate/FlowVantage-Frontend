import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { validateTwoFactorLogin } from '../../lib/backendApi'
import { showToast } from '../../lib/toast'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { OtpInput } from '../ui/otp-input'
import { Button } from '../ui/button'
import { Alert } from '../common/Alert'

/**
 * Blocks the dashboard until a pending 2FA login challenge is resolved, the
 * same non-dismissable pattern EmailVerificationGateModal uses.
 */
export function TwoFactorChallengeModal() {
  const { twoFactorChallenge, resolveTwoFactorChallenge, cancelTwoFactorChallenge } = useAuth()
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  if (!twoFactorChallenge) return null

  const handleVerify = async () => {
    if (code.length !== 6) return
    setSubmitting(true)
    setError('')
    try {
      const result = await validateTwoFactorLogin(twoFactorChallenge.userId, code)
      if (result.status === 'ok') {
        resolveTwoFactorChallenge(result.sessionToken)
        showToast('success', 'Signed in')
      }
    } catch {
      setError('Invalid code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelTwoFactorChallenge()
    } catch {
      setCancelling(false)
    }
  }

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-600">
            <ShieldCheck size={24} />
          </div>

          <DialogTitle className="text-xl font-semibold text-slate-900">Two-factor verification</DialogTitle>
          <p className="text-sm text-slate-500">Enter the 6-digit code from your authenticator app to finish signing in.</p>

          <div className="flex justify-center">
            <OtpInput value={code} onChange={setCode} autoFocus />
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="button" className="w-full" disabled={code.length !== 6 || submitting} onClick={handleVerify}>
            {submitting ? 'Verifying…' : 'Verify'}
          </Button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelling ? 'Signing out…' : 'Cancel and sign out'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
