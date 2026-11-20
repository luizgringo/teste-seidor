import type { Role, TicketStatus } from './types.ts'

const NEXT: Record<TicketStatus, readonly TicketStatus[]> = {
  open: ['in_progress', 'waiting_on_customer', 'closed'],
  in_progress: ['waiting_on_customer', 'resolved', 'closed'],
  waiting_on_customer: ['in_progress', 'closed'],
  resolved: ['closed', 'in_progress'],
  closed: ['open'],
}

/**
 * Returns whether this role may move a ticket between two statuses.
 * Customers may only reopen a closed ticket.
 */
export function canMoveStatus(from: TicketStatus, to: TicketStatus, role: Role): boolean {
  if (!NEXT[from].includes(to)) return false
  if (role === 'customer') return from === 'closed' && to === 'open'
  return true
}

/** Resolved and closed tickets leave the working queue. */
export function isDone(status: TicketStatus): boolean {
  return status === 'resolved' || status === 'closed'
}

/** Statuses a role may move to from the current one. */
export function nextStatuses(from: TicketStatus, role: Role): TicketStatus[] {
  return NEXT[from].filter((status) => canMoveStatus(from, status, role))
}
