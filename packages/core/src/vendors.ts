/** Well-known USB vendor IDs of mouse manufacturers. */
export const VENDORS: Record<number, string> = {
  0x046d: 'Logitech',
  0x1532: 'Razer',
  0x1038: 'SteelSeries',
  0x1b1c: 'Corsair',
  0x0b05: 'ASUS',
  0x03f0: 'HP / HyperX',
  0x0951: 'Kingston / HyperX',
  0x1e7d: 'ROCCAT',
  0x045e: 'Microsoft',
  0x258a: 'SinoWealth (Glorious, Pulsar, …)',
  0x3554: 'Compx (VGN, ATK, …)',
  0x373b: 'ATK',
  0x093a: 'PixArt',
  0x3434: 'Keychron',
  0x0c45: 'Microdia',
  0x2717: 'Xiaomi',
};

export const vendorName = (vendorId: number): string =>
  VENDORS[vendorId] ?? `Vendor 0x${vendorId.toString(16).padStart(4, '0')}`;
