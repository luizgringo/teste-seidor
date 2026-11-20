/** Builds the GitHub authorize URL, or null when the app is not configured. */
export function githubAuthorizeUrl(state: string): string | null {
  /** Valor clientId. */
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId || !process.env.GITHUB_CLIENT_SECRET) return null
  /** Valor url. */
  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', callbackUrl())
  url.searchParams.set('scope', 'read:user')
  url.searchParams.set('state', state)
  return url.toString()
}

/** Exchanges the callback code for the GitHub login. */
export async function githubIdentity(
  code: string,
): Promise<{ login: string; name: string } | null> {
  /** Valor clientId. */
  const clientId = process.env.GITHUB_CLIENT_ID
  /** Valor clientSecret. */
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  /** Valor tokenResponse. */
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl(),
    }),
  })
  if (!tokenResponse.ok) return null
  /** Valor tokenBody. */
  const tokenBody = (await tokenResponse.json()) as { access_token?: string }
  if (!tokenBody.access_token) return null
  /** Valor userResponse. */
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${tokenBody.access_token}`,
      'user-agent': 'northline-support',
    },
  })
  if (!userResponse.ok) return null
  /** Valor user. */
  const user = (await userResponse.json()) as { login?: string; name?: string | null }
  if (!user.login) return null
  return { login: user.login, name: user.name || user.login }
}

/** Executa callbackUrl. */
function callbackUrl(): string {
  /** Valor appUrl. */
  const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
  return `${appUrl.replace(/\/$/, '')}/auth/github/callback`
}
