# Adding a driver

A driver teaches OpenGlide how to talk to a family of mice. It lives in
`packages/core/src/drivers/<vendor>/` and knows nothing about React or the UI —
the UI simply renders whatever **capabilities** the driver reports.

## 1. Capture the protocol

1. Connect the mouse in OpenGlide. It opens with the *Generic HID* driver.
2. Go to **Diagnostics** and copy the report. Note the vendor-specific
   collections (usage page `0xFF00`–`0xFFFF`) and their report IDs.
3. Record what the vendor software sends when you change a setting:
   - **Windows:** [USBPcap](https://desowin.org/usbpcap/) + Wireshark
   - **Linux:** `usbmon` + Wireshark
   - Some vendors ship a WebHID configurator — Chrome DevTools can log its `sendReport` / `sendFeatureReport` calls.
4. Change one setting at a time and diff the packets.

## 2. Implement the driver

```ts
// packages/core/src/drivers/acme/index.ts
import type { Driver, MouseDevice } from '../../types';

export const acmeDriver: Driver = {
  id: 'acme',
  name: 'ACME protocol',
  vendor: 'ACME',
  status: 'experimental',
  protocol: '64-byte feature reports on usage page 0xFF01',
  filters: [{ vendorId: 0x1234, usagePage: 0xff01 }],
  devices: [{ name: 'ACME Pro', vendor: 'ACME', status: 'experimental', features: ['dpi', 'pollingRates'] }],

  matches: (t) => t.vendorId === 0x1234 && t.collections.some((c) => c.usagePage === 0xff01),

  async open(transport, log) {
    await transport.open();
    // Probe the device; throw if it does not answer so the next driver is tried.
    const mouse: MouseDevice = {
      id: transport.id,
      driver: acmeDriver,
      info: { name: transport.productName, vendor: 'ACME', vendorId: transport.vendorId, productId: transport.productId, connection: 'wired' },
      capabilities: { dpi: { min: 100, max: 26000, step: 50, maxStages: 5 }, pollingRates: [125, 500, 1000], persistent: true },
      async readState() {
        const report = await transport.receiveFeatureReport(0x05);
        return { dpiStages: [/* parse */], activeStage: 0, pollingRate: 1000 };
      },
      async applyState(patch) {
        if (patch.pollingRate) await transport.sendFeatureReport(0x05, new Uint8Array([/* … */]));
        log.info(`Polling rate set to ${patch.pollingRate} Hz`);
      },
      close: () => transport.close(),
    };
    return mouse;
  },
};
```

Rules of thumb:

- **Only declare capabilities you can read *and* write.** The UI shows a control for every capability.
- `applyState` receives only the changed fields. After it returns, the app calls `readState` again to confirm.
- Throw from `open` when the device does not answer — the registry then falls back to the next driver.
- Keep packet builders and parsers **pure** (like `drivers/logitech/features.ts`) and cover them with Vitest.
- Log packets with `log.debug` using `hex()` from `log.ts`; users can attach them to bug reports.

## 3. Register it

Add the driver to `DRIVERS` in `packages/core/src/index.ts` — **before** `genericDriver`, which matches everything.

## 4. Test and open a PR

```bash
npm test && npm run typecheck && npm run dev
```

Start with `status: 'experimental'`, list exactly which models you tested, and include a Diagnostics report in the PR description.
