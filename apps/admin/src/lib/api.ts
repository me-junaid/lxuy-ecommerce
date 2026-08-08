interface RequestOptions extends RequestInit {
  data?: any;
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
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

async function refreshTokens(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
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
    } catch (err) {
      setAccessToken(null);
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

  const isAuthPath = path.startsWith('/api/v1/auth') || path.startsWith('api/v1/auth');
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const fullPath = isAuthPath 
    ? path 
    : `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  let response = await fetch(fullPath, config);

  if (
    response.status === 401 &&
    path !== '/api/v1/auth/login' &&
    path !== '/api/v1/auth/register' &&
    path !== '/api/v1/auth/refresh'
  ) {
    const newToken = await refreshTokens();
    if (newToken) {
      const retryHeaders = {
        ...config.headers,
        'Authorization': `Bearer ${newToken}`,
      } as Record<string, string>;
      
      response = await fetch(path, {
        ...config,
        headers: retryHeaders,
      });
    }
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new ApiError(
      errorData.message || 'An error occurred while making the request.',
      response.status,
      errorData
    );
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return {} as T;
}

export const api = {
  get: <T = any>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T = any>(path: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', data }),
  patch: <T = any>(path: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', data }),
  put: <T = any>(path: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', data }),
  delete: <T = any>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
