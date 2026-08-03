import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { loginUser, registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser(email, password);
        login(res.user);
        showToast({ type: 'success', title: 'Успешный вход!', message: `Добро пожаловать, ${res.user.firstName}` });
        onClose();
      } else {
        const res = await registerUser({ email, password, firstName });
        login(res.user);
        showToast({ type: 'success', title: 'Регистрация успешна!', message: `Аккаунт создан для ${res.user.email}` });
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка авторизации';
      showToast({ type: 'error', title: 'Ошибка', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="modal-content glass-elevated" style={{ padding: '28px', maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            {mode === 'login' ? 'Вход в Аккаунт' : 'Регистрация'}
          </h3>
          <button className="toast-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
          <button
            type="button"
            className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
            onClick={() => setMode('login')}
          >
            Войти
          </button>
          <button
            type="button"
            className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
            onClick={() => setMode('register')}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="input-group">
              <label className="input-label">Имя:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="Асан"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
                <User size={16} style={{ position: 'absolute', right: '14px', top: '14px', color: 'var(--text-dim)' }} />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                required
                placeholder="user@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Mail size={16} style={{ position: 'absolute', right: '14px', top: '14px', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Пароль:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Lock size={16} style={{ position: 'absolute', right: '14px', top: '14px', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginTop: '12px' }}
          >
            {isLoading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        {/* Admin Quick Login Option */}
        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '20px', paddingTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-gold"
            style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
            onClick={handleQuickDemoAdmin}
          >
            <ShieldCheck size={16} /> Войти как Администратор (.env)
          </button>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Вход с правами admin@platekeyfob.kg
          </div>
        </div>

      </div>
    </div>
  );
};
