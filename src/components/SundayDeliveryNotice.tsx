import React, { useState, useEffect } from 'react';
import { Truck, Clock } from 'lucide-react';

export function getNextSunday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);
  sunday.setHours(10, 0, 0, 0); // 10:00 AM delivery start
  return sunday;
}

export function formatSundayText(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  };
  return date.toLocaleDateString('ru-RU', options);
}

export const SundayDeliveryNotice: React.FC = () => {
  const [nextSunday] = useState<Date>(getNextSunday);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = nextSunday.getTime() - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextSunday]);

  return (
    <div className="sunday-notice-card glass-elevated" style={{ padding: '16px 20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(225, 29, 72, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f43f5e',
            }}
          >
            <Truck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-sunday">Правило доставки</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Все заказы отправляются батчем</span>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-main)' }}>
              Ближайшая доставка: <span style={{ color: '#f43f5e' }}>Воскресенье, {formatSundayText(nextSunday)}</span>
            </h4>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0, 0, 0, 0.3)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Clock size={16} color="#f43f5e" />
            <span>До выезда курьеров:</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
            <span>{timeLeft.days}д</span>:
            <span>{String(timeLeft.hours).padStart(2, '0')}ч</span>:
            <span>{String(timeLeft.minutes).padStart(2, '0')}м</span>:
            <span>{String(timeLeft.seconds).padStart(2, '0')}с</span>
          </div>
        </div>
      </div>
    </div>
  );
};
