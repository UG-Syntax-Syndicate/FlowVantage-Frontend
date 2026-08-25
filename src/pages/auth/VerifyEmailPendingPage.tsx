import { useEffect, useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { sendEmailVerification } from 'firebase/auth'
import { MailCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { auth } from '../../lib/firebase'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { showToast } from '../../lib/toast'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthLoadingOverlay } from '../../components/auth/AuthLoadingOverlay'

const RESEND_COOLDOWN_SECONDS = 60
const VERIFICATION_POLL_MS = 5000

export function VerifyEmailPendingPage() {
  const { currentUser, loading } = useAuth()
  const navigate = useNavigate()
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => setCooldown((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (!currentUser) return
    let cancelled = false

    const checkVerified = async () => {
      try {
        await auth.currentUser?.reload()
      } catch {
        return
      }
      if (cancelled) return
      if (auth.currentUser?.emailVerified) {
        showToast('success', 'Email verified!')
        navigate('/dashboard', { replace: true })
      }
    }

    const interval = window.setInterval(checkVerified, VERIFICATION_POLL_MS)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') checkVerified()
    }
    document.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', checkVerified)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', checkVerified)
    }
  }, [currentUser, navigate])

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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
          <MailCheck size={26} strokeWidth={1.75} />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900">Check your email</h2>
        <p className="text-sm text-slate-500">
          We sent a verification link to <span className="font-medium text-slate-700">{currentUser.email}</span>.
          Click it to verify your account — this page will continue automatically once you do.
        </p>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
        </button>

        <Link
          to="/dashboard"
          className="block w-full rounded-xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-600"
        >
          Continue to dashboard
        </Link>
      </div>
    </AuthLayout>
  )
}
