import { Link } from 'react-router'
import { dueLabel, dueState } from '@/features/tickets/domain/sla.ts'
import type { User, WireTicket } from '@/features/tickets/domain/types.ts'
import styles from './desk.module.css'

type TicketListProps = {
  sections: { id: string; title: string; tickets: WireTicket[] }[]
  users: User[]
  selectedId?: string
  nowMs: number
  showClock: boolean
}

/** Scrollable queue. The rail is the due state, not only a color. */
export function TicketList({ sections, users, selectedId, nowMs, showClock }: TicketListProps) {
  if (sections.length === 0) {
    return <p className={styles.empty}>Nothing in this queue.</p>
  }
  return (
    <div>
      {sections.map((section) => (
        <section key={section.id} className={styles.section} aria-label={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.tickets.map((ticket) => {
              const tone = dueState(ticket.dueAt, nowMs).tone
              const assignee =
                users.find((user) => user.id === ticket.assigneeId)?.name ?? 'Unassigned'
              return (
                <li key={ticket.id}>
                  <Link
                    className={styles.row}
                    to={`/tickets/${ticket.id}`}
                    aria-current={ticket.id === selectedId ? 'true' : undefined}
                  >
                    <span className={`${styles.rail} ${railClass(tone)}`} />
                    <span>
                      <span className={styles.number}>{ticket.number}</span>
                      <p className={styles.title}>{ticket.title}</p>
                      <span className={styles.meta}>
                        <span>{assignee}</span>
                        {showClock ? (
                          <span className={`${styles.clock} ${clockClass(tone)}`}>
                            {dueLabel(ticket.dueAt, nowMs)}
                          </span>
                        ) : (
                          <span>{ticket.statusLabel}</span>
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function railClass(tone: 'breached' | 'soon' | 'ok'): string {
  if (tone === 'breached') return styles.railBreached ?? ''
  if (tone === 'soon') return styles.railSoon ?? ''
  return styles.railOk ?? ''
}

function clockClass(tone: 'breached' | 'soon' | 'ok'): string {
  if (tone === 'breached') return styles.clockBreached ?? ''
  if (tone === 'soon') return styles.clockSoon ?? ''
  return ''
}
