import * as Dropdown from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useNavigate } from 'react-router'
import { useSession } from '@/features/auth/useSession.ts'
import { api } from '@/shared/api/http.ts'
import { LanguageSelect } from '@/shared/i18n/LanguageSelect.tsx'
import styles from './shell.module.css'

/**
 * Mastro e navegação comuns a quem já entrou.
 * @param children - Conteúdo da página atual.
 * @returns Cabeçalho com fila, equipe e seletor de idioma.
 */
export function Shell({ children }: { children: ReactNode }) {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor session. */
  const session = useSession()
  /** Valor navigate. */
  const navigate = useNavigate()
  /** Valor persona. */
  const persona = session.data?.persona
  /** Valor home. */
  const home = persona?.role === 'manager' ? '/team' : '/queue'

  /**
   * Encerra a sessão e volta ao login.
   */
  async function logout() {
    await api('/api/session/logout', { method: 'POST' })
    await session.refetch()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      <header className={styles.mast}>
        <Link className={styles.brand} to={home}>
          <span className={styles.wordmark}>Northline</span>
          <span className={styles.eyebrow}>{t('brand.eyebrow')}</span>
        </Link>
        <nav className={styles.nav} aria-label={t('nav.queue')}>
          {persona?.role === 'customer' ? (
            <NavLink to="/queue">{t('nav.requests')}</NavLink>
          ) : (
            <NavLink to="/queue">{t('nav.queue')}</NavLink>
          )}
          {persona?.role === 'manager' ? <NavLink to="/team">{t('nav.team')}</NavLink> : null}
          <NavLink to="/tickets/new">{t('nav.newTicket')}</NavLink>
        </nav>
        <LanguageSelect className={styles.language} />
        {persona ? (
          <Dropdown.Root>
            <Dropdown.Trigger className={styles.account}>{persona.name}</Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content className={styles.menu} align="end">
                <Dropdown.Item asChild>
                  <Link to="/session">{t('nav.switchPersona')}</Link>
                </Dropdown.Item>
                <Dropdown.Item onSelect={() => void logout()}>{t('nav.signOut')}</Dropdown.Item>
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        ) : null}
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
