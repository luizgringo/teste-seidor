import { useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router'
import { useDeskConfig, useSession } from '@/features/auth/useSession.ts'
import { api } from '@/shared/api/http.ts'
import styles from './auth.module.css'

/** GitHub entry, plus a local preview when the test session is enabled. */
export function LoginPage() {
  const session = useSession()
  const config = useDeskConfig()
  const client = useQueryClient()
  const navigate = useNavigate()
  if (session.data?.persona) return <Navigate to={homeFor(session.data.persona.role)} replace />
  if (session.data) return <Navigate to="/session" replace />

  async function preview() {
    await api('/auth/test-session', { method: 'POST', body: '{}' })
    await client.invalidateQueries({ queryKey: ['session'] })
    navigate('/session')
  }

  return (
    <div className={styles.screen}>
      <section className={styles.card}>
        <p>Support desk</p>
        <h1 className={styles.wordmark}>Northline</h1>
        <p>Sign in, then choose who you are looking through.</p>
        {config.data?.githubEnabled ? (
          <a className={styles.primary} href="/auth/github">
            Continue with GitHub
          </a>
        ) : (
          <p>GitHub login is not configured in this environment.</p>
        )}
        {config.data?.devSession ? (
          <button className={styles.primary} type="button" onClick={() => void preview()}>
            Preview the desk
          </button>
        ) : null}
      </section>
    </div>
  )
}

function homeFor(role: string): string {
  return role === 'manager' ? '/team' : '/queue'
}
