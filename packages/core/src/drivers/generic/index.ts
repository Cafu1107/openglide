import type { Driver, MouseDevice } from '../../types';
import { vendorName } from '../../vendors';

/**
 * Fallback for mice without a protocol driver yet. It exposes the device
 * identity and HID layout so users can file a useful support request.
 */
export const genericDriver: Driver = {
  id: 'generic-hid',
  name: 'Generic HID (read-only)',
  vendor: 'Any',
  status: 'stable',
  protocol: 'USB HID descriptor inspection only',
  filters: [{ usagePage: 0x0001, usage: 0x0002 }],
  devices: [
    {
      name: 'Any USB / 2.4 GHz mouse',
      vendor: 'Any',
      status: 'stable',
      features: [],
      notes: 'Shows device identity and HID collections for diagnostics and support requests.',
    },
  ],
  matches: () => true,
  async open(transport, log) {
    log.info(`Opened ${transport.productName} with the generic driver (no settings available).`);
    const mouse: MouseDevice = {
      id: transport.id,
      driver: genericDriver,
      info: {
        name: transport.productName || 'Unknown mouse',
        vendor: vendorName(transport.vendorId),
        vendorId: transport.vendorId,
        productId: transport.productId,
        connection: 'wired',
        protocol: 'Generic HID',
        notes: ['No protocol driver is available for this mouse yet. Use the diagnostics tab to help add support.'],
      },
      capabilities: {},
      readState: async () => ({}),
      applyState: async () => {
        throw new Error('This mouse has no writable settings in OpenGlide yet.');
      },
      close: () => transport.close(),
    };
    return mouse;
  },
};
