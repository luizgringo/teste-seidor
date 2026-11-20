import { describe, expect, it } from 'vitest'
import { idleMinutes } from './idle.ts'
import type { Assignment } from './types.ts'

const start = Date.parse('2026-11-13T00:00:00.000Z')
const end = Date.parse('2026-11-20T00:00:00.000Z')

function assignment(partial: Partial<Assignment>): Assignment {
  return {
    id: 'assignment-1',
    ticketId: 'ticket-1',
    consultantId: 'consultant-1',
    startedAt: new Date(start).toISOString(),
    endedAt: null,
    ...partial,
  }
}

describe('idleMinutes', () => {
  it('counts the whole window when nobody assigned work', () => {
    expect(idleMinutes('consultant-1', [], start, end)).toBe(7 * 24 * 60)
  })

  it('returns zero when one assignment covers the window', () => {
    const covered = assignment({ endedAt: new Date(end).toISOString() })
    expect(idleMinutes('consultant-1', [covered], start, end)).toBe(0)
  })

  it('counts the gap after the last assignment ends', () => {
    const ended = assignment({
      startedAt: new Date(start).toISOString(),
      endedAt: new Date(start + 3 * 24 * 60 * 60_000).toISOString(),
    })
    expect(idleMinutes('consultant-1', [ended], start, end)).toBe(4 * 24 * 60)
  })

  it('does not double-count overlapping assignments', () => {
    const first = assignment({ endedAt: new Date(start + 2 * 24 * 60 * 60_000).toISOString() })
    const second = assignment({
      id: 'assignment-2',
      startedAt: new Date(start + 24 * 60 * 60_000).toISOString(),
      endedAt: new Date(start + 2 * 24 * 60 * 60_000).toISOString(),
    })
    expect(idleMinutes('consultant-1', [first, second], start, end)).toBe(5 * 24 * 60)
  })
})
