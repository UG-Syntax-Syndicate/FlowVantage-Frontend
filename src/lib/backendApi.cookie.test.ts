import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exchangeFirebaseSession, fetchRealtimeTicket, getJson } from './backendApi'
import { COOKIE_SESSION } from './backendSession'

/**
 * The cookie session from the client's side: the token never appears in a
 * header or in what the app stores, the cookie travels with every request,
 * and older Bearer sessions keep working.
 */

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response
}

describe('cookie sessions', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('asks for a cookie at sign-in and records only that a session exists', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { success: true, sessionTransport: 'cookie', user: { uid: 'u1', email: 'a@b.c' } }),
    )

    const result = await exchangeFirebaseSession('firebase-id-token')

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers['X-Session-Transport']).toBe('cookie')
    expect(init.credentials).toBe('include')
    expect(result).toMatchObject({ status: 'ok', sessionToken: COOKIE_SESSION })
  })

  it('sends no Authorization header for a cookie session, and includes the cookie', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: [] }))

    await getJson('/projects', COOKIE_SESSION)

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/v1\/projects$/)
    expect(init.headers.Authorization).toBeUndefined()
    expect(init.credentials).toBe('include')
  })

  it('still sends a Bearer token for a session from before the cookie', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: [] }))

    await getJson('/projects', 'legacy.jwt.token')

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer legacy.jwt.token')
  })

  it('fetches a realtime ticket over the cookie session', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: { ticket: 'one-minute' } }))

    expect(await fetchRealtimeTicket(COOKIE_SESSION)).toBe('one-minute')
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/v1\/realtime\/ticket$/)
    expect(init.method).toBe('POST')
  })
})
