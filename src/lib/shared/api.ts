export async function apiFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const body = await res.json()

  if (!res.ok || body.ok === false) {
    throw new Error(body.error || `API error ${res.status}`)
  }

  return body as T
}
