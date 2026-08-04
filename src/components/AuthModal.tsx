import React, { useState } from 'react';
import { X } from 'lucide-react';
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
  const [, setIsLoading] = useState(false);

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
    <div className="modal-overlay">
      <div className="modal-content glass-elevated" style={{ padding: '28px', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Авторизация</h3>
          <button className="toast-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Выберите удобный способ входа в систему:
        </p>

        {/* Google & Telegram Social Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div id="google-btn" style={{ minHeight: '40px', display: 'flex', justifyContent: 'center' }}></div>
          <div id="telegram-login-container" style={{ minHeight: '40px', display: 'flex', justifyContent: 'center' }}></div>
        </div>
      </div>
    </div>
  );
};

