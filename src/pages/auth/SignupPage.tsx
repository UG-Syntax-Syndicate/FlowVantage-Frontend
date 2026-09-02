import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../../lib/constants'
import { logAuditEvent } from '../../lib/auditLog'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { signInWithGoogle, signInWithMicrosoft } from '../../lib/oauth'
import { setPendingAuthRedirect } from '../../lib/pendingAuthRedirect'
import { showToast } from '../../lib/toast'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { GoogleButton } from '../../components/auth/GoogleButton'
import { MicrosoftButton } from '../../components/auth/MicrosoftButton'
import { Alert } from '../../components/common/Alert'

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function SignupPage() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setFormError('')
    try {
      setPendingAuthRedirect('/verify-email-pending')
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password)
      await updateProfile(credential.user, { displayName: values.name })
      await setDoc(doc(db, 'users', credential.user.uid), {
        name: values.name,
        email: values.email,
        role: 'owner',
        authProvider: 'password',
        photoURL: null,
        createdAt: serverTimestamp(),
        notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
      })
      await sendEmailVerification(credential.user, {
        url: `${window.location.origin}/auth/action`,
      })
      await logAuditEvent(credential.user.uid, 'account_created', { provider: 'password' }).catch((error) => {
        console.warn('Failed to log account-created audit event', error)
      })
      showToast('success', 'Account created', 'Check your inbox to verify your email.')
      navigate('/verify-email-pending', { replace: true })
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
      showToast('success', 'Account created', 'Welcome to Flow Vantage.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-1.5">
        <h2 className="text-3xl font-semibold text-slate-900">Create an account</h2>
        <p className="text-sm text-slate-500">
          Manage your projects from one secure, centralized workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
            placeholder="Jane Doe"
          />
          {errors.name && <p className="text-sm text-rose-600">{errors.name.message}</p>}
        </div>

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
            autoComplete="new-password"
            {...register('password')}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
            placeholder="at least 8 characters"
          />
          {errors.password && <p className="text-sm text-rose-600">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
            placeholder="at least 8 characters"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-rose-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {formError && <Alert variant="error">{formError}</Alert>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-rail px-4 py-3 font-semibold text-white transition hover:bg-rail-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
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
          label="Sign up with Google"
        />
        <MicrosoftButton
          onClick={() => handleOAuth('microsoft')}
          disabled={oauthLoading !== null}
          label="Sign up with Microsoft"
        />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent-600 hover:text-accent-700">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
