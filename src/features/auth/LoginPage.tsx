import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router'
import { useDeskConfig, useSession } from '@/features/auth/useSession.ts'
import { api } from '@/shared/api/http.ts'
import { LanguageSelect } from '@/shared/i18n/LanguageSelect.tsx'
import styles from './auth.module.css'

/**
 * Entrada pelo GitHub, com prévia local quando o ambiente de teste está ligado.
 * @returns Tela de login ou redirecionamento se a sessão já existe.
 */
export function LoginPage() {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor session. */
  const session = useSession()
  /** Valor config. */
  const config = useDeskConfig()
  /** Valor client. */
  const client = useQueryClient()
  /** Valor navigate. */
  const navigate = useNavigate()
  if (session.data?.persona) return <Navigate to={homeFor(session.data.persona.role)} replace />
  if (session.data) return <Navigate to="/session" replace />

  /**
   * Abre a escolha de persona sem passar pelo GitHub.
   */
  async function preview() {
    await api('/auth/test-session', { method: 'POST', body: '{}' })
    await client.invalidateQueries({ queryKey: ['session'] })
    navigate('/session')
  }

  return (
    <div className={styles.screen}>
      <motion.section
        className={styles.card}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <LanguageSelect className={styles.language} />
        <p>{t('brand.eyebrow')}</p>
        <h1 className={styles.wordmark}>Northline</h1>
        <p>{t('login.intro')}</p>
        {config.data?.githubEnabled ? (
          <a className={styles.primary} href="/auth/github">
            {t('login.github')}
          </a>
        ) : (
          <p>{t('login.githubMissing')}</p>
        )}
        {config.data?.devSession ? (
          <button className={styles.primary} type="button" onClick={() => void preview()}>
            {t('login.preview')}
          </button>
        ) : null}
      </motion.section>
    </div>
  )
}

/**
 * Destino inicial depois do login, conforme o papel.
 * @param role - Papel da persona.
 * @returns Rota da equipe ou da fila.
 */
function homeFor(role: string): string {
  return role === 'manager' ? '/team' : '/queue'
}
