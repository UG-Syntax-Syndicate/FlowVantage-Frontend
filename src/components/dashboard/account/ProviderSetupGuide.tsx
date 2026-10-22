import { useState } from 'react'
import { Check, Copy, ExternalLink, Info, TriangleAlert } from 'lucide-react'
import { Alert } from '../../common/Alert'
import { PROVIDER_SETUP_GUIDES } from './providerSetupGuides'
import type { IntegrationSetup } from '../../../types/integrations'

interface ProviderSetupGuideProps {
  providerId: string
  providerName: string
  /** Reported by the server, never guessed here — the URI must match exactly. */
  setup: IntegrationSetup | null
}

/** A value an administrator has to paste somewhere, with a copy button. */
function CopyableValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be blocked; the value is on screen to select by
      // hand, so this is not worth an error toast.
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-line bg-slate-50 px-2.5 py-2">
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-slate-700">{value}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        >
          {copied ? <Check size={13} strokeWidth={2.5} className="text-emerald-600" /> : <Copy size={13} strokeWidth={2} />}
        </button>
      </div>
    </div>
  )
}

/**
 * What to do when a provider says "unavailable on this server".
 *
 * Without this the state is a dead end: the page says credentials are missing
 * and the person reading it has no way to find out which, or where to get
 * them. The redirect URI and variable names come from the server, because the
 * URI depends on its own configuration and has to match the vendor's console
 * character for character.
 */
export function ProviderSetupGuide({ providerId, providerName, setup }: ProviderSetupGuideProps) {
  const guide = PROVIDER_SETUP_GUIDES[providerId]

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        {providerName} is not available on this server yet — it needs {providerName} app credentials before anyone can
        connect. Here is how to create them.
      </Alert>

      {guide && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={guide.consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:brightness-95"
            >
              Open the {guide.console}
              <ExternalLink size={13} strokeWidth={2} />
            </a>
          </div>

          {guide.enableFirst && (
            <p className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
              <TriangleAlert size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
              <span>
                <strong className="font-semibold">Switch on first:</strong> {guide.enableFirst}
              </span>
            </p>
          )}

          <ol className="flex flex-col gap-2.5">
            {guide.steps.map((step, index) => (
              <li key={step} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-50 text-[11px] font-semibold text-accent-700">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </>
      )}

      {setup && (
        <div className="flex flex-col gap-3 rounded-xl border border-line p-3.5">
          <h4 className="text-sm font-semibold text-slate-900">Values for this server</h4>

          {setup.redirectUri && (
            <CopyableValue label="Authorised redirect URI — paste this into the vendor's console" value={setup.redirectUri} />
          )}

          <CopyableValue
            label="Environment variables to set on the API, then restart it"
            value={setup.envVars.join('\n')}
          />

          {setup.scopes?.length > 0 && <CopyableValue label="Scopes requested" value={setup.scopes.join(' ')} />}
        </div>
      )}

      {guide?.note && (
        <p className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
          <Info size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
          {guide.note}
        </p>
      )}
    </div>
  )
}
