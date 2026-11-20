/** Roles that share one ITSM tenant. */
export const ROLES = ['customer', 'consultant', 'manager'] as const

/** A person's relationship to the support desk. */
export type Role = (typeof ROLES)[number]

/** Ticket lifecycle values stored on the wire. */
export const TICKET_STATUSES = [
  'open',
  'in_progress',
  'waiting_on_customer',
  'resolved',
  'closed',
] as const

/** Where a ticket sits in its lifecycle. */
export type TicketStatus = (typeof TICKET_STATUSES)[number]

/** Internal urgency. Customers never receive this value. */
export const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const

/** Internal urgency used to compute the due instant. */
export type Priority = (typeof PRIORITIES)[number]

/** Who is allowed to read a message. */
export const MESSAGE_VISIBILITIES = ['public', 'internal'] as const

/** Public replies are visible to the requester. Internal notes are not. */
export type MessageVisibility = (typeof MESSAGE_VISIBILITIES)[number]

/** A person who can sign in as a persona. */
export type User = {
  id: string
  name: string
  email: string
  role: Role
  groupId: string | null
  timeZone: string
}

/** A support queue that owns tickets. */
export type Group = {
  id: string
  name: string
}

/** A support request, including fields hidden from customers. */
export type Ticket = {
  id: string
  number: string
  title: string
  description: string
  status: TicketStatus
  priority: Priority
  groupId: string
  requesterId: string
  assigneeId: string | null
  openedAt: string
  dueAt: string
  updatedAt: string
}

/** One entry in a ticket conversation. */
export type Message = {
  id: string
  ticketId: string
  authorId: string
  visibility: MessageVisibility
  body: string
  createdAt: string
}

/** A recorded status transition. */
export type StatusChange = {
  id: string
  ticketId: string
  from: TicketStatus
  to: TicketStatus
  reason: string
  userId: string
  occurredAt: string
}

/** A span during which a person owned a ticket. */
export type Assignment = {
  id: string
  ticketId: string
  consultantId: string
  startedAt: string
  endedAt: string | null
}

/** Ticket fields safe to render for the current viewer. */
export type WireTicket = {
  id: string
  number: string
  title: string
  description: string
  status: TicketStatus
  statusLabel: string
  requesterId: string
  assigneeId: string | null
  openedAt: string
  dueAt: string
  updatedAt: string
  priority: Priority | null
  groupId: string | null
}

/** A ticket was created. */
export type TicketOpenedEvent = {
  id: string
  type: 'ticket.opened'
  occurredAt: string
  payload: Ticket
}

/** A ticket gained or changed owner. */
export type TicketAssignedEvent = {
  id: string
  type: 'ticket.assigned'
  occurredAt: string
  payload: {
    ticketId: string
    consultantId: string
  }
}

/** A message was added to a ticket. */
export type MessageAddedEvent = {
  id: string
  type: 'message.added'
  occurredAt: string
  payload: Message
}

/** A ticket moved from one status to another. */
export type StatusChangedEvent = {
  id: string
  type: 'status.changed'
  occurredAt: string
  payload: {
    ticketId: string
    from: TicketStatus
    to: TicketStatus
    reason: string
    userId: string
  }
}

/** A domain fact stored by the server. The same id may be delivered twice. */
export type DomainEvent =
  | TicketOpenedEvent
  | TicketAssignedEvent
  | MessageAddedEvent
  | StatusChangedEvent

/** Ticket-opened event after hidden fields are removed for the viewer. */
export type ClientTicketOpenedEvent = {
  id: string
  type: 'ticket.opened'
  occurredAt: string
  payload: WireTicket
}

/** A domain fact after it has been filtered for one viewer. */
export type ClientEvent =
  | ClientTicketOpenedEvent
  | TicketAssignedEvent
  | MessageAddedEvent
  | StatusChangedEvent

/** The in-memory or Redis snapshot of one tenant. */
export type AppState = {
  seedVersion: string
  users: User[]
  groups: Group[]
  tickets: Ticket[]
  messages: Message[]
  statusChanges: StatusChange[]
  assignments: Assignment[]
  seenEventIds: string[]
}

/** What the signed-in person is allowed to do with one ticket. */
export type Capabilities = {
  canOpenTicket: boolean
  canViewTeam: boolean
  canViewTaxonomy: boolean
  canViewInternalNote: boolean
  canReply: boolean
  canCreateInternalNote: boolean
  canTake: boolean
  canReassign: boolean
  canChangeStatus: boolean
  canReopen: boolean
}

/** Screen data already filtered for one viewer. */
export type Workspace = {
  viewer: User
  users: User[]
  groups: Group[]
  tickets: WireTicket[]
  messages: Message[]
  statusChanges: StatusChange[]
  seenEventIds: string[]
}

/** Workload of one consultant for the manager's board. */
export type ConsultantLoad = {
  consultantId: string
  name: string
  openCount: number
  atRiskCount: number
  idleMinutes: number
}
