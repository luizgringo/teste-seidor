import { createAdaptorServer } from '@hono/node-server'
import { WebSocketServer } from 'ws'
import { createApp } from './createApp.ts'
import { buildState } from './data/blueprint.ts'
import { createMemoryStore } from './data/memoryStore.ts'
import { createRedisStore } from './data/redisStore.ts'
import { loadLocalEnv } from './env.ts'

loadLocalEnv()

const state = buildState(Date.now(), process.env.SEED_VERSION ?? '2026-11-20')
const store =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? createRedisStore(state)
    : createMemoryStore(state)

const websocket = new WebSocketServer({ noServer: true })

/** Node server exported for Vercel. Local development listens from server/index.ts. */
const server = createAdaptorServer({
  fetch: createApp(store).fetch,
  websocket: { server: websocket },
})

export default server
