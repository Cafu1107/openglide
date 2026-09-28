import { isWebHidSupported } from '@openglide/core';
import { Activity, Download, Gauge, Lock, Puzzle, ScanLine, Sparkles, Usb } from 'lucide-react';
import { Callout } from '../components/ui';
import { MouseGraphic } from '../components/MouseGraphic';
import { REPO_URL } from '../components/Sidebar';
import { connectDemo, connectDevice } from '../lib/devices';
import { useT } from '../lib/settings';
import './home.css';

export function HomePage() {
  const t = useT();
  const hid = isWebHidSupported();
  const features = [
    { icon: Gauge, k: 'home.f1' },
    { icon: ScanLine, k: 'home.f2' },
    { icon: Activity, k: 'home.f3' },
    { icon: Download, k: 'home.f4' },
    { icon: Lock, k: 'home.f5' },
    { icon: Puzzle, k: 'home.f6' },
  ] as const;

  return (
    <div className="home">
      <section className="hero card">
        <div className="hero-bg" aria-hidden />
        <div className="hero-copy">
          <span className="eyebrow">{t('home.eyebrow')}</span>
          <h1>{t('home.title')}</h1>
          <p>{t('home.sub')}</p>
          <div className="row wrap" style={{ gap: 10, marginTop: 24 }}>
            <button className="btn primary lg" onClick={connectDevice} disabled={!hid}>
              <Usb size={17} />
              {t('home.connect')}
            </button>
            <button className="btn lg" onClick={connectDemo}>
              <Sparkles size={16} />
              {t('home.demo')}
            </button>
          </div>
          {!hid && (
            <div style={{ marginTop: 18, maxWidth: 520 }}>
              <Callout kind="warn">{t('home.unsupported')}</Callout>
            </div>
          )}
        </div>
        <div className="hero-art">
          <div className="hero-ring" aria-hidden />
          <MouseGraphic lighting={{ effect: 'spectrum', color: '#5dde89', brightness: 100, speed: 55 }} size={210} />
          <div className="hero-chip c1 mono">1600 DPI</div>
          <div className="hero-chip c2 mono">8000 Hz</div>
          <div className="hero-chip c3 mono">LOD 0.7 mm</div>
        </div>
      </section>

      <section className="grid grid-3" style={{ marginTop: 16 }}>
        {features.map(({ icon: Icon, k }) => (
          <div key={k} className="card feature">
            <span className="feature-icon">
              <Icon size={18} />
            </span>
            <h3>{t(`${k}.t` as const)}</h3>
            <p>{t(`${k}.d` as const)}</p>
          </div>
        ))}
      </section>

      <section className="card steps">
        <h2>{t('home.how')}</h2>
        <ol>
          {(['home.step1', 'home.step2', 'home.step3'] as const).map((k, i) => (
            <li key={k}>
              <span className="step-n mono">{String(i + 1).padStart(2, '0')}</span>
              {t(k)}
            </li>
          ))}
        </ol>
        <a className="btn ghost sm" href={REPO_URL} target="_blank" rel="noreferrer" style={{ justifySelf: 'start' }}>
          github.com/Cafu1107/openglide →
        </a>
      </section>
    </div>
  );
}
