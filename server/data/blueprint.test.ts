import { describe, expect, it } from 'vitest'
import { presentWorkspace } from '../../src/features/tickets/domain/present.ts'
import { teamLoad } from '../../src/features/tickets/domain/team.ts'
import {
  buildState,
  GROUP,
  HELENA_OPEN_TITLE,
  PAYROLL_TITLE,
  PERSONA,
  PRINTER_TITLE,
} from './blueprint.ts'

describe('buildState', () => {
  const now = Date.parse('2026-11-20T15:00:00.000Z')
  const state = buildState(now, 'test')

  it('gives Marina about forty assigned tickets and an unassigned printer', () => {
    const marinaTickets = state.tickets.filter((ticket) => ticket.assigneeId === PERSONA.marina)
    expect(marinaTickets.length).toBeGreaterThanOrEqual(40)
    const printer = state.tickets.find((ticket) => ticket.title === PRINTER_TITLE)
    expect(printer?.assigneeId).toBeNull()
    expect(printer?.groupId).toBe(GROUP.applications)
    const payroll = state.tickets.find((ticket) => ticket.title === PAYROLL_TITLE)
    expect(payroll?.assigneeId).toBe(PERSONA.marina)
    expect(Date.parse(payroll?.dueAt ?? '') - now).toBe(25 * 60_000)
  })

  it('keeps the internal Lisbon note out of Helena’s workspace', () => {
    const workspace = presentWorkspace(state, PERSONA.helena)
    const open = workspace?.tickets.find((ticket) => ticket.title === HELENA_OPEN_TITLE)
    expect(open?.priority).toBeNull()
    expect(open?.groupId).toBeNull()
    expect(workspace?.messages.some((message) => message.visibility === 'internal')).toBe(false)
    expect(
      state.messages.some(
        (message) =>
          message.visibility === 'internal' && message.body.includes('janela de manutenção'),
      ),
    ).toBe(true)
  })

  it('shows Paulo with more idle time than Marina', () => {
    const load = teamLoad(state, now)
    const paulo = load.find((row) => row.consultantId === PERSONA.paulo)
    const marina = load.find((row) => row.consultantId === PERSONA.marina)
    expect(paulo?.openCount).toBe(0)
    expect((paulo?.idleMinutes ?? 0) > (marina?.idleMinutes ?? 0)).toBe(true)
  })
})
