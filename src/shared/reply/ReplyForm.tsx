import { Button, Callout, SegmentedControl, Text, TextArea } from '@radix-ui/themes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, api } from '@/shared/api/http.ts'
import { translateError } from '@/shared/i18n/format.ts'
import { ActionLabel } from '@/shared/icons/ActionIcon.tsx'
import styles from './reply-form.module.css'

/** Visibilidade de uma resposta. */
type ReplyVisibility = 'public' | 'internal'

/**
 * Formulário para responder um chamado. A nota interna só aparece quando a pessoa pode escrevê-la.
 * @param ticketId - Chamado que recebe a mensagem.
 * @param allowInternal - Quando verdadeiro, oferece nota interna além da resposta pública.
 * @returns O formulário de resposta.
 */
export function ReplyForm({
  ticketId,
  allowInternal = false,
}: {
  ticketId: string
  allowInternal?: boolean
}) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor client. */
  const client = useQueryClient()
  /** Valor body. */
  const [body, setBody] = useState('')
  /** Valor visibility. */
  const [visibility, setVisibility] = useState<ReplyVisibility>('public')
  /** Valor error. */
  const [error, setError] = useState('')
  /** Valor kind. */
  const kind: ReplyVisibility = allowInternal ? visibility : 'public'
  /** Valor fieldId. */
  const fieldId = `reply-${ticketId}`
  /** Valor mutation. */
  const mutation = useMutation({
    mutationFn: () =>
      api(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body, visibility: kind }),
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
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
    >
      {allowInternal ? (
        <SegmentedControl.Root
          value={kind}
          onValueChange={(value) => {
            if (value === 'public' || value === 'internal') setVisibility(value)
          }}
        >
          <SegmentedControl.Item value="public">
            <ActionLabel name="reply">{t('ticket.replyToCustomer')}</ActionLabel>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="internal">
            <ActionLabel name="note">{t('ticket.internalNote')}</ActionLabel>
          </SegmentedControl.Item>
        </SegmentedControl.Root>
      ) : null}
      <Text as="label" htmlFor={fieldId} size="2" weight="medium">
        {t('ticket.message')}
      </Text>
      <TextArea id={fieldId} value={body} onChange={(event) => setBody(event.target.value)} />
      {error ? (
        <Callout.Root color="red" size="1">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      ) : null}
      <Button disabled={mutation.isPending} type="submit">
        <ActionLabel name={kind === 'internal' ? 'note' : 'send'}>
          {kind === 'internal' ? t('ticket.saveNote') : t('ticket.sendReply')}
        </ActionLabel>
      </Button>
    </form>
  )
}
