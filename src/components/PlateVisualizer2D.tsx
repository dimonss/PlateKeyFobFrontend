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

/**
 * Parses user plate text into digits and letters according to KG plate standard.
 * e.g. "5555 M" -> { digits: "5555", letters: "M" }
 * e.g. "777 AAA" -> { digits: "777", letters: "AAA" }
 */
function parsePlateText(text: string) {
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
        {/* Crimson Red Field */}
        <rect width="40" height="26" fill="#E11D48" rx="1.5" />

        {/* Sun Disk & 40 Curved Rays (Scaled down to ~70%) */}
        <g transform="translate(20, 13) scale(0.6)">
          {/* 40 Rays */}
          {Array.from({ length: 40 }).map((_, i) => {
            const angle = (i * 360) / 40;
            return (
              <path
                key={i}
                d="M 0 -7.2 C 0.8 -9.2, 1.6 -10.2, 0 -11.6 C -1.6 -10.2, -0.8 -9.2, 0 -7.2 Z"
                fill="#FBBF24"
                transform={`rotate(${angle})`}
              />
            );
          })}

          {/* Center Sun Disk */}
          <circle r="6" fill="#FBBF24" />
          <circle r="4.8" fill="#E11D48" />

          {/* Tunduk emblem */}
          <g stroke="#FBBF24" strokeWidth="0.8" fill="none" strokeLinecap="round">
            <path d="M -3.6 -2.6 C -1.3 -0.8, 1.3 -0.8, 3.6 -2.6" />
            <path d="M -4.2 0 C -1.5 1.6, 1.5 1.6, 4.2 0" />
            <path d="M -3.6 2.6 C -1.3 0.8, 1.3 0.8, 3.6 2.6" />

            <path d="M -2.6 -3.6 C -0.8 -1.3, -0.8 1.3, -2.6 3.6" />
            <path d="M 0 -4.2 C 1.6 -1.5, 1.6 1.5, 0 4.2" />
            <path d="M 2.6 -3.6 C 0.8 -1.3, 0.8 1.3, 2.6 3.6" />
          </g>
        </g>

        {/* Flag boundary border */}
        <rect width="40" height="26" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" rx="1.5" />
      </g>

      {/* "KG" Country Identifier (height ~26mm, baseline y=96mm, centered under right digit '1' at x=76) */}
      <text
        x="76"
        y="96"
        fontSize="30"
        fontFamily="'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Outfit', sans-serif"
        fontWeight="700"
        fill="#1E1E1E"
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
                top: '7px',
                right: '7px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'rgba(12, 14, 18, 0.75)',
                border: '2px solid rgba(30, 30, 30, 0.8)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.2)',
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
                top: '7px',
                left: '7px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'rgba(12, 14, 18, 0.75)',
                border: '2px solid rgba(30, 30, 30, 0.8)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.2)',
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
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                textAlign: 'center',
              }}
            >
              {config.backSideLogo && config.backSideLogo !== 'none' && LOGO_SVGS[config.backSideLogo] && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {LOGO_SVGS[config.backSideLogo]}
                </div>
              )}
              <div
                style={{
                  fontSize: '1.2rem',
                  fontFamily: "'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', var(--font-mono), sans-serif",
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  wordBreak: 'break-word',
                  lineHeight: 1.2,
                }}
              >
                {config.backSideText || '+996 555 123 456'}
              </div>
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

