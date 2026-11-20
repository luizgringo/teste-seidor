import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { capabilitiesFor } from '@/features/tickets/domain/access.ts'
import { useTicketStream, useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import { api } from '@/shared/api/http.ts'
import styles from './portal.module.css'

/** One request, with a marker for messages that arrived after the previous visit. */
export function CustomerTicketPage() {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor valor. */
  const { ticketId = '' } = useParams()
  /** Valor workspace. */
  const workspace = useWorkspace()
  useTicketStream(Boolean(workspace.data))
  /** Valor ticket. */
  const ticket = workspace.data?.tickets.find((item) => item.id === ticketId)
  /** Valor seenKey. */
  const seenKey = workspace.data ? `northline:seen:${workspace.data.viewer.id}:${ticketId}` : ''
  /** Valor seenAt. */
  const seenAt = useRef<string | null | undefined>(undefined)
  if (seenKey && seenAt.current === undefined) seenAt.current = window.localStorage.getItem(seenKey)
  useEffect(() => {
    if (!seenKey) return
    window.localStorage.setItem(seenKey, new Date().toISOString())
  }, [seenKey])
  if (!workspace.data || !ticket) return <p className={styles.portal}>{t('portal.unavailable')}</p>
  /** Valor messages. */
  const messages = workspace.data.messages.filter((message) => message.ticketId === ticket.id)
  /** Valor capabilities. */
  const capabilities = capabilitiesFor(workspace.data.viewer, ticket)
  /** Valor name. */
  const name = (id: string) =>
    workspace.data?.users.find((user) => user.id === id)?.name ?? t('common.support')
  /** Valor marked. */
  let marked = false
  return (
    <div className={styles.portal}>
      <p>{ticket.number}</p>
      <h1>{ticket.title}</h1>
      <p>{t(`status.${ticket.status}`)}</p>
      <div className={styles.thread}>
        {messages.map((message) => {
          /** Valor fresh. */
          const fresh =
            seenAt.current !== null &&
            seenAt.current !== undefined &&
            message.createdAt > seenAt.current
          /** Valor showMarker. */
          const showMarker = fresh && !marked
          if (showMarker) marked = true
          return (
            <div key={message.id}>
              {showMarker ? <p className={styles.marker}>{t('portal.sinceVisit')}</p> : null}
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

/** Executa CustomerReply. */
function CustomerReply({ ticketId }: { ticketId: string }) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor client. */
  const client = useQueryClient()
  /** Valor valor. */
  const [body, setBody] = useState('')
  /** Valor mutation. */
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
        {t('portal.reply')}
        <textarea value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      <button className={styles.primary} type="submit">
        {t('ticket.sendReply')}
      </button>
    </form>
  )
}

/** Executa Reopen. */
function Reopen({ ticketId }: { ticketId: string }) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor client. */
  const client = useQueryClient()
  /** Valor mutation. */
  const mutation = useMutation({
    mutationFn: () =>
      api(`/api/tickets/${ticketId}/status`, {
        method: 'POST',
        body: JSON.stringify({ to: 'open', reason: t('portal.stillOpen') }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['workspace'] }),
  })
  return (
    <button className={styles.primary} type="button" onClick={() => mutation.mutate()}>
      {t('portal.stillOpen')}
    </button>
  )
}
