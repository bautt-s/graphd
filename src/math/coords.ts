// ---------------------------------------------------------------------------
// Coordinate-system helpers.
//
// Axis convention: three.js is y-up, but math "height" is z. We map math
// (x, y, z) -> three (x, z, y) so the height axis points up. Ground plane is
// three XZ (= math XY); the vertical axis is three Y (= math Z).
// ---------------------------------------------------------------------------

import type { CoordSystem } from '../types'

/** Canonical (ascii) scope variable names a surface height-field reads. */
export function surfaceVars(coords: 'cartesian' | 'polar'): [string, string] {
  return coords === 'polar' ? ['r', 'theta'] : ['x', 'y']
}

/** Pretty labels for UI. */
export function surfaceVarLabels(coords: 'cartesian' | 'polar'): [string, string] {
  return coords === 'polar' ? ['r', 'θ'] : ['x', 'y']
}

export function coordLabel(c: CoordSystem): string {
  switch (c) {
    case 'cartesian':
      return 'Cartesianas (x, y)'
    case 'polar':
      return 'Polares (r, θ)'
    case 'cylindrical':
      return 'Cilíndricas (r, θ, z)'
    case 'spherical':
      return 'Esféricas (ρ, θ, φ)'
  }
}

/** Map math-space (x, y, z=height) to three-space (x, height, y). */
export function toThree(x: number, y: number, height: number): [number, number, number] {
  return [x, height, y]
}
