import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { addLoadingListener } from '../api/client';

export const GlobalLoadingBar: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    const unsubscribe = addLoadingListener((loading, count) => {
      setIsLoading(loading);
      setActiveCount(count);

      if (loading) {
        if (timeout) clearTimeout(timeout);
        setVisible(true);
      } else {
        // Keep visible briefly for smooth completion effect
        timeout = setTimeout(() => {
          setVisible(false);
        }, 300);
      }
    });

    return () => {
      unsubscribe();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Top Animated Glowing Progress Line */}
      <div className="global-loading-bar-container" aria-hidden="true">
        <div className="global-loading-bar-inner" />
      </div>

      {/* Floating subtle sync badge */}
      {isLoading && (
        <div className="global-sync-badge" role="status" aria-live="polite">
          <RefreshCw size={13} className="spin" color="#f43f5e" />
          <span>Загрузка данных... {activeCount > 1 ? `(${activeCount})` : ''}</span>
        </div>
      )}
    </>
  );
};
