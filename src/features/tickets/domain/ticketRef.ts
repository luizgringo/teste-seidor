/**
 * Acha o chamado pelo código da URL ou pelo id interno.
 * @param tickets - Chamados visíveis para quem está olhando.
 * @param route - Trecho da URL, como `TCK-10596` ou o id antigo.
 * @returns O chamado correspondente, ou indefinido.
 */
export function ticketByRoute<T extends { id: string; number: string }>(
  tickets: T[],
  route: string | undefined,
): T | undefined {
  if (!route) return undefined
  /** Valor ref. */
  const ref = decodeURIComponent(route)
  return tickets.find((ticket) => ticket.number === ref || ticket.id === ref)
}
