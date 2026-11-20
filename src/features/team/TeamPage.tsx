import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { ConsultantLoad } from '@/features/tickets/domain/types.ts'
import { ApiError, api } from '@/shared/api/http.ts'
import styles from './team.module.css'

/** Ricardo's morning view: who is overloaded, who is idle, who is about to breach. */
export function TeamPage() {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor team. */
  const team = useQuery({
    queryKey: ['team'],
    queryFn: () => api<{ consultants: ConsultantLoad[] }>('/api/team'),
  })
  if (team.isLoading) return <p className={styles.page}>{t('team.loading')}</p>
  if (team.error instanceof ApiError && team.error.status === 403) {
    return <p className={styles.page}>{t('team.forbidden')}</p>
  }
  if (!team.data) return <p className={styles.page}>{t('team.error')}</p>
  return (
    <div className={styles.page}>
      <h1>{t('team.title')}</h1>
      <p>{t('team.intro')}</p>
      <table>
        <thead>
          <tr>
            <th>{t('team.consultant')}</th>
            <th>{t('team.open')}</th>
            <th>{t('team.atRisk')}</th>
            <th>{t('team.idle')}</th>
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

/** Executa formatIdle. */
function formatIdle(minutes: number): string {
  /** Valor hours. */
  const hours = Math.floor(minutes / 60)
  if (hours < 1) return `${minutes}m`
  return `${hours}h`
}
