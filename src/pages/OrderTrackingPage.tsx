import React, { useState } from 'react';
import { Search, Package, Calendar, MapPin, Truck } from 'lucide-react';
import { trackOrder, type OrderItem } from '../api/orders';
import { PlateVisualizer2D } from '../components/PlateVisualizer2D';
import { useToast } from '../context/ToastContext';

export const OrderTrackingPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<OrderItem | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const res = await trackOrder(searchQuery.trim());
      setOrder(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Заказ не найден';
      showToast({ type: 'error', title: 'Ошибка', message: msg });
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-pending">Ожидает обработки</span>;
      case 'confirmed':
        return <span className="badge badge-pending">Подтвержден</span>;
      case 'in_production':
        return <span className="badge badge-in_production">В производстве</span>;
      case 'shipped_for_sunday':
        return <span className="badge badge-shipped_for_sunday">Передан на воскресную доставку</span>;
      case 'delivered':
        return <span className="badge badge-delivered">Доставлен</span>;
      case 'cancelled':
        return <span className="badge badge-cancelled">Отменен</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div className="glass-elevated" style={{ padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search color="#f43f5e" size={24} /> Отслеживание Заказа по Номеру
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Введите номер Вашего заказа (например: <strong>KG-849201</strong>) для проверки статуса и даты воскресной доставки.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Введите номер заказа KG-XXXXXX"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ fontSize: '1rem', flex: 1, minWidth: '200px' }}
          />
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ whiteSpace: 'nowrap', minHeight: '44px' }}>
            {isLoading ? 'Поиск...' : 'Найти Заказ'}
          </button>
        </form>
      </div>

      {/* Order Details View */}
      {order && (
        <div className="glass-elevated" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Детали заказа:</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                Заказ #{order.orderNumber}
              </h3>
            </div>
            <div>{getStatusBadge(order.status)}</div>
          </div>

          {/* Sunday Delivery Banner */}
          <div
            style={{
              background: 'rgba(225, 29, 72, 0.12)',
              border: '1px solid rgba(225, 29, 72, 0.3)',
              padding: '16px',
              borderRadius: '14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <Calendar size={28} color="#f43f5e" />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Запланированная дата доставки:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Воскресенье, {order.sundayDeliveryDate}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Visualizer Preview */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Макет заказанного брелка:</span>
              <PlateVisualizer2D
                config={{
                  plateNumber: order.plateNumber,
                  regionCode: order.regionCode,
                  plateType: order.plateType as any,
                  backSideText: order.backSideText || '',
                  backSideLogo: order.backSideLogo || 'none',
                  material: order.material as any,
                }}
              />
            </div>

            {/* Info Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Package size={16} color="var(--text-muted)" />
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Получатель:</span> <strong>{order.customerName}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <MapPin size={16} color="var(--text-muted)" />
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Адрес:</span> <strong>{order.city}, {order.customerAddress}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Truck size={16} color="var(--text-muted)" />
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Способ оплаты:</span> <strong>{order.paymentMethod === 'cash_on_delivery' ? 'При получении' : order.paymentMethod}</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800 }}>
                  <span>Стоимость:</span>
                  <span style={{ color: '#f43f5e' }}>{order.totalPrice} сом</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
