import { useEffect, useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { sendEmailVerification } from 'firebase/auth'
import { Send } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { clearPendingAuthRedirect } from '../../lib/pendingAuthRedirect'
import { showToast } from '../../lib/toast'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthLoadingOverlay } from '../../components/auth/AuthLoadingOverlay'
import { ResendCountdownRing } from '../../components/common/ResendCountdownRing'

const RESEND_COOLDOWN_SECONDS = 60

export function VerifyEmailPendingPage() {
  const { currentUser, loading, emailVerified } = useAuth()
  const navigate = useNavigate()
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    clearPendingAuthRedirect()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => setCooldown((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (!currentUser || !emailVerified) return
    showToast('success', 'Email verified!')
    navigate('/dashboard', { replace: true })
  }, [currentUser, emailVerified, navigate])

  if (loading) {
    return <AuthLoadingOverlay />
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const handleResend = async () => {
    try {
      await sendEmailVerification(currentUser, { url: `${window.location.origin}/auth/action` })
      showToast('success', 'Verification email sent again.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (caught) {
      showToast('error', getAuthErrorMessage(caught))
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-4 text-center">
        <ResendCountdownRing
          active={cooldown > 0}
          durationSeconds={RESEND_COOLDOWN_SECONDS}
          onComplete={() => setCooldown(0)}
        >
          <Send size={26} strokeWidth={1.75} />
        </ResendCountdownRing>

        <h2 className="text-2xl font-semibold text-slate-900">Verification Email Sent</h2>
        <p className="text-sm text-slate-500">Check your email for link to verify your email.</p>

        <p className="text-sm text-slate-500">
          Didn&apos;t receive Link?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="font-medium text-accent-600 hover:text-accent-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend'}
          </button>
        </p>

        <Link
          to="/login"
          className="block w-full rounded-xl bg-rail px-4 py-3 text-sm font-semibold text-white transition hover:bg-rail-hover"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
