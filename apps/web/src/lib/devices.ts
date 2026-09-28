import {
  DemoMouse,
  LogBook,
  WebHidTransport,
  allFilters,
  getGrantedWebHidDevices,
  groupTransports,
  isWebHidSupported,
  openDevice,
  requestWebHidDevices,
  type BatteryInfo,
  type HidTransport,
  type MouseDevice,
  type MouseState,
} from '@openglide/core';
import { navigate } from './router';
import { settingsStore, t } from './settings';
import { createStore, useStore } from './store';
import { toast } from './toast';

export interface DeviceEntry {
  device: MouseDevice;
  transports: HidTransport[];
  /** Last state read back from the mouse. */
  state: MouseState | null;
  /** Local edits not yet written. */
  draft: MouseState;
  battery: BatteryInfo | null;
  status: 'loading' | 'ready' | 'applying' | 'error';
  error?: string;
}

export const logbook = new LogBook(2000);
const log = logbook.logger('app');

export const deviceStore = createStore<{ order: string[]; entries: Record<string, DeviceEntry> }>({
  order: [],
  entries: {},
});

const patchEntry = (id: string, patch: Partial<DeviceEntry> | ((e: DeviceEntry) => Partial<DeviceEntry>)) =>
  deviceStore.set((s) => {
    const entry = s.entries[id];
    if (!entry) return s;
    const next = typeof patch === 'function' ? patch(entry) : patch;
    return { ...s, entries: { ...s.entries, [id]: { ...entry, ...next } } };
  });

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

function register(device: MouseDevice, transports: HidTransport[]) {
  deviceStore.set((s) => ({
    order: s.order.includes(device.id) ? s.order : [...s.order, device.id],
    entries: {
      ...s.entries,
      [device.id]: { device, transports, state: null, draft: {}, battery: null, status: 'loading' },
    },
  }));
  void refresh(device.id);
}

export async function refresh(id: string) {
  const entry = deviceStore.get().entries[id];
  if (!entry) return;
  patchEntry(id, { status: 'loading', error: undefined });
  try {
    const [state, battery] = await Promise.all([
      entry.device.readState(),
      entry.device.readBattery?.().catch(() => null) ?? Promise.resolve(null),
    ]);
    patchEntry(id, { state, battery, status: 'ready' });
  } catch (e) {
    log.error(`Reading ${entry.device.info.name} failed: ${errorMessage(e)}`);
    patchEntry(id, { status: 'error', error: errorMessage(e) });
    toast('error', t('device.readFailed'), errorMessage(e));
  }
}

async function openGroups(groups: HidTransport[][], announce: boolean) {
  for (const group of groups) {
    const known = deviceStore.get().order.some((id) =>
      deviceStore.get().entries[id]?.transports.some((t) => group.includes(t)),
    );
    if (known) continue;
    try {
      const device = await openDevice(group, logbook.logger('driver'));
      register(device, group);
      if (announce) {
        toast('success', t('device.connected', { name: device.info.name }));
        navigate(`device/${device.id}`);
      }
    } catch (e) {
      log.error(errorMessage(e));
      if (announce) toast('error', group[0]?.productName ?? 'Device', errorMessage(e));
    }
  }
}

export async function connectDevice() {
  try {
    const transports = await requestWebHidDevices(allFilters());
    if (transports.length === 0) return;
    await openGroups(groupTransports(transports), true);
  } catch (e) {
    // Closing the picker throws NotFoundError; that is not an error for the user.
    if ((e as DOMException).name !== 'NotFoundError') toast('error', t('nav.connect'), errorMessage(e));
  }
}

export function connectDemo() {
  const existing = deviceStore.get().entries['demo-mouse'];
  if (!existing) register(new DemoMouse(logbook.logger('demo')), []);
  navigate('device/demo-mouse');
}

export async function disconnect(id: string) {
  const entry = deviceStore.get().entries[id];
  if (!entry) return;
  await entry.device.close().catch(() => undefined);
  deviceStore.set((s) => {
    const { [id]: _removed, ...entries } = s.entries;
    return { order: s.order.filter((x) => x !== id), entries };
  });
}

// ---- editing -------------------------------------------------------------

const applyTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function editDraft(id: string, patch: MouseState) {
  patchEntry(id, (e) => ({ draft: { ...e.draft, ...patch } }));
  if (settingsStore.get().autoApply) {
    clearTimeout(applyTimers.get(id));
    applyTimers.set(id, setTimeout(() => void apply(id, true), 350));
  }
}

export const discard = (id: string) => patchEntry(id, { draft: {} });

/** Keys in the draft that differ from what the mouse reported. */
export function pendingKeys(entry: DeviceEntry): (keyof MouseState)[] {
  return (Object.keys(entry.draft) as (keyof MouseState)[]).filter(
    (k) => JSON.stringify(entry.draft[k]) !== JSON.stringify(entry.state?.[k]),
  );
}

export const effective = (entry: DeviceEntry): MouseState => ({ ...entry.state, ...entry.draft });

export async function apply(id: string, quiet = false) {
  const entry = deviceStore.get().entries[id];
  if (!entry) return;
  const keys = pendingKeys(entry);
  if (keys.length === 0) return patchEntry(id, { draft: {} });
  const patch: MouseState = {};
  for (const k of keys) (patch as Record<string, unknown>)[k] = entry.draft[k];
  // DPI stages and the active stage belong together.
  if (patch.dpiStages || patch.activeStage !== undefined) {
    patch.dpiStages = effective(entry).dpiStages;
    patch.activeStage = effective(entry).activeStage;
  }
  patchEntry(id, { status: 'applying' });
  try {
    await entry.device.applyState(patch);
    const state = await entry.device.readState();
    patchEntry(id, { state, draft: {}, status: 'ready' });
    if (!quiet) toast('success', t('device.applied'));
  } catch (e) {
    log.error(`Writing to ${entry.device.info.name} failed: ${errorMessage(e)}`);
    patchEntry(id, { status: 'ready' });
    toast('error', t('device.applyFailed'), errorMessage(e));
  }
}

// ---- lifecycle -----------------------------------------------------------

/** Re-open mice the user already granted, and watch for unplugging. */
export async function initDevices() {
  if (!isWebHidSupported()) return;
  navigator.hid.addEventListener('disconnect', (e) => {
    for (const id of deviceStore.get().order) {
      const entry = deviceStore.get().entries[id];
      if (entry?.transports.some((t) => (t as WebHidTransport).device === e.device)) {
        log.info(`${entry.device.info.name} was unplugged`);
        void disconnect(id);
      }
    }
  });
  const granted = await getGrantedWebHidDevices();
  if (granted.length) await openGroups(groupTransports(granted), false);
}

// Keep battery readings fresh.
setInterval(() => {
  for (const id of deviceStore.get().order) {
    const entry = deviceStore.get().entries[id];
    if (!entry?.device.readBattery || entry.status !== 'ready') continue;
    entry.device
      .readBattery()
      .then((battery) => patchEntry(id, { battery }))
      .catch(() => undefined);
  }
}, 60_000);

export const useDevices = () => useStore(deviceStore);
export const useDevice = (id: string | undefined) =>
  useStore(deviceStore, (s) => (id ? s.entries[id] : undefined));
