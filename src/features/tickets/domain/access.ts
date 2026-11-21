import { canMoveStatus, isDone } from './status.ts'
import type { Capabilities, MessageVisibility, TicketStatus, User } from './types.ts'

/** Campos de que a permissão precisa. O que está oculto pode já vir nulo. */
export type AccessibleTicket = {
  requesterId: string
  assigneeId: string | null
  groupId: string | null
  status: TicketStatus
}

/** Diz se esta pessoa pode ver o chamado. */
export function canAccess(actor: User, ticket: AccessibleTicket): boolean {
  if (actor.role === 'manager') return true
  if (actor.role === 'customer') return ticket.requesterId === actor.id
  return ticket.groupId !== null && ticket.groupId === actor.groupId
}

/** Ações que a tela pode oferecer neste chamado. Passe nulo quando nenhum chamado está aberto. */
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

/**
 * Diz se esta pessoa pode alterar a própria mensagem.
 * @param actor - Pessoa que está olhando.
 * @param ticket - Chamado em que a mensagem está.
 * @param message - Mensagem com autor e visibilidade.
 * @returns Verdadeiro só para o autor, e só enquanto ainda pode escrever esse tipo de texto.
 */
export function canReviseMessage(
  actor: User,
  ticket: AccessibleTicket,
  message: { authorId: string; visibility: MessageVisibility },
): boolean {
  if (message.authorId !== actor.id) return false
  /** Valor capabilities. */
  const capabilities = capabilitiesFor(actor, ticket)
  switch (message.visibility) {
    case 'internal':
      return capabilities.canCreateInternalNote
    case 'public':
      return capabilities.canReply
    default: {
      /** Valor unreachable. */
      const unreachable: never = message.visibility
      return unreachable
    }
  }
}

/** Executa nextStatusExists. */
function nextStatusExists(actor: User, ticket: AccessibleTicket): boolean {
  return (['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'] as const).some(
    (status) => status !== ticket.status && canMoveStatus(ticket.status, status, actor.role),
  )
}
