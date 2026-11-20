import { describe, expect, it } from 'vitest'
import { suggestReopen } from './similarity.ts'
import type { Ticket } from './types.ts'

function ticket(description: string): Ticket {
  return {
    id: 'ticket-closed',
    number: 'TCK-10001',
    title: 'VPN from Lisbon fails',
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
    const closed = ticket('VPN from Lisbon fails when the office network changes')
    const match = suggestReopen('VPN from Lisbon fails again after the laptop update', [closed])
    expect(match?.id).toBe(closed.id)
  })

  it('stays quiet when the draft is a different problem', () => {
    const closed = ticket('The badge printer on floor 3 jams every morning')
    expect(suggestReopen('Payroll export fails before the cutoff', [closed])).toBeNull()
  })
})
