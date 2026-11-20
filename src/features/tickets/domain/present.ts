import { canAccess } from './access.ts'
import { statusLabel } from './labels.ts'
import type {
  AppState,
  ClientEvent,
  DomainEvent,
  Message,
  Ticket,
  User,
  WireTicket,
  Workspace,
} from './types.ts'

/** Projeção do chamado para quem olha. Nulo quando o chamado está fora do alcance. */
export function presentTicket(ticket: Ticket, viewer: User): WireTicket | null {
  if (!canAccess(viewer, ticket)) return null
  /** Valor staff. */
  const staff = viewer.role !== 'customer'
  return {
    id: ticket.id,
    number: ticket.number,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    statusLabel: statusLabel(ticket.status),
    requesterId: ticket.requesterId,
    assigneeId: ticket.assigneeId,
    openedAt: ticket.openedAt,
    dueAt: ticket.dueAt,
    updatedAt: ticket.updatedAt,
    priority: staff ? ticket.priority : null,
    groupId: staff ? ticket.groupId : null,
  }
}

/** Projeção da mensagem. A nota interna some para o cliente. */
export function presentMessage(message: Message, ticket: Ticket, viewer: User): Message | null {
  if (!canAccess(viewer, ticket)) return null
  if (viewer.role === 'customer' && message.visibility === 'internal') return null
  return message
}

/** Projeção do evento. Devolve nulo quando quem olha não pode saber que ele aconteceu. */
export function presentEvent(
  event: DomainEvent,
  state: AppState,
  viewer: User,
): ClientEvent | null {
  switch (event.type) {
    case 'ticket.opened': {
      /** Valor visible. */
      const visible = presentTicket(event.payload, viewer)
      if (!visible) return null
      return { ...event, payload: visible }
    }
    case 'message.added': {
      /** Valor ticket. */
      const ticket = state.tickets.find((item) => item.id === event.payload.ticketId)
      if (!ticket || !presentMessage(event.payload, ticket, viewer)) return null
      return event
    }
    case 'ticket.assigned':
    case 'status.changed': {
      /** Valor ticket. */
      const ticket = state.tickets.find((item) => item.id === event.payload.ticketId)
      if (!ticket || !canAccess(viewer, ticket)) return null
      return event
    }
    default: {
      /** Valor neverEvent. */
      const neverEvent: never = event
      return neverEvent
    }
  }
}

/** Retrato da tela para uma persona. Os campos ocultos saem do JSON, não só do visual. */
export function presentWorkspace(state: AppState, viewerId: string): Workspace | null {
  /** Valor viewer. */
  const viewer = state.users.find((user) => user.id === viewerId)
  if (!viewer) return null
  /** Valor tickets. */
  const tickets = state.tickets.flatMap((ticket) => {
    /** Valor visible. */
    const visible = presentTicket(ticket, viewer)
    return visible ? [visible] : []
  })
  /** Valor visibleIds. */
  const visibleIds = new Set(tickets.map((ticket) => ticket.id))
  /** Valor messages. */
  const messages = state.messages.filter((message) => {
    /** Valor ticket. */
    const ticket = state.tickets.find((item) => item.id === message.ticketId)
    return ticket ? presentMessage(message, ticket, viewer) !== null : false
  })
  /** Valor statusChanges. */
  const statusChanges = state.statusChanges.filter((change) => visibleIds.has(change.ticketId))
  return {
    viewer,
    users: presentUsers(state, viewer, tickets, messages),
    groups: viewer.role === 'customer' ? [] : state.groups,
    tickets,
    messages,
    statusChanges,
    seenEventIds: [],
  }
}

/** Executa presentUsers. */
function presentUsers(
  state: AppState,
  viewer: User,
  tickets: WireTicket[],
  messages: Message[],
): User[] {
  if (viewer.role === 'manager') return state.users
  if (viewer.role === 'consultant') {
    return state.users.filter(
      (user) =>
        user.id === viewer.id ||
        user.role === 'customer' ||
        user.role === 'manager' ||
        user.groupId === viewer.groupId,
    )
  }
  /** Valor needed. */
  const needed = new Set<string>([viewer.id])
  for (const ticket of tickets) {
    needed.add(ticket.requesterId)
    if (ticket.assigneeId) needed.add(ticket.assigneeId)
  }
  for (const message of messages) needed.add(message.authorId)
  return state.users
    .filter((user) => needed.has(user.id))
    .map((user) => (user.id === viewer.id ? user : { ...user, email: '', groupId: null }))
}
