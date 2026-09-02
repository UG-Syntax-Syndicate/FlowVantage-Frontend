import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { logAuditEvent } from '../../lib/auditLog'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { signInWithGoogle, signInWithMicrosoft } from '../../lib/oauth'
import { showToast } from '../../lib/toast'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { GoogleButton } from '../../components/auth/GoogleButton'
import { MicrosoftButton } from '../../components/auth/MicrosoftButton'
import { Alert } from '../../components/common/Alert'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [formError, setFormError] = useState('')
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null)

  const timedOut = searchParams.get('reason') === 'timeout'
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setFormError('')
    try {
      const credential = await signInWithEmailAndPassword(auth, values.email.trim(), values.password)
      await logAuditEvent(credential.user.uid, 'login', { provider: 'password' }).catch((error) => {
        console.warn('Failed to log login audit event', error)
      })
      showToast('success', 'Signed in', 'Welcome back.')
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    }
  }

  const handleOAuth = async (provider: 'google' | 'microsoft') => {
    setFormError('')
    setOauthLoading(provider)
    try {
      if (provider === 'google') {
        const signedIn = await signInWithGoogle()
        if (!signedIn) return
      } else {
        const signedIn = await signInWithMicrosoft()
        if (!signedIn) return
      }
      showToast('success', 'Signed in', 'Welcome back.')
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-1.5">
        <h2 className="text-3xl font-semibold text-slate-900">Welcome to Flow Vantage</h2>
        <p className="text-sm text-slate-500">
          Manage your projects from one secure, centralized workspace.
        </p>
      </div>

      {timedOut && (
        <Alert variant="info">You were signed out after a period of inactivity.</Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
            placeholder="Example@email.com"
          />
          {errors.email && <p className="text-sm text-rose-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
            placeholder="at least 8 characters"
          />
          {errors.password && <p className="text-sm text-rose-600">{errors.password.message}</p>}
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-accent-600 hover:text-accent-700">
              Forgot Password?
            </Link>
          </div>
        </div>

        {formError && <Alert variant="error">{formError}</Alert>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-rail px-4 py-3 font-semibold text-white transition hover:bg-rail-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-3">
        <GoogleButton
          onClick={() => handleOAuth('google')}
          disabled={oauthLoading !== null}
          label="Sign in with Google"
        />
        <MicrosoftButton
          onClick={() => handleOAuth('microsoft')}
          disabled={oauthLoading !== null}
          label="Sign in with Microsoft"
        />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t you have an account?{' '}
        <Link to="/signup" className="font-medium text-accent-600 hover:text-accent-700">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
