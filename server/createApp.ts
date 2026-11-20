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

/** Tipo LiveClient. */
type LiveClient = {
  socket: WSContext
  personaId: string | null
}

/** Aplicação HTTP e WebSocket ligada à loja de chamados. */
export function createApp(store: TicketStore) {
  /** Valor app. */
  const app = new Hono()
  /** Valor clients. */
  const clients = new Set<LiveClient>()
  /** Valor sent. */
  const sent = new Set<string>()
  /** Valor last. */
  let last: { event: DomainEvent; state: AppState } | null = null
  /** Valor secret. */
  const secret = sessionSecret()

  /** Valor deliver. */
  const deliver = (event: DomainEvent, state: AppState, force: boolean) => {
    if (!force && sent.has(event.id)) return
    sent.add(event.id)
    for (const client of clients) {
      if (!client.personaId || client.socket.readyState !== 1) continue
      /** Valor viewer. */
      const viewer = state.users.find((user) => user.id === client.personaId)
      if (!viewer) continue
      /** Valor visible. */
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
    /** Valor session. */
    const session = readSession(c.req.header('cookie'), secret)
    if (!session) return c.json({ message: 'errors.signIn' }, 401)
    /** Valor state. */
    const state = await store.read()
    return c.json({
      githubLogin: session.githubLogin,
      githubName: session.githubName,
      persona: personaUser(state, session),
    })
  })

  app.post('/api/session/persona', async (c) => {
    /** Valor session. */
    const session = readSession(c.req.header('cookie'), secret)
    if (!session) return c.json({ message: 'errors.signIn' }, 401)
    /** Valor body. */
    const body = parsed(personaSchema, await c.req.json().catch(() => null))
    if (!body.ok) return c.json({ message: body.message }, 400)
    /** Valor state. */
    const state = await store.read()
    /** Valor persona. */
    const persona = state.users.find((user) => user.id === body.data.personaId)
    if (!persona) return c.json({ message: 'errors.unknownPersona' }, 404)
    c.header('Set-Cookie', sessionCookie({ ...session, personaId: persona.id }, secret))
    return c.json({ persona })
  })

  app.post('/api/session/logout', (c) => {
    c.header('Set-Cookie', clearSessionCookie())
    return c.json({ ok: true })
  })

  app.post('/auth/test-session', async (c) => {
    if (process.env.E2E_SESSION !== '1') return c.json({ message: 'errors.notFound' }, 404)
    /** Valor body. */
    const body = (await c.req.json().catch(() => ({}))) as { personaId?: string }
    /** Valor state. */
    const state = await store.read()
    /** Valor personaId. */
    const personaId = body.personaId ?? null
    if (personaId && !state.users.some((user) => user.id === personaId)) {
      return c.json({ message: 'errors.unknownPersona' }, 404)
    }
    /** Valor session. */
    const session: Session = {
      githubLogin: 'local-preview',
      githubName: 'Local preview',
      personaId,
    }
    c.header('Set-Cookie', sessionCookie(session, secret))
    return c.json({ ok: true })
  })

  app.get('/auth/github', (c) => {
    /** Valor state. */
    const state = randomBytes(16).toString('hex')
    /** Valor url. */
    const url = githubAuthorizeUrl(state)
    if (!url) return c.json({ message: 'errors.githubMissing' }, 400)
    c.header('Set-Cookie', `itsm_oauth=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`)
    return c.redirect(url)
  })

  app.get('/auth/github/callback', async (c) => {
    /** Valor code. */
    const code = c.req.query('code')
    /** Valor state. */
    const state = c.req.query('state')
    /** Valor expected. */
    const expected = cookieValue(c.req.header('cookie'), 'itsm_oauth')
    if (!code || !state || !expected || state !== expected) {
      return c.redirect('/login?error=github')
    }
    /** Valor identity. */
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
    /** Valor actor. */
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    /** Valor workspace. */
    const workspace = presentWorkspace(await store.read(), actor.id)
    if (!workspace) return c.json({ message: 'errors.unknownPersona' }, 404)
    return c.json(workspace)
  })

  app.get('/api/team', async (c) => {
    /** Valor actor. */
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    if (actor.role !== 'manager') return c.json({ message: 'errors.teamForbidden' }, 403)
    return c.json({ consultants: teamLoad(await store.read(), Date.now()) })
  })

  app.post('/api/tickets', async (c) => {
    /** Valor actor. */
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    /** Valor body. */
    const body = parsed(openTicketSchema, await c.req.json().catch(() => null))
    if (!body.ok) return c.json({ message: body.message }, 400)
    /** Valor failure. */
    const failure = await commitCommand(store, (state) =>
      openTicket(state, actor, body.data, commandContext()),
    )
    if (failure) return c.json({ message: failure.message }, failure.status)
    return c.json({ ok: true }, 201)
  })

  app.post('/api/tickets/:ticketId/messages', async (c) => {
    /** Valor actor. */
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    /** Valor body. */
    const body = parsed(messageSchema, await c.req.json().catch(() => null))
    if (!body.ok) return c.json({ message: body.message }, 400)
    /** Valor ticketId. */
    const ticketId = c.req.param('ticketId')
    /** Valor failure. */
    const failure = await commitCommand(store, (state) =>
      addMessage(state, actor, ticketId, body.data, commandContext()),
    )
    if (failure) return c.json({ message: failure.message }, failure.status)
    return c.json({ ok: true }, 201)
  })

  app.post('/api/tickets/:ticketId/status', async (c) => {
    /** Valor actor. */
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    /** Valor body. */
    const body = parsed(statusSchema, await c.req.json().catch(() => null))
    if (!body.ok) return c.json({ message: body.message }, 400)
    /** Valor ticketId. */
    const ticketId = c.req.param('ticketId')
    /** Valor failure. */
    const failure = await commitCommand(store, (state) =>
      changeStatus(state, actor, ticketId, body.data, commandContext()),
    )
    if (failure) return c.json({ message: failure.message }, failure.status)
    return c.json({ ok: true })
  })

  app.post('/api/tickets/:ticketId/take', async (c) => {
    /** Valor actor. */
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    /** Valor ticketId. */
    const ticketId = c.req.param('ticketId')
    /** Valor failure. */
    const failure = await commitCommand(store, (state) =>
      takeTicket(state, actor, ticketId, commandContext()),
    )
    if (failure) return c.json({ message: failure.message }, failure.status)
    return c.json({ ok: true })
  })

  app.post('/api/tickets/:ticketId/assign', async (c) => {
    /** Valor actor. */
    const actor = await requireActor(c, store, secret)
    if (actor instanceof Response) return actor
    /** Valor body. */
    const body = parsed(assignSchema, await c.req.json().catch(() => null))
    if (!body.ok) return c.json({ message: body.message }, 400)
    /** Valor ticketId. */
    const ticketId = c.req.param('ticketId')
    /** Valor failure. */
    const failure = await commitCommand(store, (state) =>
      assignTicket(state, actor, ticketId, body.data.consultantId, commandContext()),
    )
    if (failure) return c.json({ message: failure.message }, failure.status)
    return c.json({ ok: true })
  })

  app.post('/api/test/replay', (c) => {
    if (process.env.E2E_SESSION !== '1') return c.json({ message: 'errors.notFound' }, 404)
    if (!last) return c.json({ message: 'errors.noEvent' }, 400)
    deliver(last.event, last.state, true)
    return c.json({ ok: true })
  })

  /** Valor socketEvents. */
  const socketEvents = (c: { req: { header: (name: string) => string | undefined } }) => {
    /** Valor session. */
    const session = readSession(c.req.header('cookie'), secret)
    /** Valor current. */
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

/** Sobe o HTTP e o upgrade do WebSocket na mesma porta. */
export function listen(app: Hono, port: number) {
  /** Valor websocket. */
  const websocket = new WebSocketServer({ noServer: true })
  return serve({ fetch: app.fetch, port, websocket: { server: websocket } })
}

/** Executa requireActor. */
async function requireActor(
  c: { req: { header: (name: string) => string | undefined } },
  store: TicketStore,
  secret: string,
) {
  /** Valor session. */
  const session = readSession(c.req.header('cookie'), secret)
  if (!session) return Response.json({ message: 'errors.signIn' }, { status: 401 })
  if (!session.personaId) return Response.json({ message: 'errors.choosePersona' }, { status: 401 })
  /** Valor user. */
  const user = personaUser(await store.read(), session)
  if (!user) return Response.json({ message: 'errors.unknownPersona' }, { status: 404 })
  return user
}

/** Executa personaUser. */
function personaUser(state: AppState, session: Session): User | null {
  if (!session.personaId) return null
  return state.users.find((user) => user.id === session.personaId) ?? null
}

/** Executa commitCommand. */
async function commitCommand(
  store: TicketStore,
  run: (state: AppState) => ReturnType<typeof openTicket>,
): Promise<{ status: 400 | 403 | 404; message: string } | null> {
  /** Valor failure. */
  let failure: { status: 400 | 403 | 404; message: string } | null = null
  await store.commit((state) => {
    /** Valor result. */
    const result = run(state)
    if (!result.ok) {
      failure = { status: result.status, message: result.message }
      return { state, events: [] }
    }
    return { state: result.state, events: result.events }
  })
  return failure
}

/** Executa commandContext. */
function commandContext() {
  return { now: new Date().toISOString(), createId: () => crypto.randomUUID() }
}

/** Executa parsed. */
function parsed<T>(
  schema: {
    safeParse: (
      value: unknown,
    ) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } }
  },
  value: unknown,
) {
  /** Valor result. */
  const result = schema.safeParse(value)
  if (!result.success) return { ok: false as const, message: 'errors.invalid' }
  return { ok: true as const, data: result.data }
}

/** Executa cookieValue. */
function cookieValue(header: string | undefined, name: string): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    /** Valor valor. */
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return null
}
