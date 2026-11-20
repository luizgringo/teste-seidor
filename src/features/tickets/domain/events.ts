import type { AppState, Assignment, DomainEvent, Message, StatusChange, Ticket } from './types.ts'

/**
 * Folds one event into the tenant snapshot.
 * An event id that was already applied leaves the snapshot unchanged.
 */
export function applyEvent(state: AppState, event: DomainEvent): AppState {
  if (state.seenEventIds.includes(event.id)) return state
  /** Valor seenEventIds. */
  const seenEventIds = [...state.seenEventIds, event.id].slice(-500)
  switch (event.type) {
    case 'ticket.opened':
      return applyOpened(state, event.payload, seenEventIds)
    case 'ticket.assigned':
      return applyAssigned(state, event, seenEventIds)
    case 'message.added':
      return applyMessage(state, event.payload, event.occurredAt, seenEventIds)
    case 'status.changed':
      return applyStatus(state, event, seenEventIds)
    default: {
      /** Valor neverEvent. */
      const neverEvent: never = event
      return neverEvent
    }
  }
}

/** Executa applyOpened. */
function applyOpened(state: AppState, ticket: Ticket, seenEventIds: string[]): AppState {
  if (state.tickets.some((item) => item.id === ticket.id)) return { ...state, seenEventIds }
  return { ...state, seenEventIds, tickets: [...state.tickets, ticket] }
}

/** Executa applyAssigned. */
function applyAssigned(
  state: AppState,
  event: Extract<DomainEvent, { type: 'ticket.assigned' }>,
  seenEventIds: string[],
): AppState {
  /** Valor valor. */
  const { ticketId, consultantId } = event.payload
  if (!state.tickets.some((ticket) => ticket.id === ticketId)) return { ...state, seenEventIds }
  /** Valor tickets. */
  const tickets = state.tickets.map((ticket) =>
    ticket.id === ticketId
      ? { ...ticket, assigneeId: consultantId, updatedAt: event.occurredAt }
      : ticket,
  )
  /** Valor assignments. */
  const assignments = state.assignments.map((assignment) =>
    assignment.ticketId === ticketId && assignment.endedAt === null
      ? { ...assignment, endedAt: event.occurredAt }
      : assignment,
  )
  /** Valor opened. */
  const opened: Assignment = {
    id: `${event.id}:assignment`,
    ticketId,
    consultantId,
    startedAt: event.occurredAt,
    endedAt: null,
  }
  return { ...state, seenEventIds, tickets, assignments: [...assignments, opened] }
}

/** Executa applyMessage. */
function applyMessage(
  state: AppState,
  message: Message,
  occurredAt: string,
  seenEventIds: string[],
): AppState {
  if (state.messages.some((item) => item.id === message.id)) return { ...state, seenEventIds }
  /** Valor tickets. */
  const tickets = state.tickets.map((ticket) =>
    ticket.id === message.ticketId ? { ...ticket, updatedAt: occurredAt } : ticket,
  )
  return { ...state, seenEventIds, tickets, messages: [...state.messages, message] }
}

/** Executa applyStatus. */
function applyStatus(
  state: AppState,
  event: Extract<DomainEvent, { type: 'status.changed' }>,
  seenEventIds: string[],
): AppState {
  /** Valor valor. */
  const { ticketId, from, to, reason, userId } = event.payload
  if (!state.tickets.some((ticket) => ticket.id === ticketId)) return { ...state, seenEventIds }
  /** Valor tickets. */
  const tickets = state.tickets.map((ticket) =>
    ticket.id === ticketId ? { ...ticket, status: to, updatedAt: event.occurredAt } : ticket,
  )
  /** Valor change. */
  const change: StatusChange = {
    id: `${event.id}:status`,
    ticketId,
    from,
    to,
    reason,
    userId,
    occurredAt: event.occurredAt,
  }
  return {
    ...state,
    seenEventIds,
    tickets,
    statusChanges: [...state.statusChanges, change],
  }
}
