// Factory functions for default objects, styles, scene and camera.

import { uid } from '../lib/download'
import {
  SCHEMA_VERSION,
  type CameraState,
  type GraphState,
  type PlotKind,
  type PlotObject,
  type PlotStyle,
  type SceneSettings,
} from '../types'

export const PALETTE = [
  '#7c5cff',
  '#ff6b6b',
  '#4dd07a',
  '#ffb454',
  '#36c5f0',
  '#ff4ecd',
  '#a0e426',
  '#ff8f6b',
]

export function defaultStyle(color: string): PlotStyle {
  return {
    color,
    colormap: 'none',
    opacity: 1,
    wireframe: false,
    showSurface: true,
    lineWidth: 1,
    metalness: 0.1,
    roughness: 0.65,
    flatShading: false,
  }
}

export function defaultScene(): SceneSettings {
  return {
    theme: 'dark',
    showAxes: true,
    showGrid: true,
    showLabels: true,
    showBox: false,
    projection: 'perspective',
    lightIntensity: 1,
    autoClip: true,
    clipValue: 50,
  }
}

export function defaultCamera(): CameraState {
  return {
    position: [9, 7, 11],
    target: [0, 0, 0],
  }
}

const r = (min: number, max: number) => ({ min, max })

/** Create a fresh object of the given kind with sensible defaults. */
export function createObject(kind: PlotKind, colorIndex: number): PlotObject {
  const color = PALETTE[colorIndex % PALETTE.length]
  const base = {
    id: uid(),
    visible: true,
    style: defaultStyle(color),
  }
  switch (kind) {
    case 'surface':
      return {
        ...base,
        kind: 'surface',
        label: 'Superficie',
        expr: '\\sin(x)\\cos(y)',
        coords: 'cartesian',
        rangeU: r(-5, 5),
        rangeV: r(-5, 5),
        resolution: 96,
        style: { ...base.style, colormap: 'viridis' },
      }
    case 'paramCurve':
      return {
        ...base,
        kind: 'paramCurve',
        label: 'Curva',
        exprX: '\\cos(t)',
        exprY: '\\sin(t)',
        exprZ: 't/3',
        rangeT: r(0, 18),
        resolution: 400,
        style: { ...base.style, lineWidth: 2 },
      }
    case 'paramSurface':
      return {
        ...base,
        kind: 'paramSurface',
        label: 'Sup. paramétrica',
        exprX: '\\cos(u)(3+\\cos(v))',
        exprY: '\\sin(u)(3+\\cos(v))',
        exprZ: '\\sin(v)',
        rangeU: r(0, 6.2831853),
        rangeV: r(0, 6.2831853),
        resolution: 80,
        style: { ...base.style, colormap: 'plasma' },
      }
    case 'vectorField':
      return {
        ...base,
        kind: 'vectorField',
        label: 'Campo vectorial',
        exprX: '-y',
        exprY: 'x',
        exprZ: '0',
        rangeX: r(-4, 4),
        rangeY: r(-4, 4),
        rangeZ: r(-4, 4),
        density: 7,
        normalize: true,
        resolution: 7,
        style: { ...base.style, colormap: 'turbo', lineWidth: 1 },
      }
    case 'gradientField':
      return {
        ...base,
        kind: 'gradientField',
        label: 'Gradiente',
        expr: 'x^2+y^2+z^2',
        rangeX: r(-4, 4),
        rangeY: r(-4, 4),
        rangeZ: r(-4, 4),
        density: 6,
        normalize: true,
        resolution: 6,
        style: { ...base.style, colormap: 'turbo' },
      }
    case 'contour':
      return {
        ...base,
        kind: 'contour',
        label: 'Contornos',
        expr: 'x^2-y^2',
        rangeX: r(-5, 5),
        rangeY: r(-5, 5),
        levels: 14,
        lift: false,
        resolution: 120,
        style: { ...base.style, lineWidth: 1.5 },
      }
    case 'levelSet':
      return {
        ...base,
        kind: 'levelSet',
        label: 'Conjunto de nivel',
        expr: 'x^2+y^2+z^2',
        level: 9,
        rangeX: r(-4, 4),
        rangeY: r(-4, 4),
        rangeZ: r(-4, 4),
        resolution: 40,
        style: { ...base.style, colormap: 'viridis', roughness: 0.5 },
      }
  }
}

export function defaultGraph(): GraphState {
  return {
    version: SCHEMA_VERSION,
    objects: [createObject('surface', 0)],
    scene: defaultScene(),
    camera: defaultCamera(),
  }
}
