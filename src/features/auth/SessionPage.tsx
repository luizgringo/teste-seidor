import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router'
import { PERSONA } from '@/features/auth/personas.ts'
import { useSession } from '@/features/auth/useSession.ts'
import { api } from '@/shared/api/http.ts'
import { LanguageSelect } from '@/shared/i18n/LanguageSelect.tsx'
import { PersonName } from '@/shared/people/PersonName.tsx'
import styles from './auth.module.css'

/**
 * Escolhe a persona de negócio depois que o GitHub autenticou a pessoa.
 * @returns Cartões de Marina, Ricardo e Helena.
 */
export function SessionPage() {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor session. */
  const session = useSession()
  /** Valor client. */
  const client = useQueryClient()
  /** Valor navigate. */
  const navigate = useNavigate()
  if (session.isLoading) return <p className={styles.screen}>{t('session.loading')}</p>
  if (!session.data) return <Navigate to="/login" replace />

  /**
   * Grava a persona na sessão e abre a casa dela.
   * @param personaId - Identificador estável da persona.
   * @param role - Papel usado só para escolher a rota.
   */
  async function choose(personaId: string, role: string) {
    await api('/api/session/persona', {
      method: 'POST',
      body: JSON.stringify({ personaId }),
    })
    await client.invalidateQueries({ queryKey: ['session'] })
    await client.invalidateQueries({ queryKey: ['workspace'] })
    navigate(role === 'manager' ? '/team' : '/queue')
  }

  /** Valor choices. */
  const choices = [
    { id: PERSONA.marina, name: 'Marina Costa', detail: t('session.marina'), role: 'consultant' },
    { id: PERSONA.ricardo, name: 'Ricardo Alves', detail: t('session.ricardo'), role: 'manager' },
    { id: PERSONA.helena, name: 'Helena Carvalho', detail: t('session.helena'), role: 'customer' },
  ]

  return (
    <div className={styles.screen}>
      <motion.section
        className={styles.card}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.cardHead}>
          <p>
            {t('session.signedIn', {
              name:
                session.data.githubLogin === 'local-preview'
                  ? t('session.localName')
                  : session.data.githubName,
            })}
          </p>
          <LanguageSelect />
        </div>
        <h1>{t('session.title')}</h1>
        <div className={styles.choices}>
          {choices.map((choice) => (
            <motion.button
              key={choice.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => void choose(choice.id, choice.role)}
            >
              <strong>
                <PersonName userId={choice.id} name={choice.name} />
              </strong>
              <span>{choice.detail}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
