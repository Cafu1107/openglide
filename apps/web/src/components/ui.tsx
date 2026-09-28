import type { DriverStatus } from '@openglide/core';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useT } from '../lib/settings';

export function Card({
  title,
  desc,
  action,
  children,
  className = '',
  bodyClass = '',
}: {
  title?: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClass?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="card-head">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {desc && <p className="card-desc">{desc}</p>}
          </div>
          {action}
        </header>
      )}
      {children !== undefined && <div className={`card-body ${bodyClass}`}>{children}</div>}
    </section>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <span className="switch">
      <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
      <span className="thumb" />
    </span>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T | undefined;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ '--fill': `${fill}%` } as CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function StatusBadge({ status }: { status: DriverStatus }) {
  const t = useT();
  return <span className={`badge ${status}`}>{t(`status.${status}` as const)}</span>;
}

export function Callout({ kind = 'info', children }: { kind?: 'info' | 'warn' | 'error'; children: ReactNode }) {
  const Icon = kind === 'warn' ? AlertTriangle : kind === 'error' ? XCircle : Info;
  return (
    <div className={`callout ${kind === 'info' ? '' : kind}`}>
      <Icon size={16} />
      <div>{children}</div>
    </div>
  );
}

export function SettingRow({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="setting-row">
      <div>
        <div className="label">{label}</div>
        {hint && <div className="hint">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export const hex4 = (n: number) => n.toString(16).padStart(4, '0');
