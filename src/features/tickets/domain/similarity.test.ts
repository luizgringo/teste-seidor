import { describe, expect, it } from 'vitest'
import { suggestReopen } from './similarity.ts'
import type { Ticket } from './types.ts'

function ticket(description: string): Ticket {
  return {
    id: 'ticket-closed',
    number: 'TCK-10001',
    title: 'A VPN de Lisboa falha',
    description,
    status: 'closed',
    priority: 'medium',
    groupId: 'group-1',
    requesterId: 'helena',
    assigneeId: null,
    openedAt: '2026-10-01T00:00:00.000Z',
    dueAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  }
}

describe('suggestReopen', () => {
  it('points at a closed ticket that shares the meaningful words', () => {
    const closed = ticket('A VPN de Lisboa falha quando a rede do escritório muda')
    const match = suggestReopen(
      'A VPN de Lisboa falha quando a rede do escritório muda outra vez',
      [closed],
    )
    expect(match?.id).toBe(closed.id)
  })

  it('stays quiet when the draft is a different problem', () => {
    const closed = ticket('A impressora de crachás do terceiro andar trava toda manhã')
    expect(suggestReopen('A exportação da folha falha antes do fechamento', [closed])).toBeNull()
  })
})
