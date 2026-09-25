import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logoutApi, type UserProfile } from '../api/auth';
import { clearTokens, getTokens, setOnUnauthorized, getActiveProvider, getAvailableProviders, setActiveProvider, type AuthProviderType } from '../api/client';

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  activeProvider: AuthProviderType | null;
  availableProviders: AuthProviderType[];
  login: (user: UserProfile, provider?: AuthProviderType) => void;
  logout: (target?: AuthProviderType | 'all') => Promise<void>;
  switchProvider: (provider: AuthProviderType) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  activeProvider: null,
  availableProviders: [],
  login: () => {},
  logout: async () => {},
  switchProvider: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProvider, setActiveProv] = useState<AuthProviderType | null>(() => getActiveProvider());
  const [availableProviders, setAvailableProviders] = useState<AuthProviderType[]>(() => getAvailableProviders());

  const handleLogin = useCallback((userData: UserProfile, provider?: AuthProviderType) => {
    setUser(userData);
    setActiveProv(provider || getActiveProvider());
    setAvailableProviders(getAvailableProviders());
  }, []);

  const handleLogout = useCallback(async (target?: AuthProviderType | 'all') => {
    try {
      await logoutApi(target);
    } catch {
      // Ignore
    } finally {
      clearTokens(target);
      const remaining = getActiveProvider();
      if (remaining) {
        setActiveProv(remaining);
        setAvailableProviders(getAvailableProviders());
        try {
          const profile = await getMe();
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
        setActiveProv(null);
        setAvailableProviders([]);
      }
    }
  }, []);


  const refreshUser = useCallback(async () => {
    const { accessToken, provider } = getTokens();
    setActiveProv(provider);
    setAvailableProviders(getAvailableProviders());
    if (!accessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await getMe();
      setUser(profile);
    } catch {
      clearTokens();
      setUser(null);
      setActiveProv(getActiveProvider());
      setAvailableProviders(getAvailableProviders());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchProvider = useCallback(async (provider: AuthProviderType) => {
    setActiveProvider(provider);
    setActiveProv(provider);
    setIsLoading(true);
    const { accessToken } = getTokens();
    if (accessToken) {
      try {
        const profile = await getMe();
        setUser(profile);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setActiveProv(getActiveProvider());
      setAvailableProviders(getAvailableProviders());
    });
    return () => {
      setOnUnauthorized(null);
    };
  }, []);

  useEffect(() => {
    refreshUser();

    const onStorage = (e: StorageEvent) => {
      if (e.key?.includes('accessToken') || e.key?.includes('auth_provider')) {
        refreshUser();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        activeProvider,
        availableProviders,
        login: handleLogin,
        logout: handleLogout,
        switchProvider,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
