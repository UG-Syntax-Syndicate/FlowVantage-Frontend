import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarCheck, RefreshCw, Unlink } from 'lucide-react'
import { Button } from '../../ui/button'
import { Skeleton } from '../../ui/skeleton'
import { Alert } from '../../common/Alert'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { ProviderSetupGuide } from './ProviderSetupGuide'
import {
  useConnectGoogleCalendar,
  useDisconnectGoogleCalendar,
  useGoogleCalendarStatus,
  useSyncGoogleCalendar,
} from '../../../hooks/useIntegrationsData'
import { showToast } from '../../../lib/toast'

/**
 * Google Calendar link.
 *
 * The backend has had the whole two-way sync — OAuth, token refresh, push on
 * write and an incremental pull — with no UI at all, so there was no way to
 * connect an account. The OAuth callback lands back here with
 * ?googleCalendar=<status>, which is read once and cleared so a refresh does
 * not re-announce it.
 */
const CALLBACK_MESSAGES: Record<string, { variant: 'success' | 'error'; message: string }> = {
  connected: { variant: 'success', message: 'Google Calendar connected.' },
  denied: { variant: 'error', message: 'Google Calendar was not connected — the permission request was declined.' },
  error: { variant: 'error', message: 'Google Calendar could not be connected. Please try again.' },
}

export function GoogleCalendarSection() {
  const { data: status, isLoading } = useGoogleCalendarStatus()
  const connect = useConnectGoogleCalendar()
  const disconnect = useDisconnectGoogleCalendar()
  const sync = useSyncGoogleCalendar()
  const [searchParams, setSearchParams] = useSearchParams()
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)

  const callbackStatus = searchParams.get('googleCalendar')

  useEffect(() => {
    if (!callbackStatus) return
    const result = CALLBACK_MESSAGES[callbackStatus]
    if (result) showToast(result.variant, result.message)
    // Drop the param so a refresh doesn't replay the toast.
    const next = new URLSearchParams(searchParams)
    next.delete('googleCalendar')
    setSearchParams(next, { replace: true })
  }, [callbackStatus, searchParams, setSearchParams])

  const connected = status?.connected ?? false
  const configured = status?.configured ?? false

  async function handleConnect() {
    try {
      await connect.mutateAsync()
    } catch {
      // The redirect never happened, so the user is still here to be told.
      showToast('error', 'Could not start the Google sign-in')
    }
  }

  async function handleSync() {
    try {
      const { applied, fullResync } = await sync.mutateAsync()
      showToast(
        'success',
        applied === 0 ? 'Already up to date' : `${applied} event${applied === 1 ? '' : 's'} synced`,
        fullResync ? 'Google asked for a full resync, so everything was re-read.' : undefined,
      )
    } catch {
      showToast('error', 'Could not sync with Google Calendar')
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect.mutateAsync()
      setConfirmingDisconnect(false)
      showToast('success', 'Google Calendar disconnected')
    } catch {
      showToast('error', 'Could not disconnect Google Calendar')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-48" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CalendarCheck size={17} strokeWidth={1.9} className="text-primary" />
          Google Calendar
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Events you create in FlowVantage are pushed to Google, and changes made in Google are pulled back when you
          sync.
        </p>
      </div>

      {!configured ? (
        <ProviderSetupGuide
          providerId="google_calendar"
          providerName="Google Calendar"
          setup={status?.setup ?? null}
        />
      ) : connected ? (
        <>
          <Alert variant="success">Connected. New and edited events sync to your Google Calendar automatically.</Alert>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSync} disabled={sync.isPending}>
              <RefreshCw size={14} strokeWidth={2} className={sync.isPending ? 'animate-spin' : undefined} />
              {sync.isPending ? 'Syncing…' : 'Sync now'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingDisconnect(true)}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <Unlink size={14} strokeWidth={2} />
              Disconnect
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-slate-500">
            You will be sent to Google to grant calendar access, then returned here.
          </p>
          <Button type="button" size="sm" onClick={handleConnect} disabled={connect.isPending}>
            {connect.isPending ? 'Redirecting…' : 'Connect Google Calendar'}
          </Button>

          {/* The unified sign-in covers this and more in the same consent, so
              it is worth offering - but calendar-only stays available for
              anyone who does not want to grant mail access. */}
          <p className="text-xs leading-relaxed text-slate-400">
            Want Gmail and Drive as well?{' '}
            <Link to="/dashboard/account/integrations/google" className="font-medium text-primary hover:underline">
              Connect Google once
            </Link>{' '}
            and all three are authorised together.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={confirmingDisconnect}
        title="Disconnect Google Calendar?"
        description="Events already synced stay in both calendars, but they will stop syncing. You can reconnect at any time."
        confirmLabel="Disconnect"
        danger
        loading={disconnect.isPending}
        onCancel={() => setConfirmingDisconnect(false)}
        onConfirm={handleDisconnect}
      />
    </div>
  )
}
