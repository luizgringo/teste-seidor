import type { Ticket } from './types.ts'

/** Valor STOP_WORDS. */
const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'to',
  'of',
  'for',
  'in',
  'on',
  'is',
  'it',
  'this',
  'that',
  'with',
  'from',
  'again',
  'after',
])

/**
 * Suggests a closed ticket that looks like the text being typed.
 * The score is the share of meaningful words in the draft that also appear on the closed ticket.
 */
export function suggestReopen(description: string, closedTickets: Ticket[]): Ticket | null {
  /** Valor draft. */
  const draft = tokens(description)
  if (draft.size === 0) return null
  /** Valor best. */
  let best: { ticket: Ticket; score: number } | null = null
  for (const ticket of closedTickets) {
    /** Valor score. */
    const score = overlap(draft, tokens(`${ticket.title} ${ticket.description}`))
    if (score >= 0.45 && (!best || score > best.score)) best = { ticket, score }
  }
  return best?.ticket ?? null
}

/** Executa tokens. */
function tokens(value: string): Set<string> {
  /** Valor words. */
  const words = value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  return new Set(words)
}

/** Executa overlap. */
function overlap(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0
  /** Valor shared. */
  let shared = 0
  for (const word of left) if (right.has(word)) shared += 1
  return shared / left.size
}
