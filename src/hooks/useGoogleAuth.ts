import { useEffect } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

export const useGoogleAuth = (clientId: string, callback: (response: any) => void) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback,
        });
        const container = document.getElementById('google-btn');
        if (container) {
          window.google.accounts.id.renderButton(
            container,
            { theme: 'filled_black', size: 'large', shape: 'pill' }
          );
        }
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [clientId, callback]);
};
