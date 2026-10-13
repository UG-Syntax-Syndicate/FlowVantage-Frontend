import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getBlob, registerSessionRefresher } from './backendApi'

/**
 * Covers the one request path that does not go through `request()`.
 *
 * getBlob reads the response as bytes rather than JSON, which means it had to
 * reimplement the 401 recovery and the error-message extraction instead of
 * inheriting them. Reimplemented logic is exactly what drifts, so it is tested
 * directly.
 */

type FetchMock = ReturnType<typeof vi.fn>

function blobResponse(disposition: string | null): Response {
  return {
    ok: true,
    status: 200,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-disposition' ? disposition : null) },
    blob: async () => new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
    json: async () => ({}),
  } as unknown as Response
}

function errorResponse(status: number, body: unknown): Response {
  return {
    ok: false,
    status,
    headers: { get: () => null },
    json: async () => body,
    blob: async () => new Blob([]),
  } as unknown as Response
}

describe('getBlob', () => {
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

  it('returns the bytes and the filename from Content-Disposition', async () => {
    fetchMock.mockResolvedValueOnce(blobResponse('attachment; filename="Acme rebuild - report.pdf"'))

    const { blob, filename } = await getBlob('/reporting/projects/p1/report?format=pdf', 'token')

    expect(filename).toBe('Acme rebuild - report.pdf')
    expect(blob.type).toBe('application/pdf')
  })

  it('prefers the RFC 5987 encoded filename, which is the one that carries non-ASCII names', async () => {
    fetchMock.mockResolvedValueOnce(
      blobResponse("attachment; filename=\"report.pdf\"; filename*=UTF-8''Caf%C3%A9%20report.pdf"),
    )

    const { filename } = await getBlob('/reporting/projects/p1/report', 'token')

    expect(filename).toBe('Café report.pdf')
  })

  it('returns a null filename rather than guessing when the header is absent', async () => {
    fetchMock.mockResolvedValueOnce(blobResponse(null))

    const { filename } = await getBlob('/reporting/projects/p1/report', 'token')

    expect(filename).toBeNull()
  })

  it('re-authenticates once and replays on a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse(401, { message: 'Session expired due to inactivity.' }))
      .mockResolvedValueOnce(blobResponse('attachment; filename="report.docx"'))

    const refresher = vi.fn(async () => 'fresh-token')
    registerSessionRefresher(refresher)

    const { filename } = await getBlob('/reporting/projects/p1/report?format=docx', 'stale-token')

    expect(filename).toBe('report.docx')
    expect(refresher).toHaveBeenCalledTimes(1)

    const replayHeaders = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>
    expect(replayHeaders.Authorization).toBe('Bearer fresh-token')
  })

  it("keeps the backend's message and status on a failure", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(429, { message: 'Too many report requests. Please wait a few minutes.' }))

    await expect(getBlob('/reporting/projects/p1/report', 'token')).rejects.toThrow(
      'Too many report requests. Please wait a few minutes.',
    )

    fetchMock.mockResolvedValueOnce(errorResponse(403, {}))
    await expect(getBlob('/reporting/projects/p1/report', 'token')).rejects.toMatchObject({ status: 403 })
  })

  it('aborts on its own timeout rather than the 5s default every other request uses', async () => {
    vi.useFakeTimers()

    // Resolves only when the signal fires, so the test observes the abort
    // rather than the fetch finishing.
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )

    const pending = getBlob('/reporting/projects/p1/report', 'token', 30_000)
    const assertion = expect(pending).rejects.toThrow(/abort/i)

    // Past the 5s request default, and still in flight.
    await vi.advanceTimersByTimeAsync(10_000)
    await vi.advanceTimersByTimeAsync(25_000)

    await assertion
    vi.useRealTimers()
  })
})
