import { Button, TextField } from '@radix-ui/themes'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams, useSearchParams } from 'react-router'
import styles from '@/features/tickets/components/desk.module.css'
import { TicketList } from '@/features/tickets/components/TicketList.tsx'
import { TicketPanel } from '@/features/tickets/components/TicketPanel.tsx'
import { queueSections } from '@/features/tickets/domain/queue.ts'
import { ticketByRoute } from '@/features/tickets/domain/ticketRef.ts'
import { useTicketStream, useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'
import { ActionLabel } from '@/shared/icons/ActionIcon.tsx'

/** Fila da consultora e do gestor, com o chamado aberto ao lado. */
export function QueuePage() {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor workspace. */
  const workspace = useWorkspace()
  useTicketStream(Boolean(workspace.data))
  /** Valor valor. */
  const [params, setParams] = useSearchParams()
  /** Valor valor. */
  const { ticketId } = useParams()
  /** Valor now. */
  const now = Date.now()
  if (workspace.isLoading) return <p className={styles.empty}>{t('queue.loading')}</p>
  if (workspace.isError || !workspace.data) {
    return <p className={styles.error}>{t('queue.error')}</p>
  }
  /** Valor data. */
  const data = workspace.data
  /** Valor query. */
  const query = params.get('q') ?? ''
  /** Valor showDone. */
  const showDone = params.get('done') === '1'
  /** Valor filtered. */
  const filtered = data.tickets.filter((ticket) => {
    /** Valor haystack. */
    const haystack = `${ticket.number} ${ticket.title}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })
  /** Valor sections. */
  const sections = queueSections(filtered, data.viewer, now, showDone)
  /** Valor selected. */
  const selected = ticketByRoute(data.tickets, ticketId)
  if (selected && ticketId !== selected.number) {
    return <Navigate to={`/tickets/${selected.number}`} replace />
  }
  return (
    <div className={selected ? `${styles.page} ${styles.pageOpen}` : styles.page}>
      <div className={styles.list}>
        <search className={styles.filters}>
          <TextField.Root
            aria-label={t('queue.find')}
            className={styles.find}
            placeholder={t('queue.find')}
            value={query}
            onChange={(event) => {
              /** Valor next. */
              const next = new URLSearchParams(params)
              if (event.target.value) next.set('q', event.target.value)
              else next.delete('q')
              setParams(next)
            }}
          />
          {data.viewer.role === 'manager' ? (
            <Button
              color="gray"
              type="button"
              variant="soft"
              onClick={() => {
                /** Valor next. */
                const next = new URLSearchParams(params)
                if (showDone) next.delete('done')
                else next.set('done', '1')
                setParams(next)
              }}
            >
              <ActionLabel name={showDone ? 'eyeOff' : 'eye'}>
                {showDone ? t('queue.hideClosed') : t('queue.showClosed')}
              </ActionLabel>
            </Button>
          ) : null}
        </search>
        <TicketList
          sections={sections}
          users={data.users}
          selectedId={selected?.id}
          nowMs={now}
          showClock={data.viewer.role !== 'customer'}
        />
      </div>
      {selected ? (
        <TicketPanel ticket={selected} workspace={data} nowMs={now} />
      ) : (
        <div className={styles.empty}>
          <h2>{t('queue.emptyTitle')}</h2>
          <p>{t('queue.emptySelection')}</p>
        </div>
      )}
    </div>
  )
}
