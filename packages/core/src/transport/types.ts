/**
 * The only thing drivers know about the outside world. The web app backs it
 * with WebHID; a desktop build can back it with node-hid / hidapi instead
 * without touching a single driver.
 */
export interface HidTransport {
  readonly id: string;
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string;
  readonly collections: readonly HidCollection[];
  readonly opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: Uint8Array): Promise<void>;
  sendFeatureReport(reportId: number, data: Uint8Array): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<Uint8Array>;
  /** Subscribe to input reports. Returns an unsubscribe function. */
  onInputReport(listener: (reportId: number, data: Uint8Array) => void): () => void;
}

export interface HidCollection {
  usagePage: number;
  usage: number;
  inputReports: number[];
  outputReports: number[];
  featureReports: number[];
}

export const hasOutputReport = (t: HidTransport, reportId: number): boolean =>
  t.collections.some((c) => c.outputReports.includes(reportId));

export const hasUsagePage = (t: HidTransport, usagePage: number): boolean =>
  t.collections.some((c) => c.usagePage === usagePage);
