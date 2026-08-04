import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';

export interface PlateConfig {
  plateNumber: string;
  regionCode: string;
  plateType: 'standard' | 'old' | 'vip';
  backSideText: string;
  backSideLogo: string;
  material: 'chrome' | 'black_matte' | 'gold_edge' | 'carbon';
}

const REGION_NAMES: Record<string, string> = {
  '01': 'Бишкек',
  '02': 'Ош (город)',
  '03': 'Баткен',
  '04': 'Джалал-Абад',
  '05': 'Нарын',
  '06': 'Ошская обл.',
  '07': 'Талас',
  '08': 'Чуйская обл.',
  '09': 'Иссык-Куль',
};

const LOGO_SVGS: Record<string, JSX.Element> = {
  bmw: (
    <svg viewBox="0 0 100 100" width="48" height="48">
      <circle cx="50" cy="50" r="45" fill="#000" stroke="#fff" strokeWidth="4" />
      <path d="M50 5 A45 45 0 0 1 95 50 H50 Z" fill="#0066B1" />
      <path d="M50 50 H95 A45 45 0 0 1 50 95 Z" fill="#FFF" />
      <path d="M50 50 V95 A45 45 0 0 1 5 50 Z" fill="#0066B1" />
      <path d="M50 50 H5 A45 45 0 0 1 50 5 Z" fill="#FFF" />
    </svg>
  ),
  toyota: (
    <svg viewBox="0 0 100 60" width="54" height="36">
      <ellipse cx="50" cy="30" rx="45" ry="25" fill="none" stroke="currentColor" strokeWidth="5" />
      <ellipse cx="50" cy="30" rx="20" ry="24" fill="none" stroke="currentColor" strokeWidth="4" />
      <ellipse cx="50" cy="18" rx="35" ry="12" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  ),
  mercedes: (
    <svg viewBox="0 0 100 100" width="48" height="48">
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="5" />
      <path d="M50 10 L60 50 L50 90 L40 50 Z" fill="currentColor" />
      <path d="M50 50 L88 68 L50 50 L20 28 Z" fill="currentColor" />
      <path d="M50 50 L12 68 L50 50 L80 28 Z" fill="currentColor" />
    </svg>
  ),
  lexus: (
    <svg viewBox="0 0 100 60" width="54" height="36">
      <ellipse cx="50" cy="30" rx="44" ry="24" fill="none" stroke="currentColor" strokeWidth="5" />
      <path d="M25 15 H65 L35 45 H75" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  ),
  hyundai: (
    <svg viewBox="0 0 100 60" width="54" height="36">
      <ellipse cx="50" cy="30" rx="44" ry="24" fill="none" stroke="currentColor" strokeWidth="5" transform="rotate(-10 50 30)" />
      <path d="M30 42 L42 18 M70 18 L58 42 M38 28 H62" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  ),
  none: <></>,
};

// High-Fidelity Official Flag of the Kyrgyz Republic
const KyrgyzFlagSVG: React.FC<{ width?: number; height?: number }> = ({ width = 36, height = 24 }) => (
  <svg
    viewBox="0 0 60 40"
    width={width}
    height={height}
    style={{
      borderRadius: '2px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
      flexShrink: 0,
      display: 'block',
      border: '0.5px solid rgba(0,0,0,0.2)',
    }}
  >
    {/* Crimson Red Field */}
    <rect width="60" height="40" fill="#E11D48" />

    {/* Sun Disk & 40 Rays */}
    <g transform="translate(30,20)">
      {/* 40 Rays around Sun */}
      {Array.from({ length: 40 }).map((_, i) => {
        const angle = (i * 360) / 40;
        return (
          <path
            key={i}
            d="M 0 -11 C 1.2 -14, 2.4 -15.5, 0 -17.5 C -2.4 -15.5, -1.2 -14, 0 -11 Z"
            fill="#FBBF24"
            transform={`rotate(${angle})`}
          />
        );
      })}

      {/* Sun disk ring */}
      <circle r="9" fill="#FBBF24" />
      <circle r="7.2" fill="#E11D48" />

      {/* Tunduk emblem */}
      <g stroke="#FBBF24" strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d="M -5.5 -4 C -2 -1.2, 2 -1.2, 5.5 -4" />
        <path d="M -6.2 0 C -2.2 2.5, 2.2 2.5, 6.2 0" />
        <path d="M -5.5 4 C -2 1.2, 2 1.2, 5.5 4" />

        <path d="M -4 -5.5 C -1.2 -2, -1.2 2, -4 5.5" />
        <path d="M 0 -6.2 C 2.5 -2.2, 2.5 2.2, 0 6.2" />
        <path d="M 4 -5.5 C 1.2 -2, 1.2 2, 4 5.5" />
      </g>
    </g>
  </svg>
);

export const PlateVisualizer2D: React.FC<{ config: PlateConfig }> = ({ config }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Material border styling for Keychain frame
  const getMaterialStyle = () => {
    switch (config.material) {
      case 'gold_edge':
        return {
          background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)',
          boxShadow: '0 10px 30px rgba(212, 175, 55, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.6)',
          border: '2px solid #fcf6ba',
        };
      case 'black_matte':
        return {
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), inset 0 0 8px rgba(255, 255, 255, 0.1)',
          border: '2px solid #374151',
        };
      case 'carbon':
        return {
          background: 'radial-gradient(black 15%, transparent 16%) 0 0, radial-gradient(black 15%, transparent 16%) 8px 8px, radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 0 1px, radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 8px 9px',
          backgroundColor: '#18181b',
          backgroundSize: '16px 16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          border: '2px solid #52525b',
        };
      case 'chrome':
      default:
        return {
          background: 'linear-gradient(135deg, #e2e8f0 0%, #ffffff 30%, #cbd5e1 50%, #f8fafc 70%, #94a3b8 100%)',
          boxShadow: '0 10px 30px rgba(255, 255, 255, 0.2), 0 10px 25px rgba(0,0,0,0.5)',
          border: '2px solid #ffffff',
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
      {/* 2D Keychain Frame Container */}
      <div style={{ perspective: '1000px', width: '100%', maxWidth: '440px' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT SIDE */}
          <div
            style={{
              width: '100%',
              borderRadius: '16px',
              padding: '10px',
              backfaceVisibility: 'hidden',
              ...getMaterialStyle(),
            }}
          >
            {/* Key Chain Ring Hole */}
            <div
              style={{
                position: 'absolute',
                top: '-18px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #94a3b8, #cbd5e1, #475569)',
                border: '3px solid #1e293b',
                boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                zIndex: 5,
              }}
            />

            {/* License Plate Surface (Single Border Line) */}
            <div
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '10px',
                border: '2.5px solid #1e1e1e',
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'stretch',
                height: '102px',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.2)',
                width: '100%',
              }}
            >
              {/* LEFT REGION BLOCK (Region Code on Top, Flag + KG on Bottom) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingRight: '8px',
                  paddingLeft: '4px',
                  paddingTop: '2px',
                  paddingBottom: '2px',
                  borderRight: '2.5px solid #1e1e1e',
                  minWidth: '84px',
                  userSelect: 'none',
                  flexShrink: 0,
                }}
              >
                {/* Region Code (e.g. "01") */}
                <div
                  style={{
                    fontSize: '2.4rem',
                    fontFamily: "'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', var(--font-mono), monospace",
                    fontWeight: 900,
                    color: '#1e1e1e',
                    lineHeight: 0.95,
                    letterSpacing: '-0.02em',
                    marginTop: '2px',
                    textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.15)',
                  }}
                >
                  {config.regionCode}
                </div>

                {/* Flag & "KG" Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    marginBottom: '2px',
                  }}
                >
                  <KyrgyzFlagSVG width={34} height={22} />
                  <span
                    style={{
                      fontSize: '1.25rem',
                      fontFamily: "'FE-Schrift', 'License Plate', 'Oswald', 'Outfit', 'Inter', sans-serif",
                      fontWeight: 900,
                      color: '#1e1e1e',
                      lineHeight: 1,
                      letterSpacing: '0.5px',
                      textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.15)',
                    }}
                  >
                    KG
                  </span>
                </div>
              </div>

              {/* RIGHT MAIN PLATE TEXT SECTION */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: '10px',
                  paddingRight: '6px',
                  userSelect: 'none',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    fontSize: (config.plateNumber || '').length > 8 ? '2.4rem' : '3.3rem',
                    fontFamily: "'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', var(--font-mono), monospace",
                    fontWeight: 900,
                    color: '#1e1e1e',
                    letterSpacing: '0.07em',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.2)',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  {config.plateNumber || '777 AAA'}
                </div>
              </div>
            </div>
          </div>

          {/* BACK SIDE */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '16px',
              padding: '10px',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              ...getMaterialStyle(),
            }}
          >
            {/* Inner Surface Back */}
            <div
              style={{
                background: config.material === 'black_matte' ? '#111827' : '#ffffff',
                color: config.material === 'black_matte' ? '#ffffff' : '#000000',
                borderRadius: '12px',
                border: `2.5px solid ${config.material === 'black_matte' ? '#ffffff' : '#1e1e1e'}`,
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '106px',
                textAlign: 'center',
              }}
            >
              {config.backSideLogo && config.backSideLogo !== 'none' && LOGO_SVGS[config.backSideLogo] && (
                <div style={{ marginBottom: '6px' }}>
                  {LOGO_SVGS[config.backSideLogo]}
                </div>
              )}
              <div
                style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  wordBreak: 'break-word',
                }}
              >
                {config.backSideText || '+996 555 123 456'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <RotateCw size={16} />
          <span>{isFlipped ? 'Показать лицевую сторону' : 'Повернуть оборотную сторону'}</span>
        </button>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Регион: <strong style={{ color: 'var(--text-main)' }}>{REGION_NAMES[config.regionCode] || config.regionCode}</strong>
        </span>
      </div>
    </div>
  );
};
