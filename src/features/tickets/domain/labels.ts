import type { TicketStatus } from './types.ts'

/**
 * Plain-language status for someone who does not know the internal workflow.
 */
export function statusLabel(status: TicketStatus): string {
  switch (status) {
    case 'open':
      return 'Aguardando alguém assumir'
    case 'in_progress':
      return 'Alguém está cuidando'
    case 'waiting_on_customer':
      return 'Precisamos de você'
    case 'resolved':
      return 'Resolvido'
    case 'closed':
      return 'Fechado'
    default: {
      /** Valor neverStatus. */
      const neverStatus: never = status
      return neverStatus
    }
  }
}
