import { compareByDue, dueState } from './sla.ts'
import { isDone } from './status.ts'
import type { User, WireTicket } from './types.ts'

/** Tipo QueueSection. */
export type QueueSection = {
  id: string
  title: string
  tickets: WireTicket[]
}

/**
 * Splits the working list the way each role scans it.
 * Consultants see risk first, then unassigned work in their group, then the rest of their own tickets.
 */
export function queueSections(
  tickets: WireTicket[],
  viewer: User,
  nowMs: number,
  showDone: boolean,
): QueueSection[] {
  /** Valor visible. */
  const visible = (showDone ? tickets : tickets.filter((ticket) => !isDone(ticket.status))).slice()
  visible.sort(compareByDue)
  if (viewer.role !== 'consultant') return [{ id: 'queue', title: 'Queue', tickets: visible }]
  /** Valor atRisk. */
  const atRisk = visible.filter(
    (ticket) => ticket.assigneeId === viewer.id && dueState(ticket.dueAt, nowMs).tone !== 'ok',
  )
  /** Valor riskIds. */
  const riskIds = new Set(atRisk.map((ticket) => ticket.id))
  /** Valor unassigned. */
  const unassigned = visible.filter(
    (ticket) => ticket.assigneeId === null && ticket.groupId === viewer.groupId,
  )
  /** Valor mine. */
  const mine = visible.filter(
    (ticket) => ticket.assigneeId === viewer.id && !riskIds.has(ticket.id),
  )
  return [
    { id: 'risk', title: 'About to breach', tickets: atRisk },
    { id: 'free', title: 'Unassigned in your group', tickets: unassigned },
    { id: 'mine', title: 'Yours', tickets: mine },
  ].filter((section) => section.tickets.length > 0)
}
