import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { showToast } from '../../lib/toast'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Alert } from '../../components/common/Alert'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [formError, setFormError] = useState('')
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setFormError('')
    try {
      await sendPasswordResetEmail(auth, values.email, {
        url: `${window.location.origin}/auth/action`,
      })
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : ''
      if (code !== 'auth/user-not-found') {
        setFormError(getAuthErrorMessage(error))
        return
      }
    }
    // Always show success, even for unregistered emails, to avoid user enumeration.
    showToast('success', 'Reset link sent', 'Check your inbox for the password reset link.')
    setSent(true)
  }

  return (
    <AuthLayout>
      <div className="space-y-1.5">
        <h2 className="text-3xl font-semibold text-slate-900">Reset your password</h2>
        <p className="text-sm text-slate-500">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {sent ? (
        <div className="mt-6 space-y-4">
          <Alert variant="success">
            If an account exists for that email, a reset link has been sent.
          </Alert>
          <Link
            to="/login"
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
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
              placeholder="you@company.com"
            />
            {errors.email && <p className="text-sm text-rose-600">{errors.email.message}</p>}
          </div>

          {formError && <Alert variant="error">{formError}</Alert>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-accent-500 px-4 py-3 font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>

          <Link to="/login" className="block text-center text-sm text-accent-600 hover:text-accent-700">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
