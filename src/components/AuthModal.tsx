import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { loginUser, loginGoogle, loginTelegram } from '../api/auth';
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

  const handleQuickDemoAdmin = async () => {
    setIsLoading(true);
    try {
      const res = await loginUser('admin@platekeyfob.kg', 'adminpassword123');
      login(res.user);
      showToast({ type: 'success', title: 'Вход выполнен как Администратор', message: 'Доступны функции управления заказами' });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка входа админа';
      showToast({ type: 'error', title: 'Ошибка', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          <div id="google-btn" style={{ minHeight: '40px', display: 'flex', justifyContent: 'center' }}></div>
          <div id="telegram-login-container" style={{ minHeight: '40px', display: 'flex', justifyContent: 'center' }}></div>
        </div>

        {/* Admin Quick Login Option */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-gold"
            disabled={isLoading}
            style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
            onClick={handleQuickDemoAdmin}
          >
            <ShieldCheck size={16} /> Войти как Администратор (.env)
          </button>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Вход с правами администратора
          </div>
        </div>
      </div>
    </div>
  );
};
