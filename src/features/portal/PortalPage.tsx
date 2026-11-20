import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useTicketStream, useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import styles from './portal.module.css'

/** Helena's list: her tickets, in plain language, newest activity first. */
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
        <Link key={ticket.id} className={styles.card} to={`/tickets/${ticket.id}`}>
          <strong>{ticket.title}</strong>
          <span>{t(`status.${ticket.status}`)}</span>
        </Link>
      ))}
    </div>
  )
}
