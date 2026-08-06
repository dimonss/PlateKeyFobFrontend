import React, { useEffect, useState } from 'react';
import { Package, Calendar, MapPin, Truck, RefreshCw, ShoppingBag, Search, AlertCircle, ArrowRight } from 'lucide-react';
import { getMyOrders, type OrderItem } from '../api/orders';
import { PlateVisualizer2D } from '../components/PlateVisualizer2D';
import { useToast } from '../context/ToastContext';

interface MyOrdersPageProps {
  onGoToCustomizer: () => void;
  onGoToTrack: () => void;
}

export const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ onGoToCustomizer, onGoToTrack }) => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось загрузить ваши заказы';
      setError(msg);
      showToast({ type: 'error', title: 'Ошибка', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Top Header Card */}
      <div className="glass-elevated" style={{ padding: '24px 28px', marginBottom: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package color="#f43f5e" size={26} /> Мои Заказы
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              История ваших заказов и статус воскресной доставки курьером
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onGoToTrack}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              title="Отследить по номеру"
            >
              <Search size={15} /> Отследить по номеру
            </button>
            <button
              onClick={fetchOrders}
              className="btn btn-secondary"
              disabled={isLoading}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              title="Обновить список"
            >
              <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="glass-elevated" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px' }}>
          <RefreshCw size={36} color="#f43f5e" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Загружаем список ваших заказов...
          </div>
        </div>
      ) : error ? (
        <div className="glass-elevated" style={{ padding: '36px', textAlign: 'center', borderRadius: '16px' }}>
          <AlertCircle size={44} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Ошибка загрузки заказов</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchOrders}>
            Попробовать снова
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-elevated" style={{ padding: '48px 28px', textAlign: 'center', borderRadius: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(225, 29, 72, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#f43f5e' }}>
            <ShoppingBag size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>У вас пока нет заказов</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Вы ещё не оформили ни одного заказа. Создайте свой уникальный автомобильный брелок прямо сейчас в нашем 3D-конструкторе!
          </p>
          <button className="btn btn-primary" onClick={onGoToCustomizer} style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            Перейти в Конструктор <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map(order => (
            <div key={order.id} className="glass-elevated" style={{ padding: '24px', borderRadius: '16px' }}>
              {/* Order Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                      Заказ #{order.orderNumber}
                    </h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Оформлен: {formatDate(order.createdAt)}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Сумма к оплате:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f43f5e' }}>
                    {order.totalPrice} сом
                  </div>
                </div>
              </div>

              {/* Sunday Delivery Banner */}
              <div
                style={{
                  background: 'rgba(225, 29, 72, 0.1)',
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Calendar size={24} color="#f43f5e" />
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Запланированная дата доставки:</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Воскресенье, {order.sundayDeliveryDate}
                  </div>
                </div>
              </div>

              {/* Grid Content */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Plate Preview */}
                <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Макет брелка:</span>
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

                {/* Details Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Package size={16} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Получатель:</span>{' '}
                      <strong>{order.customerName}</strong> ({order.customerPhone})
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <MapPin size={16} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Адрес доставки:</span>{' '}
                      <strong>г. {order.city}, {order.customerAddress}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Truck size={16} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Способ оплаты:</span>{' '}
                      <strong>{order.paymentMethod === 'cash_on_delivery' ? 'При получении в воскресенье' : order.paymentMethod}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px' }}>
                      Материал: {order.material} | Тип: {order.plateType}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
