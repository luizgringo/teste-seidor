/** Falha da API JSON, com o status HTTP preservado. */
export class ApiError extends Error {
  /** Campo status. */
  readonly status: number

  /** Executa constructor. */
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Envia um pedido JSON no mesmo endereço e devolve o corpo interpretado. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  /** Valor response. */
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    /** Valor body. */
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new ApiError(response.status, body?.message ?? 'Request failed.')
  }
  return (await response.json()) as T
}
