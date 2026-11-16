const apiBaseUrl = import.meta.env.VITE_API_URL?.trim()

export async function getPing(): Promise<unknown> {
  if (!apiBaseUrl) {
    throw new Error('VITE_API_URL is not configured.')
  }

  const url = new URL('ping', `${apiBaseUrl.replace(/\/+$/, '')}/`)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `GET ${url.pathname} failed (${response.status} ${response.statusText}).`,
    )
  }

  return response.json()
}
