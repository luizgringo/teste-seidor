import { canMoveStatus, isDone } from './status.ts'
import type { Capabilities, TicketStatus, User } from './types.ts'

/** Fields the permission check needs. Hidden fields may already be null. */
export type AccessibleTicket = {
  requesterId: string
  assigneeId: string | null
  groupId: string | null
  status: TicketStatus
}

/** Whether this person may see the ticket at all. */
export function canAccess(actor: User, ticket: AccessibleTicket): boolean {
  if (actor.role === 'manager') return true
  if (actor.role === 'customer') return ticket.requesterId === actor.id
  return ticket.groupId !== null && ticket.groupId === actor.groupId
}

/** Actions the screen may offer for this ticket. Pass null when no ticket is open. */
export function capabilitiesFor(actor: User, ticket: AccessibleTicket | null): Capabilities {
  /** Valor staff. */
  const staff = actor.role !== 'customer'
  /** Valor accessible. */
  const accessible = ticket ? canAccess(actor, ticket) : false
  /** Valor writable. */
  const writable = accessible && ticket !== null && !isDone(ticket.status)
  /** Valor sameGroup. */
  const sameGroup = ticket !== null && actor.groupId !== null && ticket.groupId === actor.groupId
  return {
    canOpenTicket: true,
    canViewTeam: actor.role === 'manager',
    canViewTaxonomy: staff,
    canViewInternalNote: staff,
    canReply: writable,
    canCreateInternalNote: staff && writable,
    canTake:
      accessible &&
      ticket !== null &&
      ticket.assigneeId === null &&
      !isDone(ticket.status) &&
      (actor.role === 'manager' || (actor.role === 'consultant' && sameGroup)),
    canReassign:
      actor.role === 'manager' && accessible && ticket !== null && !isDone(ticket.status),
    canChangeStatus: staff && accessible && ticket !== null && nextStatusExists(actor, ticket),
    canReopen:
      accessible &&
      ticket !== null &&
      ticket.status === 'closed' &&
      canMoveStatus('closed', 'open', actor.role),
  }
}

/** Executa nextStatusExists. */
function nextStatusExists(actor: User, ticket: AccessibleTicket): boolean {
  return (['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'] as const).some(
    (status) => status !== ticket.status && canMoveStatus(ticket.status, status, actor.role),
  )
}
