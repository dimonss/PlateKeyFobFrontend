import React, { useState } from 'react';
import { Sparkles, Eye, Box, Phone, ShieldCheck, Check } from 'lucide-react';
import { PlateVisualizer2D, type PlateConfig } from './PlateVisualizer2D';
import { PlateVisualizer3D } from './PlateVisualizer3D';

interface KeychainCustomizerProps {
  onOrderClick: (config: PlateConfig, calculatedPrice: number) => void;
}

const REGIONS = [
  { code: '01', name: 'Бишкек' },
  { code: '02', name: 'Ош (город)' },
  { code: '03', name: 'Баткен' },
  { code: '04', name: 'Джалал-Абад' },
  { code: '05', name: 'Нарын' },
  { code: '06', name: 'Ошская обл.' },
  { code: '07', name: 'Талас' },
  { code: '08', name: 'Чуйская обл.' },
  { code: '09', name: 'Иссык-Куль' },
  { code: '10', name: 'Легализованные ТС' },
];

const MATERIALS = [
  { id: 'chrome', name: 'Пластик', price: 500, color: '#e2e8f0' },
  { id: 'black_matte', name: 'Матовый Магнит', price: 500, color: '#111827' },
  { id: 'gold_edge', name: 'Золотая Кайма', price: 650, color: '#f59e0b' },
  { id: 'carbon', name: 'Карбоновый Микс', price: 700, color: '#374151' },
];

const CAR_LOGOS = [
  { id: 'none', label: 'Без лого' },
  { id: 'bmw', label: 'BMW' },
  { id: 'mercedes', label: 'Mercedes' },
  { id: 'toyota', label: 'Toyota' },
  { id: 'lexus', label: 'Lexus' },
  { id: 'honda', label: 'Honda' },
  { id: 'hyundai', label: 'Hyundai' },
  { id: 'kia', label: 'KIA' },
  { id: 'audi', label: 'Audi' },
  { id: 'chevrolet', label: 'Chevrolet' },
];

export const KeychainCustomizer: React.FC<KeychainCustomizerProps> = ({ onOrderClick }) => {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const [config, setConfig] = useState<PlateConfig>({
    plateNumber: '777 AAA',
    regionCode: '01',
    plateType: 'standard',
    backSideText: '+996 555 123 456',
    backSideLogo: 'bmw',
    material: 'chrome',
  });

  // Calculate dynamic price
  const calculatePrice = () => {
    let price = 500;
    const selectedMat = MATERIALS.find(m => m.id === config.material);
    if (selectedMat) price = selectedMat.price;

    if (config.backSideText.trim().length > 0) price += 100;
    return price;
  };

  const totalPrice = calculatePrice();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="customizer-grid">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Visualizer Preview */}
        <div className="glass-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Mode Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-inset)', padding: '4px', borderRadius: '12px', marginBottom: '20px', width: '100%', maxWidth: '320px', justifyContent: 'center' }}>
            <button
              onClick={() => setViewMode('2d')}
              className={`btn ${viewMode === '2d' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 14px', fontSize: '0.85rem', flex: 1, minHeight: '38px' }}
            >
              <Eye size={16} /> 2D Вид
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`btn ${viewMode === '3d' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 14px', fontSize: '0.85rem', flex: 1, minHeight: '38px' }}
            >
              <Box size={16} /> 3D Интерактив
            </button>
          </div>

          {/* Rendering active visualizer */}
          {viewMode === '2d' ? (
            <PlateVisualizer2D config={config} />
          ) : (
            <PlateVisualizer3D config={config} showExportControls={true} />
          )}

          {/* Quick Presets */}
          <div style={{ marginTop: '20px', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Быстрые популярные номера:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['01 777 VIP', '08 001 KG', '02 888 AAA', 'BOSS', '01 555 KGZ'].map(preset => (
                <button
                  key={preset}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', minHeight: '32px' }}
                  onClick={() => {
                    const parts = preset.split(' ');
                    if (parts.length >= 2) {
                      setConfig(prev => ({ ...prev, regionCode: parts[0], plateNumber: parts.slice(1).join(' ') }));
                    } else {
                      setConfig(prev => ({ ...prev, plateNumber: preset }));
                    }
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Customization Controls */}
        <div className="glass-elevated" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles color="#f43f5e" size={22} /> Кастомизация Брелка
          </h2>

          {/* Step 1: Region Selection */}
          <div className="input-group">
            <label className="input-label">1. Регион Кыргызской Республики:</label>
            <select
              className="input-field"
              value={config.regionCode}
              onChange={e => setConfig(prev => ({ ...prev, regionCode: e.target.value }))}
            >
              {REGIONS.map(r => (
                <option key={r.code} value={r.code}>
                  {r.code} — {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Plate Number */}
          <div className="input-group">
            <label className="input-label">2. Гос Номер Автомобиля / Текст:</label>
            <input
              type="text"
              className="input-field plate-font"
              style={{ fontSize: '1.15rem', textTransform: 'uppercase' }}
              value={config.plateNumber}
              maxLength={12}
              placeholder="Например: 777 AAA или B 1234 A"
              onChange={e => setConfig(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
            />
          </div>

          {/* Step 3: Back Side Customization */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={16} color="#f43f5e" /> 3. Обратная сторона (Телефон или Пожелание):
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="+996 555 123 456 или Счастливого пути!"
              value={config.backSideText}
              onChange={e => setConfig(prev => ({ ...prev, backSideText: e.target.value }))}
              style={{ marginTop: '8px' }}
            />

            <label className="input-label" style={{ marginTop: '12px', display: 'block' }}>
              Марка автомобиля (Логотип):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(85px, 1fr))', gap: '8px', marginTop: '6px' }}>
              {CAR_LOGOS.map(logo => (
                <button
                  key={logo.id}
                  type="button"
                  className={`btn ${config.backSideLogo === logo.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 8px', fontSize: '0.78rem', minHeight: '36px' }}
                  onClick={() => setConfig(prev => ({ ...prev, backSideLogo: logo.id }))}
                >
                  {logo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Material Selection (Disabled - Plastic by default) */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '8px' }}>
              <label className="input-label" style={{ margin: 0 }}>4. Материал и Оформление брелка:</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                (По умолчанию: Пластик)
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              {MATERIALS.map(mat => {
                const isDefault = mat.id === 'chrome'; // Хром Сталь / Пластик по умолчанию
                return (
                  <div
                    key={mat.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: isDefault ? 'rgba(225, 29, 72, 0.12)' : 'var(--bg-input)',
                      border: `2px solid ${isDefault ? 'var(--primary)' : 'var(--border-color)'}`,
                      opacity: isDefault ? 1 : 0.45,
                      cursor: 'not-allowed',
                      pointerEvents: 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: mat.color,
                          border: '1px solid rgba(255,255,255,0.4)',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{mat.name}</span>
                    </div>
                    {isDefault && <Check size={16} color="var(--primary)" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price Summary & Order Button */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Итоговая стоимость брелка:</span>
                <h3 style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'var(--font-display)', margin: 0 }}>
                  {totalPrice} <span style={{ fontSize: '1rem', color: '#f43f5e' }}>сом</span>
                </h3>
              </div>
              <div style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <ShieldCheck size={15} color="#10b981" style={{ display: 'inline', verticalAlign: 'middle' }} /> Гарантия качества
                <br />
                Доставка: <strong>По Воскресеньям</strong>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', minHeight: '48px' }}
              onClick={() => onOrderClick(config, totalPrice)}
            >
              Оформить Заказ за {totalPrice} сом
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
