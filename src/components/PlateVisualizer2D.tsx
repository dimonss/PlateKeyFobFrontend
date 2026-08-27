import React, { useState, useEffect, useRef } from 'react';
import { RotateCw } from 'lucide-react';

export interface PlateConfig {
  plateNumber: string;
  regionCode: string;
  plateType: 'standard' | 'old' | 'vip';
  backSideText: string;
  backSideLogo: string;
  material: 'plastic' | 'black_matte' | 'gold_edge' | 'carbon';
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
  '10': 'Легализованные ТС',
};


/**
 * Parses user plate text into digits and letters according to KG plate standard.
 * e.g. "5555 M" -> { digits: "5555", letters: "M" }
 * e.g. "777 AAA" -> { digits: "777", letters: "AAA" }
 */
export function parsePlateText(text: string) {
  const trimmed = (text || '5555 M').trim().toUpperCase();
  const match = trimmed.match(/^([0-9]{1,4})\s*([A-ZА-Я]{1,3})$/i);
  if (match) {
    return {
      digits: match[1],
      letters: match[2],
      isStandard: true,
    };
  }
  return {
    digits: trimmed,
    letters: '',
    isStandard: false,
  };
}

/**
 * 2D Kyrgyzstan License Plate SVG component.
 * Exact 1:1 blueprint reproduction based on standard dimensions:
 * - Canvas: 520mm x 112mm (Aspect Ratio ~4.64:1)
 * - Left section: 140mm
 * - Region code height: 48mm
 * - Flag dimensions: 40mm x 26mm
 * - Digits height: 75mm
 * - Letters height: 62mm
 * - Baseline aligned digits & letters
 */
export const SVGPlate2D: React.FC<{ config: PlateConfig }> = ({ config }) => {
  const parsed = parsePlateText(config.plateNumber);
  const regionText = config.regionCode || '01';

  return (
    <svg
      viewBox="0 0 520 112"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        borderRadius: '8px',
      }}
    >
      <defs>
        {/* Soft plate surface background */}
        <linearGradient id="plateBgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        {/* Embossed shadow filter for text */}
        <filter id="embossFilter" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0.6" dy="0.6" stdDeviation="0.4" floodColor="#000000" floodOpacity="0.25" />
        </filter>

        {/* Clip path for the Kyrgyz flag corner rounding */}
        <clipPath id="flagClip">
          <rect width="40" height="26" rx="1.5" />
        </clipPath>
      </defs>

      {/* 1. License Plate Base Surface (520mm x 112mm) */}
      <rect
        x="0"
        y="0"
        width="520"
        height="112"
        rx="8"
        ry="8"
        fill="url(#plateBgGrad)"
      />

      {/* 2. Thicker Outer Black Frame Line (Positioned right at 0-edge perimeter) */}
      <rect
        x="2.25"
        y="2.25"
        width="515.5"
        height="107.5"
        rx="6"
        ry="6"
        fill="none"
        stroke="#1E1E1E"
        strokeWidth="4.5"
      />

      {/* 3. Thicker Vertical Section Separator (at 140mm mark) */}
      <line
        x1="140"
        y1="0"
        x2="140"
        y2="112"
        stroke="#1E1E1E"
        strokeWidth="4.5"
      />

      {/* ================= LEFT SECTION (0..140mm) ================= */}
      {/* Region Code (e.g. "01") - 48mm design height */}
      <text
        x="70"
        y="57"
        textAnchor="middle"
        fontSize="56"
        fontFamily="'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace"
        fontWeight="600"
        fill="#1E1E1E"
        letterSpacing="-0.5"
        filter="url(#embossFilter)"
      >
        {regionText}
      </text>

      {/* Flag of Kyrgyz Republic (40mm width x 26mm height, centered under left digit '0' at x=28) */}
      <g transform="translate(28, 72)">
        <image
          href={`${import.meta.env.BASE_URL}flag.svg`}
          x="-1.666"
          y="0"
          width="43.333"
          height="26"
          clipPath="url(#flagClip)"
        />

        {/* Flag boundary border */}
        <rect width="40" height="26" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" rx="1.5" />
      </g>

      {/* "KG" Country Identifier (authentic proportions with bold stroke for 0.4mm nozzle readiness) */}
      <text
        x="76"
        y="96"
        fontSize="31"
        fontFamily="'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Outfit', sans-serif"
        fontWeight="900"
        fill="#1E1E1E"
        stroke="#1E1E1E"
        strokeWidth="1.2"
        strokeLinejoin="round"
        paintOrder="stroke fill"
        letterSpacing="0.5"
        filter="url(#embossFilter)"
      >
        KG
      </text>

      {/* ================= RIGHT SECTION (140..520mm) ================= */}
      {/* Center of right section is x = 330mm. Baseline is y = 92mm. */}
      {parsed.isStandard ? (
        <text
          x="330"
          y="92"
          textAnchor="middle"
          filter="url(#embossFilter)"
        >
          {/* Digits: 75mm design height -> fontSize=92 */}
          <tspan
            fontSize="92"
            fontFamily="'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace"
            fontWeight="600"
            fill="#1E1E1E"
            letterSpacing="0"
          >
            {parsed.digits}
          </tspan>

          {/* Suffix Letters: 62mm design height -> fontSize=76 */}
          {parsed.letters && (
            <tspan
              dx="24"
              fontSize="76"
              fontFamily="'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace"
              fontWeight="600"
              fill="#1E1E1E"
              letterSpacing="0"
            >
              {parsed.letters}
            </tspan>
          )}
        </text>
      ) : (
        /* Non-standard or custom text string */
        <text
          x="330"
          y="91"
          textAnchor="middle"
          fontSize={parsed.digits.length > 8 ? '54' : parsed.digits.length > 6 ? '70' : '86'}
          fontFamily="'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace"
          fontWeight="600"
          fill="#1E1E1E"
          letterSpacing="2"
          filter="url(#embossFilter)"
        >
          {parsed.digits}
        </text>
      )}
    </svg>
  );
};

export const PlateVisualizer2D: React.FC<{ config: PlateConfig }> = ({ config }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const prevConfigRef = useRef<PlateConfig | null>(null);

  useEffect(() => {
    if (prevConfigRef.current) {
      const prev = prevConfigRef.current;
      const frontChanged = prev.plateNumber !== config.plateNumber || prev.regionCode !== config.regionCode;
      const backChanged = prev.backSideText !== config.backSideText || prev.backSideLogo !== config.backSideLogo;

      if (frontChanged) {
        setIsFlipped(false);
      } else if (backChanged) {
        setIsFlipped(true);
      }
    }
    prevConfigRef.current = config;
  }, [config]);

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
      case 'plastic':
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
              position: 'relative',
              width: '100%',
              borderRadius: '10px',
              padding: '2px',
              backfaceVisibility: 'hidden',
              ...getMaterialStyle(),
            }}
          >
            {/* Key Chain Ring Hole */}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 60%, #94a3b8 100%)',
                border: '1.5px solid rgba(148, 163, 184, 0.8)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 0 4px rgba(0,0,0,0.15)',
                zIndex: 5,
              }}
            />

            {/* 1:1 Vector License Plate */}
            <SVGPlate2D config={config} />
          </div>

          {/* BACK SIDE */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '10px',
              padding: '2px',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              boxSizing: 'border-box',
              ...getMaterialStyle(),
            }}
          >
            {/* Key Chain Ring Hole (Positioned on the top left when flipped so it aligns with front top right) */}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 60%, #94a3b8 100%)',
                border: '1.5px solid rgba(148, 163, 184, 0.8)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 0 4px rgba(0,0,0,0.15)',
                zIndex: 5,
              }}
            />
            {/* Inner Surface Back */}
            <div
              style={{
                background: config.material === 'black_matte' ? '#111827' : '#ffffff',
                color: config.material === 'black_matte' ? '#ffffff' : '#000000',
                borderRadius: '8px',
                border: `2.25px solid ${config.material === 'black_matte' ? '#ffffff' : '#1e1e1e'}`,
                padding: '8px 16px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                textAlign: 'center',
              }}
            >
              {config.backSideLogo && config.backSideLogo !== 'none' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img
                    src={`${import.meta.env.BASE_URL}logos/${config.backSideLogo}.svg`}
                    alt={config.backSideLogo}
                    style={{
                      width: ['toyota', 'lexus', 'hyundai', 'kia', 'audi', 'chevrolet'].includes(config.backSideLogo) ? '118px' : '94px',
                      height: '76px',
                      objectFit: 'contain',
                      filter: config.material === 'black_matte' && config.backSideLogo !== 'bmw'
                        ? 'brightness(0) invert(1)' 
                        : 'none',
                    }}
                  />
                </div>
              )}
              {config.backSideText && config.backSideText.trim() && (
                <div
                  style={{
                    fontSize: '2.25rem',
                    fontFamily: "'Oswald', 'Outfit', 'Inter', var(--font-mono), sans-serif",
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                    textAlign: 'center',
                  }}
                >
                  {config.backSideText}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions & Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
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

