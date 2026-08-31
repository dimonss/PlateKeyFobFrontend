import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, CheckCircle, Calendar, Truck, CreditCard } from 'lucide-react';
import type { PlateConfig } from './PlateVisualizer2D';
import { createOrder, type OrderItem } from '../api/orders';
import { getNextSunday, formatSundayText } from './SundayDeliveryNotice';
import { useToast } from '../context/ToastContext';

import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderItem | null>(null);

  const initialFullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  const [customerName, setCustomerName] = useState(initialFullName);
  const [customerPhone, setCustomerPhone] = useState('+996 ');
  const [customerAddress, setCustomerAddress] = useState('');
  const [city, setCity] = useState('Бишкек');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'mbank' | 'optima_qr'>('cash_on_delivery');

  const [errors, setErrors] = useState<{ customerName?: string; customerPhone?: string; customerAddress?: string }>({});

  const nextSunday = getNextSunday();

  // Mask function for Kyrgyz phone numbers: +996 (XXX) XX-XX-XX
  const formatPhoneNumber = (value: string) => {
    // Keep digits only
    let digits = value.replace(/\D/g, '');
    
    // If it starts with 996, strip it for internal handling
    if (digits.startsWith('996')) {
      digits = digits.slice(3);
    }
    
    // Limit to 9 digits (Kyrgyz mobile standard: 555 123 456)
    digits = digits.slice(0, 9);
    
    let result = '+996';
    if (digits.length > 0) {
      result += ' (' + digits.slice(0, 3);
    }
    if (digits.length >= 3) {
      result += ') ' + digits.slice(3, 5);
    }
    if (digits.length >= 5) {
      result += '-' + digits.slice(5, 7);
    }
    if (digits.length >= 7) {
      result += '-' + digits.slice(7, 9);
    }
    return result;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setCustomerPhone(formatted);
    if (errors.customerPhone) {
      setErrors(prev => ({ ...prev, customerPhone: undefined }));
    }
  };

  const validateFields = () => {
    const newErrors: { customerName?: string; customerPhone?: string; customerAddress?: string } = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'Пожалуйста, введите Ваше имя (минимум 2 символа)';
    } else if (customerName.trim().length < 2) {
      newErrors.customerName = 'Имя слишком короткое';
    }

    const digitsOnly = customerPhone.replace(/\D/g, '');
    // Must be 12 digits: 996 + 9 digits
    if (digitsOnly.length !== 12) {
      newErrors.customerPhone = 'Введите полный номер телефона в формате +996 (XXX) XX-XX-XX';
    }

    if (!customerAddress.trim()) {
      newErrors.customerAddress = 'Укажите точный адрес доставки (улица, дом)';
    } else if (customerAddress.trim().length < 5) {
      newErrors.customerAddress = 'Пожалуйста, укажите более подробный адрес';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) {
      showToast({ type: 'error', title: 'Ошибка проверки', message: 'Пожалуйста, проверьте правильно ли заполнены поля' });
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
        {/* Mobile Pull Handle */}
        <div className="bottom-sheet-handle" />

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
                background: 'var(--bg-input)',
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
                  Доставка: {formatSundayText(nextSunday)}
                </div>
              </div>
            </div>

            {/* Contact Form Fields */}
            <div className="input-group">
              <label className="input-label">ФИО Получателя:</label>
              <input
                type="text"
                className="input-field"
                style={{ borderColor: errors.customerName ? '#ef4444' : undefined }}
                placeholder="Асан Усенов"
                value={customerName}
                onChange={e => {
                  setCustomerName(e.target.value);
                  if (errors.customerName) setErrors(prev => ({ ...prev, customerName: undefined }));
                }}
              />
              {errors.customerName && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                  {errors.customerName}
                </span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Номер Телефона (+996):</label>
              <input
                type="text"
                className="input-field"
                style={{ borderColor: errors.customerPhone ? '#ef4444' : undefined }}
                placeholder="+996 (555) 12-34-56"
                value={customerPhone}
                onChange={handlePhoneChange}
              />
              {errors.customerPhone && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                  {errors.customerPhone}
                </span>
              )}
            </div>

            <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Город:</label>
                <select className="input-field" value={city} onChange={e => setCity(e.target.value)}>
                  <option value="Бишкек">Бишкек</option>
                  <option value="Ош" disabled>Ош (недоступно)</option>
                  <option value="Джалал-Абад" disabled>Джалал-Абад (недоступно)</option>
                  <option value="Кант" disabled>Кант (недоступно)</option>
                  <option value="Токмок" disabled>Токмок (недоступно)</option>
                  <option value="Каракол" disabled>Каракол (недоступно)</option>
                  <option value="Нарын" disabled>Нарын (недоступно)</option>
                  <option value="Талас" disabled>Талас (недоступно)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Адрес Доставки (Улица, дом):</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ borderColor: errors.customerAddress ? '#ef4444' : undefined }}
                  placeholder="ул. Ахунбаева 120, кв. 4"
                  value={customerAddress}
                  onChange={e => {
                    setCustomerAddress(e.target.value);
                    if (errors.customerAddress) setErrors(prev => ({ ...prev, customerAddress: undefined }));
                  }}
                />
                {errors.customerAddress && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                    {errors.customerAddress}
                  </span>
                )}
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
                      background: paymentMethod === opt.id ? 'rgba(225, 29, 72, 0.12)' : 'var(--bg-input)',
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
