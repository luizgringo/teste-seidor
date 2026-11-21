import { addMessage } from '../../src/features/tickets/domain/commands.ts'
import type { TicketStore } from './memoryStore.ts'

/** Valor REPLIES. */
const REPLIES = [
  'Tem alguma atualização?',
  'Tentei de novo e o mesmo erro continua.',
  'Isso está travando a equipe esta tarde.',
]

/** Emite uma resposta pública num chamado em atendimento, para a mesa se mover enquanto alguém lê. */
export function startSimulator(store: TicketStore): () => void {
  /** Valor timer. */
  const timer = setInterval(() => {
    void tick(store)
  }, 12_000)
  return () => clearInterval(timer)
}

/** Executa tick. */
async function tick(store: TicketStore): Promise<void> {
  await store.commit((state) => {
    /** Valor candidates. */
    const candidates = state.tickets.filter((ticket) => ticket.status === 'in_progress')
    /** Valor ticket. */
    const ticket = candidates[Math.floor(Math.random() * candidates.length)]
    if (!ticket) return { state, events: [] }
    /** Valor requester. */
    const requester = state.users.find((user) => user.id === ticket.requesterId)
    if (!requester) return { state, events: [] }
    /** Valor body. */
    const body = REPLIES[Math.floor(Math.random() * REPLIES.length)] ?? 'Tem alguma atualização?'
    /** Valor result. */
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
