import type { ButtonAction } from '@openglide/core';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { MouseGraphic } from '../../components/MouseGraphic';
import { Card } from '../../components/ui';
import type { Key } from '../../i18n';
import { useT } from '../../lib/settings';
import type { TabProps } from './DevicePage';

const LABEL_KEYS: Record<string, Key> = { Left: 'tests.left', Right: 'tests.right', Middle: 'tests.middle', Back: 'tests.back', Forward: 'tests.forward' };

const DEFAULTS: ButtonAction[] = ['left-click', 'right-click', 'middle-click', 'back', 'forward', 'dpi-cycle'];

export function ButtonsTab({ entry, state, edit }: TabProps) {
  const t = useT();
  const cap = entry.device.capabilities.buttons!;
  const [selected, setSelected] = useState(0);
  const buttons = state.buttons ?? DEFAULTS.slice(0, cap.labels.length);

  const assign = (index: number, action: ButtonAction) => {
    const next = [...buttons];
    next[index] = action;
    edit({ buttons: next });
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 300px) 1fr' }}>
      <div className="card" style={{ display: 'grid', placeItems: 'center', padding: 28 }}>
        <MouseGraphic lighting={state.lighting} selected={selected} onSelect={setSelected} buttonCount={cap.labels.length} size={200} />
      </div>
      <Card
        title={t('buttons.title')}
        desc={t('buttons.desc')}
        action={
          <button className="btn sm ghost" onClick={() => edit({ buttons: DEFAULTS.slice(0, cap.labels.length) })}>
            <RotateCcw size={14} />
            {t('buttons.reset')}
          </button>
        }
      >
        <div className="stack" style={{ gap: 6 }}>
          {cap.labels.map((label, i) => (
            <label
              key={label}
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
              <select className="input" value={buttons[i]} onChange={(e) => assign(i, e.target.value as ButtonAction)} style={{ width: 190 }}>
                {cap.actions.map((a) => (
                  <option key={a} value={a}>
                    {t(`action.${a}` as const)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
