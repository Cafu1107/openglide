import { Github } from 'lucide-react';
import { REPO_URL } from '../components/Sidebar';
import { Card, Segmented, SettingRow, Switch } from '../components/ui';
import { LANGS } from '../i18n';
import { ACCENTS, updateSettings, useSettings, useT } from '../lib/settings';

export function SettingsPage() {
  const t = useT();
  const s = useSettings();

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">{t('settings.title')}</h1>
          <p className="page-sub">{t('settings.sub')}</p>
        </div>
      </header>
      <div className="stack" style={{ maxWidth: 760 }}>
        <Card title={t('settings.appearance')}>
          <SettingRow label={t('settings.theme')}>
            <Segmented
              label={t('settings.theme')}
              value={s.theme}
              onChange={(theme) => updateSettings({ theme })}
              options={[
                { value: 'system', label: t('settings.system') },
                { value: 'dark', label: t('settings.dark') },
                { value: 'light', label: t('settings.light') },
              ]}
            />
          </SettingRow>
          <SettingRow label={t('settings.accent')}>
            <div className="row" role="radiogroup" aria-label={t('settings.accent')}>
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  role="radio"
                  aria-checked={s.accent === a.id}
                  aria-label={a.id}
                  onClick={() => updateSettings({ accent: a.id })}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', background: a.color, cursor: 'pointer',
                    border: '2px solid var(--panel)',
                    boxShadow: s.accent === a.id ? `0 0 0 2px ${a.color}` : '0 0 0 1px var(--line-strong)',
                  }}
                />
              ))}
            </div>
          </SettingRow>
          <SettingRow label={t('settings.language')}>
            <Segmented label={t('settings.language')} value={s.lang} onChange={(lang) => updateSettings({ lang })} options={LANGS.map((l) => ({ value: l.id, label: l.label }))} />
          </SettingRow>
        </Card>

        <Card title={t('settings.editing')}>
          <SettingRow label={t('settings.autoApply')} hint={t('settings.autoApplyHint')}>
            <Switch label={t('settings.autoApply')} checked={s.autoApply} onChange={(autoApply) => updateSettings({ autoApply })} />
          </SettingRow>
        </Card>

        <Card title={t('settings.about')} desc={t('settings.aboutText')}>
          <a className="btn sm" href={REPO_URL} target="_blank" rel="noreferrer">
            <Github size={14} />
            Cafu1107/openglide
          </a>
        </Card>
      </div>
    </>
  );
}
