import type { HidCollection, HidTransport } from './types';

const toCollections = (device: HIDDevice): HidCollection[] =>
  (device.collections ?? []).map((c) => ({
    usagePage: c.usagePage ?? 0,
    usage: c.usage ?? 0,
    inputReports: (c.inputReports ?? []).map((r) => r.reportId ?? 0),
    outputReports: (c.outputReports ?? []).map((r) => r.reportId ?? 0),
    featureReports: (c.featureReports ?? []).map((r) => r.reportId ?? 0),
  }));

let counter = 0;

export class WebHidTransport implements HidTransport {
  readonly id: string;
  readonly collections: HidCollection[];

  constructor(readonly device: HIDDevice) {
    this.id = `webhid-${device.vendorId.toString(16)}-${device.productId.toString(16)}-${counter++}`;
    this.collections = toCollections(device);
  }

  get vendorId() {
    return this.device.vendorId;
  }
  get productId() {
    return this.device.productId;
  }
  get productName() {
    return this.device.productName;
  }
  get opened() {
    return this.device.opened;
  }

  async open() {
    if (!this.device.opened) await this.device.open();
  }

  async close() {
    if (this.device.opened) await this.device.close();
  }

  async sendReport(reportId: number, data: Uint8Array) {
    await this.device.sendReport(reportId, new Uint8Array(data));
  }

  async sendFeatureReport(reportId: number, data: Uint8Array) {
    await this.device.sendFeatureReport(reportId, new Uint8Array(data));
  }

  async receiveFeatureReport(reportId: number) {
    const view = await this.device.receiveFeatureReport(reportId);
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }

  onInputReport(listener: (reportId: number, data: Uint8Array) => void) {
    const handler = (e: HIDInputReportEvent) =>
      listener(e.reportId, new Uint8Array(e.data.buffer, e.data.byteOffset, e.data.byteLength));
    this.device.addEventListener('inputreport', handler);
    return () => this.device.removeEventListener('inputreport', handler);
  }
}

export const isWebHidSupported = (): boolean =>
  typeof navigator !== 'undefined' && 'hid' in navigator;

/**
 * Show the browser device picker and wrap every selected interface.
 * Chrome may return one HIDDevice per interface of the same mouse.
 */
export async function requestWebHidDevices(filters: HIDDeviceFilter[]): Promise<WebHidTransport[]> {
  if (!isWebHidSupported()) throw new Error('WebHID is not available in this browser.');
  const devices = await navigator.hid.requestDevice({ filters });
  return devices.map((d) => new WebHidTransport(d));
}

/** Devices the user already granted access to in an earlier session. */
export async function getGrantedWebHidDevices(): Promise<WebHidTransport[]> {
  if (!isWebHidSupported()) return [];
  const devices = await navigator.hid.getDevices();
  return devices.map((d) => new WebHidTransport(d));
}
