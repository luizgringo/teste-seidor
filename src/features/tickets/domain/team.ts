import { idleMinutes } from './idle.ts'
import { dueState } from './sla.ts'
import { isDone } from './status.ts'
import type { AppState, ConsultantLoad } from './types.ts'

/** Valor WEEK_MS. */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** Uma linha por consultor, os mais ocupados e em risco primeiro. */
export function teamLoad(state: AppState, nowMs: number): ConsultantLoad[] {
  /** Valor windowStart. */
  const windowStart = nowMs - WEEK_MS
  /** Valor rows. */
  const rows = state.users
    .filter((user) => user.role === 'consultant')
    .map((consultant) => {
      /** Valor assigned. */
      const assigned = state.tickets.filter(
        (ticket) => ticket.assigneeId === consultant.id && !isDone(ticket.status),
      )
      /** Valor atRiskCount. */
      const atRiskCount = assigned.filter(
        (ticket) => dueState(ticket.dueAt, nowMs).tone !== 'ok',
      ).length
      return {
        consultantId: consultant.id,
        name: consultant.name,
        openCount: assigned.length,
        atRiskCount,
        idleMinutes: idleMinutes(consultant.id, state.assignments, windowStart, nowMs),
      }
    })
  return rows.sort(
    (left, right) => right.atRiskCount - left.atRiskCount || right.openCount - left.openCount,
  )
}
