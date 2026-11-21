import { Button, DropdownMenu } from '@radix-ui/themes'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { useSession } from '@/features/auth/useSession.ts'
import { api } from '@/shared/api/http.ts'
import { LanguageSelect } from '@/shared/i18n/LanguageSelect.tsx'
import { ActionLabel } from '@/shared/icons/ActionIcon.tsx'
import { PersonName } from '@/shared/people/PersonName.tsx'
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
  /** Valor location. */
  const location = useLocation()
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
          <NavLink to="/board">
            <ActionLabel name="board">{t('nav.board')}</ActionLabel>
          </NavLink>
          {persona?.role === 'manager' ? <NavLink to="/team">{t('nav.team')}</NavLink> : null}
          <NavLink to="/tickets/new">
            <ActionLabel name="plus">{t('nav.newTicket')}</ActionLabel>
          </NavLink>
        </nav>
        <div className={styles.tools}>
          <LanguageSelect className={styles.language} />
          {persona ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button className={styles.account} type="button" variant="outline">
                  <PersonName userId={persona.id} name={persona.name} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" collisionPadding={16} sideOffset={8}>
                <DropdownMenu.Item asChild>
                  <Link to="/session">
                    <ActionLabel name="swap">{t('nav.switchPersona')}</ActionLabel>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => void logout()}>
                  <ActionLabel name="signOut">{t('nav.signOut')}</ActionLabel>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          ) : null}
        </div>
      </header>
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stageKey(location.pathname, persona?.role)}
            className={styles.stage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

/**
 * Agrupa a fila e o chamado aberto para a troca de página não repetir a mesa.
 * @param pathname - Caminho atual.
 * @param role - Papel da persona, quando já escolhido.
 * @returns Chave estável da tela.
 */
function stageKey(pathname: string, role: string | undefined): string {
  if (role !== 'customer' && (pathname === '/queue' || pathname.startsWith('/tickets/'))) {
    if (pathname !== '/tickets/new') return '/desk'
  }
  return pathname
}
