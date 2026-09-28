import { Apple, ExternalLink, Globe, Monitor, Search, Terminal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { REPO_URL } from '../components/Sidebar';
import { Callout } from '../components/ui';
import { DRIVER_LINKS, type Platform } from '../data/drivers';
import { useT } from '../lib/settings';
import './drivers.css';

const PLATFORM_ICON: Record<Platform, typeof Monitor> = { windows: Monitor, macos: Apple, linux: Terminal, web: Globe };
const PLATFORM_LABEL: Record<Platform, string> = { windows: 'Windows', macos: 'macOS', linux: 'Linux', web: 'Web' };

const monogram = (brand: string) =>
  brand
    .split(/[\s/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export function DriversPage() {
  const t = useT();
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<Platform | 'all'>('all');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DRIVER_LINKS.filter(
      (d) =>
        (platform === 'all' || d.platforms.includes(platform)) &&
        (!q || `${d.brand} ${d.software}`.toLowerCase().includes(q)),
    );
  }, [query, platform]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">{t('drivers.title')}</h1>
          <p className="page-sub">{t('drivers.sub')}</p>
        </div>
      </header>

      <div className="row wrap between" style={{ marginBottom: 16 }}>
        <label className="search">
          <Search size={15} />
          <input className="input" placeholder={t('drivers.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="row wrap" style={{ gap: 6 }}>
          {(['all', 'windows', 'macos', 'web'] as const).map((p) => (
            <button key={p} className={`chip ${platform === p ? 'on' : ''}`} onClick={() => setPlatform(p)}>
              {p === 'all' ? t('drivers.all') : p === 'web' ? t('drivers.web') : PLATFORM_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card empty">{t('drivers.none')}</div>
      ) : (
        <div className="driver-grid">
          {list.map((d) => (
            <article key={d.brand + d.software} className="card driver-card">
              <div className="row" style={{ gap: 12 }}>
                <span className="monogram" style={{ '--brand': d.color } as React.CSSProperties}>
                  {monogram(d.brand)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="driver-brand">{d.brand}</div>
                  <div className="faint small">{d.software}</div>
                </div>
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                {d.platforms.map((p) => {
                  const Icon = PLATFORM_ICON[p];
                  return (
                    <span key={p} className="badge">
                      <Icon size={11} />
                      {PLATFORM_LABEL[p]}
                    </span>
                  );
                })}
                {d.openglide && <span className="badge accent">{t('drivers.openglide')}</span>}
              </div>
              {d.note && <p className="faint small" style={{ margin: 0 }}>{d.note}</p>}
              <div className="driver-actions">
                <a className="btn sm primary" href={d.url} target="_blank" rel="noreferrer noopener">
                  {t('drivers.download')}
                  <ExternalLink size={13} />
                </a>
                {d.webUrl && d.webUrl !== d.url && (
                  <a className="btn sm" href={d.webUrl} target="_blank" rel="noreferrer noopener">
                    <Globe size={13} />
                    {t('drivers.open')}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <Callout>
          {t('drivers.note')}{' '}
          <a href={`${REPO_URL}/issues/new/choose`} target="_blank" rel="noreferrer">GitHub →</a>
        </Callout>
      </div>
    </>
  );
}
