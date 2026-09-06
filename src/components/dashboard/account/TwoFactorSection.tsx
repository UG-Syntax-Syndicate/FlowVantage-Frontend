import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../hooks/useAuth'
import { fetchBackendMe, disableTwoFactor } from '../../../lib/backendApi'
import { showToast } from '../../../lib/toast'
import { Switch } from '../../ui/switch'
import { Button } from '../../ui/button'
import { OtpInput } from '../../ui/otp-input'
import { Alert } from '../../common/Alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog'
import { TwoFactorSetup } from './TwoFactorSetup'

const BACKEND_ME_QUERY_KEY = ['backend', 'me']

function DisableTwoFactorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { backendSessionToken } = useAuth()
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!backendSessionToken || code.length !== 6) return
    setSubmitting(true)
    setError('')
    try {
      await disableTwoFactor(backendSessionToken, code)
      await queryClient.invalidateQueries({ queryKey: BACKEND_ME_QUERY_KEY })
      showToast('success', 'Two-factor authentication turned off')
      setCode('')
      onClose()
    } catch {
      setError('That code didn’t work. Check your authenticator app and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Turn off two-factor authentication</DialogTitle>
          <DialogDescription>Enter a current code from your authenticator app to confirm.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <OtpInput value={code} onChange={setCode} autoFocus />
          {error && <Alert variant="error">{error}</Alert>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleSubmit} disabled={code.length !== 6 || submitting}>
              {submitting ? 'Turning off…' : 'Turn off'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TwoFactorSection() {
  const { backendSessionToken } = useAuth()
  const queryClient = useQueryClient()
  const [enableOpen, setEnableOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: BACKEND_ME_QUERY_KEY,
    queryFn: () => fetchBackendMe(backendSessionToken as string),
    enabled: Boolean(backendSessionToken),
  })

  const twoFactorEnabled = data?.twoFactorEnabled ?? false

  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium text-slate-800">2-Step Verifications</p>
        <p className="text-sm text-slate-500">Add an additional layer of security to your account during login.</p>
      </div>
      <Switch
        checked={twoFactorEnabled}
        disabled={!backendSessionToken || isLoading}
        onCheckedChange={(next) => (next ? setEnableOpen(true) : setDisableOpen(true))}
        aria-label="Toggle two-factor authentication"
      />

      <Dialog open={enableOpen} onOpenChange={setEnableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Setup Authenticator App</DialogTitle>
          <TwoFactorSetup
            onCancel={() => setEnableOpen(false)}
            onEnabled={() => {
              queryClient.invalidateQueries({ queryKey: BACKEND_ME_QUERY_KEY })
              showToast('success', 'Two-factor authentication enabled')
              setTimeout(() => setEnableOpen(false), 900)
            }}
          />
        </DialogContent>
      </Dialog>

      <DisableTwoFactorDialog open={disableOpen} onClose={() => setDisableOpen(false)} />
    </div>
  )
}
