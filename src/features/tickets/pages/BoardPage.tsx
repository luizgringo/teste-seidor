import { Badge } from '@radix-ui/themes'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import styles from '@/features/tickets/components/board.module.css'
import { capabilitiesFor } from '@/features/tickets/domain/access.ts'
import { boardColumns } from '@/features/tickets/domain/board.ts'
import type { DueTone } from '@/features/tickets/domain/sla.ts'
import { dueState } from '@/features/tickets/domain/sla.ts'
import type { Priority, WireTicket } from '@/features/tickets/domain/types.ts'
import { useTicketStream, useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import { formatDue } from '@/shared/i18n/format.ts'
import { PersonName } from '@/shared/people/PersonName.tsx'

/** Quadro por etapa. Cada pessoa vê só os chamados que já pode ver. */
export function BoardPage() {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor workspace. */
  const workspace = useWorkspace()
  useTicketStream(Boolean(workspace.data))
  /** Valor now. */
  const now = Date.now()
  if (workspace.isLoading) return <p className={styles.board}>{t('board.loading')}</p>
  if (!workspace.data) return <p className={styles.board}>{t('board.error')}</p>
  /** Valor data. */
  const data = workspace.data
  /** Valor staff. */
  const staff = capabilitiesFor(data.viewer, null).canViewTaxonomy
  /** Valor columns. */
  const columns = boardColumns(data.tickets)
  /** Valor name. */
  const name = (id: string | null) =>
    data.users.find((user) => user.id === id)?.name ?? t('common.unassigned')
  return (
    <div className={styles.board}>
      <h1>{t('board.title')}</h1>
      <p className={styles.intro}>{t('board.intro')}</p>
      <div className={styles.columns}>
        {columns.map((column) => (
          <section
            key={column.status}
            className={styles.column}
            aria-label={t(`status.${column.status}`)}
          >
            <header>
              <h2>{t(`status.${column.status}`)}</h2>
              <span className={styles.count}>{column.tickets.length}</span>
            </header>
            {column.tickets.length === 0 ? (
              <p className={styles.empty}>{t('board.empty')}</p>
            ) : null}
            <div className={styles.cards}>
              {column.tickets.map((ticket) => (
                <BoardCard
                  key={ticket.id}
                  ticket={ticket}
                  nowMs={now}
                  staff={staff}
                  assignee={name(ticket.assigneeId)}
                  assigneeId={ticket.assigneeId}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

/** Tipo BoardCardProps. */
type BoardCardProps = {
  ticket: WireTicket
  nowMs: number
  staff: boolean
  assignee: string
  assigneeId: string | null
}

/**
 * Cartão de um chamado dentro da coluna.
 * @param props - Chamado, relógio e se a pessoa vê prazo e prioridade.
 * @returns Link para o código do chamado.
 */
function BoardCard({ ticket, nowMs, staff, assignee, assigneeId }: BoardCardProps) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor tone. */
  const tone = dueState(ticket.dueAt, nowMs).tone
  return (
    <Link
      className={
        staff && tone === 'breached' ? `${styles.card} ${styles.cardBreached}` : styles.card
      }
      to={`/tickets/${ticket.number}`}
    >
      <span className={`${styles.rail} ${staff ? railClass(tone) : styles.railQuiet}`} />
      <span>
        <span className={styles.number}>{ticket.number}</span>
        <strong>{ticket.title}</strong>
        {staff ? (
          <span className={styles.meta}>
            <span className={styles.who}>
              <PersonName userId={assigneeId} name={assignee} />
            </span>
            <span className={`${styles.clock} ${clockClass(tone)}`}>
              {formatDue(ticket.dueAt, nowMs, t)}
            </span>
          </span>
        ) : null}
        {ticket.priority ? (
          <Badge color={priorityColor(ticket.priority)} variant="solid">
            {t(`priority.${ticket.priority}`)}
          </Badge>
        ) : null}
      </span>
    </Link>
  )
}

/**
 * Classe do trilho do prazo.
 * @param tone - Tom calculado por `dueState`.
 * @returns Classe do trilho.
 */
function railClass(tone: DueTone): string {
  if (tone === 'breached') return styles.railBreached ?? ''
  if (tone === 'soon') return styles.railSoon ?? ''
  return styles.railOk ?? ''
}

/**
 * Classe do relógio do prazo.
 * @param tone - Tom calculado por `dueState`.
 * @returns Classe do relógio, ou vazio quando o prazo está folgado.
 */
function clockClass(tone: DueTone): string {
  if (tone === 'breached') return styles.clockBreached ?? ''
  if (tone === 'soon') return styles.clockSoon ?? ''
  return ''
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
