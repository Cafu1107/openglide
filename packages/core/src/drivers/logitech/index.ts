import type { Logger } from '../../log';
import { hasOutputReport, hasUsagePage, type HidTransport } from '../../transport/types';
import type { BatteryInfo, Capabilities, Driver, MouseDevice, MouseState } from '../../types';
import {
  EXTENDED_RATES,
  Feature,
  decodeAscii,
  hzToMs,
  msToHz,
  parseBatteryStatus,
  parseDpiList,
  parseExtendedRateFlags,
  parseFirmware,
  parseReportRateFlags,
  parseUnifiedBattery,
  summariseDpi,
  u16,
} from './features';
import { HidppChannel, HidppDevice, LONG_REPORT, SHORT_REPORT } from './hidpp';

const LOGITECH_VID = 0x046d;

/** Unifying, Lightspeed and Bolt receivers: the mouse sits behind a device index. */
const RECEIVER_PIDS = new Set([0xc52b, 0xc532, 0xc539, 0xc53a, 0xc53d, 0xc53f, 0xc545, 0xc547, 0xc548, 0xc54d]);

const meta = {
  id: 'logitech-hidpp',
  name: 'Logitech HID++ 2.0',
  vendor: 'Logitech',
  status: 'beta',
  protocol: 'HID++ 2.0 (features 0x2201, 0x8060, 0x8061, 0x1000, 0x1004)',
} as const;

async function probe(transport: HidTransport, log: Logger): Promise<HidppDevice> {
  const indexes = RECEIVER_PIDS.has(transport.productId) ? [1, 2, 3, 4, 5, 6] : [0xff, 1];
  for (const index of indexes) {
    const device = new HidppDevice(new HidppChannel(transport, index, log));
    try {
      const version = await device.protocolVersion();
      log.info(`Device index 0x${index.toString(16)} answered, HID++ ${version}`);
      return device;
    } catch (e) {
      log.debug(`Device index 0x${index.toString(16)} did not answer: ${(e as Error).message}`);
    }
  }
  throw new Error('No HID++ 2.0 mouse answered. Is the mouse switched on and paired?');
}

async function readName(dev: HidppDevice): Promise<string | undefined> {
  if (!(await dev.has(Feature.DEVICE_NAME))) return undefined;
  const length = (await dev.call(Feature.DEVICE_NAME, 0))[0] ?? 0;
  let name = '';
  while (name.length < length) {
    const chunk = decodeAscii(await dev.call(Feature.DEVICE_NAME, 1, [name.length]));
    if (!chunk) break;
    name += chunk;
  }
  return name.slice(0, length).trim() || undefined;
}

async function readFirmware(dev: HidppDevice): Promise<string | undefined> {
  if (!(await dev.has(Feature.DEVICE_FW_VERSION))) return undefined;
  const count = (await dev.call(Feature.DEVICE_FW_VERSION, 0))[0] ?? 0;
  for (let i = 0; i < count; i++) {
    const fw = parseFirmware(await dev.call(Feature.DEVICE_FW_VERSION, 1, [i]));
    if (fw.type === 0) return fw.text; // main application
  }
  return undefined;
}

class LogitechMouse implements MouseDevice {
  readonly driver = meta;
  info!: MouseDevice['info'];
  capabilities: Capabilities = {};
  private extendedRate = false;
  private onboardChecked = false;

  constructor(
    readonly id: string,
    private readonly transport: HidTransport,
    private readonly dev: HidppDevice,
    private readonly log: Logger,
  ) {}

  async init(protocol: string) {
    const d = this.dev;
    const [name, firmware] = await Promise.all([readName(d).catch(() => undefined), readFirmware(d).catch(() => undefined)]);
    const caps: Capabilities = { persistent: false };

    if (await d.has(Feature.ADJUSTABLE_DPI)) {
      const reply = await d.call(Feature.ADJUSTABLE_DPI, 1, [0]);
      const values = parseDpiList(reply.slice(1));
      if (values.length) caps.dpi = { ...summariseDpi(values), maxStages: 1 };
    }

    if (await d.has(Feature.EXTENDED_REPORT_RATE)) {
      const flags = u16(await d.call(Feature.EXTENDED_REPORT_RATE, 1), 0);
      caps.pollingRates = parseExtendedRateFlags(flags);
      this.extendedRate = true;
    } else if (await d.has(Feature.REPORT_RATE)) {
      caps.pollingRates = parseReportRateFlags((await d.call(Feature.REPORT_RATE, 0))[0] ?? 0);
    }

    caps.battery = (await d.has(Feature.UNIFIED_BATTERY)) || (await d.has(Feature.BATTERY_STATUS));

    const receiver = RECEIVER_PIDS.has(this.transport.productId);
    this.info = {
      name: name ?? this.transport.productName ?? 'Logitech mouse',
      vendor: 'Logitech',
      vendorId: this.transport.vendorId,
      productId: this.transport.productId,
      connection: receiver ? 'receiver' : 'wired',
      firmware,
      protocol: `HID++ ${protocol}`,
      notes: [
        'Changes are applied in host mode. If the mouse uses onboard profiles, OpenGlide switches it to host mode first; G HUB can switch it back.',
      ],
    };
    this.capabilities = caps;
  }

  /** Onboard-profile mode ignores host writes, so switch to host mode once. */
  private async ensureHostMode() {
    if (this.onboardChecked) return;
    this.onboardChecked = true;
    if (!(await this.dev.has(Feature.ONBOARD_PROFILES))) return;
    const mode = (await this.dev.call(Feature.ONBOARD_PROFILES, 2))[0];
    if (mode === 0x01) {
      this.log.warn('Mouse is in onboard-profile mode; switching to host mode so changes take effect.');
      await this.dev.call(Feature.ONBOARD_PROFILES, 1, [0x02]);
    }
  }

  async readState(): Promise<MouseState> {
    const state: MouseState = {};
    if (this.capabilities.dpi) {
      const r = await this.dev.call(Feature.ADJUSTABLE_DPI, 2, [0]);
      const dpi = u16(r, 1) || u16(r, 3); // 0 means "default"
      state.dpiStages = [dpi];
      state.activeStage = 0;
    }
    if (this.capabilities.pollingRates) {
      if (this.extendedRate) {
        const index = (await this.dev.call(Feature.EXTENDED_REPORT_RATE, 2))[0] ?? 0;
        state.pollingRate = EXTENDED_RATES[index];
      } else {
        state.pollingRate = msToHz((await this.dev.call(Feature.REPORT_RATE, 1))[0] || 1);
      }
    }
    return state;
  }

  async applyState(patch: MouseState): Promise<void> {
    await this.ensureHostMode();
    const dpi = patch.dpiStages?.[patch.activeStage ?? 0];
    if (dpi !== undefined && this.capabilities.dpi) {
      await this.dev.call(Feature.ADJUSTABLE_DPI, 3, [0, dpi >> 8, dpi & 0xff]);
      this.log.info(`DPI set to ${dpi}`);
    }
    if (patch.pollingRate !== undefined && this.capabilities.pollingRates) {
      if (this.extendedRate) {
        const index = EXTENDED_RATES.indexOf(patch.pollingRate as (typeof EXTENDED_RATES)[number]);
        if (index < 0) throw new Error(`${patch.pollingRate} Hz is not supported.`);
        await this.dev.call(Feature.EXTENDED_REPORT_RATE, 3, [index]);
      } else {
        await this.dev.call(Feature.REPORT_RATE, 2, [hzToMs(patch.pollingRate)]);
      }
      this.log.info(`Polling rate set to ${patch.pollingRate} Hz`);
    }
  }

  async readBattery(): Promise<BatteryInfo | null> {
    if (await this.dev.has(Feature.UNIFIED_BATTERY)) {
      return parseUnifiedBattery(await this.dev.call(Feature.UNIFIED_BATTERY, 1));
    }
    if (await this.dev.has(Feature.BATTERY_STATUS)) {
      return parseBatteryStatus(await this.dev.call(Feature.BATTERY_STATUS, 0));
    }
    return null;
  }

  async close() {
    await this.transport.close();
  }
}

export const logitechDriver: Driver = {
  ...meta,
  filters: [{ vendorId: LOGITECH_VID, usagePage: 0xff00 }],
  devices: [
    { name: 'PRO X Superlight / Superlight 2', vendor: 'Logitech', status: 'beta', features: ['dpi', 'pollingRates', 'battery'] },
    { name: 'PRO Wireless', vendor: 'Logitech', status: 'beta', features: ['dpi', 'pollingRates', 'battery'] },
    { name: 'G502 HERO / G502 X / G502 X Plus', vendor: 'Logitech', status: 'beta', features: ['dpi', 'pollingRates'] },
    { name: 'G305 / G304 Lightspeed', vendor: 'Logitech', status: 'beta', features: ['dpi', 'pollingRates', 'battery'] },
    { name: 'G703 / G903 Lightspeed', vendor: 'Logitech', status: 'beta', features: ['dpi', 'pollingRates', 'battery'] },
    { name: 'G102 / G203 Lightsync', vendor: 'Logitech', status: 'experimental', features: ['dpi', 'pollingRates'] },
    {
      name: 'Other HID++ 2.0 mice',
      vendor: 'Logitech',
      status: 'experimental',
      features: ['dpi', 'pollingRates', 'battery'],
      notes: 'Any mouse exposing features 0x2201 and 0x8060/0x8061 should work.',
    },
  ],
  matches: (t) =>
    t.vendorId === LOGITECH_VID &&
    hasUsagePage(t, 0xff00) &&
    (hasOutputReport(t, LONG_REPORT) || hasOutputReport(t, SHORT_REPORT)),
  async open(transport, log) {
    await transport.open();
    const dev = await probe(transport, log);
    const version = await dev.protocolVersion();
    const mouse = new LogitechMouse(transport.id, transport, dev, log);
    await mouse.init(version);
    return mouse;
  },
};
