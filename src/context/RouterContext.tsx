import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type TabType = 'customizer' | 'track' | 'orders' | 'admin';

const TAB_ROUTES: Record<TabType, string> = {
  customizer: '',
  track: 'track',
  orders: 'orders',
  admin: 'admin',
};

export const getBaseUrl = (): string => {
  return (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
};

export const getPathForTab = (tab: TabType, query?: Record<string, string>): string => {
  const base = getBaseUrl();
  const route = TAB_ROUTES[tab];
  let url = route ? `${base}/${route}` : `${base}/`;

  if (query && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) searchParams.set(key, value);
    }
    const searchStr = searchParams.toString();
    if (searchStr) {
      url += `?${searchStr}`;
    }
  }

  return url;
};

export const parseRoute = (pathname: string): TabType => {
  const base = getBaseUrl();
  let relPath = pathname;
  if (base && relPath.startsWith(base)) {
    relPath = relPath.slice(base.length);
  }
  relPath = relPath.replace(/^\/+|\/+$/g, '');

  if (relPath === 'track') return 'track';
  if (relPath === 'orders') return 'orders';
  if (relPath === 'admin') return 'admin';
  return 'customizer';
};

interface RouterContextType {
  tab: TabType;
  navigate: (tab: TabType, options?: { replace?: boolean; query?: Record<string, string> }) => void;
  getPath: (tab: TabType, query?: Record<string, string>) => string;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tab, setTab] = useState<TabType>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setTab(parseRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((targetTab: TabType, options?: { replace?: boolean; query?: Record<string, string> }) => {
    const targetUrl = getPathForTab(targetTab, options?.query);
    if (options?.replace) {
      window.history.replaceState({}, '', targetUrl);
    } else {
      window.history.pushState({}, '', targetUrl);
    }
    setTab(targetTab);
  }, []);

  return (
    <RouterContext.Provider value={{ tab, navigate, getPath: getPathForTab }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  tab: TabType;
  query?: Record<string, string>;
  activeClassName?: string;
}

export const NavLink: React.FC<NavLinkProps> = ({
  tab,
  query,
  children,
  className = '',
  activeClassName = '',
  onClick,
  ...props
}) => {
  const { tab: activeTab, navigate, getPath } = useRouter();
  const href = getPath(tab, query);
  const isActive = activeTab === tab;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      navigate(tab, { query });
    }
  };

  const finalClassName = `${className} ${isActive ? activeClassName : ''}`.trim();

  return (
    <a href={href} onClick={handleClick} className={finalClassName} {...props}>
      {children}
    </a>
  );
};
