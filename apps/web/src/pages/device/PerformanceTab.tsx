import type { DpiCapability } from '@openglide/core';
import { Plus, X } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { Callout, Card, Segmented, Slider } from '../../components/ui';
import { useT } from '../../lib/settings';
import type { TabProps } from './DevicePage';
import './performance.css';

export const STAGE_COLORS = ['#ff6b6b', '#ffb454', '#5dde89', '#67d8ff', '#a78bfa', '#f472b6'];
const PRESETS = [400, 800, 1200, 1600, 3200, 6400];

/** Clamp and snap a DPI value to what the sensor accepts. */
export function snapDpi(value: number, cap: DpiCapability): number {
  if (cap.values?.length) {
    return cap.values.reduce((best, v) => (Math.abs(v - value) < Math.abs(best - value) ? v : best), cap.values[0]!);
  }
  const clamped = Math.min(cap.max, Math.max(cap.min, value));
  return Math.round((clamped - cap.min) / cap.step) * cap.step + cap.min;
}

/** Free typing, committed (clamped and snapped) on blur or Enter. */
function DpiInput({ value, cap, onChange, label }: { value: number; cap: DpiCapability; onChange: (v: number) => void; label: string }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const snapped = snapDpi(Number(text) || cap.min, cap);
    setText(String(snapped));
    if (snapped !== value) onChange(snapped);
  };
  return (
    <input
      className="input num"
      inputMode="numeric"
      aria-label={label}
      value={text}
      onChange={(e) => setText(e.target.value.replace(/\D/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
    />
  );
}

export function PerformanceTab({ entry, state, edit }: TabProps) {
  const t = useT();
  const caps = entry.device.capabilities;
  const dpiCap = caps.dpi;
  const stages = state.dpiStages ?? [];
  const active = Math.min(state.activeStage ?? 0, Math.max(stages.length - 1, 0));
  const multi = (dpiCap?.maxStages ?? 1) > 1;
  const fixedCount = !!dpiCap?.fixedStageCount;

  const setStage = (index: number, value: number) => {
    const next = [...stages];
    next[index] = value;
    edit({ dpiStages: next });
  };
  const sliderMax = dpiCap ? Math.min(dpiCap.max, 12000) : 0;

  return (
    <div className="stack">
      {dpiCap && multi && (
        <Card
          title={t('perf.dpi')}
          desc={t('perf.dpiDesc')}
          action={
            !fixedCount && <button
              className="btn sm"
              disabled={stages.length >= dpiCap.maxStages}
              onClick={() => edit({ dpiStages: [...stages, snapDpi((stages.at(-1) ?? 800) * 2, dpiCap)] })}
            >
              <Plus size={14} />
              {t('perf.addStage')}
            </button>
          }
        >
          <div className="stages">
            {stages.map((value, i) => (
              <div key={i} className={`stage ${i === active ? 'on' : ''}`} style={{ '--stage': STAGE_COLORS[i % STAGE_COLORS.length] } as CSSProperties}>
                <button className="stage-pick" onClick={() => edit({ activeStage: i })} aria-pressed={i === active}>
                  <span className="stage-dot" />
                  <span>
                    <span className="stage-name">{t('perf.stage', { n: i + 1 })}</span>
                    {i === active && <span className="badge accent" style={{ marginLeft: 8 }}>{t('perf.active')}</span>}
                  </span>
                </button>
                <Slider value={Math.min(value, sliderMax)} min={dpiCap.min} max={sliderMax} step={dpiCap.step} onChange={(v) => setStage(i, snapDpi(v, dpiCap))} label={t('perf.stage', { n: i + 1 })} />
                <DpiInput value={value} cap={dpiCap} onChange={(v) => setStage(i, v)} label={t('perf.stage', { n: i + 1 })} />
                {fixedCount ? <span /> : <button
                  className="btn ghost icon-btn sm"
                  aria-label={t('perf.remove')}
                  disabled={stages.length <= 1}
                  onClick={() =>
                    edit({ dpiStages: stages.filter((_, j) => j !== i), activeStage: Math.min(active, stages.length - 2) })
                  }
                >
                  <X size={14} />
                </button>}
              </div>
            ))}
          </div>
          <div className="row wrap" style={{ marginTop: 14 }}>
            <span className="faint small">{t('perf.presets')}:</span>
            {PRESETS.filter((p) => p >= dpiCap.min && p <= dpiCap.max).map((p) => (
              <button key={p} className={`chip ${stages[active] === p ? 'on' : ''}`} onClick={() => setStage(active, snapDpi(p, dpiCap))}>
                {p}
              </button>
            ))}
          </div>
        </Card>
      )}

      {dpiCap && !multi && (
        <Card title={t('perf.dpiSingle')} desc={t('perf.dpiSingleDesc')}>
          <div className="dpi-single">
            <div className="dpi-big mono">
              {(stages[0] ?? 0).toLocaleString()}
              <small>DPI</small>
            </div>
            <Slider value={stages[0] ?? dpiCap.min} min={dpiCap.min} max={dpiCap.max} step={dpiCap.values ? 1 : dpiCap.step} onChange={(v) => setStage(0, snapDpi(v, dpiCap))} label={t('perf.dpiSingle')} />
            <DpiInput value={stages[0] ?? dpiCap.min} cap={dpiCap} onChange={(v) => setStage(0, v)} label={t('perf.dpiSingle')} />
          </div>
          <div className="row wrap" style={{ marginTop: 14 }}>
            <span className="faint small">{t('perf.presets')}:</span>
            {PRESETS.filter((p) => p >= dpiCap.min && p <= dpiCap.max).map((p) => (
              <button key={p} className={`chip ${stages[0] === p ? 'on' : ''}`} onClick={() => setStage(0, snapDpi(p, dpiCap))}>
                {p}
              </button>
            ))}
          </div>
          <div className="faint small mono" style={{ marginTop: 10 }}>
            {dpiCap.min}–{dpiCap.max} · step {dpiCap.step}
          </div>
        </Card>
      )}

      {caps.pollingRates && (
        <Card title={t('perf.rate')} desc={t('perf.rateDesc')}>
          <Segmented
            label={t('perf.rate')}
            value={state.pollingRate}
            onChange={(v) => edit({ pollingRate: v })}
            options={caps.pollingRates.map((hz) => ({
              value: hz,
              label: (
                <>
                  {hz >= 1000 ? `${hz / 1000}K` : hz}
                  <span className="unit">Hz</span>
                </>
              ),
            }))}
          />
          {(state.pollingRate ?? 0) > 1000 && (
            <div style={{ marginTop: 14 }}>
              <Callout kind="warn">{t('perf.rateHigh')}</Callout>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
