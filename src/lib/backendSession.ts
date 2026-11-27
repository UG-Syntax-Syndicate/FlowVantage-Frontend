export const BACKEND_SESSION_STORAGE_KEY = 'flowvantage.backendSessionToken'

/**
 * Stored in place of a token when the session lives in the backend's httpOnly
 * cookie. Not a secret: it only records that a session exists, so the rest of
 * the app (which gates its queries on "is there a session") works unchanged
 * while the real credential stays out of reach of page scripts.
 *
 * A value other than this is a Bearer token from before the cookie, which
 * keeps working until that user next signs in.
 */
export const COOKIE_SESSION = 'cookie-session'

/**
 * Keeps the backend JWT in one well-defined browser-storage location.
 * Firebase manages its own authentication persistence separately.
 */
export function readBackendSessionToken(): string | null {
  try {
    return window.localStorage.getItem(BACKEND_SESSION_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeBackendSessionToken(token: string): void {
  try {
    window.localStorage.setItem(BACKEND_SESSION_STORAGE_KEY, token)
  } catch (error) {
    console.warn('Unable to persist backend session token', error)
  }
}

export function clearBackendSessionToken(): void {
  try {
    window.localStorage.removeItem(BACKEND_SESSION_STORAGE_KEY)
  } catch (error) {
    console.warn('Unable to remove backend session token', error)
  }
}
