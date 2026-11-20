import { statusLabel } from './labels.ts'
import type { ClientEvent, StatusChange, Workspace } from './types.ts'

/**
 * Folds a viewer-specific event into the screen snapshot.
 * A repeated event id does not add a second message or status row.
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
