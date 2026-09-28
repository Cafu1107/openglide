import type { HidTransport } from './transport/types';
import type { Logger } from './log';

/** How the mouse is attached to the host. */
export type ConnectionKind = 'wired' | 'wireless' | 'receiver' | 'bluetooth' | 'virtual';

/** Maturity of a driver. Shown to users so they know what to expect. */
export type DriverStatus = 'stable' | 'beta' | 'experimental';

export interface DeviceInfo {
  name: string;
  vendor: string;
  vendorId: number;
  productId: number;
  connection: ConnectionKind;
  firmware?: string;
  serial?: string;
  /** Free-form protocol details shown on the overview page (e.g. "HID++ 4.2"). */
  protocol?: string;
  /** Caveats the user should know about (e.g. "settings are not stored on the mouse"). */
  notes?: string[];
}

export interface BatteryInfo {
  /** 0–100 when the device reports a percentage. */
  percent?: number;
  level?: 'critical' | 'low' | 'good' | 'full';
  charging: boolean;
}

export interface DpiCapability {
  min: number;
  max: number;
  step: number;
  /** Explicit list when the sensor only accepts discrete values. */
  values?: number[];
  /** How many DPI stages the device can store (1 = single DPI value). */
  maxStages: number;
  /** Stage count is fixed by the firmware; stages can be edited but not added or removed. */
  fixedStageCount?: boolean;
}

export type LightingEffect = 'off' | 'static' | 'breathing' | 'spectrum' | 'wave';

/** Actions with built-in translations. Drivers may also use their own action names. */
export type KnownButtonAction =
  | 'left-click'
  | 'right-click'
  | 'middle-click'
  | 'back'
  | 'forward'
  | 'dpi-up'
  | 'dpi-down'
  | 'dpi-cycle'
  | 'scroll-up'
  | 'scroll-down'
  | 'profile-cycle'
  | 'media-play'
  | 'volume-up'
  | 'volume-down'
  | 'disabled';

/** A known action id, or a vendor-specific action label passed through as-is. */
export type ButtonAction = KnownButtonAction | (string & {});

export interface Capabilities {
  dpi?: DpiCapability;
  /** Supported polling rates in Hz. */
  pollingRates?: number[];
  /** Lift-off options: millimetres (number) or vendor levels such as "Low" / "Medium" / "High". */
  liftOff?: (number | string)[];
  angleSnapping?: boolean;
  rippleControl?: boolean;
  motionSync?: boolean;
  /** Click debounce range in milliseconds. */
  debounce?: { min: number; max: number; step: number };
  /** Auto-sleep options in seconds (wireless mice). */
  sleepTimeout?: number[];
  lighting?: { effects: LightingEffect[] };
  buttons?: {
    labels: string[];
    actions: ButtonAction[];
    /** Assignments can be read but this driver cannot change them yet. */
    readOnly?: boolean;
  };
  profiles?: { count: number };
  battery?: boolean;
  /** Whether settings persist on the mouse after unplugging. */
  persistent?: boolean;
}

export interface LightingState {
  effect: LightingEffect;
  color: string;
  brightness: number;
  speed: number;
}

/**
 * Everything a driver can read or write. All fields are optional because
 * devices only expose a subset — check {@link Capabilities} before rendering.
 */
export interface MouseState {
  dpiStages?: number[];
  activeStage?: number;
  pollingRate?: number;
  liftOff?: number | string;
  angleSnapping?: boolean;
  rippleControl?: boolean;
  motionSync?: boolean;
  debounce?: number;
  sleepTimeout?: number;
  lighting?: LightingState;
  buttons?: ButtonAction[];
  activeProfile?: number;
}

/** A connected, opened mouse. The UI only talks to this interface. */
export interface MouseDevice {
  readonly id: string;
  readonly driver: DriverMeta;
  readonly info: DeviceInfo;
  readonly capabilities: Capabilities;
  readState(): Promise<MouseState>;
  applyState(patch: MouseState): Promise<void>;
  readBattery?(): Promise<BatteryInfo | null>;
  close(): Promise<void>;
}

export interface DriverMeta {
  id: string;
  name: string;
  vendor: string;
  status: DriverStatus;
  /** Short protocol description for the support page. */
  protocol: string;
}

export interface SupportedDevice {
  name: string;
  vendor: string;
  /** Product IDs this entry covers (for documentation). */
  productIds?: number[];
  status: DriverStatus;
  features: (keyof Capabilities)[];
  notes?: string;
}

export interface Driver extends DriverMeta {
  /** WebHID filters used for the browser device picker. */
  filters: HIDDeviceFilter[];
  /** Devices this driver is known to work with. */
  devices: SupportedDevice[];
  /** Cheap check: can this driver talk to the given transport? */
  matches(transport: HidTransport): boolean;
  /** Optional preference among several matching interfaces of one mouse (higher wins). */
  score?(transport: HidTransport): number;
  /** Open and probe the device. Throws if the device does not answer. */
  open(transport: HidTransport, log: Logger): Promise<MouseDevice>;
}
