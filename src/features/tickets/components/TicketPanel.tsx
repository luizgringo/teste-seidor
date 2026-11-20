import * as Dialog from '@radix-ui/react-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { capabilitiesFor } from '@/features/tickets/domain/access.ts'
import { nextStatuses } from '@/features/tickets/domain/status.ts'
import type { User, WireTicket, Workspace } from '@/features/tickets/domain/types.ts'
import { ApiError, api } from '@/shared/api/http.ts'
import { formatDue, translateError } from '@/shared/i18n/format.ts'
import styles from './desk.module.css'

/** Tipo TicketPanelProps. */
type TicketPanelProps = {
  ticket: WireTicket
  workspace: Workspace
  nowMs: number
}

/** Conversation, reply box, and the facts beside it. The draft lives in the composer. */
export function TicketPanel({ ticket, workspace, nowMs }: TicketPanelProps) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor capabilities. */
  const capabilities = capabilitiesFor(workspace.viewer, ticket)
  /** Valor messages. */
  const messages = workspace.messages.filter((message) => message.ticketId === ticket.id)
  /** Valor changes. */
  const changes = workspace.statusChanges.filter((change) => change.ticketId === ticket.id)
  /** Valor timeline. */
  const timeline = [
    ...messages.map((message) => ({ kind: 'message' as const, at: message.createdAt, message })),
    ...changes.map((change) => ({ kind: 'status' as const, at: change.occurredAt, change })),
  ].sort((left, right) => left.at.localeCompare(right.at))
  /** Valor name. */
  const name = (id: string | null) =>
    workspace.users.find((user) => user.id === id)?.name ?? t('common.unassigned')
  return (
    <div className={styles.detail}>
      <section className={styles.conversation} aria-label={t('ticket.conversation')}>
        <header>
          <p className={styles.number}>{ticket.number}</p>
          <h1>{ticket.title}</h1>
          <p>{t(`status.${ticket.status}`)}</p>
        </header>
        <div className={styles.thread}>
          <article className={styles.bubble}>
            <strong>{name(ticket.requesterId)}</strong>
            <p>{ticket.description}</p>
          </article>
          {timeline.map((entry) =>
            entry.kind === 'message' ? (
              <article
                key={entry.message.id}
                className={entry.message.visibility === 'internal' ? styles.note : styles.bubble}
              >
                <strong>
                  {name(entry.message.authorId)}
                  {entry.message.visibility === 'internal' ? ` · ${t('ticket.internalNote')}` : ''}
                </strong>
                <p>{entry.message.body}</p>
              </article>
            ) : (
              <p key={entry.change.id}>
                {t('ticket.statusChanged', {
                  status: t(`status.${entry.change.to}`),
                  reason: entry.change.reason,
                })}
              </p>
            ),
          )}
        </div>
        {capabilities.canReply || capabilities.canCreateInternalNote ? (
          <Composer ticketId={ticket.id} allowInternal={capabilities.canCreateInternalNote} />
        ) : (
          <p className={styles.empty}>{t('ticket.closedHint')}</p>
        )}
      </section>
      <aside className={styles.context} aria-label={t('ticket.details')}>
        <dl>
          <dt>{t('ticket.due')}</dt>
          <dd>
            {capabilities.canViewTaxonomy
              ? formatDue(ticket.dueAt, nowMs, t)
              : t(`status.${ticket.status}`)}
          </dd>
          <dt>{t('ticket.assignee')}</dt>
          <dd>{name(ticket.assigneeId)}</dd>
          {capabilities.canViewTaxonomy && ticket.priority ? (
            <>
              <dt>{t('ticket.priority')}</dt>
              <dd>{t(`priority.${ticket.priority}`)}</dd>
            </>
          ) : null}
        </dl>
        <div className={styles.actions}>
          {capabilities.canTake ? <TakeButton ticketId={ticket.id} /> : null}
          {capabilities.canChangeStatus ? (
            <StatusDialog ticket={ticket} viewer={workspace.viewer} />
          ) : null}
          {capabilities.canReopen ? <ReopenButton ticketId={ticket.id} /> : null}
          {capabilities.canReassign ? (
            <Reassign ticketId={ticket.id} users={workspace.users} />
          ) : null}
        </div>
      </aside>
    </div>
  )
}

/** Executa Composer. */
function Composer({ ticketId, allowInternal }: { ticketId: string; allowInternal: boolean }) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor client. */
  const client = useQueryClient()
  /** Valor valor. */
  const [body, setBody] = useState('')
  /** Valor valor. */
  const [visibility, setVisibility] = useState<'public' | 'internal'>('public')
  /** Valor valor. */
  const [error, setError] = useState('')
  /** Valor mutation. */
  const mutation = useMutation({
    mutationFn: () =>
      api(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body, visibility }),
      }),
    onSuccess: async () => {
      setBody('')
      setError('')
      await client.invalidateQueries({ queryKey: ['workspace'] })
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? translateError(reason.message, t) : t('ticket.sendError'),
      ),
  })
  return (
    <form
      className={styles.composer}
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
    >
      {allowInternal ? (
        <div className={styles.actions}>
          <button type="button" className={styles.quiet} onClick={() => setVisibility('public')}>
            {t('ticket.replyToCustomer')} {visibility === 'public' ? `· ${t('common.active')}` : ''}
          </button>
          <button type="button" className={styles.quiet} onClick={() => setVisibility('internal')}>
            {t('ticket.internalNote')} {visibility === 'internal' ? `· ${t('common.active')}` : ''}
          </button>
        </div>
      ) : null}
      <label>
        {t('ticket.message')}
        <textarea value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      {error ? <p className={styles.error}>{error}</p> : null}
      <button className={styles.primary} type="submit" disabled={mutation.isPending}>
        {visibility === 'internal' ? t('ticket.saveNote') : t('ticket.sendReply')}
      </button>
    </form>
  )
}

/** Executa TakeButton. */
function TakeButton({ ticketId }: { ticketId: string }) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor client. */
  const client = useQueryClient()
  /** Valor mutation. */
  const mutation = useMutation({
    mutationFn: () => api(`/api/tickets/${ticketId}/take`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['workspace'] }),
  })
  return (
    <button className={styles.primary} type="button" onClick={() => mutation.mutate()}>
      {t('ticket.take')}
    </button>
  )
}

/** Executa ReopenButton. */
function ReopenButton({ ticketId }: { ticketId: string }) {
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
      {t('ticket.reopen')}
    </button>
  )
}

/** Executa StatusDialog. */
function StatusDialog({ ticket, viewer }: { ticket: WireTicket; viewer: User }) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor client. */
  const client = useQueryClient()
  /** Valor valor. */
  const [reason, setReason] = useState('')
  /** Valor valor. */
  const [to, setTo] = useState(nextStatuses(ticket.status, viewer.role)[0] ?? ticket.status)
  /** Valor valor. */
  const [error, setError] = useState('')
  /** Valor mutation. */
  const mutation = useMutation({
    mutationFn: () =>
      api(`/api/tickets/${ticket.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ to, reason }),
      }),
    onSuccess: async () => {
      setReason('')
      await client.invalidateQueries({ queryKey: ['workspace'] })
    },
    onError: (reasonError) =>
      setError(
        reasonError instanceof ApiError
          ? translateError(reasonError.message, t)
          : t('ticket.statusError'),
      ),
  })
  /** Valor options. */
  const options = nextStatuses(ticket.status, viewer.role)
  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.quiet}>{t('ticket.changeStatus')}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content className={styles.dialog}>
          <Dialog.Title>{t('ticket.changeStatus')}</Dialog.Title>
          <Dialog.Description>{t('ticket.reasonStays')}</Dialog.Description>
          <label>
            {t('ticket.status')}
            <select value={to} onChange={(event) => setTo(event.target.value as typeof to)}>
              {options.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('ticket.reason')}
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          {error ? <p className={styles.error}>{error}</p> : null}
          <button className={styles.primary} type="button" onClick={() => mutation.mutate()}>
            {t('ticket.saveStatus')}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Executa Reassign. */
function Reassign({ ticketId, users }: { ticketId: string; users: User[] }) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor consultants. */
  const consultants = users.filter((user) => user.role === 'consultant')
  /** Valor valor. */
  const [consultantId, setConsultantId] = useState(consultants[0]?.id ?? '')
  /** Valor client. */
  const client = useQueryClient()
  /** Valor mutation. */
  const mutation = useMutation({
    mutationFn: () =>
      api(`/api/tickets/${ticketId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ consultantId }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['workspace'] }),
  })
  return (
    <form
      className={styles.actions}
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
    >
      <select value={consultantId} onChange={(event) => setConsultantId(event.target.value)}>
        {consultants.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
      <button className={styles.quiet} type="submit">
        {t('ticket.reassign')}
      </button>
    </form>
  )
}
