import { createApp, listen } from './createApp.ts'
import { buildState } from './data/blueprint.ts'
import { createMemoryStore } from './data/memoryStore.ts'
import { createRedisStore } from './data/redisStore.ts'
import { startSimulator } from './data/simulator.ts'
import { loadLocalEnv } from './env.ts'

loadLocalEnv()

const seedVersion = process.env.SEED_VERSION ?? '2026-11-20'
const state = buildState(Date.now(), seedVersion)
const store =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? createRedisStore(state)
    : createMemoryStore(state)

const app = createApp(store)
const port = Number(process.env.PORT ?? 8787)
listen(app, port)

if (process.env.SIMULATOR !== 'off') startSimulator(store)

console.log(`Northline API listening on ${port}`)
