import type { TFunction } from 'i18next'
import { dueState } from '@/features/tickets/domain/sla.ts'

/**
 * Frase do prazo no idioma ativo.
 * @param dueAt - Instante ISO do vencimento.
 * @param nowMs - Relógio usado na comparação.
 * @param translate - Função de tradução do i18next.
 * @returns Texto de estourado ou de tempo restante.
 */
export function formatDue(dueAt: string, nowMs: number, translate: TFunction): string {
  /** Valor state. */
  const state = dueState(dueAt, nowMs)
  /** Valor absolute. */
  const absolute = Math.abs(state.minutes)
  /** Valor hours. */
  const hours = Math.floor(absolute / 60)
  /** Valor rest. */
  const rest = absolute % 60
  /** Valor time. */
  const time =
    hours === 0
      ? translate('due.minutes', { count: rest })
      : translate('due.hours', { hours, minutes: rest })
  if (state.tone === 'breached') return translate('due.breached', { time })
  return translate('due.remaining', { time })
}

/**
 * Traduz uma chave de erro da API. Se o texto não for chave, devolve o original.
 * @param message - Chave `errors.*` ou texto já pronto.
 * @param translate - Função de tradução do i18next.
 * @returns Mensagem no idioma ativo.
 */
export function translateError(message: string, translate: TFunction): string {
  if (message.startsWith('errors.')) return translate(message)
  return message
}
