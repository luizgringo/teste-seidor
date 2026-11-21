import type { Message, StatusChange } from '@/features/tickets/domain/types.ts'

/** Atualização da equipe que a pessoa que abriu o pedido pode ler. */
export type TeamUpdate =
  | { kind: 'status'; at: string; change: StatusChange }
  | { kind: 'reply'; at: string; message: Message }

/** Frase pronta para um motivo que o sistema grava sozinho. */
export type SystemProgress = 'taken' | 'reassigned' | 'completed' | 'written'

/**
 * Último fato da equipe neste pedido. A mensagem da própria pessoa não conta como andamento.
 * @param requesterId - Quem abriu o pedido.
 * @param messages - Mensagens já filtradas para essa pessoa.
 * @param changes - Mudanças de status desse pedido.
 * @returns O fato mais recente, ou nada quando a equipe ainda não agiu.
 */
export function latestTeamUpdate(
  requesterId: string,
  messages: Message[],
  changes: StatusChange[],
): TeamUpdate | undefined {
  /** Valor updates. */
  const updates: TeamUpdate[] = [
    ...changes.map((change) => ({ kind: 'status' as const, at: change.occurredAt, change })),
    ...messages
      .filter((message) => message.authorId !== requesterId && message.visibility === 'public')
      .map((message) => ({
        kind: 'reply' as const,
        at: message.editedAt ?? message.createdAt,
        message,
      })),
  ]
  return updates.sort((left, right) => right.at.localeCompare(left.at))[0]
}

/**
 * Separa o motivo automático do texto que a equipe escreveu.
 * @param reason - Motivo gravado na mudança de status.
 * @returns Qual frase a tela deve usar.
 */
export function systemProgress(reason: string): SystemProgress {
  if (reason === 'Chamado assumido.') return 'taken'
  if (reason === 'Chamado redistribuído.') return 'reassigned'
  if (reason === 'Atendimento concluído.') return 'completed'
  return 'written'
}

/**
 * Escolhe a frase da atualização e os valores já prontos para traduzir.
 * @param change - Mudança de status visível para quem abriu.
 * @param status - Status já traduzido para a frase simples.
 * @returns Chave e valores da frase.
 */
export function progressCopy(
  change: StatusChange,
  status: string,
): {
  key:
    | 'portal.taken'
    | 'portal.reassigned'
    | 'portal.completed'
    | 'portal.moved'
    | 'portal.progress'
  values: Record<string, string>
} {
  if (change.reason === 'Chamado assumido.' && change.to !== 'in_progress') {
    return { key: 'portal.moved', values: { status } }
  }
  /** Valor kind. */
  const kind = systemProgress(change.reason)
  switch (kind) {
    case 'taken':
      return { key: 'portal.taken', values: {} }
    case 'reassigned':
      return { key: 'portal.reassigned', values: {} }
    case 'completed':
      return { key: 'portal.completed', values: {} }
    case 'written':
      return { key: 'portal.progress', values: { status, reason: change.reason } }
    default: {
      /** Valor unreachable. */
      const unreachable: never = kind
      return unreachable
    }
  }
}
