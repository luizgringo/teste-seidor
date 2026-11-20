import { createApp, listen } from './createApp.ts'
import { buildState } from './data/blueprint.ts'
import { createMemoryStore } from './data/memoryStore.ts'
import { createRedisStore, redisConfigured } from './data/redisStore.ts'
import { startSimulator } from './data/simulator.ts'
import { loadLocalEnv } from './env.ts'

loadLocalEnv()

/** Valor seedVersion. */
const seedVersion = process.env.SEED_VERSION ?? '2026-11-20'
/** Valor state. */
const state = buildState(Date.now(), seedVersion)
/** Valor store. */
const store = redisConfigured() ? createRedisStore(state) : createMemoryStore(state)

/** Valor app. */
const app = createApp(store)
/** Valor port. */
const port = Number(process.env.PORT ?? 8787)
listen(app, port)

if (process.env.SIMULATOR !== 'off') startSimulator(store)

console.log(`Northline API listening on ${port}`)
