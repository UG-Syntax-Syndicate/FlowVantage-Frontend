export const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://localhost:3000/api/v1'

const BACKEND_TIMEOUT_MS = 5000

/**
 * The session exchange gets its own, far longer budget. It is the one request
 * that must not be treated as best-effort: the backend provisions the user row
 * and their personal workspace during it, so a timeout here leaves the account
 * half-created with no workspace at all.
 *
 * 5s was nowhere near enough in practice. A host that idles the instance out
 * takes 30-60s to wake, and this backend also runs its migrations lazily on the
 * first request, so the very first sign-in after a quiet period reliably
 * exceeded the old timeout and aborted.
 */
const AUTH_TIMEOUT_MS = 45000

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, cancel: () => clearTimeout(timeoutId) }
}

/** An HTTP failure that keeps its status, so callers can branch on 401. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Re-authenticates and returns a fresh backend session token, or null if that
 * is not possible right now.
 *
 * Registered by AuthProvider rather than implemented here: it owns the Firebase
 * user and the React state holding the token, so it is the only place that can
 * both mint a new one and keep the UI in sync. Injecting it also keeps this
 * module free of a firebase/auth import, and so free of an import cycle.
 */
type SessionRefresher = () => Promise<string | null>

let sessionRefresher: SessionRefresher | null = null
let inFlightRefresh: Promise<string | null> | null = null

export function registerSessionRefresher(refresher: SessionRefresher | null): void {
  sessionRefresher = refresher
}

/**
 * Runs the registered refresher, collapsing concurrent callers onto one
 * exchange. A page typically has several queries in flight, and a lapsed
 * session fails them all at once - without this they would each mint a separate
 * session and the last one to finish would win, invalidating the others.
 */
function refreshSessionOnce(): Promise<string | null> {
  if (!sessionRefresher) return Promise.resolve(null)

  if (!inFlightRefresh) {
    inFlightRefresh = sessionRefresher().finally(() => {
      inFlightRefresh = null
    })
  }

  return inFlightRefresh
}

export interface BackendNotificationPreferences {
  emailOnAssignment: boolean
  emailOnMention: boolean
  weeklyDigest: boolean
  productUpdates: boolean
}

export interface BackendSessionUser {
  uid: string
  email: string
  emailVerified: boolean
  name: string | null
  picture: string | null
  role?: string
  authProvider?: string
  twoFactorEnabled?: boolean
  notificationPreferences?: BackendNotificationPreferences
}

interface BackendSessionPayload {
  success: boolean
  sessionToken?: string
  user?: BackendSessionUser
  requiresTwoFactor?: boolean
  userId?: string
}

/** Result of exchanging (or completing) a session: either a real session, or a pending 2FA challenge. */
export type BackendSessionResult =
  | { status: 'ok'; sessionToken: string; user: BackendSessionUser }
  | { status: 'requiresTwoFactor'; userId: string }

async function sendOnce<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body: unknown,
  sessionToken: string | undefined,
  timeoutMs: number,
): Promise<T> {
  const { signal, cancel } = withTimeout(timeoutMs)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })

    const payload = (await response.json().catch(() => ({}))) as { message?: string } & T

    if (!response.ok) {
      throw new ApiError(payload.message || `Request failed (${response.status})`, response.status)
    }

    return payload
  } finally {
    cancel()
  }
}

/**
 * Sends an authenticated request, re-authenticating once and retrying if the
 * backend reports the session is gone.
 *
 * The backend expires sessions on a sliding inactivity window and *deletes* the
 * row, so a token can stop working while still being a structurally valid JWT
 * sitting in localStorage. Nothing used to notice: the only place that minted a
 * session ran in an effect keyed on the Firebase user, which does not change
 * when a request 401s. So the app wedged - every retry re-sent the same dead
 * token and failed identically, and the user saw a permanent "please try again"
 * with no way to recover but a reload. A long-running flow like contact import,
 * where the user can sit on a review screen for minutes, hit this routinely.
 */
async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body: unknown,
  sessionToken?: string,
  timeoutMs: number = BACKEND_TIMEOUT_MS,
  { recoverSession = true }: { recoverSession?: boolean } = {},
): Promise<T> {
  try {
    return await sendOnce<T>(method, path, body, sessionToken, timeoutMs)
  } catch (error) {
    const isExpiredSession = error instanceof ApiError && error.status === 401
    if (!isExpiredSession || !recoverSession || !sessionToken) {
      throw error
    }

    const freshToken = await refreshSessionOnce()
    if (!freshToken) {
      throw error
    }

    // Deliberately only one retry, and only with a token we actually got back:
    // if the replay 401s too, the failure is real and must surface rather than
    // loop.
    return sendOnce<T>(method, path, body, freshToken, timeoutMs)
  }
}

async function postJson<T>(path: string, body: unknown, sessionToken?: string): Promise<T> {
  return request<T>('POST', path, body, sessionToken)
}

/** Authenticated GET - sessionToken is required since every non-auth endpoint needs one. */
export async function getJson<T>(path: string, sessionToken: string): Promise<T> {
  return request<T>('GET', path, undefined, sessionToken)
}

/** Authenticated PATCH - sessionToken is required since every non-auth endpoint needs one. */
export async function patchJson<T>(path: string, body: unknown, sessionToken: string): Promise<T> {
  return request<T>('PATCH', path, body, sessionToken)
}

/** Authenticated DELETE - sessionToken is required since every non-auth endpoint needs one. */
export async function deleteJson<T>(path: string, sessionToken: string): Promise<T> {
  return request<T>('DELETE', path, undefined, sessionToken)
}

/** Authenticated POST - sessionToken is required since every non-auth endpoint needs one. */
export async function postJsonAuthed<T>(path: string, body: unknown, sessionToken: string): Promise<T> {
  return request<T>('POST', path, body, sessionToken)
}

/**
 * Authenticated POST with a longer, caller-specified timeout. The default
 * 5s BACKEND_TIMEOUT_MS is too short for an LLM completion, so AI endpoints
 * (src/api/aiApi.ts) use this instead of postJsonAuthed rather than raising
 * the global default for every other endpoint.
 */
export async function postJsonAuthedWithTimeout<T>(
  path: string,
  body: unknown,
  sessionToken: string,
  timeoutMs: number,
): Promise<T> {
  return request<T>('POST', path, body, sessionToken, timeoutMs)
}

function toSessionResult(payload: BackendSessionPayload): BackendSessionResult {
  if (payload.requiresTwoFactor) {
    if (typeof payload.userId !== 'string' || payload.userId.length === 0) {
      throw new Error('Backend requested 2FA but returned no userId')
    }
    return { status: 'requiresTwoFactor', userId: payload.userId }
  }

  if (typeof payload.sessionToken !== 'string' || payload.sessionToken.length === 0 || !payload.user) {
    throw new Error('Backend session exchange returned no session token')
  }

  return { status: 'ok', sessionToken: payload.sessionToken, user: payload.user }
}

/**
 * Retries `attempt` on timeouts and network errors, with backoff. A 4xx is
 * returned to the caller immediately - a rejected token or origin will be
 * rejected just as fast the second time.
 */
async function withRetries<T>(attempt: () => Promise<T>, tries = 3): Promise<T> {
  let lastError: unknown

  for (let i = 0; i < tries; i += 1) {
    try {
      return await attempt()
    } catch (error) {
      const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500
      if (isClientError || i === tries - 1) throw error
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i))
    }
  }

  throw lastError
}

// The backend treats signup and login identically (both upsert + issue a
// session token, or signal that a 2FA code is needed first).
//
// Retried, and on the long AUTH_TIMEOUT_MS budget, because this call has a side
// effect the rest of the app depends on: it is what creates the backend user
// row and their personal workspace. When it was a single best-effort 5s attempt,
// losing the race against a cold start left the user signed in to Firebase with
// no workspace - and no way to make one, since the create-organization control
// only renders once a workspace exists.
export async function exchangeFirebaseSession(idToken: string): Promise<BackendSessionResult> {
  const payload = await withRetries(() =>
    request<BackendSessionPayload>('POST', '/auth/login', { idToken }, undefined, AUTH_TIMEOUT_MS, {
      recoverSession: false,
    }),
  )
  return toSessionResult(payload)
}

/** Completes a two-step login by validating the TOTP code for a pending 2FA challenge. */
export async function validateTwoFactorLogin(userId: string, token: string): Promise<BackendSessionResult> {
  const payload = await postJson<BackendSessionPayload>('/auth/2fa/validate', { userId, token })
  return toSessionResult(payload)
}

export async function logoutBackendSession(sessionToken: string): Promise<void> {
  const { signal, cancel } = withTimeout(BACKEND_TIMEOUT_MS)
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
      signal,
    })
  } finally {
    cancel()
  }
}

/** Session policy the server owns and the client's idle timer follows. */
export interface BackendSessionPolicy {
  inactivityTimeoutMinutes: number
}

interface BackendMePayload {
  user?: BackendSessionUser
  session?: BackendSessionPolicy
}

/**
 * Fetches the caller's profile and the server's session policy together.
 *
 * Routed through request() (it used to call fetch directly) so that it picks up
 * the 401 recovery above - this doubles as the app's session heartbeat, which
 * makes it the single most valuable place to re-authenticate automatically.
 */
export async function fetchBackendMeWithPolicy(
  sessionToken: string,
): Promise<{ user: BackendSessionUser; session: BackendSessionPolicy | null }> {
  const payload = await request<BackendMePayload>('GET', '/auth/me', undefined, sessionToken)
  if (!payload.user) {
    throw new Error('Backend returned no user')
  }
  return { user: payload.user, session: payload.session ?? null }
}

export async function fetchBackendMe(sessionToken: string): Promise<BackendSessionUser> {
  const { user } = await fetchBackendMeWithPolicy(sessionToken)
  return user
}

/** Partial profile update - only the fields present get written. Replaces the old Firestore users/{uid} document writes. */
export interface BackendProfileUpdate {
  name?: string
  avatarUrl?: string | null
  notificationPreferences?: Partial<BackendNotificationPreferences>
}

export async function updateBackendProfile(
  sessionToken: string,
  updates: BackendProfileUpdate,
): Promise<BackendSessionUser> {
  const payload = await patchJson<{ user: BackendSessionUser }>('/auth/me', updates, sessionToken)
  return payload.user
}

/**
 * Records a client-originated audit event. Replaces the old Firestore
 * write-only auditLogs collection - see src/lib/auditLog.ts, its one caller.
 */
export async function postAuditEvent(
  sessionToken: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await postJsonAuthed('/auth/audit', { action, metadata }, sessionToken)
}

export interface TwoFactorSetupSecret {
  secret: string
  qrCodeUrl: string
}

/** Starts 2FA setup: generates a pending TOTP secret and its QR code. */
export async function generateTwoFactorSecret(sessionToken: string): Promise<TwoFactorSetupSecret> {
  return postJson<TwoFactorSetupSecret>('/auth/2fa/generate', {}, sessionToken)
}

/** Confirms 2FA setup with a 6-digit code, promoting the pending secret to permanent. */
export async function confirmTwoFactorSetup(sessionToken: string, token: string): Promise<void> {
  await postJson('/auth/2fa/verify', { token }, sessionToken)
}

/** Disables 2FA, given a currently-valid 6-digit code. */
export async function disableTwoFactor(sessionToken: string, token: string): Promise<void> {
  await postJson('/auth/2fa/disable', { token }, sessionToken)
}
