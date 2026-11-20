import { describe, expect, it } from 'vitest'
import { canMoveStatus, isDone, nextStatuses } from './status.ts'

describe('canMoveStatus', () => {
  it('lets a consultant move along the working path', () => {
    expect(canMoveStatus('open', 'in_progress', 'consultant')).toBe(true)
    expect(canMoveStatus('in_progress', 'waiting_on_customer', 'consultant')).toBe(true)
    expect(canMoveStatus('waiting_on_customer', 'in_progress', 'manager')).toBe(true)
    expect(canMoveStatus('resolved', 'closed', 'manager')).toBe(true)
    expect(canMoveStatus('closed', 'open', 'consultant')).toBe(true)
  })

  it('rejects a jump that skips the path', () => {
    expect(canMoveStatus('open', 'resolved', 'consultant')).toBe(false)
    expect(canMoveStatus('closed', 'in_progress', 'manager')).toBe(false)
  })

  it('lets a customer reopen and nothing else', () => {
    expect(canMoveStatus('closed', 'open', 'customer')).toBe(true)
    expect(canMoveStatus('open', 'closed', 'customer')).toBe(false)
    expect(canMoveStatus('in_progress', 'resolved', 'customer')).toBe(false)
    expect(nextStatuses('closed', 'customer')).toEqual(['open'])
  })

  it('treats resolved and closed as done', () => {
    expect(isDone('resolved')).toBe(true)
    expect(isDone('closed')).toBe(true)
    expect(isDone('open')).toBe(false)
  })
})
