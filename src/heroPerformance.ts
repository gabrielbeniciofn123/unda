/** Conservative quality hints, without user-agent or device-model detection. */
export function prefersLightHeroEffects() {
  const device = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return matchMedia('(max-width: 700px), (pointer: coarse)').matches
    || (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4)
    || (device.deviceMemory !== undefined && device.deviceMemory <= 4)
    || device.connection?.saveData === true;
}
