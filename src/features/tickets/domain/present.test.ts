import { describe, expect, it } from 'vitest'
import { presentEvent, presentWorkspace } from './present.ts'
import {
  emptyState,
  helena,
  internalNote,
  marina,
  payrollTicket,
  ricardo,
} from './test-fixtures.ts'

describe('presentWorkspace', () => {
  it('removes internal notes, priority, and group from Helena', () => {
    const workspace = presentWorkspace(emptyState(), helena.id)
    expect(workspace?.messages).toEqual([])
    expect(workspace?.tickets[0]?.priority).toBeNull()
    expect(workspace?.tickets[0]?.groupId).toBeNull()
    expect(workspace?.groups).toEqual([])
    expect(workspace?.tickets[0]?.statusLabel).toBe('Aguardando alguém assumir')
  })

  it('keeps the internal note for Marina and the full board for Ricardo', () => {
    expect(presentWorkspace(emptyState(), marina.id)?.messages[0]?.id).toBe(internalNote.id)
    expect(presentWorkspace(emptyState(), ricardo.id)?.groups).toHaveLength(3)
  })

  it('does not deliver an internal note event to Helena', () => {
    const state = emptyState()
    const event = {
      id: 'event-note',
      type: 'message.added' as const,
      occurredAt: internalNote.createdAt,
      payload: internalNote,
    }
    expect(presentEvent(event, state, helena)).toBeNull()
    expect(presentEvent(event, state, marina)?.type).toBe('message.added')
  })

  it('strips priority from a ticket.opened event for Helena', () => {
    const state = emptyState()
    const event = {
      id: 'event-open',
      type: 'ticket.opened' as const,
      occurredAt: payrollTicket.openedAt,
      payload: payrollTicket,
    }
    const visible = presentEvent(event, state, helena)
    expect(visible?.type).toBe('ticket.opened')
    if (visible?.type !== 'ticket.opened') return
    expect(visible.payload.priority).toBeNull()
    expect(visible.payload.groupId).toBeNull()
  })
})
