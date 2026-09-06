const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://localhost:3000/api/v1'

const BACKEND_TIMEOUT_MS = 5000

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, cancel: () => clearTimeout(timeoutId) }
}

interface BackendSessionUser {
  uid: string
  email: string
  emailVerified: boolean
  name: string | null
  picture: string | null
  role?: string
  authProvider?: string
  twoFactorEnabled?: boolean
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

async function postJson<T>(path: string, body: unknown, sessionToken?: string): Promise<T> {
  const { signal, cancel } = withTimeout(BACKEND_TIMEOUT_MS)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    })

    const payload = (await response.json().catch(() => ({}))) as { message?: string } & T

    if (!response.ok) {
      throw new Error(payload.message || `Request failed (${response.status})`)
    }

    return payload
  } finally {
    cancel()
  }
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

// The backend treats signup and login identically (both upsert + issue a
// session token, or signal that a 2FA code is needed first).
export async function exchangeFirebaseSession(idToken: string): Promise<BackendSessionResult> {
  const payload = await postJson<BackendSessionPayload>('/auth/login', { idToken })
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

export async function fetchBackendMe(sessionToken: string): Promise<BackendSessionUser> {
  const { signal, cancel } = withTimeout(BACKEND_TIMEOUT_MS)
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      signal,
    })
    const payload = (await response.json().catch(() => ({}))) as { message?: string; user?: BackendSessionUser }
    if (!response.ok || !payload.user) {
      throw new Error(payload.message || `Request failed (${response.status})`)
    }
    return payload.user
  } finally {
    cancel()
  }
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
