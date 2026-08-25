import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { logAuditEvent } from '../../../lib/auditLog'
import { useAuth } from '../../../hooks/useAuth'
import { Alert } from '../../common/Alert'
import { AvatarUploader } from './AvatarUploader'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
})

type FormValues = z.infer<typeof schema>

export function ProfileSection() {
  const { currentUser, userProfile } = useAuth()
  const [message, setMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { name: userProfile?.name ?? '' },
  })

  const onSubmit = async (values: FormValues) => {
    if (!currentUser) return
    setMessage('')
    await updateProfile(currentUser, { displayName: values.name })
    await updateDoc(doc(db, 'users', currentUser.uid), { name: values.name })
    await logAuditEvent(currentUser.uid, 'profile_updated', { field: 'name' })
    setMessage('Profile updated.')
  }

  return (
    <section className="space-y-5 border-b border-slate-100 pb-8">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Profile</h2>
        <p className="text-sm text-slate-500">Your name and photo as they appear across Flow Vantage.</p>
      </div>

      <AvatarUploader />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
          />
          {errors.name && <p className="text-sm text-rose-600">{errors.name.message}</p>}
        </div>

        {message && <Alert variant="success">{message}</Alert>}

        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </section>
  )
}
