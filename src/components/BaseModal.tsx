import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  glowColor?: string;
  showCloseButton?: boolean;
  isDisabled?: boolean;
  zIndex?: number;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = '460px',
  glowColor = 'rgba(225, 29, 72, 0.25)',
  showCloseButton = true,
  isDisabled = false,
  zIndex = 9999,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDisabled) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDisabled]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isDisabled) {
      onClose();
    }
  };

  const modalNode = (
    <div
      className="base-modal-overlay"
      onClick={handleOverlayClick}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="base-modal-card"
        style={{
          maxWidth,
          boxShadow: `var(--shadow-lg), 0 0 35px ${glowColor}`,
        }}
      >
        {/* Mobile Bottom Sheet Pull Indicator */}
        <div className="bottom-sheet-handle" />

        {/* Ambient Glow Orb */}
        <div
          style={{
            position: 'absolute',
            top: '-70px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            height: '240px',
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            pointerEvents: 'none',
            filter: 'blur(25px)',
            borderRadius: '50%',
          }}
        />

        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            disabled={isDisabled}
            className="base-modal-close"
            aria-label="Закрыть"
            title="Закрыть"
          >
            <X size={18} />
          </button>
        )}

        {children}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalNode, document.body)
    : modalNode;
};
