import { useEffect, useState } from 'react'
import { Check, Copy, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { confirmTwoFactorSetup, generateTwoFactorSecret } from '../../../lib/backendApi'
import { Button } from '../../ui/button'
import { OtpInput } from '../../ui/otp-input'
import { Alert } from '../../common/Alert'
import { DialogFooter } from '../../ui/dialog'

interface TwoFactorSetupProps {
  onEnabled: () => void
  /** Presence renders a Cancel/Confirm dialog footer instead of a single standalone button. */
  onCancel?: () => void
}

type Status = 'loading' | 'ready' | 'verifying' | 'enabled' | 'error'

function StepBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
      {children}
    </span>
  )
}

/**
 * Shared TOTP setup flow: fetches a pending secret + QR code, then confirms
 * it with a 6-digit code. Used both in the Account Security dialog and the
 * post-signup "enable 2FA" screen.
 */
export function TwoFactorSetup({ onEnabled, onCancel }: TwoFactorSetupProps) {
  const { backendSessionToken } = useAuth()
  const [status, setStatus] = useState<Status>('loading')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!backendSessionToken) return

    let cancelled = false
    setStatus('loading')
    setError('')

    generateTwoFactorSecret(backendSessionToken)
      .then((result) => {
        if (cancelled) return
        setQrCodeUrl(result.qrCodeUrl)
        setSecret(result.secret)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setError('Could not start 2FA setup. Please try again.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [backendSessionToken])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access denied — the secret is still visible to copy manually.
    }
  }

  const handleVerify = async () => {
    if (!backendSessionToken || code.length !== 6) return
    setStatus('verifying')
    setError('')
    try {
      await confirmTwoFactorSetup(backendSessionToken, code)
      setStatus('enabled')
      onEnabled()
    } catch {
      setError('That code didn’t work. Check your authenticator app and try again.')
      setStatus('ready')
    }
  }

  if (!backendSessionToken) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" />
        Setting up your secure session…
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" />
        Generating your setup key…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-3">
        <Alert variant="error">{error}</Alert>
        <Button type="button" variant="outline" onClick={() => setStatus('loading')}>
          Try again
        </Button>
      </div>
    )
  }

  if (status === 'enabled') {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <ShieldCheck size={24} />
        </div>
        <p className="text-sm font-medium text-slate-900">Two-factor authentication is on</p>
        <p className="text-sm text-slate-500">Your account now requires a code from your authenticator app to sign in.</p>
      </div>
    )
  }

  const canSubmit = code.length === 6 && status !== 'verifying'

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Setup Authenticator App</h2>
        <p className="mt-1 text-sm text-slate-500">
          Each time you log in, in addition to your password, you&apos;ll use an authenticator app to generate a
          one-time code.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StepBadge>Step 1</StepBadge>
          <span className="text-sm font-medium text-slate-900">Scan QR code</span>
        </div>
        <p className="text-sm text-slate-500">
          Scan the QR code below or manually enter the secret key into your authenticator app.
        </p>

        <div className="flex flex-col gap-4 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-start">
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="Two-factor authentication QR code"
              className="h-28 w-28 shrink-0 self-center rounded-md border border-slate-200 bg-white p-1.5 sm:self-start"
            />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium text-slate-800">Can&apos;t scan QR code?</p>
            <p className="text-xs text-slate-500">Enter this secret instead:</p>
            <code className="block truncate rounded-md bg-slate-200/70 px-2 py-1.5 font-mono text-xs text-slate-700">
              {secret}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy code'}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StepBadge>Step 2</StepBadge>
          <span className="text-sm font-medium text-slate-900">Get verification code</span>
        </div>
        <p className="text-sm text-slate-500">Enter the 6-digit code you see in your authenticator app.</p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Enter verification code</label>
          <OtpInput value={code} onChange={setCode} autoFocus />
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {onCancel ? (
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleVerify} disabled={!canSubmit}>
            {status === 'verifying' ? 'Verifying…' : 'Confirm'}
          </Button>
        </DialogFooter>
      ) : (
        <Button type="button" onClick={handleVerify} disabled={!canSubmit} className="w-full">
          {status === 'verifying' ? 'Verifying…' : 'Verify & enable'}
        </Button>
      )}
    </div>
  )
}
