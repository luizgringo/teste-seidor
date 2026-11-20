import { Link } from 'react-router'
import { useTicketStream, useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import styles from './portal.module.css'

/** Helena's list: her tickets, in plain language, newest activity first. */
export function PortalPage() {
  const workspace = useWorkspace()
  useTicketStream(Boolean(workspace.data))
  if (workspace.isLoading) return <p className={styles.portal}>Loading your requests…</p>
  if (!workspace.data) return <p className={styles.portal}>Your requests could not be loaded.</p>
  const tickets = [...workspace.data.tickets].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )
  return (
    <div className={styles.portal}>
      <h1>Your requests</h1>
      <p>You will see when someone picks it up, and what changed since you last looked.</p>
      {tickets.length === 0 ? <p>You have no requests yet.</p> : null}
      {tickets.map((ticket) => (
        <Link key={ticket.id} className={styles.card} to={`/tickets/${ticket.id}`}>
          <strong>{ticket.title}</strong>
          <span>{ticket.statusLabel}</span>
        </Link>
      ))}
    </div>
  )
}
