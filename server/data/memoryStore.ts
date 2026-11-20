import type { AppState, DomainEvent } from '../../src/features/tickets/domain/types.ts'

/** Tipo StoreChange. */
export type StoreChange = {
  state: AppState
  events: DomainEvent[]
}

/** Tipo StoreListener. */
export type StoreListener = (event: DomainEvent, state: AppState) => void

/** Retrato do tenant compartilhado pelo HTTP e pelo socket. */
export type TicketStore = {
  read: () => Promise<AppState>
  commit: (change: (state: AppState) => StoreChange) => Promise<DomainEvent[]>
  subscribe: (listener: StoreListener) => () => void
}

/** Loja no processo, usada no desenvolvimento local e nos testes. */
export function createMemoryStore(initial: AppState): TicketStore {
  /** Valor state. */
  let state = initial
  /** Valor listeners. */
  const listeners = new Set<StoreListener>()
  return {
    async read() {
      return state
    },
    async commit(change) {
      /** Valor result. */
      const result = change(state)
      state = result.state
      for (const event of result.events) {
        for (const listener of listeners) listener(event, state)
      }
      return result.events
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
