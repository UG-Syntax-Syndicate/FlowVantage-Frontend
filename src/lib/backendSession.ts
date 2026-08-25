export const BACKEND_SESSION_STORAGE_KEY = 'flowvantage.backendSessionToken'

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
