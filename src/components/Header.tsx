import React, { useState } from 'react';
import { Key, User, LogOut, ShieldCheck, Sun, Moon, Package, Search, Menu, X } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: 'customizer' | 'track' | 'orders' | 'admin') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="glass header-container" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 24px', marginBottom: '24px' }}>
      <div className="header-content" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <div
          onClick={() => handleTabClick('customizer')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(225, 29, 72, 0.4)',
              flexShrink: 0,
            }}
          >
            <Key size={20} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '6px' }}>
              PLATE<span style={{ color: '#f43f5e' }}>KEYCHAIN</span>
              <span className="badge badge-sunday" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>KG</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Кыргызские Гос Номера</div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hide-mobile" style={{ alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'customizer' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => handleTabClick('customizer')}
          >
            Конструктор
          </button>

          <button
            className={`btn ${activeTab === 'track' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => handleTabClick('track')}
          >
            <Search size={15} /> Отследить Заказ
          </button>

          {user && (
            <button
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => handleTabClick('orders')}
            >
              <Package size={15} /> Мои Заказы
            </button>
          )}

          {user?.isAdmin && (
            <button
              className={`btn ${activeTab === 'admin' ? 'btn-gold' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => handleTabClick('admin')}
            >
              <ShieldCheck size={15} /> Админ-Панель
            </button>
          )}
        </nav>

        {/* User & Theme Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={toggleTheme}
            style={{ padding: '8px 12px', fontSize: '0.85rem', minHeight: '38px' }}
            title="Сменить тему"
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <User size={16} color="#f43f5e" />
              <div style={{ fontSize: '0.82rem', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName}
              </div>
              <button
                onClick={logout}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', marginLeft: '2px', display: 'flex', alignItems: 'center' }}
                title="Выйти"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={onOpenAuth}
              style={{ padding: '8px 14px', fontSize: '0.85rem', minHeight: '38px' }}
            >
              <User size={15} /> Войти
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="btn btn-secondary show-mobile"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ padding: '8px 10px', minHeight: '38px' }}
            aria-label="Меню"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu Drawer Dropdown */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-drawer show-mobile">
            <button
              className={`btn ${activeTab === 'customizer' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleTabClick('customizer')}
            >
              <Key size={16} /> Конструктор Брелка
            </button>

            <button
              className={`btn ${activeTab === 'track' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleTabClick('track')}
            >
              <Search size={16} /> Отследить Заказ
            </button>

            {user && (
              <button
                className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTabClick('orders')}
              >
                <Package size={16} /> Мои Заказы
              </button>
            )}

            {user?.isAdmin && (
              <button
                className={`btn ${activeTab === 'admin' ? 'btn-gold' : 'btn-secondary'}`}
                onClick={() => handleTabClick('admin')}
              >
                <ShieldCheck size={16} /> Админ-Панель
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
};

