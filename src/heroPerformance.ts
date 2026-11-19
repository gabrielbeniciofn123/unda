export const HERO_LIGHT_MEDIA = '(max-width: 767px), (pointer: coarse)';

type DeviceHints = Navigator & {
  deviceMemory?: number;
  connection?: EventTarget & { saveData?: boolean; effectiveType?: string };
};

export function heroConnection() {
  return (navigator as DeviceHints).connection;
}

function prefersLightDeviceEffects() {
  const device = navigator as DeviceHints;
  const connection = heroConnection();
  return (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4)
    || (device.deviceMemory !== undefined && device.deviceMemory <= 4)
    || connection?.saveData === true
    || connection?.effectiveType === 'slow-2g'
    || connection?.effectiveType === '2g';
}

export function prefersLightHeroEffects() {
  return matchMedia(HERO_LIGHT_MEDIA).matches || prefersLightDeviceEffects();
}

export type HeroQuality = 'full' | 'balanced' | 'compact' | 'low';
export const HERO_QUALITY = {
  full: { rows: 208, sides: 56, dpr: 1.75, pixels: 2400000, transmission: .6, fps: 30, doubleSided: true },
  balanced: { rows: 176, sides: 48, dpr: 1.5, pixels: 1600000, transmission: .5, fps: 30, doubleSided: true },
  compact: { rows: 128, sides: 40, dpr: 2, pixels: 1000000, transmission: .4, fps: 24, doubleSided: true },
  low: { rows: 112, sides: 32, dpr: 1.25, pixels: 650000, transmission: .3, fps: 20, doubleSided: false },
} as const;

export function heroQuality(): HeroQuality {
  if (prefersLightDeviceEffects()) return 'low';
  if (matchMedia('(max-width: 1024px), (pointer: coarse)').matches) return 'compact';
  if (innerWidth >= 1600 && navigator.hardwareConcurrency >= 8) return 'full';
  return 'balanced';
}
