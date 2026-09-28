import { Card, Segmented, SettingRow, Slider, Switch } from '../../components/ui';
import { useT } from '../../lib/settings';
import type { TabProps } from './DevicePage';

const formatSleep = (s: number) => (s < 60 ? `${s}s` : `${s / 60}m`);

export function SensorTab({ entry, state, edit }: TabProps) {
  const t = useT();
  const c = entry.device.capabilities;

  return (
    <Card title={t('sensor.title')} desc={t('sensor.desc')}>
      {c.liftOff && (
        <SettingRow label={t('sensor.lod')} hint={t('sensor.lodHint')}>
          <Segmented
            label={t('sensor.lod')}
            value={state.liftOff}
            onChange={(v) => edit({ liftOff: v })}
            options={c.liftOff.map((mm) => ({ value: mm, label: <>{mm}<span className="unit">mm</span></> }))}
          />
        </SettingRow>
      )}
      {c.angleSnapping && (
        <SettingRow label={t('sensor.angle')} hint={t('sensor.angleHint')}>
          <Switch label={t('sensor.angle')} checked={!!state.angleSnapping} onChange={(v) => edit({ angleSnapping: v })} />
        </SettingRow>
      )}
      {c.rippleControl && (
        <SettingRow label={t('sensor.ripple')} hint={t('sensor.rippleHint')}>
          <Switch label={t('sensor.ripple')} checked={!!state.rippleControl} onChange={(v) => edit({ rippleControl: v })} />
        </SettingRow>
      )}
      {c.motionSync && (
        <SettingRow label={t('sensor.motion')} hint={t('sensor.motionHint')}>
          <Switch label={t('sensor.motion')} checked={!!state.motionSync} onChange={(v) => edit({ motionSync: v })} />
        </SettingRow>
      )}
      {c.debounce && (
        <SettingRow label={t('sensor.debounce')} hint={t('sensor.debounceHint')}>
          <div className="row" style={{ width: 260 }}>
            <Slider
              label={t('sensor.debounce')}
              value={state.debounce ?? c.debounce.min}
              min={c.debounce.min}
              max={c.debounce.max}
              step={c.debounce.step}
              onChange={(v) => edit({ debounce: v })}
            />
            <span className="mono" style={{ minWidth: 48, textAlign: 'right' }}>{state.debounce ?? 0} ms</span>
          </div>
        </SettingRow>
      )}
      {c.sleepTimeout && (
        <SettingRow label={t('sensor.sleep')} hint={t('sensor.sleepHint')}>
          <Segmented
            label={t('sensor.sleep')}
            value={state.sleepTimeout}
            onChange={(v) => edit({ sleepTimeout: v })}
            options={c.sleepTimeout.map((s) => ({ value: s, label: formatSleep(s) }))}
          />
        </SettingRow>
      )}
    </Card>
  );
}
