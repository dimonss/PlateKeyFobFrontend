import React from 'react';
import { BaseModal } from './BaseModal';

export type ConfirmModalVariant = 'danger' | 'warning' | 'info' | 'primary';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: ConfirmModalVariant;
  confirmText?: string;
  cancelText?: string;
  confirmIcon?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  note?: React.ReactNode;
  children?: React.ReactNode;
  maxWidth?: string;
}

const variantStyles: Record<
  ConfirmModalVariant,
  {
    glowColor: string;
    badgeBg: string;
    badgeBorder: string;
    badgeShadow: string;
    badgeColor: string;
    confirmBtnBg: string;
    confirmBtnShadow: string;
  }
> = {
  danger: {
    glowColor: 'rgba(239, 68, 68, 0.25)',
    badgeBg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%)',
    badgeBorder: 'rgba(239, 68, 68, 0.4)',
    badgeShadow: '0 8px 20px rgba(239, 68, 68, 0.25)',
    badgeColor: '#f43f5e',
    confirmBtnBg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    confirmBtnShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
  },
  warning: {
    glowColor: 'rgba(245, 158, 11, 0.25)',
    badgeBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%)',
    badgeBorder: 'rgba(245, 158, 11, 0.4)',
    badgeShadow: '0 8px 20px rgba(245, 158, 11, 0.25)',
    badgeColor: '#f59e0b',
    confirmBtnBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    confirmBtnShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
  },
  info: {
    glowColor: 'rgba(6, 182, 212, 0.25)',
    badgeBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(14, 116, 144, 0.3) 100%)',
    badgeBorder: 'rgba(6, 182, 212, 0.4)',
    badgeShadow: '0 8px 20px rgba(6, 182, 212, 0.25)',
    badgeColor: '#06b6d4',
    confirmBtnBg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    confirmBtnShadow: '0 4px 16px rgba(6, 182, 212, 0.35)',
  },
  primary: {
    glowColor: 'rgba(225, 29, 72, 0.25)',
    badgeBg: 'linear-gradient(135deg, rgba(225, 29, 72, 0.2) 0%, rgba(190, 18, 60, 0.3) 100%)',
    badgeBorder: 'rgba(225, 29, 72, 0.4)',
    badgeShadow: '0 8px 20px rgba(225, 29, 72, 0.25)',
    badgeColor: '#f43f5e',
    confirmBtnBg: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
    confirmBtnShadow: '0 4px 16px rgba(225, 29, 72, 0.35)',
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  icon,
  variant = 'primary',
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  confirmIcon,
  isLoading = false,
  loadingText = 'Обработка...',
  note,
  children,
  maxWidth = '460px',
}) => {
  const styles = variantStyles[variant];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      glowColor={styles.glowColor}
      isDisabled={isLoading}
    >
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: styles.badgeBg,
            border: `1px solid ${styles.badgeBorder}`,
            boxShadow: styles.badgeShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: styles.badgeColor,
            marginBottom: '14px',
          }}
        >
          {icon}
        </div>

        <h3
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            marginBottom: '6px',
          }}
        >
          {title}
        </h3>

        {subtitle && (
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              lineHeight: '1.4',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Main Content / Details */}
      {children && (
        <div style={{ position: 'relative', zIndex: 1, marginBottom: note ? '14px' : '20px' }}>
          {children}
        </div>
      )}

      {/* Optional Note / Callout */}
      {note && (
        <div
          style={{
            marginBottom: '20px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {typeof note === 'string' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              {note}
            </div>
          ) : (
            note
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, padding: '10px', fontSize: '0.9rem' }}
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          className="btn"
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '0.9rem',
            background: styles.confirmBtnBg,
            color: '#ffffff',
            boxShadow: styles.confirmBtnShadow,
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              {loadingText}
            </>
          ) : (
            <>
              {confirmIcon}
              {confirmText}
            </>
          )}
        </button>
      </div>
    </BaseModal>
  );
};
