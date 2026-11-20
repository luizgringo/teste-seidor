import { describe, expect, it } from 'vitest'
import { messageSchema, openTicketSchema, statusSchema } from './contracts.ts'

describe('request schemas', () => {
  it('accepts a ticket and rejects a short title', () => {
    expect(
      openTicketSchema.safeParse({ title: 'VPN down', description: 'It fails.' }).success,
    ).toBe(true)
    expect(openTicketSchema.safeParse({ title: 'No', description: 'It fails.' }).success).toBe(
      false,
    )
  })

  it('accepts a public message and a reasoned status change', () => {
    expect(messageSchema.safeParse({ body: 'Looking now.', visibility: 'public' }).success).toBe(
      true,
    )
    expect(messageSchema.safeParse({ body: 'Looking now.', visibility: 'secret' }).success).toBe(
      false,
    )
    expect(statusSchema.safeParse({ to: 'closed', reason: 'Fixed.' }).success).toBe(true)
    expect(statusSchema.safeParse({ to: 'closed', reason: 'No' }).success).toBe(false)
  })
})
