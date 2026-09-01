const BASE_PREFIX = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '';
const API_BASE = `${BASE_PREFIX}/api`;

export function getTokens() {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

let refreshPromise: Promise<boolean> | null = null;
type UnauthorizedHandler = () => void;
let onUnauthorizedCallback: UnauthorizedHandler | null = null;

// Global loading listeners
type LoadingListener = (isLoading: boolean, activeRequests: number) => void;
const loadingListeners = new Set<LoadingListener>();
let activeRequestsCount = 0;

export function addLoadingListener(listener: LoadingListener) {
  loadingListeners.add(listener);
  // Emit current state immediately
  listener(activeRequestsCount > 0, activeRequestsCount);
  return () => {
    loadingListeners.delete(listener);
  };
}

export function removeLoadingListener(listener: LoadingListener) {
  loadingListeners.delete(listener);
}

function notifyLoadingListeners() {
  const isLoading = activeRequestsCount > 0;
  loadingListeners.forEach(listener => {
    try {
      listener(isLoading, activeRequestsCount);
    } catch {
      // Ignore listener errors
    }
  });
}

function startRequest() {
  activeRequestsCount++;
  notifyLoadingListeners();
}

function endRequest() {
  activeRequestsCount = Math.max(0, activeRequestsCount - 1);
  notifyLoadingListeners();
}

export function setOnUnauthorized(callback: UnauthorizedHandler | null) {
  onUnauthorizedCallback = callback;
}

function handleUnauthorized() {
  clearTokens();
  if (onUnauthorizedCallback) {
    onUnauthorizedCallback();
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return false;

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = (await response.json()) as { accessToken: string; refreshToken: string };
      if (!data.accessToken || !data.refreshToken) return false;

      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export interface ApiRequestOptions extends RequestInit {
  silentError?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { accessToken } = getTokens();

  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  startRequest();
  try {
    let response: Response | undefined;

    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
    } catch {
      throw new Error('Ошибка сети. Проверьте подключение к интернету.');
    }

    if (response.status === 401) {
      const { refreshToken } = getTokens();
      if (refreshToken) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const newTokens = getTokens();
          headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
          try {
            response = await fetch(`${API_BASE}${path}`, {
              ...options,
              headers,
            });
          } catch {
            throw new Error('Ошибка сети после обновления авторизации.');
          }
        }
      }

      if (response.status === 401) {
        handleUnauthorized();
      }
    }

    if (response.ok) {
      return (await response.json()) as T;
    }

    let errorMessage = `Ошибка ${response.status}`;
    try {
      const errData = (await response.json()) as { message?: string };
      if (errData.message) errorMessage = errData.message;
    } catch {
      // fallback message
    }

    throw new Error(errorMessage);
  } finally {
    endRequest();
  }
}
