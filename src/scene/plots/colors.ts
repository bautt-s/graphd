// Vertex-color computation from a scalar attribute + colormap.
// Runs once per sample (not per frame).

import * as THREE from 'three'
import { sampleColormap } from '../../lib/colormaps'
import type { ColormapName, PlotStyle } from '../../types'

export function applyVertexColors(
  geometry: THREE.BufferGeometry,
  scalar: Float32Array,
  smin: number,
  smax: number,
  colormap: ColormapName,
): void {
  if (colormap === 'none') {
    geometry.deleteAttribute('color')
    return
  }
  const n = scalar.length
  const colors = new Float32Array(n * 3)
  const span = smax - smin || 1
  for (let i = 0; i < n; i++) {
    const t = (scalar[i] - smin) / span
    const [r, g, b] = sampleColormap(colormap, t)
    colors[i * 3] = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

/** Standard-material props shared by surfaces and meshes. */
export function surfaceMaterialProps(style: PlotStyle): {
  color: string
  vertexColors: boolean
  transparent: boolean
  opacity: number
  metalness: number
  roughness: number
  flatShading: boolean
  wireframe: boolean
  side: THREE.Side
} {
  return {
    color: style.colormap === 'none' ? style.color : '#ffffff',
    vertexColors: style.colormap !== 'none',
    transparent: style.opacity < 1,
    opacity: style.opacity,
    metalness: style.metalness,
    roughness: style.roughness,
    flatShading: style.flatShading,
    wireframe: style.wireframe,
    side: THREE.DoubleSide,
  }
}
