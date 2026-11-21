import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useTicketStream, useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import { formatWhen } from '@/shared/i18n/format.ts'
import { PersonName } from '@/shared/people/PersonName.tsx'
import styles from './portal.module.css'
import { latestTeamUpdate, progressCopy } from './progress.ts'

/** Cartão do pedido com leve elevação no hover. */
const MotionCard = motion.create(Link)

/** Lista da Helena: os pedidos dela, do mais recente para o mais antigo. */
export function PortalPage() {
  /** Valor valor. */
  const { t, i18n } = useTranslation()
  /** Valor workspace. */
  const workspace = useWorkspace()
  useTicketStream(Boolean(workspace.data))
  if (workspace.isLoading) return <p className={styles.portal}>{t('portal.loading')}</p>
  if (!workspace.data) return <p className={styles.portal}>{t('portal.error')}</p>
  /** Valor tickets. */
  const tickets = [...workspace.data.tickets].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )
  /** Valor name. */
  const name = (id: string) =>
    workspace.data?.users.find((user) => user.id === id)?.name ?? t('common.support')
  return (
    <div className={styles.portal}>
      <h1>{t('portal.title')}</h1>
      <p>{t('portal.intro')}</p>
      {tickets.length === 0 ? <p>{t('portal.empty')}</p> : null}
      {tickets.map((ticket) => {
        /** Valor update. */
        const update = latestTeamUpdate(
          ticket.requesterId,
          workspace.data?.messages.filter((message) => message.ticketId === ticket.id) ?? [],
          workspace.data?.statusChanges.filter((change) => change.ticketId === ticket.id) ?? [],
        )
        /** Valor copy. */
        const copy =
          update?.kind === 'status'
            ? progressCopy(update.change, t(`status.${update.change.to}`))
            : undefined
        return (
          <MotionCard
            key={ticket.id}
            className={styles.card}
            to={`/tickets/${ticket.number}`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
          >
            <strong>{ticket.title}</strong>
            <span className={styles.status}>{t(`status.${ticket.status}`)}</span>
            {update?.kind === 'reply' ? (
              <span className={styles.progress}>
                <span className={styles.progressLine}>
                  <PersonName
                    userId={update.message.authorId}
                    name={name(update.message.authorId)}
                  />
                  <span>{update.message.body}</span>
                </span>
                <time dateTime={update.at}>{formatWhen(update.at, i18n.language)}</time>
              </span>
            ) : null}
            {update?.kind === 'status' && copy ? (
              <span className={styles.progress}>
                <span className={styles.progressLine}>
                  <PersonName userId={update.change.userId} name={name(update.change.userId)} />
                  <span>{t(copy.key, copy.values)}</span>
                </span>
                <time dateTime={update.at}>{formatWhen(update.at, i18n.language)}</time>
              </span>
            ) : null}
          </MotionCard>
        )
      })}
    </div>
  )
}
