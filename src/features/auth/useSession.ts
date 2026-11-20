import { useQuery } from '@tanstack/react-query'
import type { User } from '@/features/tickets/domain/types.ts'

/** Tipo SessionState. */
export type SessionState = {
  githubLogin: string
  githubName: string
  persona: User | null
}

/** Tipo DeskConfig. */
export type DeskConfig = {
  githubEnabled: boolean
  devSession: boolean
}

/** A pessoa autenticada no GitHub e a persona que ela está vendo. Nulo significa que saiu. */
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<SessionState | null> => {
      /** Valor response. */
      const response = await fetch('/api/session', { credentials: 'same-origin' })
      if (response.status === 401) return null
      if (!response.ok) throw new Error('Could not read the session.')
      return (await response.json()) as SessionState
    },
  })
}

/** Diz se o GitHub e a prévia local estão disponíveis. */
export function useDeskConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: async (): Promise<DeskConfig> => {
      /** Valor response. */
      const response = await fetch('/api/config')
      if (!response.ok) throw new Error('Could not read the desk configuration.')
      return (await response.json()) as DeskConfig
    },
  })
}
