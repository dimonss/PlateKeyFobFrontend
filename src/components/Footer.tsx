import React from 'react';
import { Truck, ShieldCheck, MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="glass" style={{ marginTop: '60px', padding: '40px 24px', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
        
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
            PLATE<span style={{ color: '#f43f5e' }}>KEYCHAIN</span> KG
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Производство премиальных металлических брелков с кыргызскими государственными автономерами. Нержавеющая сталь, 3D каемки, защита от царапин.
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>
            <Truck size={18} color="#f43f5e" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            Правило Доставки
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Доставка курьером осуществляется <strong>исключительно по Воскресеньям</strong> по городу Бишкек.
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>
            <ShieldCheck size={18} color="#10b981" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            Гарантия и Связь
          </h4>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><MapPin size={14} style={{ display: 'inline' }} /> г. Бишкек, ул. Горького 223</div>
            <div><Phone size={14} style={{ display: 'inline' }} /> +996 705 55 35 11 (WhatsApp / Telegram)</div>
          </div>
        </div>

      </div>

      <div style={{ maxWidth: '1200px', margin: '30px auto 0', borderTop: '1px solid var(--border-color)', paddingTop: '20px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        © 2026 PlateKeychain Kyrgyzstan. Все права защищены. Shared Auth compatible with RetrospectiveAggregator.
      </div>
    </footer>
  );
};
