import { isWebHidSupported } from '@openglide/core';
import {
  Activity,
  Battery,
  BookOpen,
  Download,
  Github,
  Home,
  Monitor,
  MousePointer2,
  Plus,
  Settings,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { connectDemo, connectDevice, useDevices } from '../lib/devices';
import { href } from '../lib/router';
import { useT } from '../lib/settings';

export const REPO_URL = 'https://github.com/Cafu1107/openglide';

function NavLink({ to, icon, active, children, meta }: { to: string; icon: ReactNode; active: boolean; children: ReactNode; meta?: ReactNode }) {
  return (
    <a className={`nav-item ${active ? 'active' : ''}`} href={href(to)} aria-current={active ? 'page' : undefined}>
      {icon}
      <span className="grow">{children}</span>
      {meta}
    </a>
  );
}

export function Sidebar({ route }: { route: string[] }) {
  const t = useT();
  const { order, entries } = useDevices();
  const at = route.join('/');
  const hid = isWebHidSupported();

  return (
    <aside className="sidebar">
      <a className="brand" href={href('')} style={{ textDecoration: 'none', color: 'inherit' }}>
        <span className="brand-mark">
          <MousePointer2 size={18} strokeWidth={2.4} />
        </span>
        <span>
          <div className="brand-name">OpenGlide</div>
          <div className="brand-sub">v0.1 · open source</div>
        </span>
      </a>

      <div className="sidebar-scroll">
        <NavLink to="" icon={<Home size={16} />} active={at === ''}>
          {t('nav.home')}
        </NavLink>

        <div className="nav-label">{t('nav.devices')}</div>
        {order.length === 0 && <div className="nav-empty">{t('nav.noDevices')}</div>}
        {order.map((id) => {
          const e = entries[id]!;
          const battery = e.battery?.percent;
          return (
            <NavLink
              key={id}
              to={`device/${id}`}
              active={route[0] === 'device' && route[1] === id}
              icon={<span className={`dot ${e.device.info.connection === 'virtual' ? 'virtual' : ''}`} />}
              meta={
                battery !== undefined ? (
                  <span className="meta row" style={{ gap: 3 }}>
                    <Battery size={12} />
                    {battery}%
                  </span>
                ) : undefined
              }
            >
              {e.device.info.name}
            </NavLink>
          );
        })}
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          <button className="btn primary sm block" onClick={connectDevice} disabled={!hid}>
            <Plus size={15} />
            {t('nav.connect')}
          </button>
          {!entries['demo-mouse'] && (
            <button className="btn ghost sm block" onClick={connectDemo}>
              <Sparkles size={14} />
              {t('nav.demo')}
            </button>
          )}
        </div>

        <div className="nav-label">{t('nav.tools')}</div>
        <NavLink to="tests" icon={<Activity size={16} />} active={at === 'tests'}>
          {t('nav.tests')}
        </NavLink>
        <NavLink to="diagnostics" icon={<Stethoscope size={16} />} active={at === 'diagnostics'}>
          {t('nav.diagnostics')}
        </NavLink>

        <div className="nav-label">{t('nav.resources')}</div>
        <NavLink to="drivers" icon={<Download size={16} />} active={at === 'drivers'}>
          {t('nav.drivers')}
        </NavLink>
        <NavLink to="support" icon={<BookOpen size={16} />} active={at === 'support'}>
          {t('nav.support')}
        </NavLink>
      </div>

      <div className="sidebar-foot">
        <NavLink to="settings" icon={<Settings size={16} />} active={at === 'settings'}>
          {t('nav.settings')}
        </NavLink>
        <a className="nav-item" href={REPO_URL} target="_blank" rel="noreferrer">
          <Github size={16} />
          <span className="grow">{t('nav.github')}</span>
        </a>
        <span className="nav-item" style={{ cursor: 'default' }}>
          <Monitor size={16} />
          <span className="grow">{t('nav.desktop')}</span>
          <span className="badge accent">{t('common.soon')}</span>
        </span>
      </div>
    </aside>
  );
}
