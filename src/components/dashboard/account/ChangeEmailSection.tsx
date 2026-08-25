import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { verifyBeforeUpdateEmail } from 'firebase/auth'
import { getAuthErrorMessage } from '../../../lib/authErrors'
import { logAuditEvent } from '../../../lib/auditLog'
import { useAuth } from '../../../hooks/useAuth'
import { Alert } from '../../common/Alert'
import { ReauthModal } from './ReauthModal'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

type FormValues = z.infer<typeof schema>

export function ChangeEmailSection() {
  const { currentUser, userProfile } = useAuth()
  const [reauthOpen, setReauthOpen] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    setError('')
    setMessage('')
    setPendingEmail(values.email)
    setReauthOpen(true)
  }

  const completeEmailChange = async () => {
    setReauthOpen(false)
    if (!currentUser) return
    try {
      await verifyBeforeUpdateEmail(currentUser, pendingEmail)
      await logAuditEvent(currentUser.uid, 'email_change_requested', { newEmail: pendingEmail })
      setMessage(
        `A confirmation link was sent to ${pendingEmail}. Your email won't change until you click it.`,
      )
    } catch (caught) {
      setError(getAuthErrorMessage(caught))
    }
  }

  return (
    <section className="space-y-4 border-b border-slate-100 py-8">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Email address</h2>
        <p className="text-sm text-slate-500">
          Current email: <span className="font-medium text-slate-700">{userProfile?.email ?? currentUser?.email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="newEmail" className="text-sm font-medium text-slate-700">
            New email address
          </label>
          <input
            id="newEmail"
            type="email"
            {...register('email')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
            placeholder="new@company.com"
          />
          {errors.email && <p className="text-sm text-rose-600">{errors.email.message}</p>}
        </div>

        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Update email
        </button>
      </form>

      <ReauthModal
        open={reauthOpen}
        onCancel={() => setReauthOpen(false)}
        onSuccess={completeEmailChange}
      />
    </section>
  )
}
