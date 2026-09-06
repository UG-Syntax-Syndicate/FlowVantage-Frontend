import { useState } from 'react'
import { Clock } from 'lucide-react'
import { useLogout } from '../../hooks/useLogout'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'

function formatCountdown(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const minutes = Math.floor(clamped / 60)
  const remainder = clamped % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

interface SessionWarningModalProps {
  secondsRemaining: number
  onStayActive: () => void
}

/**
 * Non-dismissable warning shown SESSION_WARNING_MS before an idle session
 * expires — the same blocking-Dialog pattern EmailVerificationGateModal and
 * TwoFactorChallengeModal use. Still fully authenticated at this point, so
 * it's safe to show live over the dashboard; useSessionTimeout (owned by
 * DashboardLayout) handles the actual sign-out if it's ignored.
 */
export function SessionWarningModal({ secondsRemaining, onStayActive }: SessionWarningModalProps) {
  const logout = useLogout()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } catch {
      setLoggingOut(false)
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock size={24} />
          </div>

          <DialogTitle className="text-xl font-semibold text-slate-900">Still there?</DialogTitle>
          <p className="text-sm text-slate-500">
            You've been inactive for a while. For your security, you'll be signed out in{' '}
            <span className="font-semibold tabular-nums text-slate-700">{formatCountdown(secondsRemaining)}</span>.
          </p>

          <Button type="button" className="w-full" onClick={onStayActive}>
            Stay signed in
          </Button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? 'Signing out…' : 'Log out now'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
