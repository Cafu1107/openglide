/**
 * Pure HID++ 2.0 payload parsers. No I/O here so everything is unit-testable.
 * References: Logitech HID++ 2.0 feature specs and the Solaar project.
 */
import type { BatteryInfo } from '../../types';

export const Feature = {
  ROOT: 0x0000,
  FEATURE_SET: 0x0001,
  DEVICE_FW_VERSION: 0x0003,
  DEVICE_NAME: 0x0005,
  BATTERY_STATUS: 0x1000,
  UNIFIED_BATTERY: 0x1004,
  ADJUSTABLE_DPI: 0x2201,
  REPORT_RATE: 0x8060,
  EXTENDED_REPORT_RATE: 0x8061,
  ONBOARD_PROFILES: 0x8100,
} as const;

export const u16 = (b: ArrayLike<number>, i: number): number => ((b[i] ?? 0) << 8) | (b[i + 1] ?? 0);

/**
 * Parse the 0x2201 getSensorDpiList payload (after the sensor index byte).
 * Values are big-endian u16, terminated by 0. A value with the top three bits
 * set (0xE000) is a step marker: the range continues from the previous value
 * to the following value in increments of `value & 0x1FFF`.
 */
export function parseDpiList(bytes: ArrayLike<number>): number[] {
  const out: number[] = [];
  let i = 0;
  while (i + 1 < bytes.length) {
    const value = u16(bytes, i);
    if (value === 0) break;
    if (value >> 13 === 0b111) {
      const step = value & 0x1fff;
      const last = u16(bytes, i + 2);
      const prev = out[out.length - 1];
      if (prev === undefined || step === 0 || last <= prev) break;
      for (let v = prev + step; v <= last; v += step) out.push(v);
      i += 4;
    } else {
      out.push(value);
      i += 2;
    }
  }
  return out;
}

/** Summarise a DPI list as min/max/step, keeping the list if it is irregular. */
export function summariseDpi(values: number[]): { min: number; max: number; step: number; values?: number[] } {
  if (values.length === 0) return { min: 100, max: 100, step: 50 };
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  if (sorted.length === 1) return { min, max, step: 1, values: sorted };
  const step = sorted[1]! - sorted[0]!;
  const regular = sorted.every((v, i) => i === 0 || v - sorted[i - 1]! === step);
  return regular ? { min, max, step } : { min, max, step, values: sorted };
}

/** 0x8060: bit n set means a report interval of (n + 1) ms is supported. */
export function parseReportRateFlags(flags: number): number[] {
  const rates: number[] = [];
  for (let i = 0; i < 8; i++) if ((flags >> i) & 1) rates.push(Math.round(1000 / (i + 1)));
  return rates.sort((a, b) => a - b);
}

export const msToHz = (ms: number): number => Math.round(1000 / ms);
export const hzToMs = (hz: number): number => Math.round(1000 / hz);

/** 0x8061 rate index → Hz. Index 0 = 8 ms … index 6 = 125 µs. */
export const EXTENDED_RATES = [125, 250, 500, 1000, 2000, 4000, 8000] as const;

export function parseExtendedRateFlags(flags: number): number[] {
  return EXTENDED_RATES.filter((_, i) => (flags >> i) & 1);
}

/** 0x1004 getStatus: [stateOfCharge, level, chargingStatus, externalPower]. */
export function parseUnifiedBattery(b: ArrayLike<number>): BatteryInfo {
  const percent = b[0] ?? 0;
  const levelBits = b[1] ?? 0;
  const status = b[2] ?? 0;
  const level =
    levelBits & 8 ? 'full' : levelBits & 4 ? 'good' : levelBits & 2 ? 'low' : levelBits & 1 ? 'critical' : undefined;
  return {
    percent: percent > 0 ? percent : undefined,
    level,
    charging: status === 1 || status === 2 || status === 4,
  };
}

/** 0x1000 getBatteryLevelStatus: [level%, nextLevel%, status]. */
export function parseBatteryStatus(b: ArrayLike<number>): BatteryInfo {
  const status = b[2] ?? 0;
  return {
    percent: (b[0] ?? 0) > 0 ? b[0] : undefined,
    charging: status === 1 || status === 2 || status === 4,
  };
}

const bcd = (n: number) => n.toString(16).padStart(2, '0');

/** 0x0003 getFwInfo: [type, prefix×3, version, revision, build(u16), …]. */
export function parseFirmware(b: ArrayLike<number>): { type: number; text: string } {
  const prefix = String.fromCharCode(b[1] ?? 0, b[2] ?? 0, b[3] ?? 0).replace(/\0/g, '').trim();
  const build = u16(b, 6).toString(16).padStart(4, '0');
  return { type: b[0] ?? 0, text: `${prefix} ${bcd(b[4] ?? 0)}.${bcd(b[5] ?? 0)}.B${build}`.trim() };
}

export const decodeAscii = (b: ArrayLike<number>): string =>
  String.fromCharCode(...Array.from(b)).replace(/\0.*$/s, '');

export const HIDPP_ERRORS: Record<number, string> = {
  0x01: 'Unknown',
  0x02: 'Invalid argument',
  0x03: 'Out of range',
  0x04: 'Hardware error',
  0x05: 'Logitech internal',
  0x06: 'Invalid feature index',
  0x07: 'Invalid function',
  0x08: 'Busy',
  0x09: 'Unsupported',
};
