import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, User, MapPin, Tag } from 'lucide-react';
import type { OrderItem } from '../api/orders';

interface DeleteConfirmModalProps {
  order: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen || !order) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div
      className="auth-modal-overlay"
      onClick={handleOverlayClick}
      style={{ zIndex: 1100 }}
    >
      <div
        className="glass-elevated"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          padding: '32px 24px 24px 24px',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg), 0 0 35px rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          animation: 'authModalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Ambient Red Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-70px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(225, 29, 72, 0.1) 45%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(25px)',
            borderRadius: '50%',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-input)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          title="Закрыть"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 8px 20px rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f43f5e',
              marginBottom: '14px',
            }}
          >
            <Trash2 size={26} />
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
            Удалить заказ #{order.orderNumber}?
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Вы собираетесь безвозвратно удалить этот заказ из базы данных.
          </p>
        </div>

        {/* Order Details Preview Box */}
        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.82rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <Tag size={14} />
              <span>Гос Номер:</span>
            </div>
            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {order.regionCode} {order.plateNumber}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <User size={14} />
              <span>Клиент:</span>
            </div>
            <span style={{ fontWeight: 600 }}>
              {order.customerName} ({order.customerPhone})
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <MapPin size={14} />
              <span>Адрес:</span>
            </div>
            <span style={{ color: 'var(--text-dim)', textAlign: 'right', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              г. {order.city}, {order.customerAddress}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Сумма:</span>
            <strong style={{ color: '#f43f5e', fontSize: '0.95rem' }}>{order.totalPrice} сом</strong>
          </div>
        </div>

        {/* Warning Note */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            fontSize: '0.78rem',
            color: '#fca5a5',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, color: '#f87171' }} />
          <span>Это действие необратимо. Статистика и отчеты будут автоматически пересчитаны.</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, padding: '10px', fontSize: '0.9rem' }}
            onClick={onClose}
            disabled={isDeleting}
          >
            Отмена
          </button>
          <button
            className="btn"
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '0.9rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
              border: 'none',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.7 : 1,
            }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
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
                Удаление...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Удалить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
