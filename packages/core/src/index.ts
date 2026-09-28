import { genericDriver } from './drivers/generic';
import { logitechDriver } from './drivers/logitech';
import type { Logger } from './log';
import type { HidTransport } from './transport/types';
import type { Driver, MouseDevice } from './types';

export * from './types';
export * from './log';
export * from './vendors';
export * from './transport/types';
export * from './transport/webhid';
export { DemoMouse, demoMeta, demoDevices } from './drivers/demo';
export { logitechDriver } from './drivers/logitech';
export { genericDriver } from './drivers/generic';

/**
 * Protocol drivers in priority order. The generic driver must stay last
 * because it matches everything. Add new drivers here.
 */
export const DRIVERS: Driver[] = [logitechDriver, genericDriver];

/** WebHID filters covering every driver, for the browser device picker. */
export const allFilters = (): HIDDeviceFilter[] => DRIVERS.flatMap((d) => d.filters);

/**
 * Pick the best driver for a set of interfaces belonging to one physical
 * device and open it. Specific drivers are tried before the generic one.
 */
export async function openDevice(transports: HidTransport[], log: Logger): Promise<MouseDevice> {
  const errors: string[] = [];
  for (const driver of DRIVERS) {
    const candidates = transports.filter((t) => driver.matches(t));
    for (const transport of candidates) {
      try {
        return await driver.open(transport, log.child(driver.id));
      } catch (e) {
        const message = (e as Error).message;
        errors.push(`${driver.name}: ${message}`);
        log.warn(`${driver.name} could not open ${transport.productName}: ${message}`);
        await transport.close().catch(() => undefined);
      }
    }
  }
  throw new Error(errors.join('\n') || 'No driver matched this device.');
}

/** Group WebHID interfaces by physical device (same VID/PID/name). */
export function groupTransports<T extends HidTransport>(transports: T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const t of transports) {
    const key = `${t.vendorId}:${t.productId}:${t.productName}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  return [...groups.values()];
}
