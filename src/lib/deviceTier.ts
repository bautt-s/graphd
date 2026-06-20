// Rough device capability tiering to cap grid resolution on weak hardware.

export interface DeviceTier {
  name: 'low' | 'mid' | 'high'
  maxSurfaceRes: number
  maxFieldDensity: number
  maxLevelSetRes: number
}

export function detectTier(): DeviceTier {
  const cores = navigator.hardwareConcurrency || 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const score = cores + mem
  if (score <= 6) {
    return { name: 'low', maxSurfaceRes: 96, maxFieldDensity: 6, maxLevelSetRes: 28 }
  }
  if (score <= 12) {
    return { name: 'mid', maxSurfaceRes: 180, maxFieldDensity: 9, maxLevelSetRes: 40 }
  }
  return { name: 'high', maxSurfaceRes: 256, maxFieldDensity: 12, maxLevelSetRes: 56 }
}

let _tier: DeviceTier | null = null
export function tier(): DeviceTier {
  if (!_tier) _tier = detectTier()
  return _tier
}
