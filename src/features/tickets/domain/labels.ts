import type { TicketStatus } from './types.ts'

/**
 * Plain-language status for someone who does not know the internal workflow.
 */
export function statusLabel(status: TicketStatus): string {
  switch (status) {
    case 'open':
      return 'Waiting for someone to pick this up'
    case 'in_progress':
      return 'Someone is on it'
    case 'waiting_on_customer':
      return 'We need you'
    case 'resolved':
      return 'Resolved'
    case 'closed':
      return 'Closed'
    default: {
      const neverStatus: never = status
      return neverStatus
    }
  }
}
