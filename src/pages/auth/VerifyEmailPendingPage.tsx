import { useEffect, useRef, useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { sendEmailVerification } from 'firebase/auth'
import { Send, TriangleAlert } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { clearPendingAuthRedirect } from '../../lib/pendingAuthRedirect'
import { showToast } from '../../lib/toast'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthLoadingOverlay } from '../../components/auth/AuthLoadingOverlay'
import { ResendCountdownRing } from '../../components/common/ResendCountdownRing'

const RESEND_COOLDOWN_SECONDS = 60

type SendStatus = 'sending' | 'sent' | 'error'

export function VerifyEmailPendingPage() {
  const { currentUser, loading, emailVerified } = useAuth()
  const navigate = useNavigate()
  const [cooldown, setCooldown] = useState(0)
  const [sendStatus, setSendStatus] = useState<SendStatus>('sending')
  const [sendError, setSendError] = useState('')
  const hasSentInitialRef = useRef(false)

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
    navigate('/setup-two-factor', { replace: true, state: { next: '/dashboard' } })
  }, [currentUser, emailVerified, navigate])

  // Sends the very first verification email from here rather than from
  // SignupPage: this page is guaranteed to still be mounted by the time
  // Firebase's account creation has actually settled, unlike SignupPage
  // (see the comment in SignupPage.onSubmit). Guarded by a ref, not just
  // `sendStatus`, so React 18 StrictMode's mount->cleanup->mount in dev can't
  // fire it twice.
  useEffect(() => {
    if (!currentUser || emailVerified || hasSentInitialRef.current) return
    hasSentInitialRef.current = true

    sendEmailVerification(currentUser, {
      url: `${window.location.origin}/auth/action`,
      handleCodeInApp: true,
    })
      .then(() => {
        setSendStatus('sent')
        setCooldown(RESEND_COOLDOWN_SECONDS)
      })
      .catch((caught) => {
        setSendStatus('error')
        setSendError(getAuthErrorMessage(caught))
      })
  }, [currentUser, emailVerified])

  if (loading) {
    return <AuthLoadingOverlay />
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const handleResend = async () => {
    try {
      await sendEmailVerification(currentUser, {
        url: `${window.location.origin}/auth/action`,
        handleCodeInApp: true,
      })
      setSendStatus('sent')
      showToast('success', 'Verification email sent again.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (caught) {
      showToast('error', getAuthErrorMessage(caught))
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-4 text-center">
        {sendStatus === 'error' ? (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <TriangleAlert size={22} strokeWidth={1.75} />
          </div>
        ) : (
          <ResendCountdownRing
            active={cooldown > 0}
            durationSeconds={RESEND_COOLDOWN_SECONDS}
            onComplete={() => setCooldown(0)}
          >
            <Send size={26} strokeWidth={1.75} />
          </ResendCountdownRing>
        )}

        <h2 className="text-2xl font-semibold text-slate-900">
          {sendStatus === 'sending' && 'Sending verification email…'}
          {sendStatus === 'sent' && 'Verification Email Sent'}
          {sendStatus === 'error' && "Couldn't send the verification email"}
        </h2>
        <p className="text-sm text-slate-500">
          {sendStatus === 'error' ? sendError : 'Check your email for link to verify your email.'}
        </p>

        <p className="text-sm text-slate-500">
          {sendStatus === 'error' ? 'Try again: ' : "Didn't receive Link? "}
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
