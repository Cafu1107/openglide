import type { Logger } from '../../log';
import type { BatteryInfo, Capabilities, DriverMeta, MouseDevice, MouseState, SupportedDevice } from '../../types';

export const demoMeta: DriverMeta = {
  id: 'demo',
  name: 'Virtual demo mouse',
  vendor: 'OpenGlide',
  status: 'stable',
  protocol: 'In-memory simulation, no hardware required',
};

export const demoDevices: SupportedDevice[] = [
  {
    name: 'Glide One (virtual)',
    vendor: 'OpenGlide',
    status: 'stable',
    features: ['dpi', 'pollingRates', 'liftOff', 'angleSnapping', 'rippleControl', 'motionSync', 'debounce', 'sleepTimeout', 'lighting', 'buttons', 'profiles', 'battery'],
    notes: 'Try every screen of the app without a mouse connected.',
  },
];

const capabilities: Capabilities = {
  dpi: { min: 50, max: 26000, step: 50, maxStages: 5 },
  pollingRates: [125, 250, 500, 1000, 2000, 4000, 8000],
  liftOff: [0.7, 1, 2],
  angleSnapping: true,
  rippleControl: true,
  motionSync: true,
  debounce: { min: 0, max: 20, step: 1 },
  sleepTimeout: [30, 60, 120, 300, 600, 900],
  lighting: { effects: ['off', 'static', 'breathing', 'spectrum', 'wave'] },
  buttons: {
    labels: ['Left', 'Right', 'Middle', 'Back', 'Forward', 'DPI'],
    actions: ['left-click', 'right-click', 'middle-click', 'back', 'forward', 'dpi-up', 'dpi-down', 'dpi-cycle', 'scroll-up', 'scroll-down', 'profile-cycle', 'media-play', 'volume-up', 'volume-down', 'disabled'],
  },
  profiles: { count: 4 },
  battery: true,
  persistent: true,
};

const defaults = (): MouseState => ({
  dpiStages: [400, 800, 1600, 3200],
  activeStage: 1,
  pollingRate: 1000,
  liftOff: 1,
  angleSnapping: false,
  rippleControl: false,
  motionSync: true,
  debounce: 4,
  sleepTimeout: 120,
  lighting: { effect: 'breathing', color: '#5dde89', brightness: 70, speed: 50 },
  buttons: ['left-click', 'right-click', 'middle-click', 'back', 'forward', 'dpi-cycle'],
  activeProfile: 0,
});

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A fully featured fake mouse that behaves like real hardware (with latency). */
export class DemoMouse implements MouseDevice {
  readonly id = 'demo-mouse';
  readonly driver = demoMeta;
  readonly capabilities = capabilities;
  readonly info = {
    name: 'Glide One (virtual)',
    vendor: 'OpenGlide',
    vendorId: 0x0000,
    productId: 0x0001,
    connection: 'virtual' as const,
    firmware: 'v1.4.2',
    protocol: 'Simulated',
    notes: ['This is a virtual device. Nothing is written to real hardware.'],
  };
  private profiles: MouseState[] = Array.from({ length: 4 }, defaults);
  private profile = 0;
  private battery = 87;

  constructor(private readonly log: Logger) {
    log.info('Virtual demo mouse attached');
  }

  async readState(): Promise<MouseState> {
    await wait(120);
    return structuredClone({ ...this.profiles[this.profile], activeProfile: this.profile });
  }

  async applyState(patch: MouseState): Promise<void> {
    await wait(180);
    if (patch.activeProfile !== undefined && patch.activeProfile !== this.profile) {
      this.profile = patch.activeProfile;
      this.log.info(`Switched to profile ${this.profile + 1}`);
    }
    const { activeProfile: _ignored, ...rest } = patch;
    Object.assign(this.profiles[this.profile]!, structuredClone(rest));
    for (const [key, value] of Object.entries(rest)) this.log.info(`Wrote ${key} = ${JSON.stringify(value)}`);
  }

  async readBattery(): Promise<BatteryInfo> {
    this.battery = Math.max(5, this.battery - Math.random() * 0.2);
    return { percent: Math.round(this.battery), charging: false };
  }

  async close() {
    this.log.info('Virtual demo mouse detached');
  }
}
