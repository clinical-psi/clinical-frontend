const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

function assertOk(response: Response, path: string) {
  if (response.ok) return;

  // En /auth/* un 403 son credenciales invalidas, no sesion expirada
  if (response.status === 403 && !path.startsWith("/auth/")) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  throw new Error(`La solicitud fallo con el estado ${response.status}`);
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function get<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });

  assertOk(response, path);

  return response.json() as Promise<T>;
}

export async function post<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  assertOk(response, path);

  return response.json() as Promise<T>;
}

export async function put<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  assertOk(response, path);

  return response.json() as Promise<T>;
}

export async function patch<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });

  assertOk(response, path);

  return response.json() as Promise<T>;
}

export async function del(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  assertOk(response, path);
}
