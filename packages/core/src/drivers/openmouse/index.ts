/**
 * Bridge to the protocol drivers of the OpenMouse project
 * (https://github.com/OpenMouse-Project/mouse-protocol, npm @openmouse/protocol).
 *
 * Each OpenMouse client exposes a `readStatus()` snapshot plus optional
 * `set*` methods. This adapter turns the snapshot into OpenGlide
 * capabilities/state and only exposes a control when the matching setter
 * exists on the client, so the UI never offers a setting the driver cannot write.
 */
import {
  DEVICE_DRIVERS,
  SUPPORTED_HID_FILTERS,
  clientSupportScore,
  createSupportedClient,
  type MouseLighting,
  type MouseLightingMode,
  type MouseStatus,
  type SupportedClient,
} from '@openmouse/protocol/drivers';
import { RAZER_BUTTON_CONTROLS, RAZER_BUTTON_MAPPINGS } from '@openmouse/protocol/razer';
import type { Logger } from '../../log';
import type { HidTransport } from '../../transport/types';
import { WebHidTransport } from '../../transport/webhid';
import type {
  BatteryInfo,
  Capabilities,
  Driver,
  LightingEffect,
  LightingState,
  MouseDevice,
  MouseState,
  SupportedDevice,
} from '../../types';
import { OPENMOUSE_BRANDS } from './brands';

/** Setters are optional and differ per client, so they are looked up dynamically. */
type AnyFn = (...args: unknown[]) => Promise<unknown>;
const method = (client: SupportedClient, name: string): AnyFn | undefined => {
  const fn = (client as unknown as Record<string, unknown>)[name];
  return typeof fn === 'function' ? (fn as AnyFn).bind(client) : undefined;
};

const DEFAULT_SLEEP_OPTIONS = [30, 60, 120, 300, 600, 900];
const DEFAULT_POLLING = [125, 250, 500, 1000];

const EFFECT_FROM: Partial<Record<MouseLightingMode, LightingEffect>> = {
  Off: 'off',
  Static: 'static',
  'Breathing single': 'breathing',
  Spectrum: 'spectrum',
  Cycling: 'spectrum',
  Wave: 'wave',
};

const hasValue = <T>(v: T | null | undefined): v is T => v !== null && v !== undefined;

/** How buttons are remapped on this client, if at all. */
type ButtonScheme =
  | { kind: 'generic'; names: string[]; options: string[] }
  | { kind: 'razer'; names: string[]; options: string[] }
  | { kind: 'readonly'; names: string[]; actions: string[] }
  | null;

function buttonScheme(client: SupportedClient, s: MouseStatus): ButtonScheme {
  const set = method(client, 'setButtonMapping');
  if (s.razerButtonMappings && set) {
    const names = RAZER_BUTTON_CONTROLS.filter((c) => c in s.razerButtonMappings!);
    if (names.length) return { kind: 'razer', names: [...names], options: [...RAZER_BUTTON_MAPPINGS] };
  }
  if (s.buttonMappings && s.buttonOptions?.length && set) {
    return { kind: 'generic', names: Object.keys(s.buttonMappings), options: [...s.buttonOptions] };
  }
  if (s.atkButtonMappings?.length) {
    return { kind: 'readonly', names: s.atkButtonMappings.map((b) => b.name), actions: s.atkButtonMappings.map((b) => b.action) };
  }
  if (s.eggButtonMappings?.length) {
    return { kind: 'readonly', names: s.eggButtonMappings.map((_, i) => `Button ${i + 1}`), actions: [...s.eggButtonMappings] };
  }
  return null;
}

function toLighting(l: MouseLighting): LightingState {
  return {
    effect: (l.mode && EFFECT_FROM[l.mode]) ?? 'static',
    color: l.color ?? '#ffffff',
    brightness: l.brightness ?? 100,
    speed: 50,
  };
}

function fromLighting(base: MouseLighting, next: LightingState): MouseLighting {
  const mode = (Object.keys(EFFECT_FROM) as MouseLightingMode[]).find(
    (m) => EFFECT_FROM[m] === next.effect && base.modes.includes(m),
  );
  const levels = base.brightnessLevels;
  const brightness = levels?.length
    ? levels.reduce((a, b) => (Math.abs(b - next.brightness) < Math.abs(a - next.brightness) ? b : a))
    : next.brightness;
  return { ...base, mode: mode ?? base.mode, color: next.color, brightness };
}

export class OpenMouseDevice implements MouseDevice {
  readonly driver: Driver;
  info!: MouseDevice['info'];
  capabilities: Capabilities = {};
  private status!: MouseStatus;
  private buttons: ButtonScheme = null;

  constructor(
    readonly id: string,
    private readonly client: SupportedClient,
    private readonly transport: HidTransport,
    private readonly log: Logger,
  ) {
    this.driver = openmouseDriver;
  }

  async init() {
    this.status = await this.client.readStatus();
    const s = this.status;
    const ui = s.ui ?? {};
    const has = (name: string) => !!method(this.client, name);
    const caps: Capabilities = {};

    if (ui.settingsReady !== false) {
      // DPI
      const options = (await Promise.resolve(this.client.getDpiOptions()).catch(() => [])) as number[];
      const editor = ui.dpiStageEditor;
      const stageWritable = s.dpiStages?.length && has('setDpiStageValue');
      if (editor && stageWritable) {
        caps.dpi = {
          min: editor.minDpi,
          max: editor.maxDpi,
          step: editor.stepDpi,
          maxStages: editor.maxStages,
          fixedStageCount: editor.countEditable === false || !has('setDpiStageCount'),
        };
      } else if (has('setDpi') && (options.length || s.dpi)) {
        const values = options.length ? [...options].sort((a, b) => a - b) : [s.dpi];
        caps.dpi = { min: values[0]!, max: values[values.length - 1]!, step: 1, values, maxStages: 1 };
        if (stageWritable) {
          caps.dpi.maxStages = s.dpiStages!.length;
          caps.dpi.fixedStageCount = true;
        }
      }

      // Polling rate
      if (has('setPollingRate') && !ui.pollingReadOnly) {
        const rates = s.supportedPollingRates?.length ? s.supportedPollingRates : DEFAULT_POLLING;
        caps.pollingRates = [...new Set([...rates, s.pollingRateHz].filter((r) => r > 0))].sort((a, b) => a - b);
      }

      // Sensor
      if (has('setLiftOffDistance') && s.liftOffDistance !== undefined) {
        caps.liftOff = s.supportedLiftOffDistances?.length
          ? [...s.supportedLiftOffDistances]
          : ui.hideLodLow
            ? ['Medium', 'High']
            : ['Low', 'Medium', 'High'];
      }
      const processing = !ui.hideProcessingCard;
      if (processing && !ui.hideAngleSnapping && hasValue(s.angleSnapping) && has('setAngleSnapping')) caps.angleSnapping = true;
      if (processing && !ui.hideRippleControl && hasValue(s.rippleControl) && has('setRippleControl')) caps.rippleControl = true;
      if (processing && !ui.hideMotionSync && hasValue(s.motionSync) && has('setMotionSync')) caps.motionSync = true;
      if (hasValue(s.debounceMs) && has('setDebounceTime')) caps.debounce = { min: 0, max: 20, step: 1 };
      if (!ui.hideSleepCard && hasValue(s.sleepTimeout) && has('setSleepTimeout')) {
        caps.sleepTimeout = [...new Set([...DEFAULT_SLEEP_OPTIONS, s.sleepTimeout])].sort((a, b) => a - b);
      }

      // Lighting
      if (s.lighting && has('setLighting')) {
        const effects = [...new Set(s.lighting.modes.map((m) => EFFECT_FROM[m]).filter(hasValue))];
        if (effects.length) caps.lighting = { effects };
      }

      // Profiles
      if (s.profileCount && s.profileCount > 1 && has('setProfile')) caps.profiles = { count: s.profileCount };
    }

    // Buttons (read-only schemes are shown even before settings are ready)
    this.buttons = buttonScheme(this.client, s);
    if (this.buttons) {
      caps.buttons =
        this.buttons.kind === 'readonly'
          ? { labels: this.buttons.names, actions: [...new Set(this.buttons.actions)], readOnly: true }
          : { labels: this.buttons.names, actions: this.buttons.options };
    }

    caps.battery = hasValue(s.batteryPercent);
    caps.persistent = s.deviceMode !== 'Host';

    const notes: string[] = [];
    if (ui.statusNote) notes.push(ui.statusNote);
    if (this.buttons?.kind === 'readonly') {
      notes.push('Button assignments are read from the mouse; changing them is not supported by this driver yet.');
    }

    this.info = {
      name: s.name || this.transport.productName,
      vendor: s.brand,
      vendorId: this.transport.vendorId,
      productId: this.transport.productId,
      connection:
        s.connectionType === 'Wireless'
          ? /receiver|dongle|2\.4/i.test(s.connectionDetail ?? '')
            ? 'receiver'
            : 'wireless'
          : 'wired',
      firmware: s.firmware?.filter(Boolean).join(' · ') || undefined,
      protocol: `OpenMouse ${ui.family ?? s.brand}${s.connectionDetail ? ` · ${s.connectionDetail}` : ''}`,
      notes: notes.length ? notes : undefined,
    };
    this.capabilities = caps;
  }

  async readState(): Promise<MouseState> {
    this.status = await this.client.readStatus();
    const s = this.status;
    const state: MouseState = {};
    if (this.capabilities.dpi) {
      if (s.dpiStages?.length && this.capabilities.dpi.maxStages > 1) {
        state.dpiStages = [...s.dpiStages];
        state.activeStage = s.activeDpiStage ?? 0;
      } else {
        state.dpiStages = [s.dpi];
        state.activeStage = 0;
      }
    }
    if (this.capabilities.pollingRates) state.pollingRate = s.pollingRateHz;
    if (this.capabilities.liftOff && s.liftOffDistance) state.liftOff = s.liftOffDistance;
    if (this.capabilities.angleSnapping) state.angleSnapping = !!s.angleSnapping;
    if (this.capabilities.rippleControl) state.rippleControl = !!s.rippleControl;
    if (this.capabilities.motionSync) state.motionSync = !!s.motionSync;
    if (this.capabilities.debounce) state.debounce = s.debounceMs ?? 0;
    if (this.capabilities.sleepTimeout && hasValue(s.sleepTimeout)) state.sleepTimeout = s.sleepTimeout;
    if (this.capabilities.lighting && s.lighting) state.lighting = toLighting(s.lighting);
    if (this.capabilities.profiles && hasValue(s.activeProfile)) state.activeProfile = Math.max(0, s.activeProfile - 1);
    const b = this.buttons;
    if (b?.kind === 'generic') state.buttons = b.names.map((n) => s.buttonMappings?.[n] ?? '');
    if (b?.kind === 'razer') state.buttons = b.names.map((n) => s.razerButtonMappings?.[n] ?? '');
    if (b?.kind === 'readonly') state.buttons = [...b.actions];
    return state;
  }

  private async call(name: string, ...args: unknown[]) {
    const fn = method(this.client, name);
    if (!fn) throw new Error(`${this.info.name}: ${name} is not supported by this driver.`);
    this.log.debug(`${name}(${args.map((a) => JSON.stringify(a)).join(', ')})`);
    return fn(...args);
  }

  async applyState(patch: MouseState): Promise<void> {
    const caps = this.capabilities;
    // The profile switch goes first: everything after it lands in the new profile.
    if (patch.activeProfile !== undefined) await this.call('setProfile', patch.activeProfile + 1);

    if (patch.dpiStages && caps.dpi) {
      const stages = patch.dpiStages;
      const active = Math.min(patch.activeStage ?? 0, stages.length - 1);
      if (caps.dpi.maxStages > 1) {
        const current = this.status.dpiStages ?? [];
        if (!caps.dpi.fixedStageCount && stages.length !== current.length) await this.call('setDpiStageCount', stages.length);
        for (let i = 0; i < stages.length; i++) {
          if (stages[i] !== current[i]) await this.call('setDpiStageValue', i, stages[i]);
        }
        if (active !== (this.status.activeDpiStage ?? 0)) await this.call('setActiveDpiStage', active);
      } else {
        await this.call('setDpi', stages[active]);
      }
    }

    if (patch.pollingRate !== undefined) await this.call('setPollingRate', patch.pollingRate);
    if (patch.liftOff !== undefined) await this.call('setLiftOffDistance', patch.liftOff);
    if (patch.angleSnapping !== undefined) await this.call('setAngleSnapping', patch.angleSnapping);
    if (patch.rippleControl !== undefined) await this.call('setRippleControl', patch.rippleControl);
    if (patch.motionSync !== undefined) await this.call('setMotionSync', patch.motionSync);
    if (patch.debounce !== undefined) await this.call('setDebounceTime', patch.debounce);
    if (patch.sleepTimeout !== undefined) await this.call('setSleepTimeout', patch.sleepTimeout);
    if (patch.lighting && this.status.lighting) await this.call('setLighting', fromLighting(this.status.lighting, patch.lighting));

    if (patch.buttons) {
      const b = this.buttons;
      if (!b || b.kind === 'readonly') throw new Error('Button assignments cannot be changed on this mouse yet.');
      const current = (await this.readState()).buttons ?? [];
      for (let i = 0; i < b.names.length; i++) {
        const action = patch.buttons[i];
        if (action && action !== current[i]) await this.call('setButtonMapping', b.names[i], action);
      }
    }
  }

  async readBattery(): Promise<BatteryInfo | null> {
    const s = await this.client.readStatus();
    if (!hasValue(s.batteryPercent)) return null;
    return { percent: s.batteryPercent, charging: s.batteryState.startsWith('Charging') };
  }

  async close() {
    await method(this.client, 'close')?.().catch(() => undefined);
    await this.transport.close().catch(() => undefined);
  }
}

const deviceOf = (t: HidTransport): HIDDevice | null => (t instanceof WebHidTransport ? t.device : null);

export const openmouseDriver: Driver = {
  id: 'openmouse',
  name: 'OpenMouse protocol drivers',
  vendor: 'OpenMouse community',
  status: 'beta',
  protocol: '@openmouse/protocol 0.18.0 — 40+ vendor protocols',
  filters: SUPPORTED_HID_FILTERS,
  devices: OPENMOUSE_BRANDS.map(
    (b): SupportedDevice => ({
      name: b.models,
      vendor: b.brand,
      status: 'beta',
      features: b.features,
      notes: b.notes,
    }),
  ),
  matches(transport) {
    const device = deviceOf(transport);
    return !!device && DEVICE_DRIVERS.some((d) => d.supports(device));
  },
  score(transport) {
    const device = deviceOf(transport);
    return device ? clientSupportScore(device) : 0;
  },
  async open(transport, log) {
    const device = deviceOf(transport);
    if (!device) throw new Error('OpenMouse drivers need a WebHID device.');
    const client = createSupportedClient(device);
    if (!client) throw new Error('No OpenMouse driver claimed this device.');
    await method(client, 'open')?.();
    const mouse = new OpenMouseDevice(transport.id, client, transport, log);
    try {
      await mouse.init();
    } catch (e) {
      await method(client, 'close')?.().catch(() => undefined);
      throw e;
    }
    log.info(`Opened ${mouse.info.name} (${mouse.info.vendor}) with the OpenMouse driver`);
    return mouse;
  },
};
