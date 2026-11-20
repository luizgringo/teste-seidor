/** Papéis que compartilham um tenant de ITSM. */
export const ROLES = ['customer', 'consultant', 'manager'] as const

/** Relação da pessoa com a mesa de suporte. */
export type Role = (typeof ROLES)[number]

/** Valores do ciclo do chamado no contrato. */
export const TICKET_STATUSES = [
  'open',
  'in_progress',
  'waiting_on_customer',
  'resolved',
  'closed',
] as const

/** Onde o chamado está no ciclo de vida. */
export type TicketStatus = (typeof TICKET_STATUSES)[number]

/** Urgência interna. O cliente nunca recebe este valor. */
export const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const

/** Urgência interna usada para calcular o vencimento. */
export type Priority = (typeof PRIORITIES)[number]

/** Who is allowed to read a message. */
export const MESSAGE_VISIBILITIES = ['public', 'internal'] as const

/** A resposta pública aparece para quem abriu. A nota interna não. */
export type MessageVisibility = (typeof MESSAGE_VISIBILITIES)[number]

/** Pessoa que pode entrar como uma persona. */
export type User = {
  id: string
  name: string
  email: string
  role: Role
  groupId: string | null
  timeZone: string
}

/** Fila de atendimento que possui os chamados. */
export type Group = {
  id: string
  name: string
}

/** Pedido de suporte, inclusive os campos ocultos do cliente. */
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

/** Transição de status registrada. */
export type StatusChange = {
  id: string
  ticketId: string
  from: TicketStatus
  to: TicketStatus
  reason: string
  userId: string
  occurredAt: string
}

/** Intervalo em que uma pessoa foi responsável pelo chamado. */
export type Assignment = {
  id: string
  ticketId: string
  consultantId: string
  startedAt: string
  endedAt: string | null
}

/** Campos do chamado seguros para desenhar para quem está olhando. */
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

/** Um chamado foi criado. */
export type TicketOpenedEvent = {
  id: string
  type: 'ticket.opened'
  occurredAt: string
  payload: Ticket
}

/** Um chamado ganhou ou trocou de responsável. */
export type TicketAssignedEvent = {
  id: string
  type: 'ticket.assigned'
  occurredAt: string
  payload: {
    ticketId: string
    consultantId: string
  }
}

/** Uma mensagem foi adicionada a um chamado. */
export type MessageAddedEvent = {
  id: string
  type: 'message.added'
  occurredAt: string
  payload: Message
}

/** Um chamado passou de um status para outro. */
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

/** Fato do domínio guardado pelo servidor. O mesmo id pode chegar duas vezes. */
export type DomainEvent =
  | TicketOpenedEvent
  | TicketAssignedEvent
  | MessageAddedEvent
  | StatusChangedEvent

/** Evento de abertura depois que os campos ocultos saem para quem olha. */
export type ClientTicketOpenedEvent = {
  id: string
  type: 'ticket.opened'
  occurredAt: string
  payload: WireTicket
}

/** Fato do domínio depois de filtrado para uma pessoa. */
export type ClientEvent =
  | ClientTicketOpenedEvent
  | TicketAssignedEvent
  | MessageAddedEvent
  | StatusChangedEvent

/** Retrato em memória ou no Redis de um tenant. */
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

/** O que a pessoa autenticada pode fazer com um chamado. */
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

/** Dados da tela já filtrados para quem olha. */
export type Workspace = {
  viewer: User
  users: User[]
  groups: Group[]
  tickets: WireTicket[]
  messages: Message[]
  statusChanges: StatusChange[]
  seenEventIds: string[]
}

/** Carga de um consultor no quadro do gestor. */
export type ConsultantLoad = {
  consultantId: string
  name: string
  openCount: number
  atRiskCount: number
  idleMinutes: number
}
