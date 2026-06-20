// Message protocol between the main thread and the sampler worker.
// Jobs carry transpiled JS bodies (strings) — never closures.

import type { SampleResult } from '../types'

export interface SurfaceJob {
  kind: 'surface'
  body: string
  coords: 'cartesian' | 'polar'
  uMin: number
  uMax: number
  vMin: number
  vMax: number
  res: number
  clip: number
}

export interface ParamSurfaceJob {
  kind: 'paramSurface'
  bodyX: string
  bodyY: string
  bodyZ: string
  uMin: number
  uMax: number
  vMin: number
  vMax: number
  res: number
}

export interface ParamCurveJob {
  kind: 'paramCurve'
  bodyX: string
  bodyY: string
  bodyZ: string
  tMin: number
  tMax: number
  res: number
}

export interface VectorJob {
  kind: 'vectorField'
  bodyX: string
  bodyY: string
  bodyZ: string
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zMin: number
  zMax: number
  density: number
  normalize: boolean
}

export interface GradientJob {
  kind: 'gradientField'
  body: string
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zMin: number
  zMax: number
  density: number
  normalize: boolean
}

export interface ContourJob {
  kind: 'contour'
  body: string
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  res: number
  levels: number
  lift: boolean
}

export interface LevelSetJob {
  kind: 'levelSet'
  body: string
  level: number
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zMin: number
  zMax: number
  res: number
}

export type SampleJob =
  | SurfaceJob
  | ParamSurfaceJob
  | ParamCurveJob
  | VectorJob
  | GradientJob
  | ContourJob
  | LevelSetJob

export interface WorkerRequest {
  reqId: number
  job: SampleJob
}

export interface WorkerResponse {
  reqId: number
  ok: boolean
  result?: SampleResult
  error?: string
}
