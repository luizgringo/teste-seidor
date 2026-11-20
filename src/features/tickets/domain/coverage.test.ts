import { describe, expect, it } from 'vitest'
import { statusLabel } from './labels.ts'
import { presentWorkspace } from './present.ts'
import { queueSections } from './queue.ts'
import { emptyState, helena, marina, ricardo } from './test-fixtures.ts'
import type { WireTicket } from './types.ts'
import { reduceWorkspace } from './workspace.ts'

function wire(partial: Partial<WireTicket>): WireTicket {
  return {
    id: 'ticket-1',
    number: 'TCK-1',
    title: 'VPN',
    description: 'Down',
    status: 'open',
    statusLabel: 'Waiting for someone to pick this up',
    requesterId: helena.id,
    assigneeId: marina.id,
    openedAt: '2026-11-20T08:00:00.000Z',
    dueAt: '2026-11-20T09:00:00.000Z',
    updatedAt: '2026-11-20T08:00:00.000Z',
    priority: 'high',
    groupId: marina.groupId,
    ...partial,
  }
}

describe('statusLabel', () => {
  it('names every status in plain language', () => {
    expect(statusLabel('open')).toMatch(/Waiting/)
    expect(statusLabel('in_progress')).toMatch(/Someone/)
    expect(statusLabel('waiting_on_customer')).toMatch(/need you/)
    expect(statusLabel('resolved')).toBe('Resolved')
    expect(statusLabel('closed')).toBe('Closed')
  })
})

describe('queueSections', () => {
  const now = Date.parse('2026-11-20T12:00:00.000Z')

  it('puts Marina’s breached ticket ahead of unassigned work', () => {
    const sections = queueSections(
      [
        wire({ id: 'risk', dueAt: '2026-11-20T11:00:00.000Z' }),
        wire({ id: 'free', assigneeId: null, dueAt: '2026-11-20T15:00:00.000Z' }),
        wire({ id: 'later', dueAt: '2026-11-21T12:00:00.000Z' }),
        wire({ id: 'done', status: 'closed', dueAt: '2026-11-20T10:00:00.000Z' }),
      ],
      marina,
      now,
      false,
    )
    expect(sections.map((section) => section.id)).toEqual(['risk', 'free', 'mine'])
    expect(sections[0]?.tickets[0]?.id).toBe('risk')
  })

  it('gives Ricardo one list and can include closed tickets', () => {
    const sections = queueSections([wire({ id: 'done', status: 'closed' })], ricardo, now, true)
    expect(sections).toHaveLength(1)
    expect(sections[0]?.tickets).toHaveLength(1)
  })
})

describe('reduceWorkspace', () => {
  it('applies an opened ticket, an assignment, and a status once', () => {
    const workspace = presentWorkspace(emptyState(), marina.id)
    if (!workspace) throw new Error('workspace')
    const opened = reduceWorkspace(workspace, {
      id: 'event-open',
      type: 'ticket.opened',
      occurredAt: '2026-11-20T12:00:00.000Z',
      payload: wire({ id: 'ticket-new', number: 'TCK-20000' }),
    })
    const assigned = reduceWorkspace(opened, {
      id: 'event-assign',
      type: 'ticket.assigned',
      occurredAt: '2026-11-20T12:01:00.000Z',
      payload: { ticketId: 'ticket-new', consultantId: marina.id },
    })
    const changed = reduceWorkspace(assigned, {
      id: 'event-status',
      type: 'status.changed',
      occurredAt: '2026-11-20T12:02:00.000Z',
      payload: {
        ticketId: 'ticket-new',
        from: 'open',
        to: 'in_progress',
        reason: 'Ticket taken',
        userId: marina.id,
      },
    })
    const twice = reduceWorkspace(changed, {
      id: 'event-status',
      type: 'status.changed',
      occurredAt: '2026-11-20T12:02:00.000Z',
      payload: {
        ticketId: 'ticket-new',
        from: 'open',
        to: 'in_progress',
        reason: 'Ticket taken',
        userId: marina.id,
      },
    })
    expect(twice.tickets.find((ticket) => ticket.id === 'ticket-new')?.status).toBe('in_progress')
    expect(twice.statusChanges.filter((change) => change.ticketId === 'ticket-new')).toHaveLength(1)
  })
})
