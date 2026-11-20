import { Redis } from '@upstash/redis'
import type { AppState, DomainEvent } from '../../src/features/tickets/domain/types.ts'
import type { StoreListener, TicketStore } from './memoryStore.ts'

/** A Vercel nomeia o Redis como KV_*; o cliente Upstash também aceita UPSTASH_REDIS_*. */
export function redisConfigured(): boolean {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN),
  )
}

/** Valor STATE_KEY. */
const STATE_KEY = 'itsm:state'
/** Valor EVENTS_KEY. */
const EVENTS_KEY = 'itsm:events'
/** Valor LOCK_KEY. */
const LOCK_KEY = 'itsm:lock'

/**
 * Retrato compartilhado na Vercel, onde cada socket fica na instância que o aceitou.
 * Um bloqueio curto impede que duas gravações apaguem o evento uma da outra.
 */
export function createRedisStore(initial: AppState): TicketStore {
  /** Valor redis. */
  const redis = Redis.fromEnv()
  /** Valor listeners. */
  const listeners = new Set<StoreListener>()
  /** Valor polling. */
  let polling = false

  /** Valor notify. */
  const notify = (event: DomainEvent, state: AppState) => {
    for (const listener of listeners) listener(event, state)
  }

  /** Valor readState. */
  const readState = async (): Promise<AppState> => {
    /** Valor stored. */
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
        /** Valor locked. */
        const locked = await redis.set(LOCK_KEY, '1', { nx: true, px: 2000 })
        if (!locked) {
          await delay(40 * (attempt + 1))
          continue
        }
        try {
          /** Valor current. */
          const current = await readState()
          /** Valor result. */
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

/** Executa poll. */
async function poll(
  redis: Redis,
  notify: (event: DomainEvent, state: AppState) => void,
): Promise<void> {
  /** Valor seen. */
  const seen = new Set<string>()
  for (;;) {
    try {
      /** Valor raw. */
      const raw = await redis.lrange(EVENTS_KEY, 0, 30)
      /** Valor state. */
      const state = await redis.get<AppState>(STATE_KEY)
      if (state) {
        for (const item of raw.slice().reverse()) {
          /** Valor event. */
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

/** Executa delay. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
