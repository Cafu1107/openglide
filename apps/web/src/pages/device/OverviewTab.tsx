import { Card, Callout, hex4 } from '../../components/ui';
import { MouseGraphic } from '../../components/MouseGraphic';
import { useT } from '../../lib/settings';
import type { TabProps } from './DevicePage';

export function OverviewTab({ entry, state }: TabProps) {
  const t = useT();
  const { info, capabilities: caps, driver } = entry.device;
  const dpi = state.dpiStages?.[state.activeStage ?? 0];
  const battery = entry.battery;

  const tiles = [
    { k: t('overview.dpi'), v: dpi?.toLocaleString(), unit: 'DPI' },
    { k: t('overview.rate'), v: state.pollingRate?.toLocaleString(), unit: 'Hz' },
    {
      k: t('overview.battery'),
      v: battery?.percent ?? battery?.level,
      unit: battery?.percent !== undefined ? (battery.charging ? `% · ${t('overview.charging')}` : '%') : '',
    },
    caps.profiles
      ? { k: t('overview.profile'), v: (state.activeProfile ?? 0) + 1, unit: `/ ${caps.profiles.count}` }
      : { k: t('overview.stages'), v: state.dpiStages?.length, unit: '' },
  ];

  return (
    <div className="stack">
      <div className="grid grid-4">
        {tiles.map((x) => (
          <div key={x.k} className="card stat">
            <div className="k">{x.k}</div>
            <div className="v">
              {x.v ?? '—'}
              {x.v !== undefined && x.unit && <small>{x.unit}</small>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <Card title={t('overview.details')}>
          <dl className="kv">
            <dt>{t('overview.model')}</dt>
            <dd>{info.name}</dd>
            <dt>{t('overview.vendor')}</dt>
            <dd>{info.vendor}</dd>
            <dt>{t('overview.ids')}</dt>
            <dd className="mono">
              {hex4(info.vendorId)}:{hex4(info.productId)}
            </dd>
            <dt>{t('overview.firmware')}</dt>
            <dd className="mono">{info.firmware ?? '—'}</dd>
            <dt>{t('overview.protocol')}</dt>
            <dd>{info.protocol ?? '—'}</dd>
            <dt>{t('overview.connection')}</dt>
            <dd>{t(`conn.${info.connection}` as const)}</dd>
            <dt>{t('overview.driver')}</dt>
            <dd>{driver.name}</dd>
            <dt>{t('overview.storage')}</dt>
            <dd>{caps.persistent ? t('overview.onMouse') : t('overview.session')}</dd>
          </dl>
        </Card>
        <div className="card" style={{ display: 'grid', placeItems: 'center', padding: 24, minHeight: 280 }}>
          <MouseGraphic lighting={state.lighting} size={160} />
        </div>
      </div>

      {info.notes?.map((note) => <Callout key={note}>{note}</Callout>)}
      {Object.keys(caps).filter((k) => k !== 'persistent' && k !== 'battery').length === 0 && (
        <Callout kind="warn">{t('device.noSettings')}</Callout>
      )}
    </div>
  );
}
