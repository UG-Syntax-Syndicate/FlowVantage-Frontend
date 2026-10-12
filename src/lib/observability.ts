import * as Sentry from '@sentry/react'

/**
 * Error reporting, in one place.
 *
 * The app previously had none: no error boundary anywhere, no global handler,
 * and no central place a failure passed through. Errors were swallowed by about
 * seventeen scattered `console.warn`/`console.error` calls and a handful of
 * deliberately empty catches, so a production fault left no trace anyone could
 * find. The two bugs this work started from were both invisible for exactly that
 * reason - the one that mattered most announced itself only as
 * `console.warn('Backend session exchange failed')` in a browser nobody was
 * watching.
 *
 * Everything here is a no-op when VITE_SENTRY_DSN is unset, which is the normal
 * state in development and before the DSN is provisioned. Call sites therefore
 * never need to care whether reporting is configured.
 */

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

/** True once Sentry is actually collecting. Exported for diagnostics, not for guarding call sites. */
export const observabilityEnabled = Boolean(dsn)

/**
 * Request bodies and headers can carry a Firebase ID token or a backend session
 * JWT, either of which is enough to impersonate the user. Strip anything that
 * looks like one before an event leaves the browser.
 */
const SENSITIVE_KEY_PATTERN = /token|secret|password|authorization|apikey|api_key|credential/i

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== 'object') return value

  if (Array.isArray(value)) return value.map((item) => scrub(item, depth + 1))

  const out: Record<string, unknown> = {}
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : scrub(inner, depth + 1)
  }
  return out
}

export function initObservability(): void {
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Sampled rather than exhaustive: this is a small app on a modest plan, and
    // the point is to notice faults, not to trace every navigation.
    tracesSampleRate: 0.1,
    // No sendDefaultPii here: it is a Node-SDK option and not valid for the
    // browser SDK, which does not attach PII by default anyway. What reaches
    // Sentry is controlled by identifyUser (uid only) and beforeSend below.
    beforeSend(event) {
      if (event.request?.data) event.request.data = scrub(event.request.data)
      if (event.request?.headers) event.request.headers = scrub(event.request.headers) as Record<string, string>
      if (event.extra) event.extra = scrub(event.extra) as Record<string, unknown>
      return event
    },
  })
}

/**
 * Associates events with the signed-in user, by uid only.
 *
 * Deliberately no email or name: the PRD commits to GDPR-compliant handling for
 * an EU user base, and a uid is enough to correlate a report with an account
 * without shipping personal data to a third party.
 */
export function identifyUser(uid: string | null): void {
  if (!dsn) return
  Sentry.setUser(uid ? { id: uid } : null)
}

export interface ReportContext {
  /** Where this came from, e.g. 'backendApi.request' or 'query'. */
  source: string
  [key: string]: unknown
}

/**
 * Reports an error, and always logs it locally too.
 *
 * The local console line is not redundant: without a DSN it is the only output,
 * and with one it keeps the failure visible to whoever is actually looking at
 * the browser.
 */
export function reportError(error: unknown, context: ReportContext): void {
  const { source, ...rest } = context

  console.error(`[${source}]`, error, rest)

  if (!dsn) return

  Sentry.captureException(error, {
    tags: { source },
    extra: scrub(rest) as Record<string, unknown>,
  })
}

/**
 * Records a non-fatal condition worth knowing about, which is not an exception.
 * Used for the states that used to vanish into a console.warn.
 */
export function reportWarning(message: string, context: ReportContext): void {
  const { source, ...rest } = context

  console.warn(`[${source}] ${message}`, rest)

  if (!dsn) return

  Sentry.captureMessage(message, {
    level: 'warning',
    tags: { source },
    extra: scrub(rest) as Record<string, unknown>,
  })
}
