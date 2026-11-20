import { randomBytes } from 'node:crypto'
import { serve, upgradeWebSocket } from '@hono/node-server'
import { Hono } from 'hono'
import type { WSContext } from 'hono/ws'
import { WebSocketServer } from 'ws'
import {
  addMessage,
  assignTicket,
  changeStatus,
  openTicket,
  takeTicket,
} from '../src/features/tickets/domain/commands.ts'
import { presentEvent, presentWorkspace } from '../src/features/tickets/domain/present.ts'
import { teamLoad } from '../src/features/tickets/domain/team.ts'
import type { AppState, DomainEvent, User } from '../src/features/tickets/domain/types.ts'
import {
  assignSchema,
  messageSchema,
  openTicketSchema,
  personaSchema,
  statusSchema,
} from '../src/features/tickets/schemas/contracts.ts'
import { githubAuthorizeUrl, githubIdentity } from './auth/github.ts'
import { clearSessionCookie, readSession, type Session, sessionCookie } from './auth/session.ts'
import type { TicketStore } from './data/memoryStore.ts'
import { sessionSecret } from './env.ts'

type LiveClient = {
  socket: WSContext
  personaId: string | null
}

/** HTTP and WebSocket application bound to a ticket store. */
export function createApp(store: TicketStore) {
  const app = new Hono()
  const clients = new Set<LiveClient>()
  const sent = new Set<string>()
  let last: { event: DomainEvent; state: AppState } | null = null
  const secret = sessionSecret()

  const deliver = (event: DomainEvent, state: AppState, force: boolean) => {
    if (!force && sent.has(event.id)) return
    sent.add(event.id)
    for (const client of clients) {
      if (!client.personaId || client.socket.readyState !== 1) continue
      const viewer = state.users.find((user) => user.id === client.personaId)
      if (!viewer) continue
      const visible = presentEvent(event, state, viewer)
      if (!visible) continue
      client.socket.send(JSON.stringify(visible))
    }
  }

  store.subscribe((event, state) => {
    last = { event, state }
    deliver(event, state, false)
  })

  app.get('/api/health', (c) => c.json({ ok: true }))

  app.get('/api/config', (c) =>
    c.json({
      githubEnabled: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      devSession: process.env.E2E_SESSION === '1',
    }),
  )

  app.get('/api/session', async (c) => {
    const session = readSession(c.req.header('cookie'), secret)
    if (!session) return c.json({ message: 'Sign in required.' }, 401)
    const state = await store.read()
    return c.json({
      githubLogin: session.githubLogin,
      githubName: session.githubName,
      persona: personaUser(state, session),
    })
  })

  app.post('/api/session/persona', async (c) => {
    const session = readSession(c.req.header('cookie'), secret)
    if (!session) return c.json({ message: 'Sign in required.' }, 401)
    const body = parsed(personaSchema, await c.req.json().catch(() => null))
    if (!body.ok) return c.json({ message: body.message }, 400)
    const state = await store.read()
    const persona = state.users.find((user) => user.id === body.data.personaId)
    if (!persona) return c.json({ message: 'Unknown persona.' }, 404)
    c.header('Set-Cookie', sessionCookie({ ...session, personaId: persona.id }, secret))
    return c.json({ persona })
  })

  app.post('/api/session/logout', (c) => {
    c.header('Set-Cookie', clearSessionCookie())
    return c.json({ ok: true })
  })

  app.post('/auth/test-session', async (c) => {
    if (process.env.E2E_SESSION !== '1') return c.json({ message: 'Not found.' }, 404)
    const body = (await c.req.json().catch(() => ({}))) as { personaId?: string }
    const state = await store.read()
    const personaId = body.personaId ?? null
    if (personaId && !state.users.some((user) => user.id === personaId)) {
      return c.json({ message: 'Unknown persona.' }, 404)
    }
    const session: Session = {
      githubLogin: 'local-preview',
      githubName: 'Local preview',
      personaId,
    }
    c.header('Set-Cookie', sessionCookie(session, secret))
    return c.json({ ok: true })
  })

  app.get('/auth/github', (c) => {
    const state = randomBytes(16).toString('hex')
    const url = githubAuthorizeUrl(state)
    if (!url) return c.json({ message: 'GitHub login is not configured.' }, 400)
    c.header('Set-Cookie', `itsm_oauth=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`)
    return c.redirect(url)
  })

  app.get('/auth/github/callback', async (c) => {
    const code = c.req.query('code')
    const state = c.req.query('state')
    const expected = cookieValue(c.req.header('cookie'), 'itsm_oauth')
    if (!code || !state || !expected || state !== expected) {
      return c.redirect('/login?error=github')
    }
    const identity = await githubIdentity(code)
    if (!identity) return c.redirect('/login?error=github')
    c.header(
      'Set-Cookie',
      sessionCookie(
        { githubLogin: identity.login, githubName: identity.name, personaId: null },
        secret,
      ),
    )
    return c.redirect('/session')
  })

  app.get('/api/workspace', async (c) => {
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    const workspace = presentWorkspace(await store.read(), actor.id)
    if (!workspace) return c.json({ message: 'Unknown persona.' }, 404)
    return c.json(workspace)
  })

  app.get('/api/team', async (c) => {
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    if (actor.role !== 'manager')
      return c.json({ message: 'Only a manager can view the team.' }, 403)
    return c.json({ consultants: teamLoad(await store.read(), Date.now()) })
  })

  app.post('/api/tickets', async (c) => {
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    const body = parsed(openTicketSchema, await c.req.json().catch(() => null))
    if (!body.ok) return c.json({ message: body.message }, 400)
    const failure = await commitCommand(store, (state) =>
      openTicket(state, actor, body.data, commandContext()),
    )
    if (failure) return c.json({ message: failure.message }, failure.status)
    return c.json({ ok: true }, 201)
  })

  app.post('/api/tickets/:ticketId/messages', async (c) => {
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    const body = parsed(messageSchema, await c.req.json().catch(() => null))
    if (!body.ok) return c.json({ message: body.message }, 400)
    const ticketId = c.req.param('ticketId')
    const failure = await commitCommand(store, (state) =>
      addMessage(state, actor, ticketId, body.data, commandContext()),
    )
    if (failure) return c.json({ message: failure.message }, failure.status)
    return c.json({ ok: true }, 201)
  })

  app.post('/api/tickets/:ticketId/status', async (c) => {
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    const body = parsed(statusSchema, await c.req.json().catch(() => null))
    if (!body.ok) return c.json({ message: body.message }, 400)
    const ticketId = c.req.param('ticketId')
    const failure = await commitCommand(store, (state) =>
      changeStatus(state, actor, ticketId, body.data, commandContext()),
    )
    if (failure) return c.json({ message: failure.message }, failure.status)
    return c.json({ ok: true })
  })

  app.post('/api/tickets/:ticketId/take', async (c) => {
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    const ticketId = c.req.param('ticketId')
    const failure = await commitCommand(store, (state) =>
      takeTicket(state, actor, ticketId, commandContext()),
    )
    if (failure) return c.json({ message: failure.message }, failure.status)
    return c.json({ ok: true })
  })

  app.post('/api/tickets/:ticketId/assign', async (c) => {
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    const body = parsed(assignSchema, await c.req.json().catch(() => null))
    if (!body.ok) return c.json({ message: body.message }, 400)
    const ticketId = c.req.param('ticketId')
    const failure = await commitCommand(store, (state) =>
      assignTicket(state, actor, ticketId, body.data.consultantId, commandContext()),
    )
    if (failure) return c.json({ message: failure.message }, failure.status)
    return c.json({ ok: true })
  })

  app.post('/api/test/replay', (c) => {
    if (process.env.E2E_SESSION !== '1') return c.json({ message: 'Not found.' }, 404)
    if (!last) return c.json({ message: 'No event yet.' }, 400)
    deliver(last.event, last.state, true)
    return c.json({ ok: true })
  })

  const socketEvents = (c: { req: { header: (name: string) => string | undefined } }) => {
    const session = readSession(c.req.header('cookie'), secret)
    let current: LiveClient | null = null
    return {
      onOpen(_event: unknown, socket: WSContext) {
        current = { socket, personaId: session?.personaId ?? null }
        clients.add(current)
      },
      onClose() {
        if (current) clients.delete(current)
      },
    }
  }
  app.get('/ws', upgradeWebSocket(socketEvents))
  app.get('/api/ws', upgradeWebSocket(socketEvents))

  return app
}

/** Starts the HTTP server and the WebSocket upgrade on one port. */
export function listen(app: Hono, port: number) {
  const websocket = new WebSocketServer({ noServer: true })
  return serve({ fetch: app.fetch, port, websocket: { server: websocket } })
}

async function requireActor(
  c: { req: { header: (name: string) => string | undefined } },
  store: TicketStore,
  secret: string,
) {
  const session = readSession(c.req.header('cookie'), secret)
  if (!session) return Response.json({ message: 'Sign in required.' }, { status: 401 })
  if (!session.personaId) return Response.json({ message: 'Choose a persona.' }, { status: 401 })
  const user = personaUser(await store.read(), session)
  if (!user) return Response.json({ message: 'Unknown persona.' }, { status: 404 })
  return user
}

function personaUser(state: AppState, session: Session): User | null {
  if (!session.personaId) return null
  return state.users.find((user) => user.id === session.personaId) ?? null
}

async function commitCommand(
  store: TicketStore,
  run: (state: AppState) => ReturnType<typeof openTicket>,
): Promise<{ status: 400 | 403 | 404; message: string } | null> {
  let failure: { status: 400 | 403 | 404; message: string } | null = null
  await store.commit((state) => {
    const result = run(state)
    if (!result.ok) {
      failure = { status: result.status, message: result.message }
      return { state, events: [] }
    }
    return { state: result.state, events: result.events }
  })
  return failure
}

function commandContext() {
  return { now: new Date().toISOString(), createId: () => crypto.randomUUID() }
}

function parsed<T>(
  schema: {
    safeParse: (
      value: unknown,
    ) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } }
  },
  value: unknown,
) {
  const result = schema.safeParse(value)
  if (!result.success)
    return { ok: false as const, message: result.error.issues[0]?.message ?? 'Invalid request.' }
  return { ok: true as const, data: result.data }
}

function cookieValue(header: string | undefined, name: string): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return null
}
