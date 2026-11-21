import { createAdaptorServer } from '@hono/node-server'
import { WebSocketServer } from 'ws'
import { createApp } from './createApp.ts'
import { buildState } from './data/blueprint.ts'
import { createMemoryStore } from './data/memoryStore.ts'
import { createRedisStore, redisConfigured } from './data/redisStore.ts'
import { loadLocalEnv } from './env.ts'

loadLocalEnv()

/** Valor state. */
const state = buildState(Date.now(), process.env.SEED_VERSION ?? '2026-11-20-pt')
/** Valor store. */
const store = redisConfigured() ? createRedisStore(state) : createMemoryStore(state)

/** Valor websocket. */
const websocket = new WebSocketServer({ noServer: true })

/** Servidor Node exportado para a Vercel. O desenvolvimento local escuta em server/index.ts. */
const server = createAdaptorServer({
  fetch: createApp(store).fetch,
  websocket: { server: websocket },
})

export default server
