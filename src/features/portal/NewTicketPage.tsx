import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { suggestReopen } from '@/features/tickets/domain/similarity.ts'
import type { Ticket } from '@/features/tickets/domain/types.ts'
import { useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import { ApiError, api } from '@/shared/api/http.ts'
import styles from './portal.module.css'

/** Opens a ticket. Customers are not asked for category, group, or priority. */
export function NewTicketPage() {
  const workspace = useWorkspace()
  const navigate = useNavigate()
  const client = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const closed = useMemo(() => closedTickets(workspace.data?.tickets ?? []), [workspace.data])
  const suggestion = suggestReopen(`${title} ${description}`, closed)
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
      setError(reason instanceof ApiError ? reason.message : 'Could not open the ticket.'),
  })
  return (
    <div className={styles.portal}>
      <h1>New ticket</h1>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <label>
          What broke?
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          What happened?
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        {suggestion ? (
          <p className={styles.suggestion}>
            This looks like {suggestion.number}, which is already closed.{' '}
            <button
              type="button"
              onClick={() =>
                api(`/api/tickets/${suggestion.id}/status`, {
                  method: 'POST',
                  body: JSON.stringify({ to: 'open', reason: 'Still not resolved' }),
                }).then(() => navigate(`/tickets/${suggestion.id}`))
              }
            >
              Reopen it
            </button>
          </p>
        ) : null}
        {error ? <p>{error}</p> : null}
        <button className={styles.primary} type="submit">
          Open ticket
        </button>
      </form>
    </div>
  )
}

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
