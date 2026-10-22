import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'

/**
 * Explains why mail here does not actually send.
 *
 * No mailbox provider is connected yet (Gmail and Outlook are catalogued under
 * Settings → Integrations but have no backend), so everything composed here is
 * stored against the workspace rather than delivered. Saying so once, at the
 * top of the page, is better than letting someone discover it after writing a
 * message — and the link is the half they can act on.
 */
export function MailboxNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700">
      <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
      <p className="leading-relaxed">
        No mailbox is connected, so messages are stored here rather than sent. Connect Gmail or Outlook under{' '}
        <Link to="/dashboard/account/integrations" className="font-medium underline underline-offset-2">
          Settings → Integrations
        </Link>{' '}
        to send and receive for real.
      </p>
    </div>
  )
}
