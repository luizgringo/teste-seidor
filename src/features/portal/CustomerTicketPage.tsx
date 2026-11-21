import { Badge, Button } from '@radix-ui/themes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router'
import { capabilitiesFor } from '@/features/tickets/domain/access.ts'
import { ticketByRoute } from '@/features/tickets/domain/ticketRef.ts'
import { useTicketStream, useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import { api } from '@/shared/api/http.ts'
import { formatWhen } from '@/shared/i18n/format.ts'
import { ActionLabel } from '@/shared/icons/ActionIcon.tsx'
import { PersonName } from '@/shared/people/PersonName.tsx'
import { ReplyForm } from '@/shared/reply/ReplyForm.tsx'
import { Timeline, TimelineItem } from '@/shared/timeline/Timeline.tsx'
import styles from './portal.module.css'
import { progressCopy } from './progress.ts'

/** Um pedido, com a marca das mensagens que chegaram depois da visita anterior. */
export function CustomerTicketPage() {
  /** Valor valor. */
  const { t, i18n } = useTranslation()
  /** Valor valor. */
  const { ticketId = '' } = useParams()
  /** Valor workspace. */
  const workspace = useWorkspace()
  useTicketStream(Boolean(workspace.data))
  /** Valor ticket. */
  const ticket = workspace.data ? ticketByRoute(workspace.data.tickets, ticketId) : undefined
  /** Valor seenKey. */
  const seenKey =
    workspace.data && ticket ? `northline:seen:${workspace.data.viewer.id}:${ticket.id}` : ''
  /** Valor seenAt. */
  const seenAt = useRef<string | null | undefined>(undefined)
  if (seenKey && seenAt.current === undefined) seenAt.current = window.localStorage.getItem(seenKey)
  useEffect(() => {
    if (!seenKey) return
    window.localStorage.setItem(seenKey, new Date().toISOString())
  }, [seenKey])
  if (!workspace.data || !ticket) return <p className={styles.portal}>{t('portal.unavailable')}</p>
  if (ticketId !== ticket.number) return <Navigate to={`/tickets/${ticket.number}`} replace />
  /** Valor messages. */
  const messages = workspace.data.messages.filter((message) => message.ticketId === ticket.id)
  /** Valor changes. */
  const changes = workspace.data.statusChanges.filter((change) => change.ticketId === ticket.id)
  /** Valor timeline. */
  const timeline = [
    ...messages.map((message) => ({ kind: 'message' as const, at: message.createdAt, message })),
    ...changes.map((change) => ({ kind: 'status' as const, at: change.occurredAt, change })),
  ].sort((left, right) => left.at.localeCompare(right.at))
  /** Valor capabilities. */
  const capabilities = capabilitiesFor(workspace.data.viewer, ticket)
  /** Valor name. */
  const name = (id: string) =>
    workspace.data?.users.find((user) => user.id === id)?.name ?? t('common.support')
  /** Valor assignee. */
  const assignee = ticket.assigneeId
    ? (workspace.data.users.find((user) => user.id === ticket.assigneeId)?.name ??
      t('common.unassigned'))
    : t('common.unassigned')
  /** Valor marked. */
  let marked = false
  return (
    <div className={styles.portal}>
      <p className={styles.number}>{ticket.number}</p>
      <h1>{ticket.title}</h1>
      <dl className={styles.facts}>
        <div>
          <dt>
            <ActionLabel name="status">{t('ticket.status')}</ActionLabel>
          </dt>
          <dd>
            <Badge color="gray" variant="soft">
              {t(`status.${ticket.status}`)}
            </Badge>
          </dd>
        </div>
        <div>
          <dt>
            <ActionLabel name="user">{t('ticket.assignee')}</ActionLabel>
          </dt>
          <dd>
            <PersonName userId={ticket.assigneeId} name={assignee} />
          </dd>
        </div>
        <div>
          <dt>
            <ActionLabel name="calendar">{t('ticket.created')}</ActionLabel>
          </dt>
          <dd>
            <time dateTime={ticket.openedAt}>{formatWhen(ticket.openedAt, i18n.language)}</time>
          </dd>
        </div>
        <div>
          <dt>
            <ActionLabel name="refresh">{t('ticket.updated')}</ActionLabel>
          </dt>
          <dd>
            <time dateTime={ticket.updatedAt}>{formatWhen(ticket.updatedAt, i18n.language)}</time>
          </dd>
        </div>
      </dl>
      <section className={styles.block} aria-label={t('ticket.description')}>
        <h2>{t('ticket.description')}</h2>
        <dl className={styles.origin}>
          <div>
            <dt>
              <ActionLabel name="user">{t('ticket.createdBy')}</ActionLabel>
            </dt>
            <dd>
              <PersonName userId={ticket.requesterId} name={name(ticket.requesterId)} />
            </dd>
          </div>
          <div>
            <dt>
              <ActionLabel name="calendar">{t('ticket.created')}</ActionLabel>
            </dt>
            <dd>
              <time dateTime={ticket.openedAt}>{formatWhen(ticket.openedAt, i18n.language)}</time>
            </dd>
          </div>
        </dl>
        <div className={styles.problem}>
          <p>
            <ActionLabel name="note">{t('ticket.problem')}</ActionLabel>
          </p>
          <p className={styles.body}>{ticket.description}</p>
        </div>
      </section>
      <h2 className={styles.activity}>{t('ticket.activity')}</h2>
      <Timeline>
        <AnimatePresence initial={false}>
          {timeline.map((entry) => {
            /** Valor fresh. */
            const fresh =
              seenAt.current !== null && seenAt.current !== undefined && entry.at > seenAt.current
            /** Valor showMarker. */
            const showMarker = fresh && !marked
            if (showMarker) marked = true
            if (entry.kind === 'status') {
              /** Valor copy. */
              const copy = progressCopy(entry.change, t(`status.${entry.change.to}`))
              return (
                <TimelineItem key={entry.change.id} kind="update">
                  {showMarker ? <p className={styles.marker}>{t('portal.sinceVisit')}</p> : null}
                  <article className={styles.update}>
                    <p className={styles.updateLine}>
                      <PersonName userId={entry.change.userId} name={name(entry.change.userId)} />
                      <span>{t(copy.key, copy.values)}</span>
                    </p>
                    <time dateTime={entry.change.occurredAt}>
                      <ActionLabel name="calendar">
                        {formatWhen(entry.change.occurredAt, i18n.language)}
                      </ActionLabel>
                    </time>
                  </article>
                </TimelineItem>
              )
            }
            return (
              <TimelineItem key={entry.message.id}>
                {showMarker ? <p className={styles.marker}>{t('portal.sinceVisit')}</p> : null}
                <article className={styles.message}>
                  <header className={styles.entryHead}>
                    <strong>
                      <PersonName
                        userId={entry.message.authorId}
                        name={name(entry.message.authorId)}
                      />
                    </strong>
                    <span className={styles.when}>
                      <time dateTime={entry.message.createdAt}>
                        <ActionLabel name="calendar">
                          {formatWhen(entry.message.createdAt, i18n.language)}
                        </ActionLabel>
                      </time>
                      {entry.message.editedAt ? (
                        <time dateTime={entry.message.editedAt}>
                          {t('ticket.editedAt', {
                            when: formatWhen(entry.message.editedAt, i18n.language),
                          })}
                        </time>
                      ) : null}
                    </span>
                  </header>
                  <p>{entry.message.body}</p>
                </article>
              </TimelineItem>
            )
          })}
        </AnimatePresence>
      </Timeline>
      {capabilities.canReply ? <ReplyForm ticketId={ticket.id} /> : null}
      {capabilities.canReopen ? <Reopen ticketId={ticket.id} /> : null}
    </div>
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
    <Button disabled={mutation.isPending} type="button" onClick={() => mutation.mutate()}>
      <ActionLabel name="reopen">{t('portal.stillOpen')}</ActionLabel>
    </Button>
  )
}
