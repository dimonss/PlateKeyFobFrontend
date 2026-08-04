import { useEffect } from 'react';

export const useTelegramAuth = (botName: string, containerId: string, callback: (user: any) => void) => {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '20');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    (window as any).onTelegramAuth = callback;

    container.appendChild(script);

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [botName, containerId, callback]);
};
