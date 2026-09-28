import type { MouseState } from '@openglide/core';
import { Battery, BatteryCharging, Cable, Loader2, RefreshCw, Unplug, Wifi } from 'lucide-react';
import { Callout, StatusBadge } from '../../components/ui';
import { apply, connectDemo, connectDevice, disconnect, discard, editDraft, effective, pendingKeys, refresh, useDevice, type DeviceEntry } from '../../lib/devices';
import { href, navigate } from '../../lib/router';
import { useSettings, useT } from '../../lib/settings';
import type { Key } from '../../i18n';
import { ButtonsTab } from './ButtonsTab';
import { LightingTab } from './LightingTab';
import { OverviewTab } from './OverviewTab';
import { PerformanceTab } from './PerformanceTab';
import { ProfilesTab } from './ProfilesTab';
import { SensorTab } from './SensorTab';

export interface TabProps {
  entry: DeviceEntry;
  state: MouseState;
  edit: (patch: MouseState) => void;
}

type TabId = 'overview' | 'performance' | 'sensor' | 'buttons' | 'lighting' | 'profiles';

function availableTabs(entry: DeviceEntry): TabId[] {
  const c = entry.device.capabilities;
  const tabs: TabId[] = ['overview'];
  if (c.dpi || c.pollingRates) tabs.push('performance');
  if (c.liftOff || c.angleSnapping || c.rippleControl || c.motionSync || c.debounce || c.sleepTimeout) tabs.push('sensor');
  if (c.buttons) tabs.push('buttons');
  if (c.lighting) tabs.push('lighting');
  if (c.dpi || c.pollingRates) tabs.push('profiles');
  return tabs;
}

export function DevicePage({ id, tab }: { id: string; tab?: string }) {
  const t = useT();
  const entry = useDevice(id);
  const { autoApply } = useSettings();

  if (!entry) {
    return (
      <div className="card empty">
        <p>{t('device.notFound')}</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={connectDevice}>{t('nav.connect')}</button>
          <button className="btn" onClick={connectDemo}>{t('nav.demo')}</button>
        </div>
      </div>
    );
  }

  const { device } = entry;
  const tabs = availableTabs(entry);
  const current: TabId = tabs.includes(tab as TabId) ? (tab as TabId) : 'overview';
  const pending = pendingKeys(entry);
  const state = effective(entry);
  const props: TabProps = { entry, state, edit: (patch) => editDraft(id, patch) };
  const ConnIcon = device.info.connection === 'wired' ? Cable : Wifi;

  return (
    <>
      <header className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="row wrap" style={{ gap: 8, marginBottom: 6 }}>
            <span className="badge">
              <ConnIcon size={12} />
              {t(`conn.${device.info.connection}` as const)}
            </span>
            <StatusBadge status={device.driver.status} />
            {entry.battery && (
              <span className="badge">
                {entry.battery.charging ? <BatteryCharging size={12} /> : <Battery size={12} />}
                {entry.battery.percent !== undefined ? `${entry.battery.percent}%` : entry.battery.level}
              </span>
            )}
          </div>
          <h1 className="page-title">{device.info.name}</h1>
          <p className="page-sub">
            {device.info.vendor} · <span className="mono">{device.driver.name}</span>
          </p>
        </div>
        <div className="row">
          <button className="btn sm" onClick={() => refresh(id)} disabled={entry.status === 'loading' || entry.status === 'applying'}>
            <RefreshCw size={14} className={entry.status === 'loading' ? 'spin' : ''} />
            {t('device.refresh')}
          </button>
          <button
            className="btn sm danger"
            onClick={async () => {
              await disconnect(id);
              navigate('');
            }}
          >
            <Unplug size={14} />
            {t('device.disconnect')}
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="Device sections">
        {tabs.map((x) => (
          <a key={x} className={`tab ${x === current ? 'on' : ''}`} href={href(`device/${id}/${x}`)} style={{ textDecoration: 'none' }}>
            {t(`device.tab.${x}` as Key)}
          </a>
        ))}
      </nav>

      {entry.status === 'error' && (
        <div style={{ marginBottom: 16 }}>
          <Callout kind="error">
            <strong>{t('device.readFailed')}:</strong> {entry.error}
          </Callout>
        </div>
      )}

      {!entry.state && entry.status === 'loading' ? (
        <div className="card empty">
          <Loader2 className="spin" size={22} />
          <p>{t('device.loading')}</p>
        </div>
      ) : (
        <>
          {current === 'overview' && <OverviewTab {...props} />}
          {current === 'performance' && <PerformanceTab {...props} />}
          {current === 'sensor' && <SensorTab {...props} />}
          {current === 'buttons' && <ButtonsTab {...props} />}
          {current === 'lighting' && <LightingTab {...props} />}
          {current === 'profiles' && <ProfilesTab {...props} />}
        </>
      )}

      {pending.length > 0 && !autoApply && (
        <div className="apply-bar" role="region" aria-label="Pending changes">
          <span className="pulse" />
          <span style={{ fontWeight: 600 }}>{t('device.pending', { n: pending.length })}</span>
          <button className="btn ghost sm" onClick={() => discard(id)} disabled={entry.status === 'applying'}>
            {t('device.discard')}
          </button>
          <button className="btn primary sm" onClick={() => apply(id)} disabled={entry.status === 'applying'}>
            {entry.status === 'applying' && <Loader2 size={14} className="spin" />}
            {entry.status === 'applying' ? t('device.applying') : t('device.apply')}
          </button>
        </div>
      )}
    </>
  );
}
