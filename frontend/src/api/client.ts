const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const parseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const apiClient = async <T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> => {
  const headers = new Headers(init.headers ?? {});

  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers
  });

  const body = await parseBody(response);

  if (!response.ok) {
    throw new ApiError((body as { message?: string })?.message ?? 'Request failed.', response.status, body);
  }

  return body as T;
};

export const fileUrl = (path?: string | null) => {
  if (!path) return null;
  const origin = API_URL.replace(/\/api$/, '');
  return `${origin}${path}`;
};
