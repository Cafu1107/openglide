import type { LightingState } from '@openglide/core';
import { MouseGraphic } from '../../components/MouseGraphic';
import { Card, Slider } from '../../components/ui';
import { useT } from '../../lib/settings';
import type { TabProps } from './DevicePage';

const SWATCHES = ['#5dde89', '#67d8ff', '#a78bfa', '#f472b6', '#ff6b6b', '#ffb454', '#facc15', '#ffffff'];
const DEFAULT: LightingState = { effect: 'static', color: '#5dde89', brightness: 80, speed: 50 };

export function LightingTab({ entry, state, edit }: TabProps) {
  const t = useT();
  const cap = entry.device.capabilities.lighting!;
  const light = state.lighting ?? DEFAULT;
  const set = (patch: Partial<LightingState>) => edit({ lighting: { ...light, ...patch } });
  const animated = light.effect === 'breathing' || light.effect === 'spectrum' || light.effect === 'wave';
  const coloured = light.effect === 'static' || light.effect === 'breathing';

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 300px) 1fr' }}>
      <div className="card" style={{ display: 'grid', placeItems: 'center', padding: 28, background: 'radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--led, transparent) 8%, transparent), transparent 70%), var(--panel)' }}>
        <MouseGraphic lighting={light} size={200} />
      </div>
      <Card title={t('light.title')} desc={t('light.desc')}>
        <div className="stack" style={{ gap: 20 }}>
          <div>
            <div className="label small faint" style={{ marginBottom: 8 }}>{t('light.effect')}</div>
            <div className="row wrap">
              {cap.effects.map((fx) => (
                <button key={fx} className={`chip ${light.effect === fx ? 'on' : ''}`} onClick={() => set({ effect: fx })}>
                  {t(`effect.${fx}` as const)}
                </button>
              ))}
            </div>
          </div>

          {coloured && (
            <div>
              <div className="label small faint" style={{ marginBottom: 8 }}>{t('light.color')}</div>
              <div className="row wrap">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    aria-label={c}
                    onClick={() => set({ color: c })}
                    style={{
                      width: 30, height: 30, borderRadius: 9, background: c, cursor: 'pointer',
                      border: light.color.toLowerCase() === c ? '2px solid var(--text)' : '1px solid var(--line-strong)',
                      boxShadow: light.color.toLowerCase() === c ? `0 0 16px ${c}` : 'none',
                    }}
                  />
                ))}
                <label className="row" style={{ gap: 8, marginLeft: 6 }}>
                  <input type="color" value={light.color} onChange={(e) => set({ color: e.target.value })} style={{ width: 36, height: 30, border: 0, background: 'none', padding: 0, cursor: 'pointer' }} />
                  <span className="mono small">{light.color.toUpperCase()}</span>
                </label>
              </div>
            </div>
          )}

          {light.effect !== 'off' && (
            <div className="grid grid-2">
              <div>
                <div className="row between small" style={{ marginBottom: 8 }}>
                  <span className="faint">{t('light.brightness')}</span>
                  <span className="mono">{light.brightness}%</span>
                </div>
                <Slider label={t('light.brightness')} value={light.brightness} min={0} max={100} step={5} onChange={(v) => set({ brightness: v })} />
              </div>
              {animated && (
                <div>
                  <div className="row between small" style={{ marginBottom: 8 }}>
                    <span className="faint">{t('light.speed')}</span>
                    <span className="mono">{light.speed}%</span>
                  </div>
                  <Slider label={t('light.speed')} value={light.speed} min={0} max={100} step={5} onChange={(v) => set({ speed: v })} />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
