/** Builds the GitHub authorize URL, or null when the app is not configured. */
export function githubAuthorizeUrl(state: string): string | null {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId || !process.env.GITHUB_CLIENT_SECRET) return null
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
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
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
  const tokenBody = (await tokenResponse.json()) as { access_token?: string }
  if (!tokenBody.access_token) return null
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${tokenBody.access_token}`,
      'user-agent': 'northline-support',
    },
  })
  if (!userResponse.ok) return null
  const user = (await userResponse.json()) as { login?: string; name?: string | null }
  if (!user.login) return null
  return { login: user.login, name: user.name || user.login }
}

function callbackUrl(): string {
  const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
  return `${appUrl.replace(/\/$/, '')}/auth/github/callback`
}
