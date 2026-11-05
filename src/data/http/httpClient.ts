const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

async function assertOk(response: Response, path: string) {
  if (response.ok) return;

  if ((response.status === 401 || response.status === 403) && !path.startsWith("/auth/")) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  let message = `La solicitud fallo con el estado ${response.status}`;
  const detail = await readErrorDetail(response);
  if (response.status === 403) {
    message = "No tienes permiso para realizar esta operación.";
  } else if (response.status === 409) {
    // El bloqueo optimista devuelve un mensaje técnico; las reglas de negocio, uno legible.
    message =
      detail && !/modified by another request/i.test(detail)
        ? detail
        : "El registro cambió en otra sesión. Recarga antes de guardar de nuevo.";
  } else if ((response.status === 412 || response.status === 422) && detail) {
    message = detail;
  }
  throw new HttpError(response.status, message);
}

async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    return typeof body.detail === "string" && body.detail.trim()
      ? body.detail
      : undefined;
  } catch {
    return undefined;
  }
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

// Tolera respuestas 204 o con cuerpo vacio
async function parseBody<T>(response: Response): Promise<T> {
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
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

  await assertOk(response, path);

  return parseBody<T>(response);
}

export async function post<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  await assertOk(response, path);

  return parseBody<T>(response);
}

export async function put<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  await assertOk(response, path);

  return parseBody<T>(response);
}

// Sin Content-Type: el navegador define el boundary del multipart
export async function putForm(path: string, body: FormData): Promise<void> {
  const headers = getAuthHeaders();
  delete headers["Content-Type"];

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers,
    body,
  });

  await assertOk(response, path);
}

export async function patch<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });

  await assertOk(response, path);

  return parseBody<T>(response);
}

export async function del(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await assertOk(response, path);
}
