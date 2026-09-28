import { Crosshair, MousePointerClick, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Card, Segmented } from '../components/ui';
import { useT } from '../lib/settings';
import './tests.css';

const CHATTER_MS = 80;

function PollingTest() {
  const t = useT();
  const area = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stamps = useRef<number[]>([]);
  const history = useRef<number[]>([]);
  const [stats, setStats] = useState({ current: 0, average: 0, peak: 0 });
  const totals = useRef({ sum: 0, n: 0, peak: 0 });

  useEffect(() => {
    const el = area.current!;
    // pointerrawupdate fires at the device rate in Chromium; fall back to coalesced pointermove events.
    const raw = 'onpointerrawupdate' in el;
    const onEvent = (e: PointerEvent) => {
      const events = !raw && e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of events.length ? events : [e]) stamps.current.push(ev.timeStamp);
    };
    const type = raw ? 'pointerrawupdate' : 'pointermove';
    el.addEventListener(type, onEvent as EventListener);

    const timer = setInterval(() => {
      const now = performance.now();
      stamps.current = stamps.current.filter((s) => now - s < 250);
      const rate = stamps.current.length * 4;
      history.current = [...history.current.slice(-119), rate];
      if (rate > 50) {
        totals.current.sum += rate;
        totals.current.n += 1;
        totals.current.peak = Math.max(totals.current.peak, rate);
      }
      setStats({
        current: rate,
        average: totals.current.n ? Math.round(totals.current.sum / totals.current.n) : 0,
        peak: totals.current.peak,
      });
      draw();
    }, 100);

    const draw = () => {
      const c = canvas.current;
      if (!c) return;
      const ctx = c.getContext('2d')!;
      const w = (c.width = c.clientWidth * devicePixelRatio);
      const h = (c.height = c.clientHeight * devicePixelRatio);
      const data = history.current;
      const max = Math.max(1100, ...data) * 1.1;
      const accent = getComputedStyle(c).getPropertyValue('--accent').trim() || '#5dde89';
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = (i / 119) * w;
        const y = h - (v / max) * h;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2 * devicePixelRatio;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.lineTo(((data.length - 1) / 119) * w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, `${accent}55`);
      grad.addColorStop(1, `${accent}00`);
      ctx.fillStyle = grad;
      ctx.fill();
    };

    return () => {
      el.removeEventListener(type, onEvent as EventListener);
      clearInterval(timer);
    };
  }, []);

  const reset = () => {
    totals.current = { sum: 0, n: 0, peak: 0 };
    history.current = [];
    setStats({ current: 0, average: 0, peak: 0 });
  };

  return (
    <Card
      title={t('tests.rate')}
      desc={t('tests.rateDesc')}
      action={
        <button className="btn sm ghost" onClick={reset}>
          <RotateCcw size={14} />
          {t('tests.reset')}
        </button>
      }
    >
      <div className="grid grid-3" style={{ marginBottom: 12 }}>
        {(
          [
            ['current', stats.current],
            ['average', stats.average],
            ['peak', stats.peak],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="mini-stat">
            <span className="faint small">{t(`tests.${k}` as const)}</span>
            <span className="mono big">
              {v.toLocaleString()} <small>Hz</small>
            </span>
          </div>
        ))}
      </div>
      <div ref={area} className="test-pad rate-pad">
        <canvas ref={canvas} />
        <span className="pad-label">{t('tests.rateArea')}</span>
      </div>
    </Card>
  );
}

const BUTTONS = ['left', 'middle', 'right', 'back', 'forward'] as const;

function ClickTest() {
  const t = useT();
  const last = useRef<Record<number, number>>({});
  const [counts, setCounts] = useState(() => BUTTONS.map(() => ({ clicks: 0, chatter: 0, lastGap: 0 })));
  const [flash, setFlash] = useState<number | null>(null);

  const onDown = (e: React.PointerEvent | React.MouseEvent) => {
    e.preventDefault();
    const b = e.button;
    if (b < 0 || b > 4) return;
    const now = performance.now();
    const gap = last.current[b] ? now - last.current[b]! : 0;
    last.current[b] = now;
    setFlash(b);
    setTimeout(() => setFlash((f) => (f === b ? null : f)), 120);
    setCounts((c) =>
      c.map((x, i) =>
        i === b ? { clicks: x.clicks + 1, chatter: x.chatter + (gap && gap < CHATTER_MS ? 1 : 0), lastGap: Math.round(gap) } : x,
      ),
    );
  };

  return (
    <Card
      title={t('tests.click')}
      desc={t('tests.clickDesc', { ms: CHATTER_MS })}
      action={
        <button className="btn sm ghost" onClick={() => setCounts(BUTTONS.map(() => ({ clicks: 0, chatter: 0, lastGap: 0 })))}>
          <RotateCcw size={14} />
          {t('tests.reset')}
        </button>
      }
    >
      <div
        className="test-pad click-pad"
        onMouseDown={onDown}
        onMouseUp={(e) => e.preventDefault()}
        onAuxClick={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <MousePointerClick size={22} />
        <span className="pad-label">{t('tests.clickArea')}</span>
      </div>
      <div className="click-grid">
        {BUTTONS.map((name, i) => (
          <div key={name} className={`click-cell ${flash === i ? 'flash' : ''} ${counts[i]!.chatter ? 'bad' : ''}`}>
            <span className="faint small">{t(`tests.${name}` as const)}</span>
            <span className="mono big">{counts[i]!.clicks}</span>
            <span className="small">
              {counts[i]!.chatter > 0 ? (
                <span style={{ color: 'var(--danger)' }}>
                  {t('tests.chatter')}: {counts[i]!.chatter}
                </span>
              ) : (
                <span className="faint mono">{counts[i]!.lastGap ? `${counts[i]!.lastGap} ms` : '—'}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ScrollTest() {
  const t = useT();
  const pad = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState({ up: 0, down: 0 });
  const [dir, setDir] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const el = pad.current!;
    let timer: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY === 0) return;
      const d = e.deltaY < 0 ? 'up' : 'down';
      setCounts((c) => ({ ...c, [d]: c[d] + 1 }));
      setDir(d);
      clearTimeout(timer);
      timer = setTimeout(() => setDir(null), 150);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <Card title={t('tests.scroll')} desc={t('tests.scrollDesc')}>
      <div ref={pad} className={`test-pad scroll-pad ${dir ?? ''}`}>
        <div className="scroll-count">
          <span className="faint small">▲ {t('tests.up')}</span>
          <span className="mono big">{counts.up}</span>
        </div>
        <div className="scroll-count">
          <span className="faint small">▼ {t('tests.down')}</span>
          <span className="mono big">{counts.down}</span>
        </div>
      </div>
    </Card>
  );
}

function DpiAnalyzer() {
  const t = useT();
  const pad = useRef<HTMLDivElement>(null);
  const [cm, setCm] = useState(10);
  const [measuring, setMeasuring] = useState(false);
  const [counts, setCounts] = useState(0);
  const sum = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== pad.current) return;
      sum.current += e.movementX;
      setCounts(sum.current);
    };
    const onLockChange = () => {
      if (document.pointerLockElement !== pad.current) setMeasuring(false);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('pointerlockchange', onLockChange);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('pointerlockchange', onLockChange);
    };
  }, []);

  const start = async () => {
    sum.current = 0;
    setCounts(0);
    const el = pad.current!;
    try {
      // Raw, unaccelerated movement where supported (Chromium).
      await (el.requestPointerLock as (o?: { unadjustedMovement?: boolean }) => Promise<void>)({ unadjustedMovement: true });
    } catch {
      await el.requestPointerLock();
    }
    setMeasuring(true);
  };

  const dpi = Math.round(Math.abs(counts) / (cm / 2.54));

  return (
    <Card title={t('tests.dpi')} desc={t('tests.dpiDesc')}>
      <div className="row wrap" style={{ marginBottom: 12 }}>
        <span className="faint small">{t('tests.distance')}</span>
        <Segmented label={t('tests.distance')} value={cm} onChange={setCm} options={[5, 10, 15, 20].map((v) => ({ value: v, label: <>{v}<span className="unit">cm</span></> }))} />
      </div>
      <div
        ref={pad}
        className={`test-pad dpi-pad ${measuring ? 'measuring' : ''}`}
        onClick={() => (measuring ? document.exitPointerLock() : undefined)}
      >
        {measuring ? (
          <span className="pad-label">{t('tests.measuring')}</span>
        ) : (
          <button className="btn primary" onClick={start}>
            <Crosshair size={15} />
            {t('tests.start')}
          </button>
        )}
        <div className="dpi-result">
          <span className="faint small">{t('tests.result')}</span>
          <span className="mono big">
            {counts ? dpi.toLocaleString() : '—'} <small>DPI</small>
          </span>
          <span className="faint small mono">
            {Math.abs(counts)} {t('tests.counts')}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function TestsPage() {
  const t = useT();
  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">{t('tests.title')}</h1>
          <p className="page-sub">{t('tests.sub')}</p>
        </div>
      </header>
      <div className="stack">
        <PollingTest />
        <div className="grid grid-2">
          <ClickTest />
          <div className="stack">
            <ScrollTest />
          </div>
        </div>
        <DpiAnalyzer />
      </div>
    </>
  );
}
