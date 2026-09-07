export interface RequestOptions extends RequestInit {
  data?: unknown;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

/**
 * Resolves API paths cleanly without duplicate /api prefixes and handles
 * both client-side and server-side (SSR) execution contexts.
 */
export function resolveApiUrl(path: string): string {
  const isServer = typeof window === 'undefined';
  let base = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/^["']|["']$/g, '').trim();

  if (base && !base.startsWith('http://') && !base.startsWith('https://') && !base.startsWith('/')) {
    base = `https://${base}`;
  }

  base = base.replace(/\/+$/, '');

  // In server-side environments (SSR, generateMetadata, sitemap), Node fetch
  // requires an absolute URL. Fallback to localhost:3001 if no env var is present.
  if (!base && isServer) {
    base = 'http://localhost:3001';
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (!base) {
    return cleanPath;
  }

  // Prevent double /api prefix if base already ends with /api and path starts with /api/
  if (base.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${base}${cleanPath.slice(4)}`;
  }

  return `${base}${cleanPath}`;
}

async function refreshTokens(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshUrl = resolveApiUrl('/api/v1/auth/refresh');
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Refresh token invalid or expired');
      }

      const data = (await response.json()) as { accessToken: string };
      const token = data.accessToken;
      setAccessToken(token);
      return token;
    } catch {
      setAccessToken(null);
      // Dispatch a custom logout event so that context listeners can update state
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-logout'));
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// TODO(migration): Use proper DTO/Response types instead of any when fully migrating to typed calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { data, headers, ...customConfig } = options;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    method: options.method || (data ? 'POST' : 'GET'),
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    credentials: 'include',
    ...customConfig,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const fullPath = resolveApiUrl(path);

  let response = await fetch(fullPath, config);

  // If 401 and not an auth path, try to refresh
  const isAuthPath =
    path.includes('/auth/login') ||
    path.includes('/auth/register') ||
    path.includes('/auth/refresh');

  if (response.status === 401 && !isAuthPath) {
    const newToken = await refreshTokens();
    if (newToken) {
      // Retry request with new token
      const retryHeaders = {
        ...config.headers,
        Authorization: `Bearer ${newToken}`,
      } as Record<string, string>;

      response = await fetch(fullPath, {
        ...config,
        headers: retryHeaders,
      });
    }
  }

  if (!response.ok) {
    let errorData: { message?: string } | undefined;
    try {
      errorData = (await response.json()) as { message?: string };
    } catch {
      errorData = { message: response.statusText };
    }
    throw new ApiError(
      errorData?.message || 'An error occurred while making the request.',
      response.status,
      errorData
    );
  }

  // Handle response bodies cleanly
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return {} as T;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const api = {
  get: <T = any>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T = any>(path: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', data }),
  patch: <T = any>(path: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', data }),
  put: <T = any>(path: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', data }),
  delete: <T = any>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
/* eslint-enable @typescript-eslint/no-explicit-any */
