import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Package, DollarSign, Clock, Truck, RefreshCw, Printer, Search, Phone, MapPin, Lock } from 'lucide-react';
import { fetchAdminOrders, updateOrderStatusApi, fetchAdminStats, type AdminStats } from '../api/admin';
import type { OrderItem } from '../api/orders';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PlateVisualizer2D } from '../components/PlateVisualizer2D';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('all');
  const [sundayFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderItem | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.isAdmin) return;
    setIsLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        fetchAdminOrders({
          status: statusFilter,
          sundayDeliveryDate: sundayFilter || undefined,
          search: searchQuery || undefined,
        }),
        fetchAdminStats(),
      ]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки админ-панели';
      showToast({ type: 'error', title: 'Ошибка', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, sundayFilter, searchQuery, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (orderId: string, newStatus: OrderItem['status']) => {
    try {
      const updated = await updateOrderStatusApi(orderId, newStatus);
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      showToast({ type: 'success', title: 'Статус обновлен', message: `Новый статус: ${newStatus}` });
      fetchAdminStats().then(setStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка обновления';
      showToast({ type: 'error', title: 'Ошибка', message: msg });
    }
  };

  const handlePrintManifest = () => {
    window.print();
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="glass-elevated" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
        <Lock size={48} color="#f43f5e" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Доступ ограничен</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Для доступа к панели администратора необходимо войти под аккаунтом с правами администратора.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck color="#f59e0b" size={28} /> Панель Администратора
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Управление заказами брелков с кыргызскими автономерами и воскресными доставками
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={loadData} title="Обновить">
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} /> Обновить
          </button>
          <button className="btn btn-gold" onClick={handlePrintManifest}>
            <Printer size={16} /> Печать Реестра Доставки
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div className="glass-elevated" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Всего заказов</span>
              <Package size={20} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px' }}>{stats.totalOrders}</div>
          </div>

          <div className="glass-elevated" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Выручка</span>
              <DollarSign size={20} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', color: '#10b981' }}>
              {stats.totalRevenue} <span style={{ fontSize: '1rem' }}>сом</span>
            </div>
          </div>

          <div className="glass-elevated" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>В производстве</span>
              <Clock size={20} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', color: '#f59e0b' }}>
              {stats.inProductionCount + stats.pendingCount}
            </div>
          </div>

          <div className="glass-elevated" style={{ padding: '20px', borderLeft: '4px solid #a855f7' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>На воскресный выезд</span>
              <Truck size={20} color="#a855f7" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', color: '#c084fc' }}>
              {stats.readyForSundayCount}
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-elevated" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          
          {/* Status Filter */}
          <select
            className="input-field"
            style={{ width: 'auto', minWidth: '180px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="in_production">В производстве</option>
            <option value="shipped_for_sunday">На Воскресную Доставку</option>
            <option value="delivered">Доставлен</option>
            <option value="cancelled">Отменен</option>
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Поиск по гос номеру, имени или телефону..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', right: '14px', top: '14px', color: 'var(--text-dim)' }} />
          </div>

        </div>
      </div>

      {/* Orders List Table */}
      <div className="glass-elevated" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 18px' }}>№ Заказа</th>
                <th style={{ padding: '14px 18px' }}>Гос Номер</th>
                <th style={{ padding: '14px 18px' }}>Клиент / Адрес</th>
                <th style={{ padding: '14px 18px' }}>Воскресная Доставка</th>
                <th style={{ padding: '14px 18px' }}>Сумма</th>
                <th style={{ padding: '14px 18px' }}>Статус</th>
                <th style={{ padding: '14px 18px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Заказы не найдены.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                    
                    <td style={{ padding: '14px 18px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      #{order.orderNumber}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div className="plate-font" style={{ fontSize: '1rem', fontWeight: 900, background: '#ffffff', color: '#000000', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', border: '1px solid #000' }}>
                        {order.regionCode} {order.plateNumber}
                      </div>
                      {order.backSideText && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Оборот: {order.backSideText}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700 }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {order.customerPhone}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {order.city}, {order.customerAddress}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span className="badge badge-sunday">
                        <Truck size={12} /> {order.sundayDeliveryDate}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#f43f5e' }}>
                      {order.totalPrice} сом
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <select
                        className="input-field"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value as any)}
                      >
                        <option value="pending">Ожидает</option>
                        <option value="in_production">В производстве</option>
                        <option value="shipped_for_sunday">Передан на Воскресенье</option>
                        <option value="delivered">Доставлен</option>
                        <option value="cancelled">Отменен</option>
                      </select>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => setSelectedOrderForModal(order)}
                      >
                        Просмотр макета
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal preview of order */}
      {selectedOrderForModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-elevated" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
              Макет Заказа #{selectedOrderForModal.orderNumber}
            </h3>
            <PlateVisualizer2D
              config={{
                plateNumber: selectedOrderForModal.plateNumber,
                regionCode: selectedOrderForModal.regionCode,
                plateType: selectedOrderForModal.plateType as any,
                backSideText: selectedOrderForModal.backSideText || '',
                backSideLogo: selectedOrderForModal.backSideLogo || 'none',
                material: selectedOrderForModal.material as any,
              }}
            />
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setSelectedOrderForModal(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
