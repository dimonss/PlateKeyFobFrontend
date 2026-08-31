import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, UserCheck } from 'lucide-react';
import { loginGoogle, loginTelegram } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useTelegramAuth } from '../hooks/useTelegramAuth';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    setIsLoading(true);
    try {
      const res = await loginGoogle(response.credential);
      login(res.user);
      showToast({
        type: 'success',
        title: 'Успешный вход через Google!',
        message: `Добро пожаловать, ${res.user.firstName}`,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка авторизации Google';
      showToast({ type: 'error', title: 'Ошибка', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramSuccess = async (user: any) => {
    setIsLoading(true);
    try {
      const res = await loginTelegram(user);
      login(res.user);
      showToast({
        type: 'success',
        title: 'Успешный вход через Telegram!',
        message: `Добро пожаловать, ${res.user.firstName}`,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка авторизации Telegram';
      showToast({ type: 'error', title: 'Ошибка', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useGoogleAuth(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || '1086857469119-k5ttqibl0f9mvek8haoq9r20trljtkq1.apps.googleusercontent.com',
    handleGoogleSuccess
  );

  useTelegramAuth(
    import.meta.env.VITE_TELEGRAM_BOT_NAME || 'ChalyshAuthBot',
    'telegram-login-container',
    handleTelegramSuccess
  );

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal-card">
        {/* Mobile Pull Handle */}
        <div className="bottom-sheet-handle" />

        {/* Glow ambient background light */}
        <div className="auth-modal-glow-orb" />

        {/* Close Button */}
        <button
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Закрыть модальное окно"
          title="Закрыть"
        >
          <X size={20} />
        </button>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="auth-loading-overlay">
            <div className="auth-spinner" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
              Выполняется вход...
            </span>
          </div>
        )}

        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-icon-badge">
            <UserCheck size={30} />
          </div>
          <h3 className="auth-modal-title">Авторизация</h3>
          <p className="auth-modal-subtitle">
            Выберите удобный способ входа для оформления и отслеживания заказов
          </p>
        </div>

        {/* Modal Body with Social Buttons */}
        <div className="auth-modal-body">
          <div className="auth-social-wrapper">
            <div id="google-btn" className="auth-social-btn-container" />
            <div id="telegram-login-container" className="auth-social-btn-container" />
          </div>
        </div>

        {/* Modal Footer Security Note */}
        <div className="auth-modal-footer">
          <ShieldCheck size={16} style={{ color: 'var(--accent-green)' }} />
          <span>Ваши персональные данные надежно защищены</span>
        </div>
      </div>
    </div>
  );
};


