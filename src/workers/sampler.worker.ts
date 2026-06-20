/// <reference lib="webworker" />
// ---------------------------------------------------------------------------
// Sampler worker: receives a job (with transpiled JS bodies), builds native
// evaluators, computes geometry, and posts back transferable buffers.
// Compute Engine is NOT imported here — only the tiny evalbuilder.
// ---------------------------------------------------------------------------

import { makeEvaluator, type Scope, type ScopeFn } from '../math/evalbuilder'
import {
  buildHeightSurface,
  buildParamSurface,
} from '../geometry/surfaceGeometry'
import { marchingSquares } from '../geometry/marchingSquares'
import { marchingCubes } from '../geometry/marchingCubes'
import type {
  SampleJob,
  WorkerRequest,
  WorkerResponse,
} from './protocol'
import type {
  CurveSample,
  LineSetSample,
  SampleResult,
  VectorSample,
} from '../types'

function transfers(r: SampleResult): Transferable[] {
  const t: Transferable[] = []
  for (const v of Object.values(r)) {
    if (ArrayBuffer.isView(v)) t.push(v.buffer)
  }
  return t
}

function buildCurve(j: Extract<SampleJob, { kind: 'paramCurve' }>): CurveSample {
  const fx = makeEvaluator(j.bodyX)
  const fy = makeEvaluator(j.bodyY)
  const fz = makeEvaluator(j.bodyZ)
  const n = j.res + 1
  const positions = new Float32Array(n * 3)
  const valid = new Uint8Array(n)
  const scope: Scope = {}
  for (let i = 0; i < n; i++) {
    const t = j.tMin + ((j.tMax - j.tMin) * i) / j.res
    scope.t = t
    const mx = fx(scope)
    const my = fy(scope)
    const mz = fz(scope)
    const ok = Number.isFinite(mx) && Number.isFinite(my) && Number.isFinite(mz)
    valid[i] = ok ? 1 : 0
    const p = i * 3
    // math (x,y,z) -> three (x, z, y)
    positions[p] = ok ? mx : 0
    positions[p + 1] = ok ? mz : 0
    positions[p + 2] = ok ? my : 0
  }
  return { kind: 'paramCurve', positions, valid }
}

function buildVectorData(
  fx: ScopeFn,
  fy: ScopeFn,
  fz: ScopeFn,
  j: {
    xMin: number
    xMax: number
    yMin: number
    yMax: number
    zMin: number
    zMax: number
    density: number
    normalize: boolean
  },
): VectorSample {
  const d = Math.max(2, j.density)
  const count = d * d * d
  const data = new Float32Array(count * 6)
  const magnitudes = new Float32Array(count)
  const scope: Scope = {}
  let magMin = Infinity
  let magMax = -Infinity
  let idx = 0
  const span = (min: number, max: number, i: number) =>
    d === 1 ? (min + max) / 2 : min + ((max - min) * i) / (d - 1)
  for (let kz = 0; kz < d; kz++) {
    const z = span(j.zMin, j.zMax, kz)
    for (let ky = 0; ky < d; ky++) {
      const y = span(j.yMin, j.yMax, ky)
      for (let kx = 0; kx < d; kx++) {
        const x = span(j.xMin, j.xMax, kx)
        scope.x = x
        scope.y = y
        scope.z = z
        let vx = fx(scope)
        let vy = fy(scope)
        let vz = fz(scope)
        if (!Number.isFinite(vx)) vx = 0
        if (!Number.isFinite(vy)) vy = 0
        if (!Number.isFinite(vz)) vz = 0
        const mag = Math.hypot(vx, vy, vz)
        if (mag < magMin) magMin = mag
        if (mag > magMax) magMax = mag
        if (j.normalize && mag > 1e-9) {
          vx /= mag
          vy /= mag
          vz /= mag
        }
        const o = idx * 6
        // origin three (x, z, y), dir three (vx, vz, vy)
        data[o] = x
        data[o + 1] = z
        data[o + 2] = y
        data[o + 3] = vx
        data[o + 4] = vz
        data[o + 5] = vy
        magnitudes[idx] = mag
        idx++
      }
    }
  }
  if (magMin > magMax) {
    magMin = 0
    magMax = 1
  }
  return {
    kind: 'vectorField',
    data,
    magnitudes,
    magMin,
    magMax,
    count,
  }
}

function buildGradientData(
  j: Extract<SampleJob, { kind: 'gradientField' }>,
): VectorSample {
  const f = makeEvaluator(j.body)
  const hx = (j.xMax - j.xMin) / 100 || 1e-3
  const hy = (j.yMax - j.yMin) / 100 || 1e-3
  const hz = (j.zMax - j.zMin) / 100 || 1e-3
  const scope: Scope = {}
  const grad = (axis: 0 | 1 | 2, x: number, y: number, z: number): number => {
    scope.x = x
    scope.y = y
    scope.z = z
    if (axis === 0) {
      scope.x = x + hx
      const a = f(scope)
      scope.x = x - hx
      const b = f(scope)
      return (a - b) / (2 * hx)
    }
    if (axis === 1) {
      scope.y = y + hy
      const a = f(scope)
      scope.y = y - hy
      const b = f(scope)
      return (a - b) / (2 * hy)
    }
    scope.z = z + hz
    const a = f(scope)
    scope.z = z - hz
    const b = f(scope)
    return (a - b) / (2 * hz)
  }
  const fx: ScopeFn = (s) => grad(0, s.x, s.y, s.z)
  const fy: ScopeFn = (s) => grad(1, s.x, s.y, s.z)
  const fz: ScopeFn = (s) => grad(2, s.x, s.y, s.z)
  return buildVectorData(fx, fy, fz, j)
}

function buildContour(
  j: Extract<SampleJob, { kind: 'contour' }>,
): LineSetSample {
  const f = makeEvaluator(j.body)
  const n = j.res + 1
  const values = new Float32Array(n * n)
  const scope: Scope = {}
  let vmin = Infinity
  let vmax = -Infinity
  for (let jy = 0; jy < n; jy++) {
    const y = j.yMin + ((j.yMax - j.yMin) * jy) / j.res
    for (let ix = 0; ix < n; ix++) {
      const x = j.xMin + ((j.xMax - j.xMin) * ix) / j.res
      scope.x = x
      scope.y = y
      const v = f(scope)
      values[jy * n + ix] = Number.isFinite(v) ? v : NaN
      if (Number.isFinite(v)) {
        if (v < vmin) vmin = v
        if (v > vmax) vmax = v
      }
    }
  }
  // Evenly spaced interior levels between the field's min and max.
  const levelValues: number[] = []
  const k = Math.max(1, j.levels)
  if (vmin < vmax) {
    for (let i = 1; i <= k; i++) levelValues.push(vmin + ((vmax - vmin) * i) / (k + 1))
  }
  const segs: number[] = []
  for (const level of levelValues) {
    const lines = marchingSquares(
      values,
      n,
      n,
      j.xMin,
      j.xMax,
      j.yMin,
      j.yMax,
      level,
    )
    // lines: [x1,y1,x2,y2,...] in math plane
    for (let i = 0; i < lines.length; i += 4) {
      const h = j.lift ? level : 0
      // math (x,y,height) -> three (x, height, y)
      segs.push(lines[i], h, lines[i + 1])
      segs.push(lines[i + 2], h, lines[i + 3])
    }
  }
  return { kind: 'contour', positions: new Float32Array(segs), isMesh: false }
}

function buildLevelSet(
  j: Extract<SampleJob, { kind: 'levelSet' }>,
): LineSetSample {
  const f = makeEvaluator(j.body)
  const mesh = marchingCubes(
    f,
    j.level,
    j.xMin,
    j.xMax,
    j.yMin,
    j.yMax,
    j.zMin,
    j.zMax,
    j.res,
  )
  return {
    kind: 'levelSet',
    positions: mesh.positions,
    normals: mesh.normals,
    isMesh: true,
  }
}

function run(job: SampleJob): SampleResult {
  switch (job.kind) {
    case 'surface':
      return buildHeightSurface({
        fn: makeEvaluator(job.body),
        varU: job.coords === 'polar' ? 'r' : 'x',
        varV: job.coords === 'polar' ? 'theta' : 'y',
        uMin: job.uMin,
        uMax: job.uMax,
        vMin: job.vMin,
        vMax: job.vMax,
        res: job.res,
        polar: job.coords === 'polar',
        clip: job.clip,
      })
    case 'paramSurface':
      return buildParamSurface({
        fx: makeEvaluator(job.bodyX),
        fy: makeEvaluator(job.bodyY),
        fz: makeEvaluator(job.bodyZ),
        uMin: job.uMin,
        uMax: job.uMax,
        vMin: job.vMin,
        vMax: job.vMax,
        res: job.res,
      })
    case 'paramCurve':
      return buildCurve(job)
    case 'vectorField':
      return buildVectorData(
        makeEvaluator(job.bodyX),
        makeEvaluator(job.bodyY),
        makeEvaluator(job.bodyZ),
        job,
      )
    case 'gradientField':
      return buildGradientData(job)
    case 'contour':
      return buildContour(job)
    case 'levelSet':
      return buildLevelSet(job)
  }
}

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  const { reqId, job } = ev.data
  try {
    const result = run(job)
    const res: WorkerResponse = { reqId, ok: true, result }
    ;(self as DedicatedWorkerGlobalScope).postMessage(res, transfers(result))
  } catch (e) {
    const res: WorkerResponse = {
      reqId,
      ok: false,
      error: (e as Error).message ?? 'Error de muestreo',
    }
    ;(self as DedicatedWorkerGlobalScope).postMessage(res)
  }
}
