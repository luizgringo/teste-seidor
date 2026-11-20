import * as Dropdown from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useSession } from '@/features/auth/useSession.ts'
import { api } from '@/shared/api/http.ts'
import styles from './shell.module.css'

/** Masthead and navigation shared by the signed-in desk. */
export function Shell({ children }: { children: ReactNode }) {
  const session = useSession()
  const navigate = useNavigate()
  const persona = session.data?.persona
  const home = persona?.role === 'manager' ? '/team' : '/queue'

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
          <span className={styles.eyebrow}>Support desk</span>
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          {persona?.role === 'customer' ? (
            <NavLink to="/queue">Your requests</NavLink>
          ) : (
            <NavLink to="/queue">Queue</NavLink>
          )}
          {persona?.role === 'manager' ? <NavLink to="/team">Team</NavLink> : null}
          <NavLink to="/tickets/new">New ticket</NavLink>
        </nav>
        {persona ? (
          <Dropdown.Root>
            <Dropdown.Trigger className={styles.account}>{persona.name}</Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content className={styles.menu} align="end">
                <Dropdown.Item asChild>
                  <Link to="/session">Switch persona</Link>
                </Dropdown.Item>
                <Dropdown.Item onSelect={() => void logout()}>Sign out</Dropdown.Item>
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        ) : null}
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
