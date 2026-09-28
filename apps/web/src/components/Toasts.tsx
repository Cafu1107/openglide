import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useStore } from '../lib/store';
import { toastStore } from '../lib/toast';

export function Toasts() {
  const toasts = useStore(toastStore);
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      {toasts.map((x) => {
        const Icon = x.kind === 'success' ? CheckCircle2 : x.kind === 'error' ? XCircle : Info;
        return (
          <div key={x.id} className={`toast ${x.kind}`}>
            <Icon size={18} style={{ flex: 'none', marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 600 }}>{x.title}</div>
              {x.body && <div className="muted small" style={{ whiteSpace: 'pre-line' }}>{x.body}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
