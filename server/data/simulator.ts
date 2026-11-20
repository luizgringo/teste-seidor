import { addMessage } from '../../src/features/tickets/domain/commands.ts'
import type { TicketStore } from './memoryStore.ts'

const REPLIES = [
  'Any update on this?',
  'I tried again and the same error is still there.',
  'This is blocking the team this afternoon.',
]

/** Emits a public reply on a random in-progress ticket so the desk moves while someone is reading. */
export function startSimulator(store: TicketStore): () => void {
  const timer = setInterval(() => {
    void tick(store)
  }, 12_000)
  return () => clearInterval(timer)
}

async function tick(store: TicketStore): Promise<void> {
  await store.commit((state) => {
    const candidates = state.tickets.filter((ticket) => ticket.status === 'in_progress')
    const ticket = candidates[Math.floor(Math.random() * candidates.length)]
    if (!ticket) return { state, events: [] }
    const requester = state.users.find((user) => user.id === ticket.requesterId)
    if (!requester) return { state, events: [] }
    const body = REPLIES[Math.floor(Math.random() * REPLIES.length)] ?? 'Any update on this?'
    const result = addMessage(
      state,
      requester,
      ticket.id,
      { body, visibility: 'public' },
      { now: new Date().toISOString(), createId: () => crypto.randomUUID() },
    )
    if (!result.ok) return { state, events: [] }
    return { state: result.state, events: result.events }
  })
}
