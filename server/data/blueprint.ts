import { PERSONA } from '../../src/features/auth/personas.ts'
import type {
  AppState,
  Assignment,
  Group,
  Message,
  Priority,
  Ticket,
  TicketStatus,
  User,
} from '../../src/features/tickets/domain/types.ts'

export { PERSONA }

/** Support groups in the mock tenant. */
export const GROUP = {
  applications: '22222222-2222-4222-8222-000000000001',
  infrastructure: '22222222-2222-4222-8222-000000000002',
  serviceDesk: '22222222-2222-4222-8222-000000000003',
} as const

/** Ticket the queue test looks for because it is about to breach. */
export const PAYROLL_TITLE = 'Payroll export fails before the cutoff'

/** Unassigned ticket Marina can take. */
export const PRINTER_TITLE = 'Printer on floor 3 is offline'

/** Helena's open request. */
export const HELENA_OPEN_TITLE = 'VPN from Lisbon fails'

/** Closed request that should be suggested when Helena describes the same problem. */
export const HELENA_CLOSED_TITLE = 'VPN from Lisbon fails when the office network changes'

/** Valor SYSTEMS. */
const SYSTEMS = ['VPN', 'Email', 'ERP', 'Payroll', 'Printer', 'Badge', 'Laptop', 'SSO', 'Scanner']
/** Valor PROBLEMS. */
const PROBLEMS = [
  'times out after login',
  'shows the wrong total',
  'stops halfway through',
  'asks for a password twice',
  'drops the connection',
]

/**
 * Builds the tenant relative to a clock so due dates stay meaningful after a restart.
 * The original dados.json link had expired, so this snapshot is reconstructed from the brief.
 */
export function buildState(nowMs: number, seedVersion: string): AppState {
  /** Valor at. */
  const at = (minutesFromNow: number) => new Date(nowMs + minutesFromNow * 60_000).toISOString()
  /** Valor users. */
  const users = buildUsers()
  /** Valor groups. */
  const groups: Group[] = [
    { id: GROUP.applications, name: 'Applications' },
    { id: GROUP.infrastructure, name: 'Infrastructure' },
    { id: GROUP.serviceDesk, name: 'Service Desk' },
  ]
  /** Valor tickets. */
  const tickets: Ticket[] = []
  /** Valor messages. */
  const messages: Message[] = []
  /** Valor assignments. */
  const assignments: Assignment[] = []
  /** Valor statusChanges. */
  const statusChanges: AppState['statusChanges'] = []

  /** Valor push. */
  const push = (ticket: Ticket, note?: string) => {
    tickets.push(ticket)
    if (ticket.assigneeId) {
      assignments.push({
        id: `${ticket.id}:current`,
        ticketId: ticket.id,
        consultantId: ticket.assigneeId,
        startedAt: ticket.openedAt,
        endedAt: null,
      })
    }
    if (ticket.status !== 'open') {
      statusChanges.push({
        id: `${ticket.id}:status`,
        ticketId: ticket.id,
        from: 'open',
        to: ticket.status,
        reason: ticket.status === 'closed' ? 'Work completed.' : 'Ticket taken',
        userId: ticket.assigneeId ?? PERSONA.ricardo,
        occurredAt: ticket.updatedAt,
      })
    }
    messages.push({
      id: `${ticket.id}:public`,
      ticketId: ticket.id,
      authorId: ticket.requesterId,
      visibility: 'public',
      body: 'This started during the morning and it is still happening.',
      createdAt: ticket.openedAt,
    })
    if (note && ticket.assigneeId) {
      messages.push({
        id: `${ticket.id}:internal`,
        ticketId: ticket.id,
        authorId: ticket.assigneeId,
        visibility: 'internal',
        body: note,
        createdAt: ticket.updatedAt,
      })
    }
  }

  push(
    ticket({
      id: '33333333-3333-4333-8333-000000000010',
      number: 'TCK-10420',
      title: PAYROLL_TITLE,
      description: 'The Friday payroll file stops halfway through the export.',
      status: 'in_progress',
      priority: 'high',
      groupId: GROUP.applications,
      requesterId: '11111111-1111-4111-8111-000000000011',
      assigneeId: PERSONA.marina,
      openedAt: at(-180),
      dueAt: at(25),
      updatedAt: at(-20),
    }),
    'Export job retries twice and then dies. Do not promise a time yet.',
  )

  push(
    ticket({
      id: '33333333-3333-4333-8333-000000000011',
      number: 'TCK-10421',
      title: PRINTER_TITLE,
      description: 'The floor 3 printer accepts the job and prints nothing.',
      status: 'open',
      priority: 'medium',
      groupId: GROUP.applications,
      requesterId: '11111111-1111-4111-8111-000000000012',
      assigneeId: null,
      openedAt: at(-50),
      dueAt: at(180),
      updatedAt: at(-50),
    }),
  )

  push(
    ticket({
      id: '33333333-3333-4333-8333-000000000012',
      number: 'TCK-10422',
      title: HELENA_OPEN_TITLE,
      description: 'VPN from Lisbon fails after the laptop wakes up.',
      status: 'in_progress',
      priority: 'high',
      groupId: GROUP.applications,
      requesterId: PERSONA.helena,
      assigneeId: PERSONA.marina,
      openedAt: at(-90),
      dueAt: at(300),
      updatedAt: at(-15),
    }),
    'Lisbon gateway is flapping. Do not mention the maintenance window.',
  )

  push(
    ticket({
      id: '33333333-3333-4333-8333-000000000013',
      number: 'TCK-10310',
      title: HELENA_CLOSED_TITLE,
      description: 'VPN from Lisbon fails when the office network changes.',
      status: 'closed',
      priority: 'medium',
      groupId: GROUP.applications,
      requesterId: PERSONA.helena,
      assigneeId: PERSONA.marina,
      openedAt: at(-20_000),
      dueAt: at(-18_000),
      updatedAt: at(-17_000),
    }),
  )
  /** Valor closedAssignment. */
  const closedAssignment = assignments.find((item) => item.ticketId.endsWith('013'))
  if (closedAssignment) closedAssignment.endedAt = at(-17_000)

  /** Valor consultants. */
  const consultants = users.filter(
    (user) => user.role === 'consultant' && user.id !== PERSONA.paulo,
  )
  for (let index = 0; index < 110; index += 1) {
    /** Valor marinaSlot. */
    const marinaSlot = index < 38
    /** Valor unassigned. */
    const unassigned = index >= 38 && index < 50
    /** Valor consultant. */
    const consultant = consultants[index % consultants.length]
    /** Valor assigneeId. */
    const assigneeId = marinaSlot ? PERSONA.marina : unassigned ? null : (consultant?.id ?? null)
    /** Valor groupId. */
    const groupId =
      marinaSlot || unassigned ? GROUP.applications : (consultant?.groupId ?? GROUP.serviceDesk)
    /** Valor dueAt. */
    const dueAt =
      marinaSlot && index < 3
        ? at(-40 + index * 10)
        : marinaSlot && index < 8
          ? at(15 + index * 8)
          : at(240 + (index % 12) * 90)
    /** Valor status. */
    const status = statusFor(index, assigneeId)
    /** Valor requester. */
    const requester = users.filter((user) => user.role === 'customer')[index % 6]
    push(
      ticket({
        id: `33333333-3333-4333-8333-${String(100 + index).padStart(12, '0')}`,
        number: `TCK-${10500 + index}`,
        title: `${SYSTEMS[index % SYSTEMS.length]} ${PROBLEMS[index % PROBLEMS.length]}`,
        description: `Reported by the team. Case ${index + 1} keeps failing in the same step.`,
        status,
        priority: priorityFor(index),
        groupId: groupId ?? GROUP.serviceDesk,
        requesterId: requester?.id ?? PERSONA.helena,
        assigneeId,
        openedAt: at(-60 - index * 30),
        dueAt,
        updatedAt: at(-30 - index),
      }),
      index % 4 === 0 ? 'Internal check done. Waiting on the vendor log.' : undefined,
    )
  }

  assignments.push({
    id: 'assignment-marina-history',
    ticketId: '33333333-3333-4333-8333-000000000013',
    consultantId: PERSONA.marina,
    startedAt: at(-6 * 24 * 60),
    endedAt: at(-60),
  })
  assignments.push({
    id: 'assignment-paulo-history',
    ticketId: '33333333-3333-4333-8333-000000000099',
    consultantId: PERSONA.paulo,
    startedAt: at(-6 * 24 * 60),
    endedAt: at(-4 * 24 * 60),
  })

  return {
    seedVersion,
    users,
    groups,
    tickets,
    messages,
    statusChanges,
    assignments,
    seenEventIds: [],
  }
}

/** Executa buildUsers. */
function buildUsers(): User[] {
  /** Valor consultant. */
  const consultant = (id: string, name: string, groupId: string): User => ({
    id,
    name,
    email: `${name.split(' ')[0]?.toLowerCase() ?? 'user'}@northline.example`,
    role: 'consultant',
    groupId,
    timeZone: 'America/Sao_Paulo',
  })
  /** Valor customer. */
  const customer = (id: string, name: string, timeZone: string): User => ({
    id,
    name,
    email: `${name.split(' ')[0]?.toLowerCase() ?? 'user'}@client.example`,
    role: 'customer',
    groupId: null,
    timeZone,
  })
  return [
    customer(PERSONA.helena, 'Helena Carvalho', 'Europe/Lisbon'),
    customer('11111111-1111-4111-8111-000000000011', 'Tiago Sousa', 'America/Sao_Paulo'),
    customer('11111111-1111-4111-8111-000000000012', 'Rita Fonseca', 'America/Sao_Paulo'),
    customer('11111111-1111-4111-8111-000000000013', 'Miguel Andrade', 'Europe/Lisbon'),
    customer('11111111-1111-4111-8111-000000000014', 'Sara Melo', 'America/Sao_Paulo'),
    customer('11111111-1111-4111-8111-000000000015', 'Pedro Lima', 'America/Sao_Paulo'),
    {
      id: PERSONA.ricardo,
      name: 'Ricardo Alves',
      email: 'ricardo@northline.example',
      role: 'manager',
      groupId: null,
      timeZone: 'America/Sao_Paulo',
    },
    consultant(PERSONA.marina, 'Marina Costa', GROUP.applications),
    consultant(PERSONA.paulo, 'Paulo Neri', GROUP.applications),
    consultant('11111111-1111-4111-8111-000000000021', 'Ana Duarte', GROUP.applications),
    consultant('11111111-1111-4111-8111-000000000022', 'Bruno Lima', GROUP.applications),
    consultant('11111111-1111-4111-8111-000000000023', 'Carla Mendes', GROUP.infrastructure),
    consultant('11111111-1111-4111-8111-000000000024', 'Diego Alves', GROUP.infrastructure),
    consultant('11111111-1111-4111-8111-000000000025', 'Eva Pinto', GROUP.infrastructure),
    consultant('11111111-1111-4111-8111-000000000026', 'Fabio Rocha', GROUP.infrastructure),
    consultant('11111111-1111-4111-8111-000000000027', 'Gisela Martins', GROUP.serviceDesk),
    consultant('11111111-1111-4111-8111-000000000028', 'Hugo Teixeira', GROUP.serviceDesk),
    consultant('11111111-1111-4111-8111-000000000029', 'Ines Barbosa', GROUP.serviceDesk),
    consultant('11111111-1111-4111-8111-000000000030', 'Joao Pires', GROUP.serviceDesk),
  ]
}

/** Executa ticket. */
function ticket(value: Ticket): Ticket {
  return value
}

/** Executa statusFor. */
function statusFor(index: number, assigneeId: string | null): TicketStatus {
  if (index % 17 === 0) return 'closed'
  if (index % 13 === 0) return 'resolved'
  if (index % 9 === 0) return 'waiting_on_customer'
  return assigneeId ? 'in_progress' : 'open'
}

/** Executa priorityFor. */
function priorityFor(index: number): Priority {
  if (index % 11 === 0) return 'critical'
  if (index % 3 === 0) return 'high'
  if (index % 2 === 0) return 'low'
  return 'medium'
}
