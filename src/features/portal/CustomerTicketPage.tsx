import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { capabilitiesFor } from '@/features/tickets/domain/access.ts'
import { useTicketStream, useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import { api } from '@/shared/api/http.ts'
import styles from './portal.module.css'

/** One request, with a marker for messages that arrived after the previous visit. */
export function CustomerTicketPage() {
  const { ticketId = '' } = useParams()
  const workspace = useWorkspace()
  useTicketStream(Boolean(workspace.data))
  const ticket = workspace.data?.tickets.find((item) => item.id === ticketId)
  const seenKey = workspace.data ? `northline:seen:${workspace.data.viewer.id}:${ticketId}` : ''
  const seenAt = useRef<string | null | undefined>(undefined)
  if (seenKey && seenAt.current === undefined) seenAt.current = window.localStorage.getItem(seenKey)
  useEffect(() => {
    if (!seenKey) return
    window.localStorage.setItem(seenKey, new Date().toISOString())
  }, [seenKey])
  if (!workspace.data || !ticket)
    return <p className={styles.portal}>This request is not available.</p>
  const messages = workspace.data.messages.filter((message) => message.ticketId === ticket.id)
  const capabilities = capabilitiesFor(workspace.data.viewer, ticket)
  const name = (id: string) =>
    workspace.data?.users.find((user) => user.id === id)?.name ?? 'Support'
  let marked = false
  return (
    <div className={styles.portal}>
      <p>{ticket.number}</p>
      <h1>{ticket.title}</h1>
      <p>{ticket.statusLabel}</p>
      <div className={styles.thread}>
        {messages.map((message) => {
          const fresh =
            seenAt.current !== null &&
            seenAt.current !== undefined &&
            message.createdAt > seenAt.current
          const showMarker = fresh && !marked
          if (showMarker) marked = true
          return (
            <div key={message.id}>
              {showMarker ? <p className={styles.marker}>Since your last visit</p> : null}
              <article>
                <strong>{name(message.authorId)}</strong>
                <p>{message.body}</p>
              </article>
            </div>
          )
        })}
      </div>
      {capabilities.canReply ? <CustomerReply ticketId={ticket.id} /> : null}
      {capabilities.canReopen ? <Reopen ticketId={ticket.id} /> : null}
    </div>
  )
}

function CustomerReply({ ticketId }: { ticketId: string }) {
  const client = useQueryClient()
  const [body, setBody] = useState('')
  const mutation = useMutation({
    mutationFn: () =>
      api(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body, visibility: 'public' }),
      }),
    onSuccess: async () => {
      setBody('')
      await client.invalidateQueries({ queryKey: ['workspace'] })
    },
  })
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
    >
      <label>
        Reply
        <textarea value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      <button className={styles.primary} type="submit">
        Send reply
      </button>
    </form>
  )
}

function Reopen({ ticketId }: { ticketId: string }) {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: () =>
      api(`/api/tickets/${ticketId}/status`, {
        method: 'POST',
        body: JSON.stringify({ to: 'open', reason: 'Still not resolved' }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['workspace'] }),
  })
  return (
    <button className={styles.primary} type="button" onClick={() => mutation.mutate()}>
      Still not resolved
    </button>
  )
}
