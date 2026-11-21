import { statusLabel } from './labels.ts'
import type { ClientEvent, StatusChange, Workspace } from './types.ts'

/**
 * Aplica um evento já filtrado no retrato da tela.
 * O mesmo id de evento não cria outra mensagem nem outra linha de status.
 */
export function reduceWorkspace(workspace: Workspace, event: ClientEvent): Workspace {
  if (workspace.seenEventIds.includes(event.id)) return workspace
  /** Valor seenEventIds. */
  const seenEventIds = [...workspace.seenEventIds, event.id].slice(-500)
  switch (event.type) {
    case 'ticket.opened':
      if (workspace.tickets.some((ticket) => ticket.id === event.payload.id)) {
        return { ...workspace, seenEventIds }
      }
      return { ...workspace, seenEventIds, tickets: [...workspace.tickets, event.payload] }
    case 'ticket.assigned':
      return {
        ...workspace,
        seenEventIds,
        tickets: workspace.tickets.map((ticket) =>
          ticket.id === event.payload.ticketId
            ? { ...ticket, assigneeId: event.payload.consultantId, updatedAt: event.occurredAt }
            : ticket,
        ),
      }
    case 'message.added':
      if (workspace.messages.some((message) => message.id === event.payload.id)) {
        return { ...workspace, seenEventIds }
      }
      return {
        ...workspace,
        seenEventIds,
        messages: [...workspace.messages, event.payload],
        tickets: workspace.tickets.map((ticket) =>
          ticket.id === event.payload.ticketId
            ? { ...ticket, updatedAt: event.occurredAt }
            : ticket,
        ),
      }
    case 'message.edited':
      return {
        ...workspace,
        seenEventIds,
        messages: workspace.messages.map((message) =>
          message.id === event.payload.id ? event.payload : message,
        ),
      }
    case 'message.removed':
      return {
        ...workspace,
        seenEventIds,
        messages: workspace.messages.filter((message) => message.id !== event.payload.messageId),
      }
    case 'status.changed': {
      /** Valor change. */
      const change: StatusChange = {
        id: `${event.id}:status`,
        ticketId: event.payload.ticketId,
        from: event.payload.from,
        to: event.payload.to,
        reason: event.payload.reason,
        userId: event.payload.userId,
        occurredAt: event.occurredAt,
      }
      return {
        ...workspace,
        seenEventIds,
        statusChanges: [...workspace.statusChanges, change],
        tickets: workspace.tickets.map((ticket) =>
          ticket.id === event.payload.ticketId
            ? {
                ...ticket,
                status: event.payload.to,
                statusLabel: statusLabel(event.payload.to),
                updatedAt: event.occurredAt,
              }
            : ticket,
        ),
      }
    }
    default: {
      /** Valor neverEvent. */
      const neverEvent: never = event
      return neverEvent
    }
  }
}
