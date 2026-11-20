import { useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router'
import { PERSONA } from '@/features/auth/personas.ts'
import { useSession } from '@/features/auth/useSession.ts'
import { api } from '@/shared/api/http.ts'
import styles from './auth.module.css'

const CHOICES = [
  {
    id: PERSONA.marina,
    name: 'Marina Costa',
    detail: 'Consultant. Forty tickets, and the ones about to breach first.',
  },
  {
    id: PERSONA.ricardo,
    name: 'Ricardo Alves',
    detail: 'Manager. Workload, idle time, and who needs a ticket moved.',
  },
  {
    id: PERSONA.helena,
    name: 'Helena Carvalho',
    detail: 'Customer in Lisbon. Her requests, in plain language.',
  },
]

/** Picks the business persona after GitHub has authenticated the person. */
export function SessionPage() {
  const session = useSession()
  const client = useQueryClient()
  const navigate = useNavigate()
  if (session.isLoading) return <p className={styles.screen}>Loading…</p>
  if (!session.data) return <Navigate to="/login" replace />

  async function choose(personaId: string, role: string) {
    await api('/api/session/persona', {
      method: 'POST',
      body: JSON.stringify({ personaId }),
    })
    await client.invalidateQueries({ queryKey: ['session'] })
    await client.invalidateQueries({ queryKey: ['workspace'] })
    navigate(role === 'manager' ? '/team' : '/queue')
  }

  return (
    <div className={styles.screen}>
      <section className={styles.card}>
        <p>Signed in as {session.data.githubName}</p>
        <h1>Who are you viewing as?</h1>
        <div className={styles.choices}>
          {CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() =>
                void choose(choice.id, choice.name.startsWith('Ricardo') ? 'manager' : 'customer')
              }
            >
              <strong>{choice.name}</strong>
              <span>{choice.detail}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
