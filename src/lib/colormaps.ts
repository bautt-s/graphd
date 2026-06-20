// Multi-stop colormaps. `sampleColormap` returns [r,g,b] in 0..1.

import type { ColormapName } from '../types'

type RGB = [number, number, number]

function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const STOPS: Record<Exclude<ColormapName, 'none'>, RGB[]> = {
  viridis: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'].map(hex),
  plasma: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921'].map(hex),
  turbo: ['#30123b', '#4675ed', '#26d07c', '#fabc2c', '#7a0403'].map(hex),
  cool: ['#00e5ff', '#5a8dff', '#ff2bd6'].map(hex),
  warm: ['#ffe16b', '#ff7b54', '#c81d4e'].map(hex),
  grayscale: ['#16181f', '#9aa0ad', '#f2f4f8'].map(hex),
}

export function sampleColormap(name: Exclude<ColormapName, 'none'>, t: number): RGB {
  const stops = STOPS[name]
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1)
  const i = Math.floor(x)
  const f = x - i
  if (i >= stops.length - 1) return stops[stops.length - 1]
  const a = stops[i]
  const b = stops[i + 1]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

/** CSS gradient preview string for a colormap (for UI swatches). */
export function colormapCss(name: Exclude<ColormapName, 'none'>): string {
  const stops = STOPS[name]
  const parts = stops.map((c, i) => {
    const pct = Math.round((i / (stops.length - 1)) * 100)
    return `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(
      c[2] * 255,
    )}) ${pct}%`
  })
  return `linear-gradient(90deg, ${parts.join(', ')})`
}
