import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useTicketStream, useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import styles from './portal.module.css'

/** Cartão do pedido com leve elevação no hover. */
const MotionCard = motion.create(Link)

/** Lista da Helena: os pedidos dela, do mais recente para o mais antigo. */
export function PortalPage() {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor workspace. */
  const workspace = useWorkspace()
  useTicketStream(Boolean(workspace.data))
  if (workspace.isLoading) return <p className={styles.portal}>{t('portal.loading')}</p>
  if (!workspace.data) return <p className={styles.portal}>{t('portal.error')}</p>
  /** Valor tickets. */
  const tickets = [...workspace.data.tickets].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )
  return (
    <div className={styles.portal}>
      <h1>{t('portal.title')}</h1>
      <p>{t('portal.intro')}</p>
      {tickets.length === 0 ? <p>{t('portal.empty')}</p> : null}
      {tickets.map((ticket) => (
        <MotionCard
          key={ticket.id}
          className={styles.card}
          to={`/tickets/${ticket.id}`}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
        >
          <strong>{ticket.title}</strong>
          <span>{t(`status.${ticket.status}`)}</span>
        </MotionCard>
      ))}
    </div>
  )
}
