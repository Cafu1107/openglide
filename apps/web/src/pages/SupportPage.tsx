import { DRIVERS, demoDevices, demoMeta, type SupportedDevice } from '@openglide/core';
import { Code2, MessageSquarePlus, Search } from 'lucide-react';
import { useState } from 'react';
import { REPO_URL } from '../components/Sidebar';
import { Card, StatusBadge } from '../components/ui';
import { useT } from '../lib/settings';
import './drivers.css';

interface Row extends SupportedDevice {
  driver: string;
}

const ROWS: Row[] = [
  ...DRIVERS.flatMap((d) => d.devices.map((dev) => ({ ...dev, driver: d.name }))),
  ...demoDevices.map((dev) => ({ ...dev, driver: demoMeta.name })),
];

export function SupportPage() {
  const t = useT();
  const [query, setQuery] = useState('');
  const [remapOnly, setRemapOnly] = useState(false);
  const q = query.trim().toLowerCase();
  const rows = ROWS.filter(
    (r) => (!remapOnly || r.features.includes('buttons')) && (!q || `${r.vendor} ${r.name}`.toLowerCase().includes(q)),
  );

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">{t('support.title')}</h1>
          <p className="page-sub">{t('support.sub')}</p>
        </div>
      </header>

      <div className="row wrap between" style={{ marginBottom: 16 }}>
        <label className="search">
          <Search size={15} />
          <input className="input" placeholder={t('support.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="row" style={{ gap: 10 }}>
          <span className="faint small">{t('support.count', { n: rows.length })}</span>
          <button className={`chip ${remapOnly ? 'on' : ''}`} onClick={() => setRemapOnly((v) => !v)}>
            {t('support.remapOnly')}
          </button>
        </div>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('support.device')}</th>
              <th>{t('support.driver')}</th>
              <th>{t('support.status')}</th>
              <th>{t('support.features')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.driver + r.name}>
                <td>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div className="faint small">{r.vendor}{r.notes ? ` · ${r.notes}` : ''}</div>
                </td>
                <td className="small muted">{r.driver}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>
                  <div className="row wrap" style={{ gap: 4 }}>
                    {r.features.length === 0 && <span className="faint small">—</span>}
                    {r.features.map((f) => (
                      <span key={f} className="badge">{t(`feature.${f}` as const)}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <Card title={t('support.request')} desc={t('support.requestDesc')}>
          <a className="btn primary sm" href={`${REPO_URL}/issues/new?template=device_request.yml`} target="_blank" rel="noreferrer">
            <MessageSquarePlus size={14} />
            {t('support.request')}
          </a>
        </Card>
        <Card title={t('support.addDriver')} desc="packages/core/src/drivers/ → docs/ADDING_A_DRIVER.md">
          <a className="btn sm" href={`${REPO_URL}/blob/main/docs/ADDING_A_DRIVER.md`} target="_blank" rel="noreferrer">
            <Code2 size={14} />
            ADDING_A_DRIVER.md
          </a>
        </Card>
      </div>
    </>
  );
}
