import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router'
import { useDeskConfig, useSession } from '@/features/auth/useSession.ts'
import { LanguageSelect } from '@/shared/i18n/LanguageSelect.tsx'
import styles from './auth.module.css'

/**
 * Entrada pela conta GitHub. Sem essa conta, a mesa não abre.
 * @returns Tela de login ou redirecionamento se a sessão já existe.
 */
export function LoginPage() {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor session. */
  const session = useSession()
  /** Valor config. */
  const config = useDeskConfig()
  /** Valor params. */
  const [params] = useSearchParams()
  if (session.data?.persona) return <Navigate to={homeFor(session.data.persona.role)} replace />
  if (session.data) return <Navigate to="/session" replace />

  /** Valor githubReady. */
  const githubReady = config.data?.githubEnabled === true
  /** Valor githubMissing. */
  const githubMissing = config.data?.githubEnabled === false

  return (
    <div className={styles.screen}>
      <motion.section
        className={styles.login}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.loginTools}>
          <LanguageSelect />
        </div>
        <p className={styles.brand}>{t('brand.eyebrow')}</p>
        <h1 className={styles.wordmark}>Northline</h1>
        <h2 className={styles.title}>{t('login.title')}</h2>
        <p className={styles.intro}>{t('login.intro')}</p>
        {params.get('error') === 'github' ? (
          <p className={styles.error}>{t('login.failed')}</p>
        ) : null}
        {githubReady ? (
          <a className={styles.github} href="/auth/github">
            <GitHubMark />
            {t('login.github')}
          </a>
        ) : githubMissing ? (
          <p className={styles.missing}>{t('login.githubMissing')}</p>
        ) : (
          <p className={styles.missing}>{t('common.loadingDesk')}</p>
        )}
      </motion.section>
    </div>
  )
}

/**
 * Marca do GitHub no botão de entrada.
 * @returns Ícone decorativo.
 */
function GitHubMark(): ReactNode {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 16 16">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.68 7.68 0 0 1 8 3.47c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
      />
    </svg>
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
