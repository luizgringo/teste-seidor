import { useQuery } from '@tanstack/react-query'
import type { User } from '@/features/tickets/domain/types.ts'

export type SessionState = {
  githubLogin: string
  githubName: string
  persona: User | null
}

export type DeskConfig = {
  githubEnabled: boolean
  devSession: boolean
}

/** The signed-in GitHub user and the persona they are viewing as. Null means signed out. */
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<SessionState | null> => {
      const response = await fetch('/api/session', { credentials: 'same-origin' })
      if (response.status === 401) return null
      if (!response.ok) throw new Error('Could not read the session.')
      return (await response.json()) as SessionState
    },
  })
}

/** Whether GitHub and the local preview entry are available. */
export function useDeskConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: async (): Promise<DeskConfig> => {
      const response = await fetch('/api/config')
      if (!response.ok) throw new Error('Could not read the desk configuration.')
      return (await response.json()) as DeskConfig
    },
  })
}
