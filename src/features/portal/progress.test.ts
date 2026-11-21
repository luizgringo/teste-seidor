import { describe, expect, it } from 'vitest'
import type { Message, StatusChange } from '@/features/tickets/domain/types.ts'
import { latestTeamUpdate, progressCopy, systemProgress } from './progress.ts'

const change = (occurredAt: string, reason = 'Chamado assumido.'): StatusChange => ({
  id: occurredAt,
  ticketId: 'ticket',
  from: 'open',
  to: 'in_progress',
  reason,
  userId: 'marina',
  occurredAt,
})

const message = (
  authorId: string,
  createdAt: string,
  visibility: Message['visibility'] = 'public',
): Message => ({
  id: createdAt + authorId,
  ticketId: 'ticket',
  authorId,
  visibility,
  body: 'Working on it.',
  createdAt,
})

describe('latestTeamUpdate', () => {
  it('ignores the opener and keeps the newest team fact', () => {
    const update = latestTeamUpdate(
      'helena',
      [
        message('helena', '2026-11-20T18:00:00.000Z'),
        message('marina', '2026-11-20T19:00:00.000Z'),
      ],
      [change('2026-11-20T18:30:00.000Z')],
    )
    expect(update?.kind).toBe('reply')
    expect(update?.at).toBe('2026-11-20T19:00:00.000Z')
  })

  it('uses a status change when nobody from the team has replied', () => {
    const update = latestTeamUpdate(
      'helena',
      [message('helena', '2026-11-20T18:00:00.000Z')],
      [change('2026-11-20T18:30:00.000Z')],
    )
    expect(update).toMatchObject({ kind: 'status', at: '2026-11-20T18:30:00.000Z' })
  })

  it('hides an internal note', () => {
    const update = latestTeamUpdate(
      'helena',
      [message('marina', '2026-11-20T19:00:00.000Z', 'internal')],
      [],
    )
    expect(update).toBeUndefined()
  })
})

describe('progressCopy', () => {
  it('does not repeat the automatic take phrase when the status moved on', () => {
    const resolved = change('2026-11-20T18:00:00.000Z')
    resolved.to = 'resolved'
    expect(progressCopy(resolved, 'Resolvido').key).toBe('portal.moved')
  })
})

describe('systemProgress', () => {
  it('keeps a written reason as feedback', () => {
    expect(systemProgress('The gateway is stable.')).toBe('written')
    expect(systemProgress('Chamado assumido.')).toBe('taken')
    expect(systemProgress('Chamado redistribuído.')).toBe('reassigned')
    expect(systemProgress('Atendimento concluído.')).toBe('completed')
  })
})
