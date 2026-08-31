import React from 'react';
import { LogOut, User, ShieldCheck, Mail, Send } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import type { UserProfile } from '../api/auth';

export interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  user: UserProfile | null;
  isLoading?: boolean;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  isLoading = false,
}) => {
  if (!user) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Выход из аккаунта"
      subtitle="Вы действительно хотите выйти из своего профиля?"
      icon={<LogOut size={26} />}
      variant="warning"
      confirmText="Выйти"
      cancelText="Отмена"
      confirmIcon={<LogOut size={16} />}
      isLoading={isLoading}
      loadingText="Выход..."
      note={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            fontSize: '0.78rem',
            color: '#fbbf24',
          }}
        >
          <span>Вы сможете снова быстро войти через Google или Telegram в любое время.</span>
        </div>
      }
    >
      {/* User Information Card */}
      <div
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        {/* User Avatar */}
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={displayName}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1.1rem',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)',
              flexShrink: 0,
            }}
          >
            {user.firstName ? user.firstName.charAt(0).toUpperCase() : <User size={22} />}
          </div>
        )}

        {/* User Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'var(--text-main)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </span>
            {user.isAdmin && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#f59e0b',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <ShieldCheck size={11} /> Admin
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.email ? (
              <>
                <Mail size={12} />
                <span>{user.email}</span>
              </>
            ) : user.username ? (
              <>
                <Send size={12} />
                <span>@{user.username}</span>
              </>
            ) : (
              <span>ID: {user.authUserId}</span>
            )}
          </div>
        </div>
      </div>
    </ConfirmModal>
  );
};
