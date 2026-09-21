import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { Loader2, MailCheck } from 'lucide-react'
import { auth } from '../../lib/firebase'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { showToast } from '../../lib/toast'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthLoadingOverlay } from '../../components/auth/AuthLoadingOverlay'
import { Alert } from '../../components/common/Alert'

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ResetFormValues = z.infer<typeof resetSchema>

type Status = 'checking' | 'ready-to-reset' | 'reset-complete' | 'email-verified' | 'error'

const EMAIL_VERIFIED_REDIRECT_DELAY_MS = 1800

export function AuthActionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')
  const oobCode = searchParams.get('oobCode')

  const [status, setStatus] = useState<Status>('checking')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const hasRunRef = useRef(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema) })

  useEffect(() => {
    // oobCode is single-use - applyActionCode/verifyPasswordResetCode fail
    // (as a stale-code error) if called on it twice. Guard with a ref rather
    // than relying on effect deps, since React 18 StrictMode's dev-only
    // mount->cleanup->mount would otherwise run this a second time with the
    // exact same code and flip a just-succeeded verification to 'error'.
    if (hasRunRef.current) return
    hasRunRef.current = true

    async function run() {
      if (!oobCode) {
        setError('This link is missing required information.')
        setStatus('error')
        return
      }

      try {
        if (mode === 'resetPassword') {
          const targetEmail = await verifyPasswordResetCode(auth, oobCode)
          setEmail(targetEmail)
          setStatus('ready-to-reset')
        } else if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode)
          await auth.currentUser?.reload()
          setStatus('email-verified')
        } else {
          setError('This link is not recognized.')
          setStatus('error')
        }
      } catch (caught) {
        setError(getAuthErrorMessage(caught))
        setStatus('error')
      }
    }

    run()
  }, [mode, oobCode])

  useEffect(() => {
    if (status === 'reset-complete') {
      showToast('success', 'Password updated. You can now sign in.')
    } else if (status === 'email-verified') {
      showToast('success', 'Email verified!')
      // Brief delay so the confirmation is actually seen before navigating
      // away, rather than leaving the user to click "Sign in" manually.
      const timer = window.setTimeout(() => {
        navigate('/login', { replace: true })
      }, EMAIL_VERIFIED_REDIRECT_DELAY_MS)
      return () => window.clearTimeout(timer)
    }
  }, [status, navigate])

  const onSubmitReset = async (values: ResetFormValues) => {
    if (!oobCode) return
    try {
      await confirmPasswordReset(auth, oobCode, values.password)
      setStatus('reset-complete')
    } catch (caught) {
      setError(getAuthErrorMessage(caught))
      setStatus('error')
    }
  }

  if (status === 'checking') {
    return <AuthLoadingOverlay />
  }

  return (
    <AuthLayout>
      {status === 'error' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">This link isn&apos;t valid</h2>
          <Alert variant="error">{error}</Alert>
          <div className="flex gap-3">
            <Link
              to="/forgot-password"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Request a new link
            </Link>
            <Link
              to="/login"
              className="flex-1 rounded-xl bg-rail px-4 py-3 text-center text-sm font-semibold text-white hover:bg-rail-hover"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      )}

      {status === 'ready-to-reset' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Choose a new password</h2>
          <p className="text-sm text-slate-500">Resetting the password for {email}</p>
          <form onSubmit={handleSubmit(onSubmitReset)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
              />
              {errors.password && <p className="text-sm text-rose-600">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-rose-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rail px-4 py-3 font-semibold text-white transition hover:bg-rail-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        </div>
      )}

      {status === 'reset-complete' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Password updated</h2>
          <Alert variant="success">Your password has been reset. You can now sign in.</Alert>
          <Link
            to="/login"
            className="block w-full rounded-xl bg-rail px-4 py-3 text-center text-sm font-semibold text-white hover:bg-rail-hover"
          >
            Back to sign in
          </Link>
        </div>
      )}

      {status === 'email-verified' && (
        <div className="space-y-4 text-center">
          <div className="flex justify-center text-slate-900">
            <MailCheck size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Email Verified</h2>
          <p className="text-sm text-slate-500">Your email address was successfully verified</p>
          <Link
            to="/login"
            className="block w-full rounded-xl bg-rail px-4 py-3 text-center text-sm font-semibold text-white hover:bg-rail-hover"
          >
            Sign in
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}
