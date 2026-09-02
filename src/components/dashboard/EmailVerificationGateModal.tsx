import { useState } from 'react'
import { sendEmailVerification } from 'firebase/auth'
import { MailWarning } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLogout } from '../../hooks/useLogout'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { showToast } from '../../lib/toast'
import { ModalShell } from '../common/ModalShell'
import { ResendCountdownRing } from '../common/ResendCountdownRing'

const RESEND_COOLDOWN_SECONDS = 60

export function EmailVerificationGateModal() {
  const { currentUser, emailVerified } = useAuth()
  const logout = useLogout()
  const [cooldown, setCooldown] = useState(0)
  const [signingOut, setSigningOut] = useState(false)

  if (!currentUser || emailVerified) return null

  const handleResend = async () => {
    try {
      await sendEmailVerification(currentUser, { url: `${window.location.origin}/auth/action` })
      showToast('success', 'Verification email sent again.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (caught) {
      showToast('error', getAuthErrorMessage(caught))
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await logout()
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <ModalShell>
      <div className="space-y-4 text-center">
        <ResendCountdownRing
          active={cooldown > 0}
          durationSeconds={RESEND_COOLDOWN_SECONDS}
          onComplete={() => setCooldown(0)}
        >
          <MailWarning size={26} strokeWidth={1.75} />
        </ResendCountdownRing>

        <h3 className="text-xl font-semibold text-slate-900">Your email is not verified</h3>
        <p className="text-sm text-slate-500">
          We sent a verification link to <span className="font-medium text-slate-700">{currentUser.email}</span>.
          You need to verify your email before you can use Flow Vantage — this will update automatically once
          you do.
        </p>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </ModalShell>
  )
}
