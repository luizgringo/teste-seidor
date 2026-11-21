import { Badge, Button, Callout, Dialog, Flex, Select, Text, TextArea } from '@radix-ui/themes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageBody } from '@/features/tickets/components/MessageBody.tsx'
import { capabilitiesFor } from '@/features/tickets/domain/access.ts'
import { dueState } from '@/features/tickets/domain/sla.ts'
import { nextStatuses } from '@/features/tickets/domain/status.ts'
import type {
  Priority,
  TicketStatus,
  User,
  WireTicket,
  Workspace,
} from '@/features/tickets/domain/types.ts'
import { ApiError, api } from '@/shared/api/http.ts'
import { formatDue, formatWhen, translateError } from '@/shared/i18n/format.ts'
import { ActionLabel } from '@/shared/icons/ActionIcon.tsx'
import { PersonName } from '@/shared/people/PersonName.tsx'
import { ReplyForm } from '@/shared/reply/ReplyForm.tsx'
import { Timeline, TimelineItem } from '@/shared/timeline/Timeline.tsx'
import styles from './desk.module.css'

/** Tipo TicketPanelProps. */
type TicketPanelProps = {
  ticket: WireTicket
  workspace: Workspace
  nowMs: number
}

/** Conversa, caixa de resposta e os fatos ao lado. O rascunho fica no compositor. */
export function TicketPanel({ ticket, workspace, nowMs }: TicketPanelProps) {
  /** Valor valor. */
  const { t, i18n } = useTranslation()
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
  /** Valor thread. */
  const thread = useRef<HTMLDivElement>(null)
  /** Valor seenCount. */
  const seenCount = useRef(messages.length)
  useEffect(() => {
    if (messages.length > seenCount.current) {
      thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: 'smooth' })
    }
    seenCount.current = messages.length
  }, [messages.length])
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={ticket.id}
        className={styles.detail}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
      >
        <section className={styles.conversation} aria-label={t('ticket.conversation')}>
          <header className={styles.issueHead}>
            <p className={styles.number}>{ticket.number}</p>
            <h1>{ticket.title}</h1>
            <Badge color="gray" variant="soft">
              {t(`status.${ticket.status}`)}
            </Badge>
          </header>
          <div className={styles.thread} ref={thread}>
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
                    <time dateTime={ticket.openedAt}>
                      {formatWhen(ticket.openedAt, i18n.language)}
                    </time>
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
            <section className={styles.block} aria-label={t('ticket.activity')}>
              <h2>{t('ticket.activity')}</h2>
              <Timeline>
                <AnimatePresence initial={false}>
                  {timeline.map((entry) =>
                    entry.kind === 'message' ? (
                      <TimelineItem
                        key={entry.message.id}
                        kind={entry.message.visibility === 'internal' ? 'note' : 'message'}
                      >
                        <article
                          className={
                            entry.message.visibility === 'internal' ? styles.note : styles.bubble
                          }
                        >
                          <header className={styles.entryHead}>
                            <strong>
                              <PersonName
                                userId={entry.message.authorId}
                                name={name(entry.message.authorId)}
                              />
                              {entry.message.visibility === 'internal'
                                ? ` · ${t('ticket.internalNote')}`
                                : ''}
                            </strong>
                            <span className={styles.when}>
                              <time dateTime={entry.message.createdAt}>
                                {formatWhen(entry.message.createdAt, i18n.language)}
                              </time>
                              {entry.message.editedAt ? (
                                <time className={styles.edited} dateTime={entry.message.editedAt}>
                                  {t('ticket.editedAt', {
                                    when: formatWhen(entry.message.editedAt, i18n.language),
                                  })}
                                </time>
                              ) : null}
                            </span>
                          </header>
                          <MessageBody
                            actor={workspace.viewer}
                            message={entry.message}
                            ticket={ticket}
                          />
                        </article>
                      </TimelineItem>
                    ) : (
                      <TimelineItem key={entry.change.id} kind="update">
                        <div className={styles.event}>
                          <time dateTime={entry.change.occurredAt}>
                            {formatWhen(entry.change.occurredAt, i18n.language)}
                          </time>
                          <p>
                            <strong>
                              <PersonName
                                userId={entry.change.userId}
                                name={name(entry.change.userId)}
                              />
                            </strong>
                            {' · '}
                            {t('ticket.statusChanged', {
                              status: t(`status.${entry.change.to}`),
                              reason: entry.change.reason,
                            })}
                          </p>
                        </div>
                      </TimelineItem>
                    ),
                  )}
                </AnimatePresence>
              </Timeline>
            </section>
          </div>
          {capabilities.canReply || capabilities.canCreateInternalNote ? (
            <ReplyForm ticketId={ticket.id} allowInternal={capabilities.canCreateInternalNote} />
          ) : (
            <p className={styles.empty}>{t('ticket.closedHint')}</p>
          )}
        </section>
        <aside className={styles.context} aria-label={t('ticket.details')}>
          <dl>
            <dt>
              <ActionLabel name="status">{t('ticket.status')}</ActionLabel>
            </dt>
            <dd>
              <Badge color="gray" variant="soft">
                {t(`status.${ticket.status}`)}
              </Badge>
            </dd>
            <dt>
              <ActionLabel name="user">{t('ticket.assignee')}</ActionLabel>
            </dt>
            <dd>
              <PersonName userId={ticket.assigneeId} name={name(ticket.assigneeId)} />
            </dd>
            <dt>
              <ActionLabel name="calendar">{t('ticket.created')}</ActionLabel>
            </dt>
            <dd>
              <time dateTime={ticket.openedAt}>{formatWhen(ticket.openedAt, i18n.language)}</time>
            </dd>
            <dt>
              <ActionLabel name="refresh">{t('ticket.updated')}</ActionLabel>
            </dt>
            <dd>
              <time dateTime={ticket.updatedAt}>{formatWhen(ticket.updatedAt, i18n.language)}</time>
            </dd>
            {capabilities.canViewTaxonomy ? (
              <>
                <dt>
                  <ActionLabel name="clock">{t('ticket.due')}</ActionLabel>
                </dt>
                <dd className={dueClass(dueState(ticket.dueAt, nowMs).tone)}>
                  {formatDue(ticket.dueAt, nowMs, t)}
                  <time className={styles.dueWhen} dateTime={ticket.dueAt}>
                    {formatWhen(ticket.dueAt, i18n.language)}
                  </time>
                </dd>
              </>
            ) : null}
            {capabilities.canViewTaxonomy && ticket.priority ? (
              <>
                <dt>
                  <ActionLabel name="flag">{t('ticket.priority')}</ActionLabel>
                </dt>
                <dd>
                  <Badge color={priorityColor(ticket.priority)} variant="solid">
                    {t(`priority.${ticket.priority}`)}
                  </Badge>
                </dd>
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
      </motion.div>
    </AnimatePresence>
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
    <Button disabled={mutation.isPending} type="button" onClick={() => mutation.mutate()}>
      <ActionLabel name="take">{t('ticket.take')}</ActionLabel>
    </Button>
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
    <Button disabled={mutation.isPending} type="button" onClick={() => mutation.mutate()}>
      <ActionLabel name="reopen">{t('ticket.reopen')}</ActionLabel>
    </Button>
  )
}

/** Executa StatusDialog. */
function StatusDialog({ ticket, viewer }: { ticket: WireTicket; viewer: User }) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor client. */
  const client = useQueryClient()
  /** Valor valor. */
  const [open, setOpen] = useState(false)
  /** Valor valor. */
  const [reason, setReason] = useState('')
  /** Valor valor. */
  const [to, setTo] = useState<TicketStatus>(
    nextStatuses(ticket.status, viewer.role)[0] ?? ticket.status,
  )
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
      setOpen(false)
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
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button color="gray" type="button" variant="outline">
          <ActionLabel name="status">{t('ticket.changeStatus')}</ActionLabel>
        </Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="440px">
        <Dialog.Title>{t('ticket.changeStatus')}</Dialog.Title>
        <Dialog.Description color="gray" size="2">
          {t('ticket.reasonStays')}
        </Dialog.Description>
        <Flex direction="column" gap="3" mt="3">
          <Text as="label" htmlFor="ticket-status" mb="1" size="2" weight="medium">
            {t('ticket.status')}
          </Text>
          <Select.Root
            value={to}
            onValueChange={(value) => {
              /** Valor next. */
              const next = options.find((status) => status === value)
              if (next) setTo(next)
            }}
          >
            <Select.Trigger id="ticket-status" />
            <Select.Content position="popper">
              {options.map((status) => (
                <Select.Item key={status} value={status}>
                  {t(`status.${status}`)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Text as="label" htmlFor="ticket-reason" size="2" weight="medium">
            {t('ticket.reason')}
          </Text>
          <TextArea
            id="ticket-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          {error ? (
            <Callout.Root color="red" size="1">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          ) : null}
          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button color="gray" type="button" variant="soft">
                <ActionLabel name="x">{t('common.cancel')}</ActionLabel>
              </Button>
            </Dialog.Close>
            <Button disabled={mutation.isPending} type="button" onClick={() => mutation.mutate()}>
              <ActionLabel name="check">{t('ticket.saveStatus')}</ActionLabel>
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
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
      <Select.Root value={consultantId} onValueChange={setConsultantId}>
        <Select.Trigger />
        <Select.Content position="popper">
          {consultants.map((user) => (
            <Select.Item key={user.id} value={user.id}>
              <PersonName userId={user.id} name={user.name} />
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      <Button
        color="gray"
        disabled={mutation.isPending || !consultantId}
        type="submit"
        variant="soft"
      >
        <ActionLabel name="reassign">{t('ticket.reassign')}</ActionLabel>
      </Button>
    </form>
  )
}

/**
 * Classe do prazo na coluna de fatos.
 * @param tone - Tom calculado por `dueState`.
 * @returns Classe do relógio, ou indefinido quando o prazo está folgado.
 */
function dueClass(tone: 'breached' | 'soon' | 'ok'): string | undefined {
  if (tone === 'breached') return styles.clockBreached
  if (tone === 'soon') return styles.clockSoon
  return undefined
}

/**
 * Cor sólida do selo de prioridade.
 * @param priority - Urgência interna do chamado.
 * @returns Cor do selo no tema.
 */
function priorityColor(priority: Priority): 'red' | 'orange' | 'amber' | 'gray' {
  switch (priority) {
    case 'critical':
      return 'red'
    case 'high':
      return 'orange'
    case 'medium':
      return 'amber'
    case 'low':
      return 'gray'
    default: {
      /** Valor unreachable. */
      const unreachable: never = priority
      return unreachable
    }
  }
}
