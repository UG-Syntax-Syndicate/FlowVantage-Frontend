import type { Page, Route } from '@playwright/test'

/**
 * An in-memory stand-in for the FlowVantage API, enough for the smoke flows:
 * session exchange, workspaces, projects, tasks. Shapes mirror the backend's
 * real responses (snake_case rows, { success, data } envelopes). Anything not
 * modelled answers an empty success, and is recorded in `unhandled` so a test
 * can see what the app asked for.
 */

interface Row {
  [key: string]: unknown
}

export interface FakeApi {
  projects: Row[]
  tasks: Row[]
  unhandled: string[]
}

const now = () => new Date().toISOString()

export async function installFakeApi(page: Page, user: { uid: string; email: string }): Promise<FakeApi> {
  const workspace = { id: 'ws-personal', name: 'Personal', is_personal: true, member_role: 'owner', created_at: now() }
  const state: FakeApi = { projects: [], tasks: [], unhandled: [] }
  let nextId = 1

  const sessionUser = {
    uid: user.uid,
    email: user.email,
    emailVerified: true,
    name: 'E2E User',
    picture: null,
    role: 'owner',
    authProvider: 'password',
    profileCompletedAt: now(),
  }

  const handlers: Array<[string, RegExp, (route: Route, match: RegExpMatchArray, body: Row) => unknown]> = [
    ['POST', /^\/auth\/login$/, () => ({ success: true, sessionToken: 'e2e-session-token', user: sessionUser, workspaces: [workspace] })],
    ['GET', /^\/auth\/me$/, () => ({ success: true, user: sessionUser })],
    ['GET', /^\/workspaces$/, () => ({ success: true, data: [workspace] })],
    [
      'GET',
      /^\/workspaces\/[^/]+\/members$/,
      () => ({
        success: true,
        data: [
          {
            workspace_id: workspace.id,
            user_id: user.uid,
            role: 'owner',
            display_name: 'E2E User',
            email: user.email,
            avatar_url: null,
            joined_at: now(),
          },
        ],
      }),
    ],
    [
      'GET',
      /^\/projects\/([^/]+)\/members$/,
      (_route, match) => ({
        success: true,
        data: [
          {
            project_id: match[1],
            user_id: user.uid,
            role: 'owner',
            display_name: 'E2E User',
            email: user.email,
            avatar_url: null,
            joined_at: now(),
          },
        ],
      }),
    ],
    ['GET', /^\/calendar$/, () => ({ success: true, events: [] })],
    ['GET', /^\/notes$/, () => ({ success: true, notes: [] })],
    ['GET', /^\/messages\/unread$/, () => ({ success: true, data: {} })],
    ['GET', /^\/emails$/, () => ({ success: true, data: [] })],
    ['GET', /^\/projects$/, () => ({ success: true, data: state.projects })],
    [
      'POST',
      /^\/projects$/,
      (_route, _match, body) => {
        const project = {
          id: `p${nextId++}`,
          name: body.name,
          description: body.description ?? null,
          status: body.status ?? 'active',
          color: body.color ?? '#ec721d',
          workspace_id: workspace.id,
          owner_id: user.uid,
          created_at: now(),
          updated_at: now(),
          members: [{ user_id: user.uid, role: 'owner' }],
          tags: [],
          objectives: [],
        }
        state.projects.unshift(project)
        return { success: true, data: project }
      },
    ],
    ['GET', /^\/projects\/([^/]+)$/, (_route, match) => ({ success: true, data: state.projects.find((p) => p.id === match[1]) })],
    ['GET', /^\/tasks$/, () => ({ success: true, data: state.tasks })],
    [
      'POST',
      /^\/tasks$/,
      (_route, _match, body) => {
        const task = {
          id: `t${nextId++}`,
          project_id: body.projectId,
          title: body.title,
          status: body.status ?? 'todo',
          priority: body.priority ?? 'medium',
          assignee_id: body.assigneeId ?? null,
          tags: body.tags ?? [],
          start_date: body.startDate ?? null,
          due_date: body.dueDate ?? null,
          created_at: now(),
        }
        state.tasks.unshift(task)
        return { success: true, data: task }
      },
    ],
  ]

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, '')
    const body = (request.postDataJSON?.() ?? {}) as Row

    // No live updates in the fake: an empty 204 makes EventSource back off.
    if (path === '/realtime/stream') {
      await route.fulfill({ status: 204, body: '' })
      return
    }

    for (const [method, pattern, handle] of handlers) {
      const match = path.match(pattern)
      if (method === request.method() && match) {
        await route.fulfill({ json: handle(route, match, body) })
        return
      }
    }

    state.unhandled.push(`${request.method()} ${path}`)
    await route.fulfill({ json: { success: true, data: [] } })
  })

  return state
}

const EMULATOR = 'http://127.0.0.1:9099'

/** A verified email/password user in the Auth emulator. */
export async function createEmulatorUser(
  request: import('@playwright/test').APIRequestContext,
  project: string,
): Promise<{ uid: string; email: string; password: string }> {
  const email = `e2e-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`
  const password = 'correct-horse-9'
  const signUp = await request.post(`${EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`, {
    data: { email, password, returnSecureToken: true },
  })
  const { localId } = await signUp.json()
  await request.post(`${EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${project}/accounts:update`, {
    headers: { Authorization: 'Bearer owner' },
    data: { localId, emailVerified: true },
  })
  return { uid: localId, email, password }
}
