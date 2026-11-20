import type { AppState, Message, Ticket, User } from './types.ts'

/** Helena, a cliente em Lisboa. */
export const helena: User = {
  id: 'user-helena',
  name: 'Helena Carvalho',
  email: 'helena@example.com',
  role: 'customer',
  groupId: null,
  timeZone: 'Europe/Lisbon',
}

/** Marina, a consultora que vive na fila. */
export const marina: User = {
  id: 'user-marina',
  name: 'Marina Costa',
  email: 'marina@example.com',
  role: 'consultant',
  groupId: 'group-applications',
  timeZone: 'America/Sao_Paulo',
}

/** Ricardo, o gestor dos doze consultores. */
export const ricardo: User = {
  id: 'user-ricardo',
  name: 'Ricardo Alves',
  email: 'ricardo@example.com',
  role: 'manager',
  groupId: null,
  timeZone: 'America/Sao_Paulo',
}

/** Um consultor fora do grupo da Marina. */
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

/** Uma nota que o cliente nunca pode receber. */
export const internalNote: Message = {
  id: 'message-internal',
  ticketId: payrollTicket.id,
  authorId: marina.id,
  visibility: 'internal',
  body: 'Gateway maintenance at 22:00. Do not mention the window.',
  createdAt: '2026-11-20T09:00:00.000Z',
}

/** Um tenant com as três personas e um chamado aberto. */
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

/** Relógio e ids fixos para os testes de comando. */
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
