import type { ButtonAction } from '@openglide/core';
import { Lock, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { MouseGraphic, spotForButton } from '../../components/MouseGraphic';
import { Callout, Card } from '../../components/ui';
import { DICTS, type Key } from '../../i18n';
import { useT } from '../../lib/settings';
import type { TabProps } from './DevicePage';

const LABEL_KEYS: Record<string, Key> = { Left: 'tests.left', Right: 'tests.right', Middle: 'tests.middle', Back: 'tests.back', Forward: 'tests.forward' };

/** Demo-mouse defaults; vendor drivers report their own current mapping. */
const DEFAULTS: ButtonAction[] = ['left-click', 'right-click', 'middle-click', 'back', 'forward', 'dpi-cycle'];

/** Translate built-in action ids; vendor action names are shown as the driver reports them. */
export function useActionLabel() {
  const t = useT();
  return (action: string) => (`action.${action}` in DICTS.en ? t(`action.${action}` as Key) : action || '—');
}

export function ButtonsTab({ entry, state, edit }: TabProps) {
  const t = useT();
  const actionLabel = useActionLabel();
  const cap = entry.device.capabilities.buttons!;
  const [selected, setSelected] = useState(0);
  const isDemo = entry.device.driver.id === 'demo';
  const buttons = state.buttons ?? (isDemo ? DEFAULTS.slice(0, cap.labels.length) : []);
  const spots = cap.labels.map(spotForButton);

  const assign = (index: number, action: ButtonAction) => {
    const next = [...buttons];
    next[index] = action;
    edit({ buttons: next });
  };

  return (
    <div className="stack">
      {cap.readOnly && (
        <Callout kind="warn">
          <strong>{t('buttons.readOnlyTitle')}</strong> {t('buttons.readOnly')}
        </Callout>
      )}
      <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 300px) 1fr' }}>
        <div className="card" style={{ display: 'grid', placeItems: 'center', padding: 28 }}>
          <MouseGraphic
            lighting={state.lighting}
            selected={spots[selected]}
            onSelect={(spot) => {
              const row = spots.indexOf(spot);
              if (row >= 0) setSelected(row);
            }}
            activeSpots={spots.filter((s) => s >= 0)}
            size={200}
          />
        </div>
        <Card
          title={t('buttons.title')}
          desc={t('buttons.desc')}
          action={
            isDemo && (
              <button className="btn sm ghost" onClick={() => edit({ buttons: DEFAULTS.slice(0, cap.labels.length) })}>
                <RotateCcw size={14} />
                {t('buttons.reset')}
              </button>
            )
          }
        >
          <div className="stack" style={{ gap: 6 }}>
            {cap.labels.map((label, i) => {
              const current = buttons[i] ?? '';
              // Keep an unknown current value selectable so it is never silently replaced.
              const options = current && !cap.actions.includes(current) ? [current, ...cap.actions] : cap.actions;
              return (
                <label
                  key={`${label}-${i}`}
                  className="row between"
                  onFocus={() => setSelected(i)}
                  onMouseEnter={() => setSelected(i)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: `1px solid ${selected === i ? 'color-mix(in srgb, var(--accent) 45%, transparent)' : 'var(--line)'}`,
                    background: selected === i ? 'var(--accent-soft)' : 'var(--panel-soft)',
                  }}
                >
                  <span className="row" style={{ gap: 10 }}>
                    <span className="mono faint" style={{ width: 18 }}>{i + 1}</span>
                    <strong>{LABEL_KEYS[label] ? t(LABEL_KEYS[label]) : label}</strong>
                  </span>
                  {cap.readOnly ? (
                    <span className="row small" style={{ gap: 6 }}>
                      <Lock size={13} className="faint" />
                      {actionLabel(current)}
                    </span>
                  ) : (
                    <select className="input" value={current} onChange={(e) => assign(i, e.target.value)} style={{ width: 200 }}>
                      {!current && <option value="">—</option>}
                      {options.map((a) => (
                        <option key={a} value={a}>
                          {actionLabel(a)}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
