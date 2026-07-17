const BASE_URL = '/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

/** Turn a non-OK Response into a typed ApiError that mirrors the server's envelope. */
async function toApiError(res: Response): Promise<ApiError> {
  let code = 'HTTP_ERROR';
  let message = `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as ErrorEnvelope;
    if (body.error?.code) code = body.error.code;
    if (body.error?.message) message = body.error.message;
  } catch {
    // non-JSON error body — keep defaults
  }
  return new ApiError(res.status, code, message);
}

/**
 * GET a JSON endpoint, throwing a typed ApiError that mirrors the server's envelope.
 *
 * `cache: 'no-cache'` forces the browser to revalidate with the origin every time
 * rather than serving a stale body from its HTTP cache (the API sends CDN-oriented
 * `s-maxage` + `stale-while-revalidate`). React Query is the client cache of record,
 * so a just-posted review shows up immediately after its query is invalidated.
 * With ETags, an unchanged resource still revalidates cheaply via a 304.
 */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { signal, cache: 'no-cache' });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Could not reach the server. Check your connection.');
  }

  if (!res.ok) throw await toApiError(res);
  return res.json() as Promise<T>;
}

/** POST a JSON body and read a typed JSON response back. */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Could not reach the server. Check your connection.');
  }

  if (!res.ok) throw await toApiError(res);
  return res.json() as Promise<T>;
}

/** POST multipart form data (file uploads); reads a typed JSON response back. */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method: 'POST', body: form });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Could not reach the server. Check your connection.');
  }

  if (!res.ok) throw await toApiError(res);
  return res.json() as Promise<T>;
}

/** Serialize a params object to a query string, dropping empty values. */
export function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === false) continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}
