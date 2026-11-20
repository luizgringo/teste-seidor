import type { AppState, Message, Ticket, User } from './types.ts'

/** Helena, the customer in Lisbon. */
export const helena: User = {
  id: 'user-helena',
  name: 'Helena Carvalho',
  email: 'helena@example.com',
  role: 'customer',
  groupId: null,
  timeZone: 'Europe/Lisbon',
}

/** Marina, the consultant who lives in the queue. */
export const marina: User = {
  id: 'user-marina',
  name: 'Marina Costa',
  email: 'marina@example.com',
  role: 'consultant',
  groupId: 'group-applications',
  timeZone: 'America/Sao_Paulo',
}

/** Ricardo, the manager of the twelve consultants. */
export const ricardo: User = {
  id: 'user-ricardo',
  name: 'Ricardo Alves',
  email: 'ricardo@example.com',
  role: 'manager',
  groupId: null,
  timeZone: 'America/Sao_Paulo',
}

/** A consultant outside Marina's group. */
export const diego: User = {
  id: 'user-diego',
  name: 'Diego Alves',
  email: 'diego@example.com',
  role: 'consultant',
  groupId: 'group-infrastructure',
  timeZone: 'America/Sao_Paulo',
}

/** Helena's open payroll ticket, assigned to nobody yet. */
export const payrollTicket: Ticket = {
  id: 'ticket-payroll',
  number: 'TCK-10420',
  title: 'Payroll export fails before the cutoff',
  description: 'The Friday payroll file stops halfway.',
  status: 'open',
  priority: 'high',
  groupId: 'group-applications',
  requesterId: helena.id,
  assigneeId: null,
  openedAt: '2026-11-20T08:00:00.000Z',
  dueAt: '2026-11-20T12:25:00.000Z',
  updatedAt: '2026-11-20T08:00:00.000Z',
}

/** A note the customer must never receive. */
export const internalNote: Message = {
  id: 'message-internal',
  ticketId: payrollTicket.id,
  authorId: marina.id,
  visibility: 'internal',
  body: 'Gateway maintenance at 22:00. Do not mention the window.',
  createdAt: '2026-11-20T09:00:00.000Z',
}

/** A tenant with the three personas and one open ticket. */
export function emptyState(): AppState {
  return {
    seedVersion: 'test',
    users: [helena, marina, ricardo, diego],
    groups: [
      { id: 'group-applications', name: 'Applications' },
      { id: 'group-infrastructure', name: 'Infrastructure' },
      { id: 'group-service-desk', name: 'Service Desk' },
    ],
    tickets: [payrollTicket],
    messages: [internalNote],
    statusChanges: [],
    assignments: [],
    seenEventIds: [],
  }
}

/** Fixed clock and ids for command tests. */
export function context(ids: string[]) {
  const queue = [...ids]
  return {
    now: '2026-11-20T12:00:00.000Z',
    createId: () => {
      const next = queue.shift()
      if (!next) throw new Error('test ran out of ids')
      return next
    },
  }
}
