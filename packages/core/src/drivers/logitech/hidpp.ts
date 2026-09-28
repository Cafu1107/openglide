import { hex, type Logger } from '../../log';
import { hasOutputReport, type HidTransport } from '../../transport/types';
import { HIDPP_ERRORS } from './features';

export const SHORT_REPORT = 0x10;
export const LONG_REPORT = 0x11;
const SHORT_LEN = 6;
const LONG_LEN = 19;
/** Software ID echoed back by the device so we can match our replies. */
const SW_ID = 0x0b;

export class HidppError extends Error {
  constructor(
    readonly code: number,
    readonly v1 = false,
  ) {
    super(`HID++ ${v1 ? '1.0' : '2.0'} error 0x${code.toString(16).padStart(2, '0')} (${HIDPP_ERRORS[code] ?? 'unknown'})`);
  }
}

export class HidppTimeout extends Error {
  constructor() {
    super('The device did not answer in time.');
  }
}

/**
 * One HID++ conversation with one device index. Requests are serialised so
 * replies can never be mixed up.
 */
export class HidppChannel {
  private queue: Promise<unknown> = Promise.resolve();
  private readonly useLong: boolean;

  constructor(
    private readonly transport: HidTransport,
    readonly deviceIndex: number,
    private readonly log: Logger,
  ) {
    this.useLong = hasOutputReport(transport, LONG_REPORT) || !hasOutputReport(transport, SHORT_REPORT);
  }

  request(featureIndex: number, fn: number, params: number[] = [], timeoutMs = 1200): Promise<Uint8Array> {
    const run = () => this.send(featureIndex, fn, params, timeoutMs);
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  private send(featureIndex: number, fn: number, params: number[], timeoutMs: number): Promise<Uint8Array> {
    const reportId = this.useLong ? LONG_REPORT : SHORT_REPORT;
    const packet = new Uint8Array(this.useLong ? LONG_LEN : SHORT_LEN);
    const fnSw = ((fn & 0x0f) << 4) | SW_ID;
    packet[0] = this.deviceIndex;
    packet[1] = featureIndex;
    packet[2] = fnSw;
    packet.set(params.slice(0, packet.length - 3), 3);

    return new Promise<Uint8Array>((resolve, reject) => {
      const finish = (settle: () => void) => {
        clearTimeout(timer);
        unsubscribe();
        settle();
      };
      const timer = setTimeout(() => finish(() => reject(new HidppTimeout())), timeoutMs);
      const unsubscribe = this.transport.onInputReport((rid, d) => {
        if ((rid !== SHORT_REPORT && rid !== LONG_REPORT) || d[0] !== this.deviceIndex) return;
        if (d[1] === 0xff && d[2] === featureIndex && d[3] === fnSw) {
          this.log.debug(`← ${hex(d)} (error)`);
          finish(() => reject(new HidppError(d[4] ?? 0)));
        } else if (d[1] === 0x8f && d[2] === featureIndex && d[3] === fnSw) {
          this.log.debug(`← ${hex(d)} (1.0 error)`);
          finish(() => reject(new HidppError(d[4] ?? 0, true)));
        } else if (d[1] === featureIndex && d[2] === fnSw) {
          this.log.debug(`← ${hex(d)}`);
          finish(() => resolve(d.slice(3)));
        }
      });
      this.log.debug(`→ ${reportId.toString(16)} ${hex(packet)}`);
      this.transport.sendReport(reportId, packet).catch((e: unknown) => finish(() => reject(e)));
    });
  }
}

/** Feature-index lookup and caching on top of a channel. */
export class HidppDevice {
  private features = new Map<number, number>();

  constructor(readonly channel: HidppChannel) {}

  /** Returns the feature index, or 0 when the feature is not supported. */
  async featureIndex(featureId: number): Promise<number> {
    const cached = this.features.get(featureId);
    if (cached !== undefined) return cached;
    const reply = await this.channel.request(0, 0, [featureId >> 8, featureId & 0xff]);
    const index = reply[0] ?? 0;
    this.features.set(featureId, index);
    return index;
  }

  async has(featureId: number): Promise<boolean> {
    return (await this.featureIndex(featureId)) !== 0;
  }

  async call(featureId: number, fn: number, params: number[] = []): Promise<Uint8Array> {
    const index = await this.featureIndex(featureId);
    if (index === 0) throw new Error(`Feature 0x${featureId.toString(16).padStart(4, '0')} is not supported.`);
    return this.channel.request(index, fn, params);
  }

  /** Root ping: returns the HID++ protocol version, e.g. "4.2". */
  async protocolVersion(timeoutMs = 800): Promise<string> {
    const reply = await this.channel.request(0, 1, [0, 0, 0x5a], timeoutMs);
    return `${reply[0]}.${reply[1]}`;
  }
}
