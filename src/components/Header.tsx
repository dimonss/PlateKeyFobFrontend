import React, { useState } from 'react';
import { Key, User, LogOut, ShieldCheck, Sun, Moon, Package, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useRouter, NavLink } from '../context/RouterContext';
import { LogoutModal } from './LogoutModal';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { tab: activeTab } = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      showToast({
        type: 'success',
        title: 'Выход выполнен',
        message: 'Вы успешно вышли из учетной записи',
      });
      setIsLogoutModalOpen(false);
      setIsMobileMenuOpen(false);
    } catch {
      showToast({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось выполнить выход',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="glass header-container" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 24px', marginBottom: '24px' }}>
      <div className="header-content" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo Link */}
        <NavLink
          tab="customizer"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0, textDecoration: 'none', color: 'inherit' }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="brand-icon"
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
            <Key size={18} />
          </div>
          <div>
            <div className="brand-logo-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>PLATE</span>
              <span className="brand-keychain-text" style={{ color: '#f43f5e' }}>KEYCHAIN</span>
            </div>
            <div className="brand-subtext" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Кыргызские Гос Номера</div>
          </div>
        </NavLink>

        {/* Desktop Navigation Links */}
        <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NavLink
            tab="customizer"
            className={`btn ${activeTab === 'customizer' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Конструктор
          </NavLink>

          <NavLink
            tab="track"
            className={`btn ${activeTab === 'track' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Search size={15} /> Отследить Заказ
          </NavLink>

          {user && (
            <NavLink
              tab="orders"
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Package size={15} /> Мои Заказы
            </NavLink>
          )}

          {user?.isAdmin && (
            <NavLink
              tab="admin"
              className={`btn ${activeTab === 'admin' ? 'btn-gold' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <ShieldCheck size={15} /> Админ-Панель
            </NavLink>
          )}
        </nav>

        {/* User & Theme Actions */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            className="btn btn-secondary header-btn-action"
            onClick={toggleTheme}
            style={{ padding: '8px 12px', fontSize: '0.85rem', minHeight: '38px' }}
            title="Сменить тему"
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <User size={16} color="#f43f5e" />
              <div style={{ fontSize: '0.82rem', fontWeight: 600, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName}
              </div>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', marginLeft: '2px', display: 'flex', alignItems: 'center' }}
                title="Выйти"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary header-btn-action"
              onClick={onOpenAuth}
              style={{ padding: '8px 14px', fontSize: '0.85rem', minHeight: '38px' }}
            >
              <User size={15} /> Войти
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="btn btn-secondary show-mobile header-btn-action"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ padding: '8px 10px', minHeight: '38px' }}
            aria-label="Меню"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-drawer show-mobile">
          <NavLink
            tab="customizer"
            className={`btn ${activeTab === 'customizer' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Key size={16} /> Конструктор Брелка
          </NavLink>

          <NavLink
            tab="track"
            className={`btn ${activeTab === 'track' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Search size={16} /> Отследить Заказ
          </NavLink>

          {user && (
            <NavLink
              tab="orders"
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Package size={16} /> Мои Заказы
            </NavLink>
          )}

          {user?.isAdmin && (
            <NavLink
              tab="admin"
              className={`btn ${activeTab === 'admin' ? 'btn-gold' : 'btn-secondary'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShieldCheck size={16} /> Админ-Панель
            </NavLink>
          )}

          {user && (
            <button
              className="btn btn-secondary"
              style={{ color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)', marginTop: '6px' }}
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLogoutModalOpen(true);
              }}
            >
              <LogOut size={16} /> Выйти из аккаунта
            </button>
          )}
        </div>
      )}
    </header>

    {/* Logout Confirmation Modal (rendered via Portal) */}
    <LogoutModal
      isOpen={isLogoutModalOpen}
      onClose={() => !isLoggingOut && setIsLogoutModalOpen(false)}
      onConfirm={handleConfirmLogout}
      user={user}
      isLoading={isLoggingOut}
    />
  </>
);
};
