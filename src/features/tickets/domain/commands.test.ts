import { describe, expect, it } from 'vitest'
import { addMessage, assignTicket, changeStatus, openTicket, takeTicket } from './commands.ts'
import {
  context,
  diego,
  emptyState,
  helena,
  marina,
  payrollTicket,
  ricardo,
} from './test-fixtures.ts'

describe('ticket commands', () => {
  it('lets Helena open a ticket without choosing priority or group', () => {
    const result = openTicket(
      emptyState(),
      helena,
      { title: 'Badge reader is silent', description: 'The lobby reader does nothing.' },
      context(['ticket-new', 'event-new']),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const opened = result.events[0]
    expect(opened?.type).toBe('ticket.opened')
    if (opened?.type !== 'ticket.opened') return
    expect(opened.payload.priority).toBe('medium')
    expect(opened.payload.groupId).toBe('group-service-desk')
    expect(opened.payload.requesterId).toBe(helena.id)
  })

  it('lets Marina take an unassigned ticket in her group', () => {
    const result = takeTicket(
      emptyState(),
      marina,
      payrollTicket.id,
      context(['event-a', 'event-b']),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.events.map((event) => event.type)).toEqual(['ticket.assigned', 'status.changed'])
    expect(result.state.tickets[0]?.assigneeId).toBe(marina.id)
    expect(result.state.tickets[0]?.status).toBe('in_progress')
  })

  it('stops Diego from taking a ticket outside his group', () => {
    const result = takeTicket(emptyState(), diego, payrollTicket.id, context(['event-a']))
    expect(result).toMatchObject({ ok: false, status: 403 })
  })

  it('hides an internal note from Helena and keeps it for Marina', () => {
    const hidden = addMessage(
      emptyState(),
      helena,
      payrollTicket.id,
      { body: 'secret', visibility: 'internal' },
      context(['event-a', 'message-a']),
    )
    expect(hidden).toMatchObject({ ok: false, status: 403 })
    const noted = addMessage(
      emptyState(),
      marina,
      payrollTicket.id,
      { body: 'Checked the gateway.', visibility: 'internal' },
      context(['event-b', 'message-b']),
    )
    expect(noted.ok).toBe(true)
  })

  it('rejects a missing ticket and a reply on a closed one', () => {
    const missing = changeStatus(
      emptyState(),
      marina,
      'missing',
      { to: 'closed', reason: 'Gone.' },
      context(['event-missing']),
    )
    expect(missing).toMatchObject({ ok: false, status: 404 })
    const closed = changeStatus(
      emptyState(),
      marina,
      payrollTicket.id,
      { to: 'closed', reason: 'Fixed in the export job.' },
      context(['event-close-2']),
    )
    expect(closed.ok).toBe(true)
    if (!closed.ok) return
    const reply = addMessage(
      closed.state,
      helena,
      payrollTicket.id,
      { body: 'Still broken', visibility: 'public' },
      context(['event-reply', 'message-reply']),
    )
    expect(reply).toMatchObject({ ok: false, status: 403 })
  })

  it('requires a reason when the status changes and lets Helena reopen', () => {
    const missing = changeStatus(
      emptyState(),
      marina,
      payrollTicket.id,
      { to: 'in_progress', reason: 'no' },
      context(['event-a']),
    )
    expect(missing).toMatchObject({ ok: false, status: 400 })
    const closed = changeStatus(
      emptyState(),
      marina,
      payrollTicket.id,
      { to: 'closed', reason: 'Fixed in the export job.' },
      context(['event-close']),
    )
    expect(closed.ok).toBe(true)
    if (!closed.ok) return
    const reopened = changeStatus(
      closed.state,
      helena,
      payrollTicket.id,
      { to: 'open', reason: 'Still not resolved' },
      context(['event-reopen']),
    )
    expect(reopened.ok).toBe(true)
    if (!reopened.ok) return
    expect(reopened.state.tickets[0]?.status).toBe('open')
  })

  it('lets Ricardo reassign and refuses Marina', () => {
    const denied = assignTicket(
      emptyState(),
      marina,
      payrollTicket.id,
      diego.id,
      context(['event-a']),
    )
    expect(denied).toMatchObject({ ok: false, status: 403 })
    const moved = assignTicket(
      emptyState(),
      ricardo,
      payrollTicket.id,
      diego.id,
      context(['event-b', 'event-c']),
    )
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    expect(moved.state.tickets[0]?.assigneeId).toBe(diego.id)
  })
})
