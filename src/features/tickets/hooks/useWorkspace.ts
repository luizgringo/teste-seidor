import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ClientEvent, Workspace } from '@/features/tickets/domain/types.ts'
import { reduceWorkspace } from '@/features/tickets/domain/workspace.ts'
import { api } from '@/shared/api/http.ts'

/** Loads the desk already filtered for the current persona. */
export function useWorkspace() {
  return useQuery({
    queryKey: ['workspace'],
    queryFn: () => api<Workspace>('/api/workspace'),
  })
}

/** Applies socket events onto the workspace without touching an open draft. */
export function useTicketStream(enabled: boolean) {
  const client = useQueryClient()
  useEffect(() => {
    if (!enabled) return
    let closed = false
    let socket: WebSocket | null = null
    let timer = 0
    const seen = new Set<string>()

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      socket = new WebSocket(`${protocol}://${window.location.host}/ws`)
      socket.onmessage = (message) => {
        const event = parseEvent(message.data)
        if (!event || seen.has(event.id)) return
        seen.add(event.id)
        client.setQueryData<Workspace>(['workspace'], (current) =>
          current ? reduceWorkspace(current, event) : current,
        )
        void client.invalidateQueries({ queryKey: ['team'] })
      }
      socket.onclose = () => {
        if (!closed) timer = window.setTimeout(connect, 1000)
      }
    }

    connect()
    return () => {
      closed = true
      window.clearTimeout(timer)
      socket?.close()
    }
  }, [client, enabled])
}

function parseEvent(raw: unknown): ClientEvent | null {
  if (typeof raw !== 'string') return null
  try {
    const value = JSON.parse(raw) as ClientEvent
    if (!value || typeof value.id !== 'string') return null
    if (
      value.type === 'ticket.opened' ||
      value.type === 'ticket.assigned' ||
      value.type === 'message.added' ||
      value.type === 'status.changed'
    ) {
      return value
    }
    return null
  } catch {
    return null
  }
}
