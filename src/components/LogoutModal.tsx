import React, { useState } from 'react';
import { LogOut, AlertTriangle, UserPlus } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { UserProfile } from '../api/auth';

export interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onOpenAuth?: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
}) => {
  const { logout, availableProviders } = useAuth();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !user) return null;

  const hasGoogle = availableProviders.includes('google');
  const hasTelegram = availableProviders.includes('telegram');

  const handleLogoutAction = async (target: 'google' | 'telegram' | 'all') => {
    setIsProcessing(true);
    try {
      await logout(target);
      showToast({
        type: 'success',
        title: 'Сессия завершена',
        message: target === 'all'
          ? 'Вы вышли со всех аккаунтов экосистемы'
          : `Вы вышли из ${target === 'google' ? 'Google' : 'Telegram'}`,
      });
      onClose();
    } catch {
      showToast({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось завершить сессию',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchToAuth = () => {
    onClose();
    if (onOpenAuth) {
      setTimeout(() => onOpenAuth(), 100);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="480px" glowColor="rgba(245, 158, 11, 0.25)">
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0,
            }}
          >
            <LogOut size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Выход из аккаунта
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Управление активными сессиями
            </div>
          </div>
        </div>

        {/* SSO Warning */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            fontSize: '0.82rem',
            lineHeight: 1.45,
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, color: '#fef3c7', marginBottom: '3px' }}>
              Сквозная авторизация экосистемы chalysh.pro
            </div>
            <div>
              Выход будет выполнен во всех подключенных веб-приложениях экосистемы (HealthChecker, Брелоки, Ретроспектива, Валидатор ТЗ, Space Shooter, ChalyshAuth).
            </div>
          </div>
        </div>

        {/* Both Providers Authorized */}
        {hasGoogle && hasTelegram ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Выберите вариант выхода:
            </div>

            {/* Logout Google */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1 1 200px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  🔵 Google
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Завершить сессию Google. Telegram останется активным.
                </div>
              </div>
              <button
                disabled={isProcessing}
                onClick={() => handleLogoutAction('google')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              >
                Выйти из Google
              </button>
            </div>

            {/* Logout Telegram */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1 1 200px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  ✈️ Telegram
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Завершить сессию Telegram. Google останется активным.
                </div>
              </div>
              <button
                disabled={isProcessing}
                onClick={() => handleLogoutAction('telegram')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              >
                Выйти из Telegram
              </button>
            </div>

            {/* Logout All */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1 1 200px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f87171' }}>
                  🚪 Выйти со всех сразу
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Полный выход из обоих аккаунтов во всех сервисах.
                </div>
              </div>
              <button
                disabled={isProcessing}
                onClick={() => handleLogoutAction('all')}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', background: '#ef4444', borderColor: '#ef4444', whiteSpace: 'nowrap' }}
              >
                Выйти со всех
              </button>
            </div>
          </div>
        ) : (
          /* Only 1 provider authorized */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1 1 200px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {hasGoogle ? '🔵 Google (активен)' : '✈️ Telegram (активен)'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Текущий аккаунт
                </div>
              </div>
              <button
                disabled={isProcessing}
                onClick={() => handleLogoutAction('all')}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.82rem', background: '#ef4444', borderColor: '#ef4444' }}
              >
                Выйти со всех сервисов
              </button>
            </div>

            {/* Authorize other provider option */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#818cf8' }}>
                <UserPlus size={16} />
                <span>Войти другим способом</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {hasGoogle
                  ? 'Вы можете также авторизоваться через Telegram, чтобы использовать разные учетные записи:'
                  : 'Вы можете также авторизоваться через Google, чтобы использовать разные учетные записи:'}
              </div>
              <button
                onClick={handleSwitchToAuth}
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-start', marginTop: '4px', padding: '6px 14px', fontSize: '0.82rem' }}
              >
                {hasGoogle ? '✈️ Войти через Telegram' : '🔵 Войти через Google'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button onClick={onClose} disabled={isProcessing} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            Отмена
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
