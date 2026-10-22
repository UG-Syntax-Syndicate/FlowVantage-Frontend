import { useState } from 'react'
import { Check, Loader2, Unlink } from 'lucide-react'
import { Button } from '../../ui/button'
import { Alert } from '../../common/Alert'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { CredentialConnectModal } from './CredentialConnectModal'
import { ConnectionCapabilities } from './ConnectionCapabilities'
import { useDisconnectConnection, useStartConnection } from '../../../hooks/useIntegrationsData'
import type { IntegrationConnection } from '../../../types/integrations'
import type { IntegrationIconName } from './IntegrationIcon'
import { showToast } from '../../../lib/toast'

interface ConnectPanelProps {
  connection: IntegrationConnection
  icon: IntegrationIconName
}

/**
 * The connect/disconnect control for any provider in the generic framework.
 *
 * Two shapes, decided by the vendor rather than by us: an OAuth provider gets
 * a single Connect button that sends you to the vendor's own sign-in, and an
 * api_key provider gets a form, because those vendors offer no sign-in to send
 * anyone to. Both end in the same place - a connection stored encrypted,
 * shown here as "Connected".
 */
export function ConnectPanel({ connection, icon }: ConnectPanelProps) {
  const startConnection = useStartConnection()
  const disconnect = useDisconnectConnection(connection.id)
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)
  const [credentialModalOpen, setCredentialModalOpen] = useState(false)

  async function handleConnect() {
    try {
      await startConnection.mutateAsync(connection.id)
      // On success the browser navigates away, so nothing runs after this.
    } catch {
      showToast('error', `Could not start the ${connection.name} sign-in`)
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect.mutateAsync()
      setConfirmingDisconnect(false)
      showToast('success', `${connection.name} disconnected`)
    } catch {
      showToast('error', `Could not disconnect ${connection.name}`)
    }
  }

  if (connection.connected) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success">
          <span className="flex items-center gap-2">
            <Check size={15} strokeWidth={2.5} className="shrink-0" />
            Connected{connection.accountLabel ? ` as ${connection.accountLabel}` : ''}.
          </span>
        </Alert>

        {connection.resources && <ConnectionCapabilities resources={connection.resources} />}

        <div>
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

        <ConfirmDialog
          open={confirmingDisconnect}
          title={`Disconnect ${connection.name}?`}
          description={`FlowVantage will forget your ${connection.name} authorisation. Nothing already imported is deleted, and you can reconnect at any time.`}
          confirmLabel="Disconnect"
          danger
          loading={disconnect.isPending}
          onCancel={() => setConfirmingDisconnect(false)}
          onConfirm={handleDisconnect}
        />
      </div>
    )
  }

  if (!connection.configured) {
    return (
      <Alert variant="info">
        {connection.name} is not available on this server yet — it needs {connection.name} app credentials in the
        server configuration before anyone can connect. Ask whoever administers your FlowVantage deployment.
      </Alert>
    )
  }

  if (connection.kind === 'api_key' && connection.credentialFields) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-slate-500">
          {connection.name} does not offer a sign-in for other apps, so it is connected with credentials from your{' '}
          {connection.name} account. The next step walks you through finding them.
        </p>
        <Button type="button" onClick={() => setCredentialModalOpen(true)}>
          Connect {connection.name}
        </Button>

        {credentialModalOpen && (
          <CredentialConnectModal
            connection={connection}
            icon={icon}
            onClose={() => setCredentialModalOpen(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-slate-500">
        You will be sent to {connection.name} to sign in and approve access, then brought straight back here. We never
        see your {connection.name} password.
      </p>
      <Button type="button" onClick={handleConnect} disabled={startConnection.isPending}>
        {startConnection.isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Taking you to {connection.name}…
          </>
        ) : (
          `Connect ${connection.name}`
        )}
      </Button>
    </div>
  )
}
