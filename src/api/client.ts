const BASE_PREFIX = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '';
const API_BASE = `${BASE_PREFIX}/api`;

export type AuthProviderType = 'google' | 'telegram';
export const APP_ID = 'keychain';
const APP_PROVIDER_KEY = `${APP_ID}_auth_provider`;

export function hasTokensFor(provider: AuthProviderType): boolean {
  return !!localStorage.getItem(`${provider}_accessToken`) && !!localStorage.getItem(`${provider}_refreshToken`);
}

export function getAvailableProviders(): AuthProviderType[] {
  const list: AuthProviderType[] = [];
  if (hasTokensFor('google')) list.push('google');
  if (hasTokensFor('telegram')) list.push('telegram');
  return list;
}

export function getActiveProvider(): AuthProviderType | null {
  const hasGoogle = hasTokensFor('google');
  const hasTelegram = hasTokensFor('telegram');

  if (!hasGoogle && !hasTelegram) {
    return null;
  }
  if (hasGoogle && !hasTelegram) {
    return 'google';
  }
  if (hasTelegram && !hasGoogle) {
    return 'telegram';
  }

  const stored = localStorage.getItem(APP_PROVIDER_KEY) as AuthProviderType | null;
  if (stored === 'google' || stored === 'telegram') {
    return stored;
  }

  return 'google';
}

export function setActiveProvider(provider: AuthProviderType) {
  localStorage.setItem(APP_PROVIDER_KEY, provider);
}

export function getTokens() {
  const provider = getActiveProvider();
  if (!provider) {
    return { accessToken: null, refreshToken: null, provider: null };
  }
  return {
    accessToken: localStorage.getItem(`${provider}_accessToken`),
    refreshToken: localStorage.getItem(`${provider}_refreshToken`),
    provider,
  };
}

export function setTokens(accessToken: string, refreshToken: string, provider?: AuthProviderType) {
  const targetProvider = provider || getActiveProvider() || 'google';
  localStorage.setItem(`${targetProvider}_accessToken`, accessToken);
  localStorage.setItem(`${targetProvider}_refreshToken`, refreshToken);
  localStorage.setItem(APP_PROVIDER_KEY, targetProvider);
}

export function clearTokens(onlyCurrent: boolean = true) {
  const current = getActiveProvider();
  if (current && onlyCurrent) {
    localStorage.removeItem(`${current}_accessToken`);
    localStorage.removeItem(`${current}_refreshToken`);
    localStorage.removeItem(`${current}_user`);
    const remaining = getActiveProvider();
    if (remaining) {
      localStorage.setItem(APP_PROVIDER_KEY, remaining);
    } else {
      localStorage.removeItem(APP_PROVIDER_KEY);
    }
  } else {
    localStorage.removeItem('google_accessToken');
    localStorage.removeItem('google_refreshToken');
    localStorage.removeItem('google_user');
    localStorage.removeItem('telegram_accessToken');
    localStorage.removeItem('telegram_refreshToken');
    localStorage.removeItem('telegram_user');
    localStorage.removeItem(APP_PROVIDER_KEY);
  }
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
