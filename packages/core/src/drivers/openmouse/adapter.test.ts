import type { SupportedClient } from '@openmouse/protocol/drivers';
import { describe, expect, it, vi } from 'vitest';
import { LogBook } from '../../log';
import type { HidTransport } from '../../transport/types';
import { OpenMouseDevice } from './index';

const transport = {
  id: 't1',
  vendorId: 0x373b,
  productId: 0x1234,
  productName: 'ATK A9 PLUS',
  collections: [],
  opened: true,
  open: async () => {},
  close: async () => {},
  sendReport: async () => {},
  sendFeatureReport: async () => {},
  receiveFeatureReport: async () => new Uint8Array(),
  onInputReport: () => () => {},
} satisfies HidTransport;

/** A client shaped like the ATK driver: stage editor, sensor toggles, read-only buttons. */
function fakeAtk() {
  let status = {
    brand: 'ATK',
    name: 'ATK A9 PLUS',
    batteryPercent: 80,
    batteryState: 'Discharging',
    dpi: 800,
    dpiStages: [400, 800, 1600],
    activeDpiStage: 1,
    pollingRateHz: 1000,
    supportedPollingRates: [125, 250, 500, 1000, 2000, 4000, 8000],
    activeProfile: null,
    liftOffDistance: 'Low',
    angleSnapping: false,
    rippleControl: false,
    motionSync: true,
    debounceMs: 4,
    sleepTimeout: 60,
    connectionType: 'Wireless',
    connectionDetail: '2.4 GHz receiver',
    firmware: ['1.02'],
    atkButtonMappings: [
      { id: 'left', name: 'Left', action: 'Left click' },
      { id: 'back', name: 'Back', action: 'Back' },
    ],
    ui: { dpiStageEditor: { maxStages: 5, minDpi: 50, maxDpi: 30000, stepDpi: 10 } },
  };
  const client = {
    readStatus: vi.fn(async () => structuredClone(status)),
    getDpiOptions: () => [],
    setDpi: vi.fn(async () => 0),
    setDpiStageCount: vi.fn(async () => 0),
    setDpiStageValue: vi.fn(async (i: number, v: number) => {
      status.dpiStages[i] = v;
      return v;
    }),
    setActiveDpiStage: vi.fn(async () => 0),
    setPollingRate: vi.fn(async (hz: number) => {
      status = { ...status, pollingRateHz: hz };
      return hz;
    }),
    setLiftOffDistance: vi.fn(async (v: string) => v),
    setAngleSnapping: vi.fn(async (v: boolean) => v),
    setRippleControl: vi.fn(async (v: boolean) => v),
    setMotionSync: vi.fn(async (v: boolean) => v),
    setDebounceTime: vi.fn(async (v: number) => v),
    setSleepTimeout: vi.fn(async (v: number) => v),
  };
  return client;
}

describe('OpenMouse adapter', () => {
  it('maps an ATK-style status to capabilities and state', async () => {
    const client = fakeAtk();
    const mouse = new OpenMouseDevice('t1', client as unknown as SupportedClient, transport, new LogBook().logger('t'));
    await mouse.init();
    const c = mouse.capabilities;
    expect(c.dpi).toMatchObject({ min: 50, max: 30000, step: 10, maxStages: 5, fixedStageCount: false });
    expect(c.pollingRates).toEqual([125, 250, 500, 1000, 2000, 4000, 8000]);
    expect(c.liftOff).toEqual(['Low', 'Medium', 'High']);
    expect(c).toMatchObject({ angleSnapping: true, rippleControl: true, motionSync: true, battery: true });
    expect(c.buttons).toMatchObject({ labels: ['Left', 'Back'], readOnly: true });
    expect(mouse.info).toMatchObject({ vendor: 'ATK', connection: 'receiver', firmware: '1.02' });

    const state = await mouse.readState();
    expect(state).toMatchObject({ dpiStages: [400, 800, 1600], activeStage: 1, pollingRate: 1000, liftOff: 'Low', buttons: ['Left click', 'Back'] });
  });

  it('writes only through setters the client provides', async () => {
    const client = fakeAtk();
    const mouse = new OpenMouseDevice('t1', client as unknown as SupportedClient, transport, new LogBook().logger('t'));
    await mouse.init();
    await mouse.readState();
    await mouse.applyState({ dpiStages: [400, 1200, 1600, 3200], activeStage: 3, pollingRate: 4000, liftOff: 'High', motionSync: false });
    expect(client.setDpiStageCount).toHaveBeenCalledWith(4);
    expect(client.setDpiStageValue).toHaveBeenCalledWith(1, 1200);
    expect(client.setDpiStageValue).toHaveBeenCalledWith(3, 3200);
    expect(client.setDpiStageValue).not.toHaveBeenCalledWith(0, 400);
    expect(client.setActiveDpiStage).toHaveBeenCalledWith(3);
    expect(client.setPollingRate).toHaveBeenCalledWith(4000);
    expect(client.setLiftOffDistance).toHaveBeenCalledWith('High');
    expect(client.setMotionSync).toHaveBeenCalledWith(false);
    await expect(mouse.applyState({ buttons: ['Back', 'Back'] })).rejects.toThrow(/cannot be changed/);
  });

  it('remaps buttons on drivers with the shared button remapper', async () => {
    const setButtonMapping = vi.fn(async () => {});
    const client = {
      readStatus: async () => ({
        brand: 'Pulsar',
        name: 'Pulsar X2',
        batteryPercent: null,
        batteryState: 'Unknown',
        dpi: 800,
        pollingRateHz: 1000,
        activeProfile: null,
        liftOffDistance: null,
        firmware: [],
        buttonMappings: { Left: 'Left Click', Right: 'Right Click', 'Side Back': 'Back' },
        buttonOptions: ['Left Click', 'Right Click', 'Back', 'Forward', 'DPI Cycle', 'Disabled'],
      }),
      getDpiOptions: () => [400, 800, 1600],
      setDpi: async () => 0,
      setButtonMapping,
    };
    const mouse = new OpenMouseDevice('t2', client as unknown as SupportedClient, transport, new LogBook().logger('t'));
    await mouse.init();
    expect(mouse.capabilities.buttons?.labels).toEqual(['Left', 'Right', 'Side Back']);
    expect(mouse.capabilities.buttons?.readOnly).toBeUndefined();
    expect(mouse.capabilities.dpi).toMatchObject({ values: [400, 800, 1600], maxStages: 1 });
    await mouse.applyState({ buttons: ['Left Click', 'Right Click', 'DPI Cycle'] });
    expect(setButtonMapping).toHaveBeenCalledTimes(1);
    expect(setButtonMapping).toHaveBeenCalledWith('Side Back', 'DPI Cycle');
  });
});
