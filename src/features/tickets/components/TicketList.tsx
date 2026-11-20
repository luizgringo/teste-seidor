import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { DueTone } from '@/features/tickets/domain/sla.ts'
import { dueState } from '@/features/tickets/domain/sla.ts'
import type { User, WireTicket } from '@/features/tickets/domain/types.ts'
import { formatDue } from '@/shared/i18n/format.ts'
import styles from './desk.module.css'

/** Link da fila com deslocamento curto no hover e no clique. */
const MotionLink = motion.create(Link)

/** Propriedades da lista de chamados. */
type TicketListProps = {
  /** Blocos já separados por risco, fila livre e próprios. */
  sections: { id: string; title: string; tickets: WireTicket[] }[]
  /** Pessoas usadas para mostrar o nome de quem atende. */
  users: User[]
  /** Chamado aberto ao lado da lista. */
  selectedId?: string
  /** Relógio da ordenação e do prazo. */
  nowMs: number
  /** Quando falso, a cliente vê a frase de status no lugar do relógio. */
  showClock: boolean
}

/**
 * Lista rolável. O trilho repete o prazo para quem não distingue só pela cor.
 * @param props - Seções, pessoas e o chamado selecionado.
 * @returns A fila ou o aviso de que ela está vazia.
 */
export function TicketList({ sections, users, selectedId, nowMs, showClock }: TicketListProps) {
  /** Valor valor. */
  const { t } = useTranslation()
  if (sections.length === 0) {
    return <p className={styles.empty}>{t('queue.empty')}</p>
  }
  return (
    <div>
      {sections.map((section) => {
        /** Valor title. */
        const title = sectionTitle(section.id, t)
        return (
          <section key={section.id} className={styles.section} aria-label={title}>
            <h2>{title}</h2>
            <ul>
              {section.tickets.map((ticket) => {
                /** Valor tone. */
                const tone = dueState(ticket.dueAt, nowMs).tone
                /** Valor assignee. */
                const assignee =
                  users.find((user) => user.id === ticket.assigneeId)?.name ??
                  t('common.unassigned')
                return (
                  <li key={ticket.id}>
                    <MotionLink
                      className={styles.row}
                      to={`/tickets/${ticket.id}`}
                      aria-current={ticket.id === selectedId ? 'true' : undefined}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.985 }}
                    >
                      <span className={`${styles.rail} ${railClass(tone)}`} />
                      <span>
                        <span className={styles.number}>{ticket.number}</span>
                        <p className={styles.title}>{ticket.title}</p>
                        <span className={styles.meta}>
                          <span>{assignee}</span>
                          {showClock ? (
                            <span className={`${styles.clock} ${clockClass(tone)}`}>
                              {formatDue(ticket.dueAt, nowMs, t)}
                            </span>
                          ) : (
                            <span>{t(`status.${ticket.status}`)}</span>
                          )}
                        </span>
                      </span>
                    </MotionLink>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

/**
 * Título traduzido de um bloco da fila.
 * @param id - Identificador estável do bloco.
 * @param translate - Função de tradução.
 * @returns Título no idioma ativo.
 */
function sectionTitle(id: string, translate: (key: string) => string): string {
  if (id === 'risk') return translate('queue.risk')
  if (id === 'free') return translate('queue.free')
  if (id === 'mine') return translate('queue.mine')
  return translate('queue.all')
}

/**
 * Classe do trilho conforme o tom do prazo.
 * @param tone - Tom calculado por `dueState`.
 * @returns Classe CSS do trilho.
 */
function railClass(tone: DueTone): string {
  if (tone === 'breached') return styles.railBreached ?? ''
  if (tone === 'soon') return styles.railSoon ?? ''
  return styles.railOk ?? ''
}

/**
 * Classe do relógio conforme o tom do prazo.
 * @param tone - Tom calculado por `dueState`.
 * @returns Classe CSS do relógio, ou vazio quando o prazo está folgado.
 */
function clockClass(tone: DueTone): string {
  if (tone === 'breached') return styles.clockBreached ?? ''
  if (tone === 'soon') return styles.clockSoon ?? ''
  return ''
}
