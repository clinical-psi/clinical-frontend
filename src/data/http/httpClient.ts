const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    throw new Error(`La solicitud fallo con el estado ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function post<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`La solicitud fallo con el estado ${response.status}`)
  }

  return response.json() as Promise<T>
}