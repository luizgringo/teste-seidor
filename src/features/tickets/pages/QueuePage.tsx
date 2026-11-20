import { useParams, useSearchParams } from 'react-router'
import styles from '@/features/tickets/components/desk.module.css'
import { TicketList } from '@/features/tickets/components/TicketList.tsx'
import { TicketPanel } from '@/features/tickets/components/TicketPanel.tsx'
import { queueSections } from '@/features/tickets/domain/queue.ts'
import { useTicketStream, useWorkspace } from '@/features/tickets/hooks/useWorkspace.ts'

/** Consultant and manager queue, with the open ticket beside it. */
export function QueuePage() {
  const workspace = useWorkspace()
  useTicketStream(Boolean(workspace.data))
  const [params, setParams] = useSearchParams()
  const { ticketId } = useParams()
  const now = Date.now()
  if (workspace.isLoading) return <p className={styles.empty}>Loading the queue…</p>
  if (workspace.isError || !workspace.data) {
    return <p className={styles.error}>The queue could not be loaded.</p>
  }
  const data = workspace.data
  const query = params.get('q') ?? ''
  const showDone = params.get('done') === '1'
  const filtered = data.tickets.filter((ticket) => {
    const haystack = `${ticket.number} ${ticket.title}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })
  const sections = queueSections(filtered, data.viewer, now, showDone)
  const selected = data.tickets.find((ticket) => ticket.id === ticketId)
  return (
    <div className={styles.page}>
      <div className={styles.list}>
        <search className={styles.filters}>
          <input
            aria-label="Find a ticket"
            value={query}
            placeholder="Find a ticket"
            onChange={(event) => {
              const next = new URLSearchParams(params)
              if (event.target.value) next.set('q', event.target.value)
              else next.delete('q')
              setParams(next)
            }}
          />
          {data.viewer.role === 'manager' ? (
            <button
              className={styles.quiet}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params)
                if (showDone) next.delete('done')
                else next.set('done', '1')
                setParams(next)
              }}
            >
              {showDone ? 'Hide closed' : 'Show closed'}
            </button>
          ) : null}
        </search>
        <TicketList
          sections={sections}
          users={data.users}
          selectedId={ticketId}
          nowMs={now}
          showClock={data.viewer.role !== 'customer'}
        />
      </div>
      {selected ? (
        <TicketPanel ticket={selected} workspace={data} nowMs={now} />
      ) : (
        <p className={styles.empty}>Choose a ticket. The ones about to breach are at the top.</p>
      )}
    </div>
  )
}
