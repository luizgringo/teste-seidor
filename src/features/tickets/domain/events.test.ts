import { describe, expect, it } from 'vitest'
import { applyEvent } from './events.ts'
import { presentWorkspace } from './present.ts'
import { emptyState, helena, internalNote, marina, payrollTicket } from './test-fixtures.ts'
import { reduceWorkspace } from './workspace.ts'

describe('applyEvent', () => {
  it('adds a message once when the same event arrives twice', () => {
    const event = {
      id: 'event-1',
      type: 'message.added' as const,
      occurredAt: '2026-11-20T12:00:00.000Z',
      payload: internalNote,
    }
    const once = applyEvent(emptyState(), event)
    const twice = applyEvent(once, event)
    expect(twice.messages).toHaveLength(1)
    expect(twice).toBe(once)
  })

  it('records an assignment and closes the previous one', () => {
    const state = emptyState()
    const next = applyEvent(state, {
      id: 'event-assign',
      type: 'ticket.assigned',
      occurredAt: '2026-11-20T12:00:00.000Z',
      payload: { ticketId: payrollTicket.id, consultantId: marina.id },
    })
    expect(next.tickets[0]?.assigneeId).toBe(marina.id)
    expect(next.assignments).toHaveLength(1)
    const again = applyEvent(next, {
      id: 'event-assign-2',
      type: 'ticket.assigned',
      occurredAt: '2026-11-20T13:00:00.000Z',
      payload: { ticketId: payrollTicket.id, consultantId: 'other' },
    })
    expect(again.assignments.find((item) => item.consultantId === marina.id)?.endedAt).toBe(
      '2026-11-20T13:00:00.000Z',
    )
  })
})

describe('reduceWorkspace', () => {
  it('keeps a single message when the event id is repeated', () => {
    const workspace = presentWorkspace(emptyState(), helena.id)
    if (!workspace) throw new Error('workspace')
    const event = {
      id: 'event-public',
      type: 'message.added' as const,
      occurredAt: '2026-11-20T12:05:00.000Z',
      payload: {
        ...internalNote,
        id: 'message-public',
        visibility: 'public' as const,
        body: 'We are looking.',
      },
    }
    const once = reduceWorkspace(workspace, event)
    expect(reduceWorkspace(once, event).messages).toHaveLength(1)
    const edited = reduceWorkspace(once, {
      id: 'event-edit',
      type: 'message.edited',
      occurredAt: '2026-11-20T12:06:00.000Z',
      payload: { ...event.payload, body: 'Updated.' },
    })
    expect(edited.messages[0]?.body).toBe('Updated.')
    expect(
      reduceWorkspace(edited, {
        id: 'event-remove',
        type: 'message.removed',
        occurredAt: '2026-11-20T12:07:00.000Z',
        payload: {
          messageId: 'message-public',
          ticketId: payrollTicket.id,
          visibility: 'public',
        },
      }).messages,
    ).toEqual([])
  })
})
