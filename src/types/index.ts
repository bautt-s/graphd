// ---------------------------------------------------------------------------
// Graphd core data model
// ---------------------------------------------------------------------------
// `PlotObject` is a discriminated union over `kind`. The LaTeX strings are the
// source of truth (they round-trip into MathLive); compiled functions and
// sampled grids live only in memory and are recomputed on load.
// ---------------------------------------------------------------------------

export const SCHEMA_VERSION = 1

export type CoordSystem = 'cartesian' | 'polar' | 'cylindrical' | 'spherical'

export type PlotKind =
  | 'surface'
  | 'paramCurve'
  | 'paramSurface'
  | 'vectorField'
  | 'gradientField'
  | 'contour'
  | 'levelSet'

export interface Range {
  min: number
  max: number
}

export type ColormapName =
  | 'none'
  | 'viridis'
  | 'plasma'
  | 'turbo'
  | 'cool'
  | 'warm'
  | 'grayscale'

export interface PlotStyle {
  /** Primary color (hex). Used as flat color and as colormap base. */
  color: string
  /** Optional height/magnitude colormap; 'none' uses the flat color. */
  colormap: ColormapName
  opacity: number
  wireframe: boolean
  /** Render the filled surface (false = wireframe/points only). */
  showSurface: boolean
  /** Tube/line radius for curves and field arrows (world units, relative). */
  lineWidth: number
  metalness: number
  roughness: number
  flatShading: boolean
}

interface PlotBase {
  id: string
  label: string
  visible: boolean
  /** Grid resolution hint per axis (clamped by device tier at sample time). */
  resolution: number
  style: PlotStyle
}

export interface SurfacePlot extends PlotBase {
  kind: 'surface'
  /** Height field: z = f(x, y) (cartesian) or z = f(r, θ) (polar). */
  expr: string
  coords: 'cartesian' | 'polar'
  rangeU: Range // x or r
  rangeV: Range // y or θ
}

export interface ParamCurvePlot extends PlotBase {
  kind: 'paramCurve'
  exprX: string
  exprY: string
  exprZ: string
  rangeT: Range
}

export interface ParamSurfacePlot extends PlotBase {
  kind: 'paramSurface'
  exprX: string
  exprY: string
  exprZ: string
  rangeU: Range
  rangeV: Range
}

export interface VectorFieldPlot extends PlotBase {
  kind: 'vectorField'
  exprX: string
  exprY: string
  exprZ: string
  rangeX: Range
  rangeY: Range
  rangeZ: Range
  /** Arrows per axis. */
  density: number
  /** Normalize arrow length (color still encodes magnitude). */
  normalize: boolean
}

export interface GradientFieldPlot extends PlotBase {
  kind: 'gradientField'
  /** Scalar potential f(x, y, z); the field is ∇f computed symbolically. */
  expr: string
  rangeX: Range
  rangeY: Range
  rangeZ: Range
  density: number
  normalize: boolean
}

export interface ContourPlot extends PlotBase {
  kind: 'contour'
  /** f(x, y); level curves drawn via marching squares. */
  expr: string
  rangeX: Range
  rangeY: Range
  /** Number of evenly spaced levels. */
  levels: number
  /** Lift contours onto the z = f(x,y) surface instead of the floor. */
  lift: boolean
}

export interface LevelSetPlot extends PlotBase {
  kind: 'levelSet'
  /** f(x, y, z); the iso-surface f = level via marching cubes. */
  expr: string
  level: number
  rangeX: Range
  rangeY: Range
  rangeZ: Range
}

export type PlotObject =
  | SurfacePlot
  | ParamCurvePlot
  | ParamSurfacePlot
  | VectorFieldPlot
  | GradientFieldPlot
  | ContourPlot
  | LevelSetPlot

export type ThemeName = 'dark' | 'light' | 'blueprint' | 'print' | 'neon'

export type Projection = 'perspective' | 'orthographic'

export interface SceneSettings {
  theme: ThemeName
  showAxes: boolean
  showGrid: boolean
  showLabels: boolean
  showBox: boolean
  projection: Projection
  lightIntensity: number
  /** Auto-clip large |z| values to keep output clean. */
  autoClip: boolean
  clipValue: number
}

export interface CameraState {
  position: [number, number, number]
  target: [number, number, number]
}

export interface GraphState {
  version: number
  objects: PlotObject[]
  scene: SceneSettings
  camera: CameraState
}

// ---------------------------------------------------------------------------
// Sampling result shapes (worker → main thread, transferable buffers)
// ---------------------------------------------------------------------------

export interface SurfaceSample {
  kind: 'surface' | 'paramSurface'
  resolution: number
  positions: Float32Array // (res+1)^2 * 3
  normals: Float32Array
  /** Scalar per vertex used for colormap (height or v). */
  scalar: Float32Array
  scalarMin: number
  scalarMax: number
  /** True where the vertex is finite (for mesh splitting). */
  valid: Uint8Array
}

export interface CurveSample {
  kind: 'paramCurve'
  positions: Float32Array // segments * 3
  valid: Uint8Array
}

export interface VectorSample {
  kind: 'vectorField'
  /** origin xyz + direction xyz packed per arrow: count * 6 */
  data: Float32Array
  magnitudes: Float32Array
  magMin: number
  magMax: number
  count: number
}

export interface LineSetSample {
  kind: 'contour' | 'levelSet'
  /** flat line segments: pairs of points, n * 6, or triangles for levelSet */
  positions: Float32Array
  /** present for levelSet (triangle soup) */
  normals?: Float32Array
  isMesh: boolean
}

export type SampleResult =
  | SurfaceSample
  | CurveSample
  | VectorSample
  | LineSetSample
