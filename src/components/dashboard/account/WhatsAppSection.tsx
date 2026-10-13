import { useState } from 'react'
import { BadgeCheck, MessageCircle, Phone } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Switch } from '../../ui/switch'
import { Skeleton } from '../../ui/skeleton'
import { Alert } from '../../common/Alert'
import { OtpInput } from '../../ui/otp-input'
import { ResendCountdownRing } from '../../common/ResendCountdownRing'
import {
  useConfirmWhatsAppVerification,
  useStartWhatsAppVerification,
  useUpdateWhatsAppPreferences,
  useWhatsAppPreferences,
} from '../../../hooks/useIntegrationsData'
import { WHATSAPP_EVENT_LABELS, type WhatsAppEvent } from '../../../types/integrations'
import { logAuditEvent } from '../../../lib/auditLog'
import { useAuth } from '../../../hooks/useAuth'
import { showToast } from '../../../lib/toast'

/** E.164, matching the pattern notifications.service.js validates against, so the client rejects what the server would. */
const E164 = /^\+[1-9]\d{7,14}$/

const RESEND_SECONDS = 60

/**
 * WhatsApp notification settings.
 *
 * Nothing is ever sent to an unverified number, so the verified/unverified
 * state is the most important thing on screen - the alternative is someone
 * entering a number, seeing a saved toggle, and silently receiving nothing.
 *
 * `whatsappConfigured` and `groupMessagingAvailable` come back from the API
 * specifically so this can *explain* rather than offer a control that would
 * fail. Both are honoured.
 */
export function WhatsAppSection() {
  const { currentUser } = useAuth()
  const { data, isLoading } = useWhatsAppPreferences()
  const startVerification = useStartWhatsAppVerification()
  const confirmVerification = useConfirmWhatsAppVerification()
  const updatePreferences = useUpdateWhatsAppPreferences()

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [resendReady, setResendReady] = useState(true)
  const [savingEvent, setSavingEvent] = useState<string | null>(null)

  if (isLoading || !data) {
    return (
      <section className="space-y-4 py-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full max-w-md rounded-xl" />
      </section>
    )
  }

  // Bound to a local after the loading guard: TypeScript will not carry the
  // narrowing into the handler closures below, and `preferences!` in six places
  // is worse than one assignment.
  const preferences = data
  const phoneValid = E164.test(phone)

  async function sendCode() {
    try {
      const result = await startVerification.mutateAsync(phone)
      setCodeSent(true)
      setResendReady(false)
      // Returned outside production only, so a developer with no live WhatsApp
      // number can still complete the flow.
      showToast(
        'success',
        'Verification code sent over WhatsApp',
        result.code ? `Development code: ${result.code}` : undefined,
      )
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not send a verification code')
    }
  }

  async function confirmCode() {
    try {
      await confirmVerification.mutateAsync(code)
      setCode('')
      setCodeSent(false)
      if (currentUser) void logAuditEvent(currentUser.uid, 'whatsapp_number_verified')
      showToast('success', 'Number verified. WhatsApp notifications are on.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'That code is not correct')
    }
  }

  async function toggleEnabled(enabled: boolean) {
    setSavingEvent('enabled')
    try {
      await updatePreferences.mutateAsync({ enabled })
      if (currentUser) void logAuditEvent(currentUser.uid, 'whatsapp_notifications_toggled', { enabled })
      showToast('success', enabled ? 'WhatsApp notifications on' : 'WhatsApp notifications off')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not save that')
    } finally {
      setSavingEvent(null)
    }
  }

  async function toggleEvent(event: WhatsAppEvent, wanted: boolean) {
    const next = wanted
      ? [...preferences.events, event]
      : preferences.events.filter((existing) => existing !== event)

    setSavingEvent(event)
    try {
      await updatePreferences.mutateAsync({ events: next })
    } catch {
      showToast('error', 'Could not save that preference')
    } finally {
      setSavingEvent(null)
    }
  }

  return (
    <section className="space-y-5 py-2">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <MessageCircle size={20} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">WhatsApp</h2>
            {preferences.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <BadgeCheck size={12} strokeWidth={2.4} />
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Get project updates on WhatsApp — status changes, assignments, deadlines and messages.
          </p>
        </div>
      </div>

      {!preferences.whatsappConfigured && (
        <Alert variant="info">
          This deployment has no WhatsApp credentials configured, so nothing can be delivered yet. You can still set
          your preferences — see <span className="font-medium">docs/deployment.md</span> for the Meta app setup an
          administrator needs to complete.
        </Alert>
      )}

      {/* --- The number --------------------------------------------------- */}
      <div className="max-w-md space-y-3 rounded-xl border border-slate-100 p-4">
        {preferences.verified ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Phone size={15} strokeWidth={2} className="text-slate-400" />
              {preferences.phone}
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setCodeSent(false)
                setPhone('')
                // Changing the number voids the old verification server-side,
                // since consent for one number does not carry to another.
                showToast('info', 'Enter a new number below and verify it to switch.')
              }}
            >
              Change number
            </Button>
          </div>
        ) : null}

        {!preferences.verified || phone.length > 0 || codeSent ? (
          <>
            <div>
              <Label htmlFor="whatsapp-phone">WhatsApp number</Label>
              <Input
                id="whatsapp-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value.trim())}
                placeholder="+233241234567"
                className="mt-1"
                inputMode="tel"
                autoComplete="tel"
              />
              <p className="mt-1 text-xs text-slate-400">
                Include the country code. Nothing is ever sent to an unverified number.
              </p>
              {phone.length > 0 && !phoneValid && (
                <p className="mt-1 text-xs text-rose-600">
                  Use the full international format, starting with “+”.
                </p>
              )}
            </div>

            {!codeSent ? (
              <Button
                type="button"
                size="sm"
                disabled={!phoneValid || startVerification.isPending}
                loading={startVerification.isPending}
                onClick={sendCode}
              >
                Send verification code
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label>Six-digit code</Label>
                  <div className="mt-1.5">
                    <OtpInput value={code} onChange={setCode} autoFocus disabled={confirmVerification.isPending} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    disabled={code.length !== 6 || confirmVerification.isPending}
                    loading={confirmVerification.isPending}
                    onClick={confirmCode}
                  >
                    Verify
                  </Button>
                  <ResendCountdownRing
                    active={!resendReady}
                    durationSeconds={RESEND_SECONDS}
                    onComplete={() => setResendReady(true)}
                    size={34}
                  >
                    <button
                      type="button"
                      disabled={!resendReady || startVerification.isPending}
                      onClick={sendCode}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Resend
                    </button>
                  </ResendCountdownRing>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* --- What to send ------------------------------------------------- */}
      <div className="max-w-md space-y-3">
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">WhatsApp notifications</p>
            <p className="text-xs text-slate-500">
              {preferences.verified
                ? 'The master switch for everything below.'
                : 'Verify a number first — this cannot be turned on without one.'}
            </p>
          </div>
          <Switch
            checked={preferences.enabled}
            disabled={!preferences.verified || savingEvent === 'enabled'}
            onCheckedChange={toggleEnabled}
          />
        </label>

        <fieldset disabled={!preferences.enabled} className="space-y-2 disabled:opacity-55">
          <legend className="pb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Which updates
          </legend>
          {preferences.availableEvents.map((event) => {
            const meta = WHATSAPP_EVENT_LABELS[event]
            return (
              <label
                key={event}
                className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{meta?.label ?? event}</p>
                  <p className="text-xs text-slate-500">{meta?.description ?? ''}</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.events.includes(event)}
                  disabled={savingEvent === event || !preferences.enabled}
                  onChange={(changeEvent) => toggleEvent(event, changeEvent.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-orange-500"
                />
              </label>
            )
          })}
        </fieldset>
      </div>

      {!preferences.groupMessagingAvailable && (
        <Alert variant="info">
          <span className="font-medium">Project groups are not available yet.</span> Posting into a WhatsApp group
          needs an Official Business Account, caps a group at 8 participants and has no way to add people
          programmatically. Until that approval lands, updates go to each member directly — which reaches everyone,
          with no cap. You can still link a group on a project so the configuration is ready.
        </Alert>
      )}
    </section>
  )
}
