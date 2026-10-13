import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, getJson, registerSessionRefresher } from './backendApi'

/**
 * Covers the session-recovery path, which is the highest-consequence logic in
 * this module and had no test at all.
 *
 * Why it matters: the backend expires sessions on a sliding inactivity window
 * and *deletes* the row, so a token stops working while remaining a
 * structurally valid JWT in localStorage. Nothing used to notice - the only
 * place that minted a session ran in an effect keyed on the Firebase user,
 * which does not change when a request 401s - so every retry resent the same
 * dead token and the app wedged on a permanent "please try again". A long
 * review screen like contact import hit this routinely.
 */

type FetchMock = ReturnType<typeof vi.fn>

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

describe('request session recovery', () => {
  let fetchMock: FetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    registerSessionRefresher(null)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('re-authenticates once and replays the request on a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Session expired due to inactivity.' }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: ['ok'] }))

    const refresher = vi.fn(async () => 'fresh-token')
    registerSessionRefresher(refresher)

    const result = await getJson<{ data: string[] }>('/contacts', 'stale-token')

    expect(result.data).toEqual(['ok'])
    expect(refresher).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // The replay must carry the NEW token; resending the dead one is the exact
    // bug this exists to prevent.
    const replayHeaders = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>
    expect(replayHeaders.Authorization).toBe('Bearer fresh-token')
  })

  it('surfaces the original 401 when re-authentication cannot help', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'Session not found. Please log in again.' }))

    // null means "signed out, or 2FA is required first" - retrying is pointless.
    registerSessionRefresher(vi.fn(async () => null))

    await expect(getJson('/contacts', 'stale-token')).rejects.toThrow(/Session not found/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not retry more than once, so a persistent 401 cannot loop', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'Invalid or expired session token' }))

    const refresher = vi.fn(async () => 'fresh-but-also-rejected')
    registerSessionRefresher(refresher)

    await expect(getJson('/contacts', 'stale-token')).rejects.toThrow(ApiError)
    expect(refresher).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('collapses concurrent 401s onto a single re-authentication', async () => {
    // A loaded dashboard has several queries in flight, and a lapsed session
    // fails them all at once. Without collapsing, each would mint its own
    // session and the last to finish would invalidate the others.
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>
      return headers.Authorization === 'Bearer fresh-token'
        ? jsonResponse(200, { success: true, data: 'ok' })
        : jsonResponse(401, { message: 'Session expired due to inactivity.' })
    })

    let refreshCount = 0
    registerSessionRefresher(async () => {
      refreshCount += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      return 'fresh-token'
    })

    const results = await Promise.all([
      getJson('/contacts', 'stale-token'),
      getJson('/projects', 'stale-token'),
      getJson('/notes', 'stale-token'),
    ])

    expect(results).toHaveLength(3)
    expect(refreshCount).toBe(1)
  })

  it('leaves non-401 failures alone', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { message: 'Internal server error' }))

    const refresher = vi.fn(async () => 'fresh-token')
    registerSessionRefresher(refresher)

    await expect(getJson('/contacts', 'token')).rejects.toThrow(/Internal server error/)
    expect(refresher).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not attempt recovery for an unauthenticated request', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'Missing session token' }))

    const refresher = vi.fn(async () => 'fresh-token')
    registerSessionRefresher(refresher)

    // No token to begin with, so there is no session to recover.
    await expect(getJson('/contacts', '')).rejects.toThrow(/Missing session token/)
    expect(refresher).not.toHaveBeenCalled()
  })

  it('preserves the HTTP status on the thrown error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { message: 'You are not a member of this workspace' }))

    await expect(getJson('/contacts', 'token')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    })
  })
})
