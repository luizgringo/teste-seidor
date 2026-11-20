import { canAccess, capabilitiesFor } from './access.ts'
import { applyEvent } from './events.ts'
import { SLA_MINUTES } from './sla.ts'
import { canMoveStatus } from './status.ts'
import type { AppState, DomainEvent, Priority, Ticket, User } from './types.ts'

/** Clock and id factory supplied by the server so tests stay deterministic. */
export type CommandContext = {
  now: string
  createId: () => string
}

export type CommandResult =
  | { ok: true; state: AppState; events: DomainEvent[] }
  | { ok: false; status: 400 | 403 | 404; message: string }

/** Opens a ticket. Customers do not choose priority, group, or category. */
export function openTicket(
  state: AppState,
  actor: User,
  input: { title: string; description: string },
  context: CommandContext,
): CommandResult {
  const title = input.title.trim()
  const description = input.description.trim()
  if (title.length < 3 || description.length < 3) {
    return fail(400, 'Title and description need at least 3 characters.')
  }
  const groupId = actor.groupId ?? defaultGroupId(state)
  if (!groupId) return fail(400, 'No support group is available.')
  const priority: Priority = 'medium'
  const ticket: Ticket = {
    id: context.createId(),
    number: nextNumber(state),
    title,
    description,
    status: 'open',
    priority,
    groupId,
    requesterId: actor.id,
    assigneeId: null,
    openedAt: context.now,
    dueAt: new Date(Date.parse(context.now) + SLA_MINUTES[priority] * 60_000).toISOString(),
    updatedAt: context.now,
  }
  const event: DomainEvent = {
    id: context.createId(),
    type: 'ticket.opened',
    occurredAt: context.now,
    payload: ticket,
  }
  return ok(applyEvent(state, event), [event])
}

/** Adds a public reply or an internal note. */
export function addMessage(
  state: AppState,
  actor: User,
  ticketId: string,
  input: { body: string; visibility: 'public' | 'internal' },
  context: CommandContext,
): CommandResult {
  const ticket = state.tickets.find((item) => item.id === ticketId)
  if (!ticket) return fail(404, 'Ticket not found.')
  if (!canAccess(actor, ticket)) return fail(403, 'You cannot write on this ticket.')
  const capabilities = capabilitiesFor(actor, ticket)
  if (input.visibility === 'internal' && !capabilities.canCreateInternalNote) {
    return fail(403, 'Internal notes stay with the support team.')
  }
  if (input.visibility === 'public' && !capabilities.canReply) {
    return fail(403, 'This ticket is not open for replies.')
  }
  const body = input.body.trim()
  if (body.length < 1) return fail(400, 'Write a message before sending.')
  const event: DomainEvent = {
    id: context.createId(),
    type: 'message.added',
    occurredAt: context.now,
    payload: {
      id: context.createId(),
      ticketId,
      authorId: actor.id,
      visibility: input.visibility,
      body,
      createdAt: context.now,
    },
  }
  return ok(applyEvent(state, event), [event])
}

/** Moves a ticket and keeps the reason on the timeline. */
export function changeStatus(
  state: AppState,
  actor: User,
  ticketId: string,
  input: { to: Ticket['status']; reason: string },
  context: CommandContext,
): CommandResult {
  const ticket = state.tickets.find((item) => item.id === ticketId)
  if (!ticket) return fail(404, 'Ticket not found.')
  if (!canAccess(actor, ticket)) return fail(403, 'You cannot change this ticket.')
  if (!canMoveStatus(ticket.status, input.to, actor.role)) {
    return fail(403, 'That status change is not available.')
  }
  const reason = input.reason.trim()
  if (reason.length < 3) return fail(400, 'A reason needs at least 3 characters.')
  const event: DomainEvent = {
    id: context.createId(),
    type: 'status.changed',
    occurredAt: context.now,
    payload: {
      ticketId,
      from: ticket.status,
      to: input.to,
      reason,
      userId: actor.id,
    },
  }
  return ok(applyEvent(state, event), [event])
}

/** Claims an unassigned ticket in the consultant's group. */
export function takeTicket(
  state: AppState,
  actor: User,
  ticketId: string,
  context: CommandContext,
): CommandResult {
  const ticket = state.tickets.find((item) => item.id === ticketId)
  if (!ticket) return fail(404, 'Ticket not found.')
  if (!capabilitiesFor(actor, ticket).canTake) return fail(403, 'You cannot take this ticket.')
  return assignTo(state, actor, ticket, actor.id, 'Ticket taken', context)
}

/** Moves a ticket to another consultant. Managers only. */
export function assignTicket(
  state: AppState,
  actor: User,
  ticketId: string,
  consultantId: string,
  context: CommandContext,
): CommandResult {
  const ticket = state.tickets.find((item) => item.id === ticketId)
  if (!ticket) return fail(404, 'Ticket not found.')
  if (!capabilitiesFor(actor, ticket).canReassign) {
    return fail(403, 'Only a manager can reassign a ticket.')
  }
  const consultant = state.users.find((user) => user.id === consultantId)
  if (consultant?.role !== 'consultant') {
    return fail(400, 'Choose a consultant.')
  }
  if (ticket.assigneeId === consultantId) return ok(state, [])
  return assignTo(state, actor, ticket, consultantId, 'Ticket reassigned', context)
}

function assignTo(
  state: AppState,
  actor: User,
  ticket: Ticket,
  consultantId: string,
  reason: string,
  context: CommandContext,
): CommandResult {
  const assigned: DomainEvent = {
    id: context.createId(),
    type: 'ticket.assigned',
    occurredAt: context.now,
    payload: { ticketId: ticket.id, consultantId },
  }
  let next = applyEvent(state, assigned)
  const events: DomainEvent[] = [assigned]
  if (ticket.status === 'open') {
    const changed: DomainEvent = {
      id: context.createId(),
      type: 'status.changed',
      occurredAt: context.now,
      payload: {
        ticketId: ticket.id,
        from: 'open',
        to: 'in_progress',
        reason,
        userId: actor.id,
      },
    }
    next = applyEvent(next, changed)
    events.push(changed)
  }
  return ok(next, events)
}

function nextNumber(state: AppState): string {
  const highest = state.tickets.reduce((max, ticket) => {
    const value = Number(ticket.number.replace('TCK-', ''))
    return Number.isFinite(value) ? Math.max(max, value) : max
  }, 10000)
  return `TCK-${highest + 1}`
}

function defaultGroupId(state: AppState): string | null {
  const serviceDesk = state.groups.find((group) => group.name === 'Service Desk')
  return serviceDesk?.id ?? state.groups[0]?.id ?? null
}

function ok(state: AppState, events: DomainEvent[]): CommandResult {
  return { ok: true, state, events }
}

function fail(status: 400 | 403 | 404, message: string): CommandResult {
  return { ok: false, status, message }
}
