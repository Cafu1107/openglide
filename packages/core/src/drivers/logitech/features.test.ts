import { describe, expect, it } from 'vitest';
import {
  parseBatteryStatus,
  parseDpiList,
  parseExtendedRateFlags,
  parseFirmware,
  parseReportRateFlags,
  parseUnifiedBattery,
  summariseDpi,
} from './features';

describe('parseDpiList', () => {
  it('reads a plain terminated list', () => {
    expect(parseDpiList([0x01, 0x90, 0x03, 0x20, 0x06, 0x40, 0x00, 0x00])).toEqual([400, 800, 1600]);
  });

  it('expands step ranges', () => {
    // 100, step 50, up to 300
    expect(parseDpiList([0x00, 0x64, 0xe0, 0x32, 0x01, 0x2c, 0x00, 0x00])).toEqual([100, 150, 200, 250, 300]);
  });

  it('summarises regular ranges without an explicit list', () => {
    expect(summariseDpi([100, 150, 200])).toEqual({ min: 100, max: 200, step: 50 });
    expect(summariseDpi([400, 800, 1600]).values).toEqual([400, 800, 1600]);
  });
});

describe('report rates', () => {
  it('decodes 0x8060 flags (bit n = n+1 ms)', () => {
    expect(parseReportRateFlags(0b10001011)).toEqual([125, 250, 500, 1000]);
  });

  it('decodes 0x8061 flags', () => {
    expect(parseExtendedRateFlags(0b1111000)).toEqual([1000, 2000, 4000, 8000]);
  });
});

describe('battery', () => {
  it('decodes unified battery', () => {
    expect(parseUnifiedBattery([72, 4, 0, 0])).toEqual({ percent: 72, level: 'good', charging: false });
    expect(parseUnifiedBattery([0, 2, 1, 1])).toEqual({ percent: undefined, level: 'low', charging: true });
  });

  it('decodes legacy battery status', () => {
    expect(parseBatteryStatus([50, 20, 0])).toEqual({ percent: 50, charging: false });
  });
});

describe('firmware', () => {
  it('formats prefix, BCD version and build', () => {
    expect(parseFirmware([0, 0x4d, 0x50, 0x4d, 0x12, 0x05, 0x00, 0x1a]).text).toBe('MPM 12.05.B001a');
  });
});
