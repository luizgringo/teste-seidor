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
 * Data e hora no idioma ativo.
 * @param iso - Instante ISO.
 * @param locale - Código do idioma, como `pt-BR`.
 * @returns Texto curto com dia, mês, ano e horário.
 */
export function formatWhen(iso: string, locale: string): string {
  /** Valor date. */
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
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
