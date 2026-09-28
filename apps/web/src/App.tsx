import { Menu, MousePointer2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Toasts } from './components/Toasts';
import { useRoute } from './lib/router';
import { DevicePage } from './pages/device/DevicePage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { DriversPage } from './pages/DriversPage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';
import { TestsPage } from './pages/TestsPage';

function Page({ route }: { route: string[] }) {
  switch (route[0]) {
    case 'device':
      return <DevicePage id={route[1] ?? ''} tab={route[2]} />;
    case 'tests':
      return <TestsPage />;
    case 'drivers':
      return <DriversPage />;
    case 'support':
      return <SupportPage />;
    case 'diagnostics':
      return <DiagnosticsPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <HomePage />;
  }
}

export function App() {
  const route = useRoute();
  const [navOpen, setNavOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  const page = route.slice(0, 2).join('/');

  useEffect(() => {
    setNavOpen(false);
    main.current?.scrollTo({ top: 0 });
  }, [page]);

  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`} onClick={(e) => navOpen && e.target === e.currentTarget && setNavOpen(false)}>
      <Sidebar route={route} />
      <main className="main" ref={main} onClick={() => navOpen && setNavOpen(false)}>
        <div className="mobile-bar">
          <button className="btn ghost icon-btn" aria-label="Menu" onClick={(e) => (e.stopPropagation(), setNavOpen(true))}>
            <Menu size={18} />
          </button>
          <MousePointer2 size={16} color="var(--accent)" />
          <strong>OpenGlide</strong>
        </div>
        <div className="main-inner">
          <Page route={route} />
        </div>
      </main>
      <Toasts />
    </div>
  );
}
