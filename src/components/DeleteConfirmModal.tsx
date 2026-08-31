import React from 'react';
import { Trash2, AlertTriangle, User, MapPin, Tag } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import type { OrderItem } from '../api/orders';

export interface DeleteConfirmModalProps {
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
  if (!order) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Удалить заказ #${order.orderNumber}?`}
      subtitle="Вы собираетесь безвозвратно удалить этот заказ из базы данных."
      icon={<Trash2 size={26} />}
      variant="danger"
      confirmText="Удалить"
      cancelText="Отмена"
      confirmIcon={<Trash2 size={16} />}
      isLoading={isDeleting}
      loadingText="Удаление..."
      note={
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
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, color: '#f87171' }} />
          <span>Это действие необратимо. Статистика и отчеты будут автоматически пересчитаны.</span>
        </div>
      }
    >
      {/* Order Details Preview Box */}
      <div
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.82rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px',
          }}
        >
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
          <span
            style={{
              color: 'var(--text-dim)',
              textAlign: 'right',
              maxWidth: '240px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            г. {order.city}, {order.customerAddress}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '4px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Сумма:</span>
          <strong style={{ color: '#f43f5e', fontSize: '0.95rem' }}>{order.totalPrice} сом</strong>
        </div>
      </div>
    </ConfirmModal>
  );
};
