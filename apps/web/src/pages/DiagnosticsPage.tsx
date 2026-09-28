import { hex, type LogEntry } from '@openglide/core';
import { Copy, Download, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, Switch, hex4 } from '../components/ui';
import { logbook, useDevices } from '../lib/devices';
import { updateSettings, useSettings, useT } from '../lib/settings';
import { toast } from '../lib/toast';

function useLog(): readonly LogEntry[] {
  const [entries, setEntries] = useState(() => [...logbook.all()]);
  useEffect(() => logbook.subscribe(() => setEntries([...logbook.all()])), []);
  return entries;
}

const LEVEL_COLOR = { debug: 'var(--text-faint)', info: 'var(--text-soft)', warn: 'var(--warning)', error: 'var(--danger)' };

export function DiagnosticsPage() {
  const t = useT();
  const log = useLog();
  const { verboseLog } = useSettings();
  const { order, entries } = useDevices();
  const shown = verboseLog ? log : log.filter((e) => e.level !== 'debug');

  const report = () => {
    const devices = order.map((id) => {
      const e = entries[id]!;
      const info = e.device.info;
      const collections = e.transports.flatMap((tr) => tr.collections);
      return [
        `## ${info.name}`,
        `USB ID: ${hex4(info.vendorId)}:${hex4(info.productId)}`,
        `Driver: ${e.device.driver.name} (${e.device.driver.status})`,
        `Firmware: ${info.firmware ?? '-'}`,
        `Protocol: ${info.protocol ?? '-'}`,
        `Collections:`,
        ...collections.map(
          (c) =>
            `  usagePage 0x${hex4(c.usagePage)} usage 0x${hex4(c.usage)} in[${hex(c.inputReports)}] out[${hex(c.outputReports)}] feature[${hex(c.featureReports)}]`,
        ),
      ].join('\n');
    });
    return [`OpenGlide diagnostics · ${new Date().toISOString()}`, `UA: ${navigator.userAgent}`, '', ...devices, '', '## Log', logbook.toText()].join('\n');
  };

  const copy = async () => {
    await navigator.clipboard.writeText(report());
    toast('success', t('diag.copied'));
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([report()], { type: 'text/plain' }));
    Object.assign(document.createElement('a'), { href: url, download: `openglide-diagnostics-${Date.now()}.txt` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">{t('diag.title')}</h1>
          <p className="page-sub">{t('diag.sub')}</p>
        </div>
        <div className="row">
          <button className="btn sm" onClick={copy}>
            <Copy size={14} />
            {t('diag.copy')}
          </button>
          <button className="btn sm" onClick={download}>
            <Download size={14} />
            {t('diag.download')}
          </button>
        </div>
      </header>

      <div className="stack">
        {order.map((id) => {
          const e = entries[id]!;
          const collections = e.transports.flatMap((tr) => tr.collections);
          if (collections.length === 0) return null;
          return (
            <Card key={id} title={`${t('diag.collections')} · ${e.device.info.name}`} desc={`${hex4(e.device.info.vendorId)}:${hex4(e.device.info.productId)}`}>
              <div className="table-wrap">
                <table className="table mono small">
                  <thead>
                    <tr>
                      <th>Usage page</th>
                      <th>Usage</th>
                      <th>Input</th>
                      <th>Output</th>
                      <th>Feature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map((c, i) => (
                      <tr key={i}>
                        <td>0x{hex4(c.usagePage)}</td>
                        <td>0x{hex4(c.usage)}</td>
                        <td>{hex(c.inputReports) || '—'}</td>
                        <td>{hex(c.outputReports) || '—'}</td>
                        <td>{hex(c.featureReports) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}

        <Card
          title={t('diag.log')}
          action={
            <div className="row">
              <label className="row small faint" style={{ gap: 8 }}>
                {t('diag.verbose')}
                <Switch label={t('diag.verbose')} checked={verboseLog} onChange={(v) => updateSettings({ verboseLog: v })} />
              </label>
              <button className="btn ghost sm" onClick={() => (logbook.clear(), toast('info', t('diag.clear')))}>
                <Trash2 size={14} />
                {t('diag.clear')}
              </button>
            </div>
          }
        >
          <div className="log-view mono" style={{ maxHeight: 420, overflow: 'auto', fontSize: 12, lineHeight: 1.7, background: 'var(--panel-soft)', border: '1px solid var(--line)', borderRadius: 10, padding: 12 }}>
            {shown.length === 0 && <span className="faint">{t('diag.empty')}</span>}
            {shown.map((e, i) => (
              <div key={i} style={{ color: LEVEL_COLOR[e.level], whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                <span className="faint">{new Date(e.time).toLocaleTimeString()}</span> <span style={{ color: 'var(--accent)' }}>[{e.scope}]</span> {e.message}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
