import type { MouseState } from '@openglide/core';
import { Check, FileDown, FileUp } from 'lucide-react';
import { useRef } from 'react';
import { Card } from '../../components/ui';
import { useT } from '../../lib/settings';
import { toast } from '../../lib/toast';
import type { TabProps } from './DevicePage';

interface SettingsFile {
  app: 'openglide';
  version: 1;
  device: { name: string; vendorId: number; productId: number };
  settings: MouseState;
}

export function ProfilesTab({ entry, state, edit }: TabProps) {
  const t = useT();
  const { info, capabilities } = entry.device;
  const fileInput = useRef<HTMLInputElement>(null);

  const exportSettings = () => {
    const { activeProfile: _skip, ...settings } = state;
    const file: SettingsFile = {
      app: 'openglide',
      version: 1,
      device: { name: info.name, vendorId: info.vendorId, productId: info.productId },
      settings,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${info.name.replace(/[^\w-]+/g, '-')}.openglide.json` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Partial<SettingsFile>;
      if (data.app !== 'openglide' || typeof data.settings !== 'object' || !data.settings) throw new Error();
      const { activeProfile: _skip, ...settings } = data.settings;
      // Only keep settings this mouse understands.
      const allowed: MouseState = {};
      const has = capabilities;
      if (has.dpi && settings.dpiStages) {
        allowed.dpiStages = settings.dpiStages.slice(0, has.dpi.maxStages);
        allowed.activeStage = Math.min(settings.activeStage ?? 0, allowed.dpiStages.length - 1);
      }
      if (has.pollingRates && settings.pollingRate && has.pollingRates.includes(settings.pollingRate)) allowed.pollingRate = settings.pollingRate;
      if (has.liftOff && settings.liftOff !== undefined) allowed.liftOff = settings.liftOff;
      if (has.angleSnapping) allowed.angleSnapping = settings.angleSnapping;
      if (has.rippleControl) allowed.rippleControl = settings.rippleControl;
      if (has.motionSync) allowed.motionSync = settings.motionSync;
      if (has.debounce) allowed.debounce = settings.debounce;
      if (has.sleepTimeout) allowed.sleepTimeout = settings.sleepTimeout;
      if (has.lighting) allowed.lighting = settings.lighting;
      if (has.buttons) allowed.buttons = settings.buttons;
      for (const k of Object.keys(allowed) as (keyof MouseState)[]) if (allowed[k] === undefined) delete allowed[k];
      edit(allowed);
      toast('success', t('profiles.imported'));
    } catch {
      toast('error', t('profiles.importFailed'));
    }
  };

  return (
    <div className="stack">
      {capabilities.profiles && (
        <Card title={t('profiles.title')} desc={t('profiles.desc')}>
          <div className="grid grid-4">
            {Array.from({ length: capabilities.profiles.count }, (_, i) => {
              const on = (state.activeProfile ?? 0) === i;
              return (
                <button
                  key={i}
                  className="card"
                  onClick={() => edit({ activeProfile: i })}
                  style={{
                    padding: 16, textAlign: 'left', cursor: 'pointer',
                    borderColor: on ? 'var(--accent)' : undefined,
                    background: on ? 'var(--accent-soft)' : undefined,
                  }}
                >
                  <div className="row between">
                    <strong>{t('profiles.slot', { n: i + 1 })}</strong>
                    {on && <Check size={16} color="var(--accent)" />}
                  </div>
                  <div className="faint small mono" style={{ marginTop: 6 }}>
                    P{i + 1}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card title={t('profiles.backup')} desc={t('profiles.backupDesc')}>
        <div className="row wrap">
          <button className="btn" onClick={exportSettings}>
            <FileDown size={15} />
            {t('profiles.export')}
          </button>
          <button className="btn" onClick={() => fileInput.current?.click()}>
            <FileUp size={15} />
            {t('profiles.import')}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importSettings(f);
              e.target.value = '';
            }}
          />
        </div>
      </Card>
    </div>
  );
}
