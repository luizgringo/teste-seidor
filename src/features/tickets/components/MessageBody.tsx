import { Button, Flex, TextArea } from '@radix-ui/themes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { canReviseMessage } from '@/features/tickets/domain/access.ts'
import type { Message, User, WireTicket } from '@/features/tickets/domain/types.ts'
import { ApiError, api } from '@/shared/api/http.ts'
import { translateError } from '@/shared/i18n/format.ts'
import { ActionLabel } from '@/shared/icons/ActionIcon.tsx'
import styles from './message-body.module.css'

/** Tipo MessageBodyProps. */
type MessageBodyProps = {
  ticket: WireTicket
  message: Message
  actor: User
}

/**
 * Texto da mensagem. O autor vê editar e apagar.
 * @param props - Chamado, mensagem e pessoa que está olhando.
 * @returns O parágrafo ou o formulário de edição.
 */
export function MessageBody({ ticket, message, actor }: MessageBodyProps) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor client. */
  const client = useQueryClient()
  /** Valor editing. */
  const [editing, setEditing] = useState(false)
  /** Valor draft. */
  const [draft, setDraft] = useState(message.body)
  /** Valor confirming. */
  const [confirming, setConfirming] = useState(false)
  /** Valor error. */
  const [error, setError] = useState('')
  /** Valor waitingBody. */
  const [waitingBody, setWaitingBody] = useState(false)
  /** Valor canRevise. */
  const canRevise = canReviseMessage(actor, ticket, message)
  /** Valor save. */
  const save = useMutation({
    mutationFn: () =>
      api(`/api/tickets/${ticket.id}/messages/${message.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ body: draft }),
      }),
    onSuccess: async () => {
      setError('')
      setWaitingBody(true)
      await client.invalidateQueries({ queryKey: ['workspace'] })
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? translateError(reason.message, t) : t('ticket.editError'),
      ),
  })
  /** Valor remove. */
  const remove = useMutation({
    mutationFn: () => api(`/api/tickets/${ticket.id}/messages/${message.id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['workspace'] })
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? translateError(reason.message, t) : t('ticket.deleteError'),
      ),
  })
  useEffect(() => {
    if (!waitingBody || save.isPending) return
    if (message.body !== draft.trim()) return
    setWaitingBody(false)
    setEditing(false)
  }, [waitingBody, save.isPending, message.body, draft])
  if (!canRevise) return <MessageText body={message.body} />
  if (editing) {
    return (
      <form
        className={styles.editor}
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate()
        }}
      >
        <TextArea value={draft} onChange={(event) => setDraft(event.target.value)} />
        <Flex gap="2">
          <Button disabled={save.isPending || draft.trim().length < 1} size="1" type="submit">
            <ActionLabel name="check">{t('ticket.saveEdit')}</ActionLabel>
          </Button>
          <Button
            color="gray"
            size="1"
            type="button"
            variant="soft"
            onClick={() => {
              setDraft(message.body)
              setEditing(false)
              setError('')
            }}
          >
            <ActionLabel name="x">{t('common.cancel')}</ActionLabel>
          </Button>
        </Flex>
        {error ? <p className={styles.error}>{error}</p> : null}
      </form>
    )
  }
  return (
    <>
      <MessageText body={message.body} />
      <Flex className={styles.actions} gap="2">
        {confirming ? (
          <>
            <Button
              color="red"
              disabled={remove.isPending}
              size="1"
              type="button"
              onClick={() => remove.mutate()}
            >
              <ActionLabel name="trash">{t('ticket.confirmDelete')}</ActionLabel>
            </Button>
            <Button
              color="gray"
              size="1"
              type="button"
              variant="soft"
              onClick={() => setConfirming(false)}
            >
              <ActionLabel name="x">{t('common.cancel')}</ActionLabel>
            </Button>
          </>
        ) : (
          <>
            <Button
              color="gray"
              size="1"
              type="button"
              variant="soft"
              onClick={() => {
                setDraft(message.body)
                setEditing(true)
                setError('')
              }}
            >
              <ActionLabel name="edit">{t('ticket.edit')}</ActionLabel>
            </Button>
            <Button
              color="red"
              size="1"
              type="button"
              variant="soft"
              onClick={() => setConfirming(true)}
            >
              <ActionLabel name="trash">{t('ticket.delete')}</ActionLabel>
            </Button>
          </>
        )}
      </Flex>
      {error ? <p className={styles.error}>{error}</p> : null}
    </>
  )
}

/**
 * Troca o texto com uma entrada curta quando o corpo muda.
 * @param body - Texto atual da mensagem.
 * @returns Parágrafo animado.
 */
function MessageText({ body }: { body: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={body}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
      >
        {body}
      </motion.p>
    </AnimatePresence>
  )
}
