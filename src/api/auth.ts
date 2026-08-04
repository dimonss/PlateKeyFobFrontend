import { apiRequest, setTokens, clearTokens, getTokens } from './client';

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
  setTokens(res.accessToken, res.refreshToken);
  return res;
}

export async function loginGoogle(credential: string): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  setTokens(res.accessToken, res.refreshToken);
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
  return apiRequest<UserProfile>('/auth/me');
}

export async function logoutApi(): Promise<void> {
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
  clearTokens();
}
