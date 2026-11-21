import { describe, expect, it } from 'vitest'
import { ticketByRoute } from './ticketRef.ts'

describe('ticketByRoute', () => {
  const tickets = [{ id: '33333333-3333-4333-8333-000000000196', number: 'TCK-10596' }]

  it('resolves the public code and the old id', () => {
    expect(ticketByRoute(tickets, 'TCK-10596')?.id).toBe(tickets[0]?.id)
    expect(ticketByRoute(tickets, tickets[0]?.id)?.number).toBe('TCK-10596')
    expect(ticketByRoute(tickets, undefined)).toBeUndefined()
  })
})
