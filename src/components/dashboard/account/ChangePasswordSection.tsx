import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updatePassword } from 'firebase/auth'
import { getAuthErrorMessage } from '../../../lib/authErrors'
import { logAuditEvent } from '../../../lib/auditLog'
import { showToast } from '../../../lib/toast'
import { useAuth } from '../../../hooks/useAuth'
import { Alert } from '../../common/Alert'
import { ReauthModal } from './ReauthModal'

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ChangePasswordSection() {
  const { currentUser } = useAuth()
  const [reauthOpen, setReauthOpen] = useState(false)
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (!currentUser?.providerData.some((p) => p.providerId === 'password')) {
    return (
      <section className="space-y-2 border-b border-slate-100 py-8">
        <h2 className="text-base font-semibold text-slate-900">Password</h2>
        <p className="text-sm text-slate-500">
          You sign in with a Google or Microsoft account, so there&apos;s no Flow Vantage password to change.
        </p>
      </section>
    )
  }

  const onSubmit = (values: FormValues) => {
    setError('')
    setPendingValues(values)
    setReauthOpen(true)
  }

  const completePasswordChange = async () => {
    setReauthOpen(false)
    if (!currentUser || !pendingValues) return
    try {
      await updatePassword(currentUser, pendingValues.newPassword)
      await logAuditEvent(currentUser.uid, 'password_changed')
      showToast('success', 'Your password has been updated.')
      reset()
    } catch (caught) {
      setError(getAuthErrorMessage(caught))
    } finally {
      setPendingValues(null)
    }
  }

  return (
    <section className="space-y-4 border-b border-slate-100 py-8">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Password</h2>
        <p className="text-sm text-slate-500">Choose a strong password you don&apos;t use elsewhere.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
          />
          {errors.newPassword && <p className="text-sm text-rose-600">{errors.newPassword.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-rose-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Update password
        </button>
      </form>

      <ReauthModal
        open={reauthOpen}
        onCancel={() => {
          setReauthOpen(false)
          setPendingValues(null)
        }}
        onSuccess={completePasswordChange}
      />
    </section>
  )
}
