import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, CheckCircle, Calendar, Truck, CreditCard } from 'lucide-react';
import type { PlateConfig } from './PlateVisualizer2D';
import { createOrder, type OrderItem } from '../api/orders';
import { getNextSunday, formatSundayText } from './SundayDeliveryNotice';
import { useToast } from '../context/ToastContext';

interface CheckoutModalProps {
  config: PlateConfig;
  price: number;
  onClose: () => void;
  onOrderCompleted: (order: OrderItem) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  config,
  price,
  onClose,
  onOrderCompleted,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderItem | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+996 ');
  const [customerAddress, setCustomerAddress] = useState('');
  const [city, setCity] = useState('Бишкек');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'mbank' | 'optima_qr'>('cash_on_delivery');

  const nextSunday = getNextSunday();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      showToast({ type: 'error', title: 'Ошибка', message: 'Пожалуйста, введите Ваше имя' });
      return;
    }
    if (!customerPhone || customerPhone.trim().length < 9) {
      showToast({ type: 'error', title: 'Ошибка', message: 'Введите верный номер телефона' });
      return;
    }
    if (!customerAddress.trim()) {
      showToast({ type: 'error', title: 'Ошибка', message: 'Укажите адрес доставки' });
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        city,
        plateNumber: config.plateNumber,
        regionCode: config.regionCode,
        plateType: config.plateType,
        backSideText: config.backSideText,
        backSideLogo: config.backSideLogo,
        material: config.material,
        quantity: 1,
        paymentMethod,
      });

      setCompletedOrder(order);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showToast({
        type: 'success',
        title: 'Заказ успешно оформлен!',
        message: `Номер заказа: ${order.orderNumber}. Доставка в воскресенье!`,
      });
      onOrderCompleted(order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось оформить заказ';
      showToast({ type: 'error', title: 'Ошибка', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-elevated" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            {completedOrder ? 'Заказ Оформлен!' : 'Оформление Заказа Брелка'}
          </h3>
          <button className="toast-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {completedOrder ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Благодарим за заказ!</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 20px' }}>
              Ваш заказ <strong>#{completedOrder.orderNumber}</strong> принят в обработку.
            </p>

            <div
              style={{
                background: 'rgba(225, 29, 72, 0.12)',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#f43f5e', marginBottom: '4px' }}>
                <Calendar size={18} /> Дата воскресной доставки:
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                {formatSundayText(nextSunday)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Курьер свяжется с Вами по номеру {completedOrder.customerPhone} в день доставки.
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
              Отлично, Вернуться к конструктору
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Order Summary Brief */}
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '14px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Выбранный брелок:</span>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                  {config.regionCode} {config.plateNumber}
                </div>
                {config.backSideText && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Оборот: {config.backSideText}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>К оплате:</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f43f5e' }}>
                  {price} сом
                </div>
              </div>
            </div>

            {/* Sunday Delivery Banner */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '12px 14px',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Truck size={22} color="#10b981" />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Правило отправки:</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                  Доставка: Воскресенье, {formatSundayText(nextSunday)}
                </div>
              </div>
            </div>

            {/* Contact Form Fields */}
            <div className="input-group">
              <label className="input-label">ФИО Получателя:</label>
              <input
                type="text"
                className="input-field"
                required
                placeholder="Асан Усенов"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Номер Телефона (+996):</label>
              <input
                type="text"
                className="input-field"
                required
                placeholder="+996 555 123 456"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Город:</label>
                <select className="input-field" value={city} onChange={e => setCity(e.target.value)}>
                  <option value="Бишкек">Бишкек</option>
                  <option value="Ош">Ош</option>
                  <option value="Джалал-Абад">Джалал-Абад</option>
                  <option value="Кант">Кант</option>
                  <option value="Токмок">Токмок</option>
                  <option value="Каракол">Каракол</option>
                  <option value="Нарын">Нарын</option>
                  <option value="Талас">Талас</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Адрес Доставки (Улица, дом):</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="ул. Ахунбаева 120, кв. 4"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Options */}
            <div className="input-group" style={{ marginTop: '8px' }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={16} /> Способ Оплаты:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {[
                  { id: 'cash_on_delivery', label: 'Наличными / Переводом при получении в Воскресенье' },
                  { id: 'mbank', label: 'MBank (Перевод по номеру)' },
                  { id: 'optima_qr', label: 'Optima24 / QR' },
                ].map(opt => (
                  <label
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: paymentMethod === opt.id ? 'rgba(225, 29, 72, 0.12)' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${paymentMethod === opt.id ? 'var(--primary)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === opt.id}
                      onChange={() => setPaymentMethod(opt.id as any)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '16px' }}
            >
              {isSubmitting ? 'Оформление...' : `Подтвердить Заказ (${price} сом)`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
