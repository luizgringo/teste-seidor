import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { suggestReopen } from '@/features/tickets/domain/similarity.ts'
import type { Ticket } from '@/features/tickets/domain/types.ts'
import { useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import { ApiError, api } from '@/shared/api/http.ts'
import { translateError } from '@/shared/i18n/format.ts'
import styles from './portal.module.css'

/** Abre um chamado. O cliente não escolhe categoria, grupo nem prioridade. */
export function NewTicketPage() {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor workspace. */
  const workspace = useWorkspace()
  /** Valor navigate. */
  const navigate = useNavigate()
  /** Valor client. */
  const client = useQueryClient()
  /** Valor valor. */
  const [title, setTitle] = useState('')
  /** Valor valor. */
  const [description, setDescription] = useState('')
  /** Valor valor. */
  const [error, setError] = useState('')
  /** Valor closed. */
  const closed = useMemo(() => closedTickets(workspace.data?.tickets ?? []), [workspace.data])
  /** Valor suggestion. */
  const suggestion = suggestReopen(`${title} ${description}`, closed)
  /** Valor mutation. */
  const mutation = useMutation({
    mutationFn: () =>
      api<{ ok: true }>('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['workspace'] })
      navigate('/queue')
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? translateError(reason.message, t) : t('newTicket.error'),
      ),
  })
  return (
    <div className={styles.portal}>
      <h1>{t('newTicket.title')}</h1>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <label>
          {t('newTicket.whatBroke')}
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          {t('newTicket.whatHappened')}
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        {suggestion ? (
          <p className={styles.suggestion}>
            {t('newTicket.suggestion', { number: suggestion.number })}{' '}
            <button
              type="button"
              onClick={() =>
                api(`/api/tickets/${suggestion.id}/status`, {
                  method: 'POST',
                  body: JSON.stringify({ to: 'open', reason: t('portal.stillOpen') }),
                }).then(() => navigate(`/tickets/${suggestion.id}`))
              }
            >
              {t('newTicket.reopen')}
            </button>
          </p>
        ) : null}
        {error ? <p>{error}</p> : null}
        <button className={styles.primary} type="submit">
          {t('newTicket.submit')}
        </button>
      </form>
    </div>
  )
}

/** Executa closedTickets. */
function closedTickets(
  tickets: {
    id: string
    number: string
    title: string
    description: string
    status: Ticket['status']
    priority: Ticket['priority'] | null
    groupId: string | null
    requesterId: string
    assigneeId: string | null
    openedAt: string
    dueAt: string
    updatedAt: string
  }[],
): Ticket[] {
  return tickets
    .filter((ticket) => ticket.status === 'closed')
    .map((ticket) => ({
      ...ticket,
      priority: ticket.priority ?? 'medium',
      groupId: ticket.groupId ?? '',
    }))
}
