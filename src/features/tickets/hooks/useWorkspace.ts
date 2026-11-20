import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ClientEvent, Workspace } from '@/features/tickets/domain/types.ts'
import { reduceWorkspace } from '@/features/tickets/domain/workspace.ts'
import { api } from '@/shared/api/http.ts'

/** Carrega a mesa já filtrada para a persona atual. */
export function useWorkspace() {
  return useQuery({
    queryKey: ['workspace'],
    queryFn: () => api<Workspace>('/api/workspace'),
  })
}

/** Aplica os eventos do socket na mesa sem mexer num rascunho aberto. */
export function useTicketStream(enabled: boolean) {
  /** Valor client. */
  const client = useQueryClient()
  useEffect(() => {
    if (!enabled) return
    /** Valor closed. */
    let closed = false
    /** Valor socket. */
    let socket: WebSocket | null = null
    /** Valor timer. */
    let timer = 0
    /** Valor seen. */
    const seen = new Set<string>()

    /** Valor connect. */
    const connect = () => {
      /** Valor protocol. */
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      socket = new WebSocket(`${protocol}://${window.location.host}/api/ws`)
      socket.onmessage = (message) => {
        /** Valor event. */
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

/** Executa parseEvent. */
function parseEvent(raw: unknown): ClientEvent | null {
  if (typeof raw !== 'string') return null
  try {
    /** Valor value. */
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
