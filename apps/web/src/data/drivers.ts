/**
 * Official configuration software per brand. Every link points to the
 * manufacturer's own site — OpenGlide never re-hosts installers.
 * Links were verified 2026-09. Please open a PR when one moves.
 */
export type Platform = 'windows' | 'macos' | 'linux' | 'web';

export interface DriverLink {
  brand: string;
  software: string;
  url: string;
  /** Browser-based configurator, if the brand offers one. */
  webUrl?: string;
  platforms: Platform[];
  color: string;
  /** OpenGlide can already configure some of this brand's mice. */
  openglide?: boolean;
  note?: string;
}

export const DRIVER_LINKS: DriverLink[] = [
  { brand: 'Logitech G', software: 'G HUB', url: 'https://www.logitechg.com/en-us/software/ghub', platforms: ['windows', 'macos'], color: '#00b8fc', openglide: true },
  { brand: 'Logitech', software: 'Logi Options+', url: 'https://www.logitech.com/en-us/software/logi-options-plus', platforms: ['windows', 'macos'], color: '#00b8fc', note: 'Productivity mice (MX series).' },
  { brand: 'Razer', software: 'Synapse 4', url: 'https://www.razer.com/synapse-4', platforms: ['windows'], color: '#44d62c' },
  { brand: 'SteelSeries', software: 'SteelSeries GG', url: 'https://steelseries.com/gg', platforms: ['windows', 'macos'], color: '#ff5200' },
  { brand: 'Corsair', software: 'iCUE', url: 'https://www.corsair.com/us/en/s/icue', platforms: ['windows', 'macos'], color: '#ece81a' },
  { brand: 'ASUS ROG', software: 'Armoury Crate', url: 'https://www.asus.com/supportonly/armoury%20crate/helpdesk_download/', platforms: ['windows'], color: '#ff1e3c' },
  { brand: 'HyperX', software: 'NGENUITY', url: 'https://hyperx.com/pages/ngenuity', platforms: ['windows'], color: '#e21836' },
  { brand: 'Glorious', software: 'Glorious CORE', url: 'https://www.gloriousgaming.com/pages/software', platforms: ['windows'], color: '#f0f0f0' },
  { brand: 'Pulsar', software: 'Pulsar Fusion', url: 'https://www.pulsar.gg/pages/download', platforms: ['windows'], color: '#ff3c3c' },
  { brand: 'ZOWIE', software: 'Support & firmware', url: 'https://zowie.benq.com/en-us/support.html', platforms: ['windows'], color: '#d71e33', note: 'Most ZOWIE mice are driverless; settings live on the mouse.' },
  { brand: 'Endgame Gear', software: 'Configuration software', url: 'https://endgamegear.com/pages/downloads', platforms: ['windows'], color: '#ff6a00' },
  { brand: 'Lamzu', software: 'Lamzu driver', url: 'https://lamzu.com/pages/download', platforms: ['windows'], color: '#9d7bff' },
  { brand: 'Finalmouse', software: 'XPANEL', url: 'https://xpanel.finalmouse.com/', webUrl: 'https://xpanel.finalmouse.com/', platforms: ['web'], color: '#e8e8e8' },
  { brand: 'Keychron', software: 'Keychron Launcher', url: 'https://launcher.keychron.com/', webUrl: 'https://launcher.keychron.com/', platforms: ['web'], color: '#ff7a00' },
  { brand: 'ATK / VXE', software: 'ATK HUB', url: 'https://www.atk.store/pages/atk-hub/', webUrl: 'https://hub.atk.pro/', platforms: ['windows', 'web'], color: '#3fa9ff' },
  { brand: 'WLmouse', software: 'WLmouse driver', url: 'https://www.wlmouse.com/pages/download', platforms: ['windows'], color: '#7dd3fc' },
  { brand: 'Ninjutso', software: 'Ninjutso driver', url: 'https://ninjutso.com/pages/download', platforms: ['windows'], color: '#f43f5e' },
  { brand: 'Turtle Beach / ROCCAT', software: 'Swarm II', url: 'https://support.turtlebeach.com/s/downloads?language=en_US', platforms: ['windows'], color: '#00a3e0' },
  { brand: 'Cooler Master', software: 'MasterPlus+', url: 'https://www.coolermaster.com/en-global/masterplus.html', platforms: ['windows'], color: '#8b5cf6' },
  { brand: 'Microsoft', software: 'Mouse and Keyboard Center', url: 'https://support.microsoft.com/en-us/topic/mouse-and-keyboard-center-download-f5b10905-7887-eedb-2f1c-d0737a36a3b2', platforms: ['windows'], color: '#00a4ef' },
  { brand: 'HP OMEN', software: 'OMEN Gaming Hub', url: 'https://www.hp.com/us-en/gaming-pc/omen-gaming-hub.html', platforms: ['windows'], color: '#e11d48' },
  { brand: 'Redragon', software: 'Redragon software', url: 'https://redragonshop.com/pages/software', platforms: ['windows'], color: '#dc2626' },
  { brand: 'Cherry Xtrfy', software: 'Support & software', url: 'https://cherryxtrfy.com/', platforms: ['windows'], color: '#ef4444' },
  { brand: 'Dareu', software: 'Dareu driver', url: 'https://dareu.com/', platforms: ['windows'], color: '#f97316', note: 'Drivers are listed on each product page.' },
  { brand: 'Sharkoon', software: 'Sharkoon software', url: 'https://www.sharkoon.com/', platforms: ['windows'], color: '#22c55e', note: 'Drivers are listed on each product page.' },
  { brand: 'Rampage', software: 'Rampage sürücüleri', url: 'https://www.rampage.com.tr/', platforms: ['windows'], color: '#ef4444', note: 'Drivers are listed on each product page.' },
  { brand: 'Everest', software: 'Everest sürücüleri', url: 'https://www.everest.com.tr/', platforms: ['windows'], color: '#3b82f6', note: 'Drivers are listed on each product page.' },
];
