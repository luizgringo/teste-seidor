import { Redis } from '@upstash/redis'
import type { AppState, DomainEvent } from '../../src/features/tickets/domain/types.ts'
import type { StoreListener, TicketStore } from './memoryStore.ts'

const STATE_KEY = 'itsm:state'
const EVENTS_KEY = 'itsm:events'
const LOCK_KEY = 'itsm:lock'

/**
 * Shared snapshot for Vercel, where each socket stays on the instance that accepted it.
 * A short lock keeps two writes from dropping each other's event.
 */
export function createRedisStore(initial: AppState): TicketStore {
  const redis = Redis.fromEnv()
  const listeners = new Set<StoreListener>()
  let polling = false

  const notify = (event: DomainEvent, state: AppState) => {
    for (const listener of listeners) listener(event, state)
  }

  const readState = async (): Promise<AppState> => {
    const stored = await redis.get<AppState>(STATE_KEY)
    if (!stored || stored.seedVersion !== initial.seedVersion) {
      await redis.set(STATE_KEY, initial)
      return initial
    }
    return stored
  }

  return {
    read: readState,
    async commit(change) {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const locked = await redis.set(LOCK_KEY, '1', { nx: true, px: 2000 })
        if (!locked) {
          await delay(40 * (attempt + 1))
          continue
        }
        try {
          const current = await readState()
          const result = change(current)
          await redis.set(STATE_KEY, result.state)
          if (result.events.length > 0) {
            await redis.lpush(EVENTS_KEY, ...result.events.map((event) => JSON.stringify(event)))
            await redis.ltrim(EVENTS_KEY, 0, 199)
          }
          for (const event of result.events) notify(event, result.state)
          return result.events
        } finally {
          await redis.del(LOCK_KEY)
        }
      }
      throw new Error('Could not save the ticket change.')
    },
    subscribe(listener) {
      listeners.add(listener)
      if (!polling) {
        polling = true
        void poll(redis, notify)
      }
      return () => listeners.delete(listener)
    },
  }
}

async function poll(
  redis: Redis,
  notify: (event: DomainEvent, state: AppState) => void,
): Promise<void> {
  const seen = new Set<string>()
  for (;;) {
    try {
      const raw = await redis.lrange(EVENTS_KEY, 0, 30)
      const state = await redis.get<AppState>(STATE_KEY)
      if (state) {
        for (const item of raw.slice().reverse()) {
          const event =
            typeof item === 'string' ? (JSON.parse(item) as DomainEvent) : (item as DomainEvent)
          if (seen.has(event.id)) continue
          seen.add(event.id)
          notify(event, state)
        }
      }
    } catch {
      // The next tick tries again. A missed poll must not kill the process.
    }
    await delay(1000)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
