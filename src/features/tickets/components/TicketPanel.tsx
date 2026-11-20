import * as Dialog from '@radix-ui/react-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { capabilitiesFor } from '@/features/tickets/domain/access.ts'
import { dueLabel } from '@/features/tickets/domain/sla.ts'
import { nextStatuses } from '@/features/tickets/domain/status.ts'
import type { User, WireTicket, Workspace } from '@/features/tickets/domain/types.ts'
import { ApiError, api } from '@/shared/api/http.ts'
import styles from './desk.module.css'

type TicketPanelProps = {
  ticket: WireTicket
  workspace: Workspace
  nowMs: number
}

/** Conversation, reply box, and the facts beside it. The draft lives in the composer. */
export function TicketPanel({ ticket, workspace, nowMs }: TicketPanelProps) {
  const capabilities = capabilitiesFor(workspace.viewer, ticket)
  const messages = workspace.messages.filter((message) => message.ticketId === ticket.id)
  const changes = workspace.statusChanges.filter((change) => change.ticketId === ticket.id)
  const timeline = [
    ...messages.map((message) => ({ kind: 'message' as const, at: message.createdAt, message })),
    ...changes.map((change) => ({ kind: 'status' as const, at: change.occurredAt, change })),
  ].sort((left, right) => left.at.localeCompare(right.at))
  const name = (id: string | null) =>
    workspace.users.find((user) => user.id === id)?.name ?? 'Unassigned'
  return (
    <div className={styles.detail}>
      <section className={styles.conversation} aria-label="Conversation">
        <header>
          <p className={styles.number}>{ticket.number}</p>
          <h1>{ticket.title}</h1>
          <p>{ticket.statusLabel}</p>
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
                  {entry.message.visibility === 'internal' ? ' · Internal note' : ''}
                </strong>
                <p>{entry.message.body}</p>
              </article>
            ) : (
              <p key={entry.change.id}>
                Status changed to {entry.change.to}. {entry.change.reason}
              </p>
            ),
          )}
        </div>
        {capabilities.canReply || capabilities.canCreateInternalNote ? (
          <Composer ticketId={ticket.id} allowInternal={capabilities.canCreateInternalNote} />
        ) : (
          <p className={styles.empty}>This ticket is closed. Reopen it before writing again.</p>
        )}
      </section>
      <aside className={styles.context} aria-label="Ticket details">
        <dl>
          <dt>Due</dt>
          <dd>
            {capabilities.canViewTaxonomy ? dueLabel(ticket.dueAt, nowMs) : ticket.statusLabel}
          </dd>
          <dt>Assignee</dt>
          <dd>{name(ticket.assigneeId)}</dd>
          {capabilities.canViewTaxonomy && ticket.priority ? (
            <>
              <dt>Priority</dt>
              <dd>{ticket.priority}</dd>
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

function Composer({ ticketId, allowInternal }: { ticketId: string; allowInternal: boolean }) {
  const client = useQueryClient()
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'internal'>('public')
  const [error, setError] = useState('')
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
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not send.'),
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
            Reply to customer {visibility === 'public' ? '· on' : ''}
          </button>
          <button type="button" className={styles.quiet} onClick={() => setVisibility('internal')}>
            Internal note {visibility === 'internal' ? '· on' : ''}
          </button>
        </div>
      ) : null}
      <label>
        Message
        <textarea value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      {error ? <p className={styles.error}>{error}</p> : null}
      <button className={styles.primary} type="submit" disabled={mutation.isPending}>
        {visibility === 'internal' ? 'Save note' : 'Send reply'}
      </button>
    </form>
  )
}

function TakeButton({ ticketId }: { ticketId: string }) {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => api(`/api/tickets/${ticketId}/take`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['workspace'] }),
  })
  return (
    <button className={styles.primary} type="button" onClick={() => mutation.mutate()}>
      Take ticket
    </button>
  )
}

function ReopenButton({ ticketId }: { ticketId: string }) {
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
      Reopen
    </button>
  )
}

function StatusDialog({ ticket, viewer }: { ticket: WireTicket; viewer: User }) {
  const client = useQueryClient()
  const [reason, setReason] = useState('')
  const [to, setTo] = useState(nextStatuses(ticket.status, viewer.role)[0] ?? ticket.status)
  const [error, setError] = useState('')
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
      setError(reasonError instanceof ApiError ? reasonError.message : 'Could not change status.'),
  })
  const options = nextStatuses(ticket.status, viewer.role)
  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.quiet}>Change status</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content className={styles.dialog}>
          <Dialog.Title>Change status</Dialog.Title>
          <Dialog.Description>The reason stays on the timeline.</Dialog.Description>
          <label>
            Status
            <select value={to} onChange={(event) => setTo(event.target.value as typeof to)}>
              {options.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reason
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          {error ? <p className={styles.error}>{error}</p> : null}
          <button className={styles.primary} type="button" onClick={() => mutation.mutate()}>
            Save status
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Reassign({ ticketId, users }: { ticketId: string; users: User[] }) {
  const consultants = users.filter((user) => user.role === 'consultant')
  const [consultantId, setConsultantId] = useState(consultants[0]?.id ?? '')
  const client = useQueryClient()
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
        Reassign
      </button>
    </form>
  )
}
