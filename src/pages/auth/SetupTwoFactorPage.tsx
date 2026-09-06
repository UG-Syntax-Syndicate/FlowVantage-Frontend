import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { TwoFactorSetup } from '../../components/dashboard/account/TwoFactorSetup'

/**
 * Shown once, right after an account is created, offering to turn on
 * two-factor authentication before landing in the app.
 */
export function SetupTwoFactorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const next = (location.state as { next?: string } | null)?.next ?? '/dashboard'
  const [started, setStarted] = useState(false)
  const [enabled, setEnabled] = useState(false)

  const goNext = () => navigate(next, { replace: true })

  if (!started) {
    return (
      <AuthLayout>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-50 text-accent-600">
            <ShieldCheck size={28} strokeWidth={1.75} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Secure your account</h2>
          <p className="text-sm text-slate-500">
            Add two-factor authentication for an extra layer of security every time you sign in. You can always turn
            it on later from Account Settings.
          </p>

          <button
            type="button"
            onClick={() => setStarted(true)}
            className="w-full rounded-xl bg-rail px-4 py-3 text-sm font-semibold text-white transition hover:bg-rail-hover"
          >
            Enable two-factor authentication
          </button>
          <button
            type="button"
            onClick={goNext}
            className="w-full text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Skip for now
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-4">
        <TwoFactorSetup onEnabled={() => setEnabled(true)} />

        {enabled ? (
          <button
            type="button"
            onClick={goNext}
            className="w-full rounded-xl bg-rail px-4 py-3 text-sm font-semibold text-white transition hover:bg-rail-hover"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="w-full text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Skip for now
          </button>
        )}
      </div>
    </AuthLayout>
  )
}
