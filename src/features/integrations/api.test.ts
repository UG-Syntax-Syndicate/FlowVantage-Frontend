import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchInbox, fileItems, requestSync } from './api'

/**
 * The inbox client's contract with the backend: which query it sends for a
 * set of filters, how the paging cursor travels, and the filing body. The
 * backend validates these with zod, so a renamed field is a 400 in production.
 */

vi.mock('../../lib/backendSession', () => ({
  readBackendSessionToken: () => 'session-token',
}))

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response
}

describe('integrations inbox api', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('asks for unfiled items of one kind and returns the cursor and counts', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: [{ kind: 'email', id: 'e1', provider: 'gmail', title: 'Hi' }],
        nextCursor: 'abc',
        unfiled: { email: 3, event: 0, contact: 0, file: 1, record: 0 },
      }),
    )

    const page = await fetchInbox({ kind: 'email', filed: 'false', provider: 'gmail' })

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.pathname).toMatch(/\/integrations\/inbox$/)
    expect(Object.fromEntries(url.searchParams)).toEqual({
      kind: 'email',
      filed: 'false',
      limit: '50',
      provider: 'gmail',
    })
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer session-token')
    expect(page.nextCursor).toBe('abc')
    expect(page.unfiled.email).toBe(3)
    expect(page.items[0].id).toBe('e1')
  })

  it('passes the cursor for the next page', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [], nextCursor: null, unfiled: {} }))

    await fetchInbox({ kind: 'all', filed: 'any' }, 'cursor-2')

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.searchParams.get('cursor')).toBe('cursor-2')
    expect(url.searchParams.get('filed')).toBe('any')
  })

  it('files items with the body the backend validates, and unfiles with null', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { filed: 2 } }))

    await fileItems(
      [
        { kind: 'email', id: 'e1' },
        { kind: 'file', id: 'f1' },
      ],
      'project-1',
    )
    await fileItems([{ kind: 'email', id: 'e1' }], null)

    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      items: [
        { kind: 'email', id: 'e1' },
        { kind: 'file', id: 'f1' },
      ],
      projectId: 'project-1',
    })
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).projectId).toBeNull()
  })

  it('queues a sync for a provider', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { provider: 'gmail', queued: ['messages'] } }, 202))

    const result = await requestSync('gmail')

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/integrations\/connections\/gmail\/sync$/)
    expect(result.queued).toEqual(['messages'])
  })
})
