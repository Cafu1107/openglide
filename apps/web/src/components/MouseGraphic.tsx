import type { LightingState } from '@openglide/core';
import type { CSSProperties } from 'react';
import './mouse.css';

/** Physical hotspots on the drawing, by index. */
export const BUTTON_SPOTS = ['left', 'right', 'wheel', 'back', 'forward', 'dpi'] as const;

/** Map a driver's button name ("Left", "leftClick", "Mouse 4", "Side back"…) to a hotspot index, or -1. */
export function spotForButton(name: string): number {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/left|primary|button1$|^m1$/.test(n)) return 0;
  if (/right|secondary|button2$|^m2$/.test(n)) return 1;
  if (/middle|wheel|scrollclick|button3$|^m3$/.test(n)) return 2;
  if (/back|mouse4|button4$|^m4$|side1|sidelower|rear/.test(n)) return 3;
  if (/forward|mouse5|button5$|^m5$|side2|sideupper|front/.test(n)) return 4;
  if (/dpi|cpi/.test(n)) return 5;
  return -1;
}

interface Props {
  lighting?: LightingState;
  selected?: number;
  onSelect?: (index: number) => void;
  /** Hotspot indices that can be clicked. */
  activeSpots?: number[];
  size?: number;
  className?: string;
}

/** Top-down vector mouse. Buttons are clickable and LEDs preview lighting. */
export function MouseGraphic({ lighting, selected, onSelect, activeSpots = [], size = 220, className = '' }: Props) {
  const on = lighting && lighting.effect !== 'off';
  const color = lighting?.color ?? 'var(--accent)';
  const style = {
    '--led': color,
    '--led-alpha': on ? String(0.25 + (lighting.brightness / 100) * 0.75) : '0',
    '--led-speed': `${6 - ((lighting?.speed ?? 50) / 100) * 5}s`,
    width: size,
  } as CSSProperties;

  const spot = (index: number, base: string) => {
    if (!activeSpots.includes(index) || !onSelect) return { className: base };
    return {
      className: `${base} hot ${selected === index ? 'sel' : ''}`,
      onClick: () => onSelect(index),
      role: 'button',
      tabIndex: 0,
      onKeyDown: (e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && onSelect(index),
    };
  };

  return (
    <svg
      viewBox="0 0 200 320"
      className={`mouse-graphic fx-${on ? lighting.effect : 'off'} ${className}`}
      style={style}
      aria-hidden={!onSelect}
    >
      <defs>
        <linearGradient id="mg-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--mg-top)" />
          <stop offset="1" stopColor="var(--mg-bottom)" />
        </linearGradient>
        <linearGradient id="mg-spectrum" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff5f6d" />
          <stop offset="0.25" stopColor="#ffc371" />
          <stop offset="0.5" stopColor="#5dde89" />
          <stop offset="0.75" stopColor="#67d8ff" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="mg-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* under-glow */}
      <ellipse className="led underglow" cx="100" cy="300" rx="80" ry="14" filter="url(#mg-blur)" />

      <path
        className="body"
        d="M100 12C150 12 178 50 180 110L182 220C184 280 150 308 100 308C50 308 16 280 18 220L20 110C22 50 50 12 100 12Z"
        fill="url(#mg-body)"
      />
      <path d="M98 14C54 16 25 52 22 108L21 130Q60 140 98 142Z" {...spot(0, 'btn-shape')} />
      <path d="M102 14C146 16 175 52 178 108L179 130Q140 140 102 142Z" {...spot(1, 'btn-shape')} />
      <rect x="90" y="38" width="20" height="48" rx="10" {...spot(2, 'wheel')} />
      <g className="wheel-ribs" pointerEvents="none">
        {[46, 53, 60, 67, 74].map((y) => (
          <line key={y} x1="94" x2="106" y1={y} y2={y} />
        ))}
      </g>
      <rect x="93" y="96" width="14" height="20" rx="6" {...spot(5, 'btn-shape small')} />
      <rect x="12" y="146" width="11" height="34" rx="5" {...spot(4, 'btn-shape small side')} />
      <rect x="12" y="186" width="11" height="34" rx="5" {...spot(3, 'btn-shape small side')} />

      {/* logo + LED strip */}
      <path className="led strip" d="M40 262C60 292 140 292 160 262" fill="none" strokeWidth="4" strokeLinecap="round" />
      <g className="led logo" transform="translate(100 222)">
        <circle r="17" fill="none" strokeWidth="3" />
        <path d="M-6 6L0 -8L6 6" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
