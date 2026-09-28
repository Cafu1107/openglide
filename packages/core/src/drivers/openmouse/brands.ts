import type { Capabilities } from '../../types';

type Feature = keyof Capabilities;

const BASE: Feature[] = ['dpi', 'pollingRates', 'liftOff'];
const REMAP: Feature[] = [...BASE, 'buttons'];

/**
 * Brand families covered by @openmouse/protocol 0.18.0, for the support page.
 * "buttons" marks families whose driver can change button assignments.
 * What a specific mouse offers is decided at connect time from its driver.
 */
export const OPENMOUSE_BRANDS: { brand: string; models: string; features: Feature[]; notes?: string }[] = [
  { brand: 'ATK', models: 'A9 family (A9 Plus, A9 Mini +), X1 Pro Max, F1 Ultimate, R1 family', features: [...BASE, 'angleSnapping', 'rippleControl', 'motionSync', 'debounce', 'sleepTimeout'], notes: 'Button assignments are shown read-only.' },
  { brand: 'VXE', models: 'R1 family (Beken)', features: [...BASE, 'motionSync', 'sleepTimeout'] },
  { brand: 'VGN', models: 'Dragonfly F2 family', features: REMAP },
  { brand: 'Razer', models: 'Viper, Viper Mini, Viper V4 Pro, Cobra and other supported models', features: [...BASE, 'buttons', 'lighting', 'battery'] },
  { brand: 'Logitech', models: 'HID++ 2.0 mice incl. onboard profiles', features: [...BASE, 'battery'] },
  { brand: 'Pulsar', models: 'Pulsar protocol mice incl. XS1 and Pro series; GravaStar', features: [...REMAP, 'motionSync', 'debounce'] },
  { brand: 'Lamzu', models: 'Atlantis and other Lamzu-protocol mice', features: REMAP },
  { brand: 'CRDRAKO', models: 'Lamzu-based models', features: BASE },
  { brand: 'Attack Shark / Lingbao', models: 'X11 and GearHub-protocol mice', features: REMAP },
  { brand: 'Endgame Gear', models: 'OP1 8k, XM2 8k, wireless series', features: BASE, notes: 'Button assignments are shown read-only.' },
  { brand: 'G-Wolves', models: 'HSK Pro / Plus / ACE, Fenrir family, XVI', features: REMAP },
  { brand: 'WLMouse', models: 'Beast X 4K and other WLmouse models', features: [...BASE, 'motionSync'] },
  { brand: 'Finalmouse', models: 'Supported Finalmouse models', features: BASE },
  { brand: 'SteelSeries', models: 'Rival 3, Rival 3 Wireless, Rival 310, Rival 650, Aerox 3/5/9, Prime+, Prime Mini Wireless, Sensei Ten', features: [...BASE, 'lighting'] },
  { brand: 'Corsair', models: 'Supported Corsair mice', features: BASE },
  { brand: 'HyperX', models: 'Supported HyperX mice', features: BASE },
  { brand: 'Glorious', models: 'Model O / D / I (classic) and newer Glorious-protocol mice', features: [...BASE, 'lighting'] },
  { brand: 'ASUS', models: 'Supported ROG mice', features: BASE },
  { brand: 'Keychron', models: 'M6, 4K series, Nape Pro', features: BASE },
  { brand: 'MCHOSE', models: 'A5 Pro Max, dock and V3-protocol mice', features: REMAP },
  { brand: 'Incott', models: 'Incott 8K wireless and supported models', features: REMAP },
  { brand: 'K-snake', models: 'Supported K-snake mice', features: REMAP },
  { brand: 'Teevolution', models: 'Supported Teevolution mice', features: REMAP },
  { brand: 'Dareu', models: 'A950 PRO and supported models', features: REMAP },
  { brand: 'Motospeed', models: 'X6 and supported models', features: BASE },
  { brand: 'Redragon', models: 'Supported Redragon mice', features: BASE },
  { brand: 'Fantech', models: 'Supported Fantech mice', features: BASE },
  { brand: 'Ninjutso', models: 'Sora V2 / V3, TEN family', features: BASE },
  { brand: 'Orbital', models: 'Supported Orbital mice', features: BASE },
  { brand: 'RAWM', models: 'Supported RAWM mice', features: BASE },
  { brand: 'VAXEE', models: 'Supported VAXEE mice', features: BASE },
  { brand: 'Microsoft', models: 'Supported IntelliMouse models', features: BASE },
  { brand: 'Zaunkoenig', models: 'Supported Zaunkoenig mice', features: BASE },
  { brand: 'moddoMOUSE', models: 'Supported models', features: BASE },
  { brand: 'WALLHACK', models: 'Supported models', features: BASE },
  { brand: 'Wooting', models: 'Analog devices (read-only)', features: [] },
  { brand: 'Delux', models: 'M800 Mini / M600 Pro', features: BASE },
  { brand: 'Ryunix', models: 'Kyu Pro MX1', features: BASE },
  { brand: 'GravaStar', models: 'Pulsar-protocol GravaStar mice', features: BASE },
];
