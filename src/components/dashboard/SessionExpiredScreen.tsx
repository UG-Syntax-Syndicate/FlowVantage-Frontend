import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'

/**
 * Blocking overlay shown after an idle-timeout sign-out — modeled on the
 * same non-dismissable Dialog pattern as EmailVerificationGateModal /
 * TwoFactorChallengeModal / SessionWarningModal. Deliberately does NOT
 * navigate away: ProtectedRoute keeps rendering whatever page the user was
 * already on (see ProtectedRoute.tsx) so this blurs that exact screen in
 * place, rather than swapping it out for a different page.
 */
export function SessionExpiredScreen() {
  const navigate = useNavigate()
  const { acknowledgeSessionExpired } = useAuth()
  const [loggingIn, setLoggingIn] = useState(false)

  const handleLogin = async () => {
    setLoggingIn(true)
    // Confirms the sign-out this screen implies has actually finished before
    // navigating — otherwise a still-in-flight signOut() can race the
    // navigation and PublicOnlyRoute bounces /login straight back here.
    await acknowledgeSessionExpired()
    navigate('/login', { replace: true })
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <ShieldAlert size={24} />
          </div>
          <DialogTitle className="text-xl font-semibold text-slate-900">Session expired</DialogTitle>
          <p className="text-sm text-slate-500">
            You were signed out due to inactivity. Please log in again to continue.
          </p>
          <button
            type="button"
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loggingIn ? 'Signing out…' : 'Log in again'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
