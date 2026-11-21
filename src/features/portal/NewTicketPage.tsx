import { Button, Callout, Flex, Text, TextArea, TextField } from '@radix-ui/themes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { suggestReopen } from '@/features/tickets/domain/similarity.ts'
import type { Ticket } from '@/features/tickets/domain/types.ts'
import { useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import { ApiError, api } from '@/shared/api/http.ts'
import { translateError } from '@/shared/i18n/format.ts'
import { ActionLabel } from '@/shared/icons/ActionIcon.tsx'
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
        <Text as="label" htmlFor="new-ticket-title" size="2" weight="medium">
          {t('newTicket.whatBroke')}
        </Text>
        <TextField.Root
          id="new-ticket-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Text as="label" htmlFor="new-ticket-body" size="2" weight="medium">
          {t('newTicket.whatHappened')}
        </Text>
        <TextArea
          id="new-ticket-body"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {suggestion ? (
          <Callout.Root color="amber" size="1">
            <Callout.Text>
              <Flex align="center" gap="3" justify="between">
                <span>{t('newTicket.suggestion', { number: suggestion.number })}</span>
                <Button
                  color="amber"
                  type="button"
                  variant="soft"
                  onClick={() =>
                    api(`/api/tickets/${suggestion.id}/status`, {
                      method: 'POST',
                      body: JSON.stringify({ to: 'open', reason: t('portal.stillOpen') }),
                    }).then(() => navigate(`/tickets/${suggestion.number}`))
                  }
                >
                  <ActionLabel name="reopen">{t('newTicket.reopen')}</ActionLabel>
                </Button>
              </Flex>
            </Callout.Text>
          </Callout.Root>
        ) : null}
        {error ? (
          <Callout.Root color="red" size="1">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        ) : null}
        <Button type="submit">
          <ActionLabel name="plus">{t('newTicket.submit')}</ActionLabel>
        </Button>
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
