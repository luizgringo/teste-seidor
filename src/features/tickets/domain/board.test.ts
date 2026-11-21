import { describe, expect, it } from 'vitest'
import { boardColumns } from './board.ts'
import type { WireTicket } from './types.ts'

function ticket(
  patch: Partial<WireTicket> & Pick<WireTicket, 'id' | 'status' | 'dueAt'>,
): WireTicket {
  return {
    number: patch.id,
    title: patch.id,
    description: '',
    statusLabel: '',
    requesterId: 'helena',
    assigneeId: null,
    openedAt: patch.dueAt,
    updatedAt: patch.dueAt,
    priority: null,
    groupId: null,
    ...patch,
  }
}

describe('boardColumns', () => {
  it('keeps every status and puts the sooner due date first', () => {
    const columns = boardColumns([
      ticket({ id: 'later', status: 'open', dueAt: '2026-11-21T12:00:00.000Z' }),
      ticket({ id: 'sooner', status: 'open', dueAt: '2026-11-20T12:00:00.000Z' }),
      ticket({ id: 'doing', status: 'in_progress', dueAt: '2026-11-20T15:00:00.000Z' }),
    ])
    expect(columns.map((column) => column.status)).toEqual([
      'open',
      'in_progress',
      'waiting_on_customer',
      'resolved',
      'closed',
    ])
    expect(columns[0]?.tickets.map((item) => item.id)).toEqual(['sooner', 'later'])
    expect(columns[1]?.tickets.map((item) => item.id)).toEqual(['doing'])
    expect(columns[2]?.tickets).toEqual([])
  })
})
