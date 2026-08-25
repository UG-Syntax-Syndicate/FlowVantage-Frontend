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
}

interface BackendSessionResponse {
  success: boolean
  sessionToken: string
  user: BackendSessionUser
}

// The backend treats signup and login identically (both upsert + issue a
// session token), so this single call covers both flows.
export async function exchangeFirebaseSession(idToken: string): Promise<BackendSessionResponse> {
  const { signal, cancel } = withTimeout(BACKEND_TIMEOUT_MS)
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`Backend session exchange failed (${response.status})`)
    }

    const payload = (await response.json()) as Partial<BackendSessionResponse>
    if (typeof payload.sessionToken !== 'string' || payload.sessionToken.length === 0) {
      throw new Error('Backend session exchange returned no session token')
    }

    return payload as BackendSessionResponse
  } finally {
    cancel()
  }
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
