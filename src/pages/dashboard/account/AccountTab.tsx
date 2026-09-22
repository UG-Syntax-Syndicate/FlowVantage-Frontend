import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { logAuditEvent } from '../../../lib/auditLog'
import { PromiseTimeoutError, promiseWithTimeout } from '../../../lib/promise'
import { useAuth } from '../../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Alert } from '../../../components/common/Alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { AvatarUploader } from '../../../components/dashboard/account/AvatarUploader'
import { ChangeEmailSection } from '../../../components/dashboard/account/ChangeEmailSection'
import { ChangePasswordSection } from '../../../components/dashboard/account/ChangePasswordSection'
import { TwoFactorSection } from '../../../components/dashboard/account/TwoFactorSection'
import { DeleteAccountSection } from '../../../components/dashboard/account/DeleteAccountSection'

const nameSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

type NameFormValues = z.infer<typeof nameSchema>

// Same bound as AvatarUploader.tsx's upload/remove handlers: this chain
// (Auth profile write, then a Firestore doc write, then an audit log write)
// can hang forever with no error if Firestore is offline/unreachable, since
// queued writes wait indefinitely for connectivity instead of rejecting.
// See src/lib/promise.ts.
const ACTION_TIMEOUT_MS = 20_000
const TIMEOUT_MESSAGE = 'This is taking too long. Check your connection and try again.'

function ProfileNameForm() {
  const { currentUser, userProfile } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    values: { name: userProfile?.name ?? '' },
  })

  const onSubmit = async (values: NameFormValues) => {
    if (!currentUser) return
    setMessage('')
    setError('')
    try {
      await promiseWithTimeout(
        (async () => {
          await updateProfile(currentUser, { displayName: values.name })
          await updateDoc(doc(db, 'users', currentUser.uid), { name: values.name })
          await logAuditEvent(currentUser.uid, 'profile_updated', { field: 'name' })
        })(),
        ACTION_TIMEOUT_MS,
      )
      setMessage('Profile updated.')
    } catch (caught) {
      console.error('Profile name update failed', caught)
      setError(
        caught instanceof PromiseTimeoutError
          ? TIMEOUT_MESSAGE
          : caught instanceof Error
            ? caught.message
            : 'Could not update your name. Please try again.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" type="text" {...register('name')} />
        {errors.name && <p className="text-sm text-rose-600">{errors.name.message}</p>}
      </div>

      {message && (
        <div className="sm:col-span-2">
          <Alert variant="success">{message}</Alert>
        </div>
      )}

      {error && (
        <div className="sm:col-span-2">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty || isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

export function AccountTab() {
  const { currentUser, userProfile } = useAuth()
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const isPasswordAccount = currentUser?.providerData.some((p) => p.providerId === 'password') ?? false

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUploader />
          <ProfileNameForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
            <div>
              <p className="text-sm font-medium text-slate-800">Email</p>
              <p className="text-sm text-slate-500">{userProfile?.email ?? currentUser?.email}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
              Change email
            </Button>
          </div>

          {isPasswordAccount && (
            <div className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-medium text-slate-800">Password</p>
                <p className="text-sm tracking-widest text-slate-500">••••••••</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)}>
                Change password
              </Button>
            </div>
          )}

          <TwoFactorSection />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support Access</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
            <div>
              <p className="text-sm font-medium text-slate-800">Support access</p>
              <p className="text-sm text-slate-500">
                Let the Flow Vantage support team into your account to help troubleshoot issues. Coming soon.
              </p>
            </div>
            <div
              aria-disabled
              title="Coming soon"
              className="h-5 w-9 shrink-0 rounded-full border border-transparent bg-input opacity-50"
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Log out of all devices</p>
              <p className="text-sm text-slate-500">Sign out everywhere you're currently signed in. Coming soon.</p>
            </div>
            <Button type="button" variant="outline" size="sm" disabled title="Coming soon">
              Log out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DeleteAccountSection compact />
        </CardContent>
      </Card>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change email</DialogTitle>
          </DialogHeader>
          <ChangeEmailSection compact />
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
          </DialogHeader>
          <ChangePasswordSection compact />
        </DialogContent>
      </Dialog>
    </div>
  )
}
