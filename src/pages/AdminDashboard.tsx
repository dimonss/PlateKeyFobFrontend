import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Package, DollarSign, Clock, Truck, RefreshCw, Printer, Search, Phone, MapPin, Lock, Eye, Box, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { fetchAdminOrders, updateOrderStatusApi, deleteOrderApi, fetchAdminStats, type AdminStats } from '../api/admin';
import type { OrderItem } from '../api/orders';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PlateVisualizer2D, SVGPlate2D } from '../components/PlateVisualizer2D';
import { PlateVisualizer3D } from '../components/PlateVisualizer3D';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [statusFilter, setStatusFilter] = useState('all');
  const [sundayFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderItem | null>(null);
  const [modalViewMode, setModalViewMode] = useState<'3d' | '2d'>('3d');

  const [orderToDelete, setOrderToDelete] = useState<OrderItem | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  const [viewType, setViewType] = useState<'cards' | 'table'>('cards');

  const loadData = useCallback(async () => {
    if (!user?.isAdmin) return;
    setIsLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        fetchAdminOrders({
          status: statusFilter,
          sundayDeliveryDate: sundayFilter || undefined,
          search: searchQuery || undefined,
          page,
          limit,
        }),
        fetchAdminStats(),
      ]);

      const items: OrderItem[] = Array.isArray(ordersData)
        ? ordersData
        : (Array.isArray(ordersData?.items) ? ordersData.items : []);
      const total = Array.isArray(ordersData)
        ? ordersData.length
        : (typeof ordersData?.total === 'number' ? ordersData.total : items.length);
      const pages = Array.isArray(ordersData)
        ? Math.max(1, Math.ceil(items.length / limit))
        : (typeof ordersData?.totalPages === 'number' ? ordersData.totalPages : 1);

      setOrders(items);
      setTotalOrders(total);
      setTotalPages(pages);
      setStats(statsData || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки админ-панели';
      showToast({ type: 'error', title: 'Ошибка', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, sundayFilter, searchQuery, page, limit, user?.isAdmin, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: OrderItem['status']) => {
    setUpdatingOrderId(orderId);
    try {
      const updated = await updateOrderStatusApi(orderId, newStatus);
      setOrders(prev => (Array.isArray(prev) ? prev.map(o => (o.id === orderId ? updated : o)) : []));
      showToast({ type: 'success', title: 'Статус обновлен', message: `Новый статус: ${newStatus}` });
      fetchAdminStats().then(setStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка обновления';
      showToast({ type: 'error', title: 'Ошибка', message: msg });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeletingOrder(true);
    try {
      await deleteOrderApi(orderToDelete.id);
      showToast({
        type: 'success',
        title: 'Заказ удален',
        message: `Заказ #${orderToDelete.orderNumber} успешно удален`,
      });
      setOrderToDelete(null);
      fetchAdminStats().then(setStats);
      const currentOrders = Array.isArray(orders) ? orders : [];
      if (currentOrders.length === 1 && page > 1) {
        setPage(p => p - 1);
      } else {
        loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при удалении заказа';
      showToast({ type: 'error', title: 'Ошибка', message: msg });
    } finally {
      setIsDeletingOrder(false);
    }
  };

  const handlePrintManifest = () => {
    window.print();
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

  const safeOrders = Array.isArray(orders) ? orders : [];

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div className="glass-elevated" style={{ padding: '16px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <span>Всего заказов</span>
              <Package size={18} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '6px' }}>{stats.totalOrders ?? 0}</div>
          </div>

          <div className="glass-elevated" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <span>Выручка</span>
              <DollarSign size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '6px', color: '#10b981' }}>
              {stats.totalRevenue ?? 0} <span style={{ fontSize: '0.85rem' }}>сом</span>
            </div>
          </div>

          <div className="glass-elevated" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <span>В производстве</span>
              <Clock size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '6px', color: '#f59e0b' }}>
              {(stats.inProductionCount || 0) + (stats.pendingCount || 0)}
            </div>
          </div>

          <div className="glass-elevated" style={{ padding: '16px', borderLeft: '4px solid #a855f7' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <span>На воскресный выезд</span>
              <Truck size={18} color="#a855f7" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '6px', color: '#c084fc' }}>
              {stats.readyForSundayCount ?? 0}
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-elevated" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, width: '100%', alignItems: 'center' }}>
          
          {/* Status Filter */}
          <select
            className="input-field"
            style={{ width: 'auto', minWidth: '150px' }}
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="in_production">В производстве</option>
            <option value="shipped_for_sunday">На Воскресную Доставку</option>
            <option value="delivered">Доставлен</option>
            <option value="cancelled">Отменен</option>
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Поиск по гос номеру, имени или телефону..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
            <Search size={16} style={{ position: 'absolute', right: '14px', top: '14px', color: 'var(--text-dim)' }} />
          </div>

          {/* View Mode Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-inset)', padding: '4px', borderRadius: '10px' }}>
            <button
              className={`btn ${viewType === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setViewType('cards')}
            >
              <Package size={14} /> Карточки
            </button>
            <button
              className={`btn ${viewType === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setViewType('table')}
            >
              <Printer size={14} /> Таблица
            </button>
          </div>

        </div>
      </div>

      {/* Orders List View */}
      <div className="content-loading-container">
        {isLoading && (
          <div className="content-loading-overlay">
            <div className="loading-spinner-ring" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Загрузка заказов...
            </span>
          </div>
        )}

        {viewType === 'cards' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {safeOrders.length === 0 ? (
              <div className="glass-elevated" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Заказы не найдены.
              </div>
            ) : (
              safeOrders.map(order => (
                <div key={order.id} className="glass-elevated" style={{ padding: '24px', borderRadius: '16px' }}>
                {/* Order Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                        Заказ #{order.orderNumber}
                      </h3>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Оформлен: {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Статус заказа:</span>
                      <select
                        className="input-field"
                        style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: updatingOrderId === order.id ? 0.6 : 1 }}
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={e => handleStatusChange(order.id, e.target.value as any)}
                      >
                        <option value="pending">Ожидает</option>
                        <option value="in_production">В производстве</option>
                        <option value="shipped_for_sunday">Передан на Воскресенье</option>
                        <option value="delivered">Доставлен</option>
                        <option value="cancelled">Отменен</option>
                      </select>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Сумма к оплате:</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f43f5e' }}>
                        {order.totalPrice} сом
                      </div>
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
                        plateNumber: order.plateNumber || '',
                        regionCode: order.regionCode || '01',
                        plateType: (order.plateType as any) || 'standard',
                        backSideText: order.backSideText || '',
                        backSideLogo: order.backSideLogo || 'none',
                        material: (order.material as any) || 'plastic',
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
                        <span style={{ color: 'var(--text-muted)' }}>Воскресная доставка:</span>{' '}
                        <strong>{order.sundayDeliveryDate}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '6px' }}>
                        Материал: {order.material} | Тип: {order.plateType}
                      </span>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                        onClick={() => setSelectedOrderForModal(order)}
                      >
                        3D Модель и Экспорт Файла
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: '8px 12px',
                          fontSize: '0.85rem',
                          color: '#f43f5e',
                          borderColor: 'rgba(244, 63, 94, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                        onClick={() => setOrderToDelete(order)}
                        title="Удалить заказ"
                      >
                        <Trash2 size={15} />
                        <span>Удалить</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Orders List Table */
        <div className="glass-elevated" style={{ padding: '0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: '700px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-inset)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
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
                {safeOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Заказы не найдены.
                    </td>
                  </tr>
                ) : (
                  safeOrders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                      
                      <td style={{ padding: '14px 18px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        #{order.orderNumber}
                      </td>

                      <td style={{ padding: '14px 18px', minWidth: '190px' }}>
                        <div style={{ width: '170px' }}>
                          <SVGPlate2D
                            config={{
                              plateNumber: order.plateNumber || '',
                              regionCode: order.regionCode || '01',
                              plateType: (order.plateType as any) || 'standard',
                              backSideText: order.backSideText || '',
                              backSideLogo: order.backSideLogo || 'none',
                              material: (order.material as any) || 'plastic',
                            }}
                          />
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
                          style={{ padding: '4px 8px', fontSize: '0.78rem', opacity: updatingOrderId === order.id ? 0.6 : 1 }}
                          value={order.status}
                          disabled={updatingOrderId === order.id}
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => setSelectedOrderForModal(order)}
                          >
                            Просмотр макета
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              color: '#f43f5e',
                              borderColor: 'rgba(244, 63, 94, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            onClick={() => setOrderToDelete(order)}
                            title="Удалить заказ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Pagination Controls */}
      {totalOrders > 0 && totalPages > 0 && (
        <div
          className="glass-elevated"
          style={{
            marginTop: '20px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Left: Summary and Limit Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Показано <strong>{(page - 1) * limit + 1}–{Math.min(page * limit, totalOrders)}</strong> из <strong>{totalOrders}</strong> заказов
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>На странице:</span>
              <select
                className="input-field"
                style={{ padding: '4px 10px', fontSize: '0.82rem', width: 'auto', minWidth: '70px' }}
                value={limit}
                onChange={e => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: page <= 1 ? 0.5 : 1 }}
              onClick={() => setPage(1)}
              disabled={page <= 1}
              title="Первая страница"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: page <= 1 ? 0.5 : 1 }}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              title="Предыдущая страница"
            >
              <ChevronLeft size={16} />
              <span className="hide-mobile">Назад</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {(() => {
                const delta = 1;
                const range: (number | string)[] = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                    range.push(i);
                  } else if (range.length > 0 && range[range.length - 1] !== '...') {
                    range.push('...');
                  }
                }
                return range.map((pNum, idx) => {
                  if (pNum === '...') {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        style={{ padding: '0 6px', color: 'var(--text-dim)', userSelect: 'none' }}
                      >
                        ...
                      </span>
                    );
                  }
                  const isCurrent = pNum === page;
                  return (
                    <button
                      key={`page-${pNum}`}
                      className={`btn ${isCurrent ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        minWidth: '34px',
                        height: '34px',
                        padding: '0 8px',
                        fontSize: '0.82rem',
                        fontWeight: isCurrent ? 700 : 500,
                      }}
                      onClick={() => setPage(pNum as number)}
                    >
                      {pNum}
                    </button>
                  );
                });
              })()}
            </div>

            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: page >= totalPages ? 0.5 : 1 }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              title="Следующая страница"
            >
              <span className="hide-mobile">Вперед</span>
              <ChevronRight size={16} />
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: page >= totalPages ? 0.5 : 1 }}
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              title="Последняя страница"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal preview of order with 3D Export capability */}
      {selectedOrderForModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content glass-elevated" style={{ padding: '24px', maxWidth: '680px', width: '92%' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Макет Заказа #{selectedOrderForModal.orderNumber}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Клиент: <strong>{selectedOrderForModal.customerName}</strong> ({selectedOrderForModal.customerPhone})
                </span>
              </div>

              {/* View Switcher Tabs */}
              <div style={{ display: 'flex', background: 'var(--bg-inset)', padding: '4px', borderRadius: '10px' }}>
                <button
                  onClick={() => setModalViewMode('3d')}
                  className={`btn ${modalViewMode === '3d' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '6px' }}
                >
                  <Box size={14} /> 3D Модель (Экспорт)
                </button>
                <button
                  onClick={() => setModalViewMode('2d')}
                  className={`btn ${modalViewMode === '2d' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '6px' }}
                >
                  <Eye size={14} /> 2D Схема
                </button>
              </div>
            </div>

            {/* Manufacturing Specifications Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
                marginBottom: '16px',
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                fontSize: '0.78rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Гос Номер:</span>
                <strong>{selectedOrderForModal.regionCode || '01'} {selectedOrderForModal.plateNumber}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Материал:</span>
                <strong style={{ textTransform: 'capitalize' }}>{(selectedOrderForModal.material || 'plastic').replace('_', ' ')}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Оборотный Текст:</span>
                <strong>{selectedOrderForModal.backSideText || '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Логотип:</span>
                <strong style={{ textTransform: 'uppercase' }}>{selectedOrderForModal.backSideLogo || 'Без лого'}</strong>
              </div>
            </div>

            {/* Active Visualizer Component */}
            {modalViewMode === '3d' ? (
              <PlateVisualizer3D
                config={{
                  plateNumber: selectedOrderForModal.plateNumber || '',
                  regionCode: selectedOrderForModal.regionCode || '01',
                  plateType: (selectedOrderForModal.plateType as any) || 'standard',
                  backSideText: selectedOrderForModal.backSideText || '',
                  backSideLogo: selectedOrderForModal.backSideLogo || 'none',
                  material: (selectedOrderForModal.material as any) || 'plastic',
                }}
                showExportControls={true}
                orderNumber={selectedOrderForModal.orderNumber}
              />
            ) : (
              <PlateVisualizer2D
                config={{
                  plateNumber: selectedOrderForModal.plateNumber || '',
                  regionCode: selectedOrderForModal.regionCode || '01',
                  plateType: (selectedOrderForModal.plateType as any) || 'standard',
                  backSideText: selectedOrderForModal.backSideText || '',
                  backSideLogo: selectedOrderForModal.backSideLogo || 'none',
                  material: (selectedOrderForModal.material as any) || 'plastic',
                }}
              />
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '20px', padding: '12px' }}
              onClick={() => setSelectedOrderForModal(null)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        order={orderToDelete}
        isOpen={!!orderToDelete}
        onClose={() => !isDeletingOrder && setOrderToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingOrder}
      />

    </div>
  );
};
