import { API_URL } from './config';
import type { ApiErrorBody } from '../types/api';
import { clearSession, getToken } from '../auth/session';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
};

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiErrorBody;
    if (data.error) {
      return data.error;
    }
  } catch {
    // ignore
  }
  return res.statusText || 'Error de servidor';
}

function handleUnauthorized(): void {
  clearSession();
  if (window.location.pathname !== '/sign-in') {
    window.location.assign('/sign-in');
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, formData, auth = true } = options;
  const headers: Record<string, string> = {};

  if (auth) {
    const token = getToken();
    if (!token) {
      handleUnauthorized();
      throw new ApiError(401, 'Sesión no válida');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined && !formData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 401 && auth) {
    handleUnauthorized();
    throw new ApiError(401, 'Sesión expirada');
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }

  return (await res.blob()) as T;
}

export async function apiRequestBytes(path: string): Promise<Blob> {
  const token = getToken();
  if (!token) {
    handleUnauthorized();
    throw new ApiError(401, 'Sesión no válida');
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, 'Sesión expirada');
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  return res.blob();
}
