import { useQuery } from '@tanstack/react-query'
import type { ConsultantLoad } from '@/features/tickets/domain/types.ts'
import { ApiError, api } from '@/shared/api/http.ts'
import styles from './team.module.css'

/** Ricardo's morning view: who is overloaded, who is idle, who is about to breach. */
export function TeamPage() {
  const team = useQuery({
    queryKey: ['team'],
    queryFn: () => api<{ consultants: ConsultantLoad[] }>('/api/team'),
  })
  if (team.isLoading) return <p className={styles.page}>Loading the team…</p>
  if (team.error instanceof ApiError && team.error.status === 403) {
    return <p className={styles.page}>The team board is for managers.</p>
  }
  if (!team.data) return <p className={styles.page}>The team could not be loaded.</p>
  return (
    <div className={styles.page}>
      <h1>Team</h1>
      <p>Open work, tickets due within two hours, and time this week with nothing assigned.</p>
      <table>
        <thead>
          <tr>
            <th>Consultant</th>
            <th>Open</th>
            <th>At risk</th>
            <th>Idle this week</th>
          </tr>
        </thead>
        <tbody>
          {team.data.consultants.map((row) => (
            <tr key={row.consultantId}>
              <td>{row.name}</td>
              <td>{row.openCount}</td>
              <td>{row.atRiskCount}</td>
              <td>{formatIdle(row.idleMinutes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatIdle(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  if (hours < 1) return `${minutes}m`
  return `${hours}h`
}
