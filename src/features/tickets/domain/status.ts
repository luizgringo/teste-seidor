import type { Role, TicketStatus } from './types.ts'

/** Valor NEXT. */
const NEXT: Record<TicketStatus, readonly TicketStatus[]> = {
  open: ['in_progress', 'waiting_on_customer', 'closed'],
  in_progress: ['waiting_on_customer', 'resolved', 'closed'],
  waiting_on_customer: ['in_progress', 'closed'],
  resolved: ['closed', 'in_progress'],
  closed: ['open'],
}

/**
 * Diz se este papel pode mover o chamado entre dois status.
 * O cliente só pode reabrir um chamado fechado.
 */
export function canMoveStatus(from: TicketStatus, to: TicketStatus, role: Role): boolean {
  if (!NEXT[from].includes(to)) return false
  if (role === 'customer') return from === 'closed' && to === 'open'
  return true
}

/** Chamados resolvidos e fechados saem da fila de trabalho. */
export function isDone(status: TicketStatus): boolean {
  return status === 'resolved' || status === 'closed'
}

/** Status para os quais um papel pode ir a partir do atual. */
export function nextStatuses(from: TicketStatus, role: Role): TicketStatus[] {
  return NEXT[from].filter((status) => canMoveStatus(from, status, role))
}
