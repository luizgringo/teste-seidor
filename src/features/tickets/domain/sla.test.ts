import { describe, expect, it } from 'vitest'
import { dueLabel, dueState } from './sla.ts'

describe('dueState', () => {
  const now = Date.parse('2026-11-20T12:00:00.000Z')

  it('marks a past due instant as breached', () => {
    const dueAt = new Date(now - 30 * 60_000).toISOString()
    expect(dueState(dueAt, now)).toEqual({ minutes: -30, tone: 'breached' })
    expect(dueLabel(dueAt, now)).toBe('Estourou há 30min')
  })

  it('marks the next two hours as soon', () => {
    const dueAt = new Date(now + 90 * 60_000).toISOString()
    expect(dueState(dueAt, now).tone).toBe('soon')
    expect(dueLabel(dueAt, now)).toBe('Vence em 1h 30min')
  })

  it('marks a later due instant as ok', () => {
    const dueAt = new Date(now + 5 * 60 * 60_000).toISOString()
    expect(dueState(dueAt, now).tone).toBe('ok')
  })
})
