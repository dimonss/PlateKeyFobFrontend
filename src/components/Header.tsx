import React from 'react';
import { Key, User, LogOut, ShieldCheck, Sun, Moon, Package, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: 'customizer' | 'track' | 'orders' | 'admin';
  setActiveTab: (tab: 'customizer' | 'track' | 'orders' | 'admin') => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 24px', marginBottom: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('customizer')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(225, 29, 72, 0.4)',
            }}
          >
            <Key size={22} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '6px' }}>
              PLATE<span style={{ color: '#f43f5e' }}>FOB</span>
              <span className="badge badge-sunday" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>KG</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Кыргызские Гос Номера</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'customizer' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('customizer')}
          >
            Конструктор
          </button>

          <button
            className={`btn ${activeTab === 'track' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('track')}
          >
            <Search size={15} /> Отследить Заказ
          </button>

          {user && (
            <button
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={15} /> Мои Заказы
            </button>
          )}

          {user?.isAdmin && (
            <button
              className={`btn ${activeTab === 'admin' ? 'btn-gold' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => setActiveTab('admin')}
            >
              <ShieldCheck size={15} /> Админ-Панель
            </button>
          )}
        </nav>

        {/* User & Theme Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={toggleTheme}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            title="Сменить тему"
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <User size={18} color="#f43f5e" />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {user.firstName} {user.isAdmin && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>(Админ)</span>}
              </div>
              <button
                onClick={logout}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', marginLeft: '4px' }}
                title="Выйти"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={onOpenAuth}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <User size={16} /> Войти
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
