import { Badge } from '@radix-ui/themes'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { ConsultantLoad } from '@/features/tickets/domain/types.ts'
import { ApiError, api } from '@/shared/api/http.ts'
import { PersonName } from '@/shared/people/PersonName.tsx'
import styles from './team.module.css'

/** Manhã do Ricardo: quem está carregado, quem está ocioso e quem está em risco. */
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
          {team.data.consultants.map((row, index) => (
            <motion.tr
              key={row.consultantId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 8) * 0.03 }}
            >
              <td>
                <PersonName userId={row.consultantId} name={row.name} />
              </td>
              <td>{row.openCount}</td>
              <td>
                {row.atRiskCount > 0 ? (
                  <Badge color="orange" variant="solid">
                    {row.atRiskCount}
                  </Badge>
                ) : (
                  row.atRiskCount
                )}
              </td>
              <td>
                {row.idleMinutes >= 60 ? (
                  <Badge color="amber" variant="solid">
                    {formatIdle(row.idleMinutes)}
                  </Badge>
                ) : (
                  formatIdle(row.idleMinutes)
                )}
              </td>
            </motion.tr>
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
