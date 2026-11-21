import { compareByDue } from './sla.ts'
import type { TicketStatus, WireTicket } from './types.ts'
import { TICKET_STATUSES } from './types.ts'

/** Uma coluna do quadro, na ordem do ciclo do chamado. */
export type BoardColumn = {
  status: TicketStatus
  tickets: WireTicket[]
}

/**
 * Agrupa os chamados visíveis por status e deixa o prazo mais perto no topo.
 * @param tickets - Chamados que esta pessoa já pode ver.
 * @returns Uma coluna para cada etapa, mesmo vazia.
 */
export function boardColumns(tickets: WireTicket[]): BoardColumn[] {
  return TICKET_STATUSES.map((status) => ({
    status,
    tickets: tickets
      .filter((ticket) => ticket.status === status)
      .slice()
      .sort(compareByDue),
  }))
}
