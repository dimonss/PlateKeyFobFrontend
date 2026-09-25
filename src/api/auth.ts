import { apiRequest, setTokens, clearTokens, getTokens, type AuthProviderType } from './client';


export interface UserProfile {
  id: string;
  authUserId: string;
  email: string | null;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export async function loginTelegram(data: any): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/telegram', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setTokens(res.accessToken, res.refreshToken, 'telegram');
  if (res.user) {
    localStorage.setItem('telegram_user', JSON.stringify(res.user));
  }
  return res;
}

export async function loginGoogle(credential: string): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  setTokens(res.accessToken, res.refreshToken, 'google');
  if (res.user) {
    localStorage.setItem('google_user', JSON.stringify(res.user));
  }
  return res;
}

export async function loginUser(email: string, password?: string): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(res.accessToken, res.refreshToken);
  return res;
}

export async function registerUser(data: {
  email: string;
  password?: string;
  firstName: string;
  lastName?: string;
}): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setTokens(res.accessToken, res.refreshToken);
  return res;
}

export async function getMe(): Promise<UserProfile> {
  const user = await apiRequest<UserProfile>('/auth/me');
  const provider = getTokens().provider;
  if (provider && user) {
    localStorage.setItem(`${provider}_user`, JSON.stringify(user));
  }
  return user;
}

export async function logoutApi(target?: AuthProviderType | 'all'): Promise<void> {
  if (target === 'all') {
    const gRefresh = localStorage.getItem('google_refreshToken');
    const tgRefresh = localStorage.getItem('telegram_refreshToken');
    if (gRefresh) await apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: gRefresh }) }).catch(() => {});
    if (tgRefresh) await apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: tgRefresh }) }).catch(() => {});
  } else if (target) {
    const refresh = localStorage.getItem(`${target}_refreshToken`);
    if (refresh) await apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: refresh }) }).catch(() => {});
  } else {
    const { refreshToken } = getTokens();
    if (refreshToken) {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore logout errors
      }
    }
  }
  clearTokens(target);
}

