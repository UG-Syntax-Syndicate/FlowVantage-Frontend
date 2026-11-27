import { useQuery } from '@tanstack/react-query'
import { getJson } from '../../lib/backendApi'
import { readBackendSessionToken } from '../../lib/backendSession'

/**
 * The full message behind a mail row. Synced mail is listed with a snippet;
 * the backend fetches the body from Gmail or Outlook the first time it is
 * opened and keeps it (GET /emails/:id/content).
 */
export interface EmailContent {
  /** The sender's HTML. Only ever rendered inside a sandboxed iframe. */
  html: string | null
  text: string | null
  to: string | null
  cc: string | null
  attachments: Array<{ filename: string; mimeType: string | null; size: number | null }>
  /** Opens the message in Gmail or Outlook. */
  webUrl: string | null
  /** False when the provider could not be reached and only the snippet is here. */
  complete: boolean
  error?: string
}

export const emailContentKey = (emailId: string) => ['emails', emailId, 'content'] as const

export async function fetchEmailContent(emailId: string): Promise<EmailContent> {
  const token = readBackendSessionToken()
  if (!token) throw new Error('Not signed in')
  const { data } = await getJson<{ data: EmailContent }>(`/emails/${encodeURIComponent(emailId)}/content`, token)
  return data
}

export function useEmailContent(emailId: string | null) {
  return useQuery({
    queryKey: emailContentKey(emailId ?? ''),
    queryFn: () => fetchEmailContent(emailId as string),
    enabled: Boolean(emailId),
    // A message body does not change; keep it for the session.
    staleTime: Infinity,
  })
}

/**
 * The document the reader's iframe shows. The iframe is sandboxed without
 * allow-scripts or allow-same-origin, so the sender's markup cannot run code
 * or reach this app; the CSP repeats that, and links open in a new tab.
 */
export function emailDocument(content: Pick<EmailContent, 'html' | 'text'>): string {
  const head = [
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'">`,
    '<base target="_blank">',
    '<style>',
    'html,body{margin:0;padding:0;background:#fff;}',
    'body{padding:20px 24px;font:14px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1e293b;word-wrap:break-word;}',
    'img{max-width:100%;height:auto;}',
    'pre.fv-plain{white-space:pre-wrap;font:inherit;margin:0;}',
    'a{color:#4f46e5;}',
    '</style>',
  ].join('')

  if (content.html) return `<!doctype html><html><head>${head}</head><body>${content.html}</body></html>`
  return `<!doctype html><html><head>${head}</head><body><pre class="fv-plain">${escapeHtml(content.text ?? '')}</pre></body></html>`
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string)
}
