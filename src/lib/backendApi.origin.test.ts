import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isSameOriginApi } from './backendApi'

/**
 * The cookie only works when the API shares the page's origin. A deploy that
 * points VITE_BACKEND_API_BASE_URL at the API host directly must fall back to
 * Bearer, or every request after sign-in 401s.
 */
describe('isSameOriginApi', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { location: { href: 'https://app.example.com/dashboard', origin: 'https://app.example.com' } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('treats the proxied relative path as same-origin', () => {
    expect(isSameOriginApi('/api/v1')).toBe(true)
  })

  it('treats an absolute URL on this origin as same-origin', () => {
    expect(isSameOriginApi('https://app.example.com/api/v1')).toBe(true)
  })

  it('treats a separate API host as cross-origin, where the cookie cannot work', () => {
    expect(isSameOriginApi('https://flowvantage-backend.onrender.com/api/v1')).toBe(false)
  })
})
