// ---------------------------------------------------------------------------
// Pure surface builders: evaluate a grid into packed attribute arrays.
// Used inside the sampler worker. Index buffers are built separately (they
// depend on vertex validity and can change with clipping).
// ---------------------------------------------------------------------------

import type { ScopeFn, Scope } from '../math/evalbuilder'
import type { SurfaceSample } from '../types'

function computeGridNormals(
  positions: Float32Array,
  nu: number,
  nv: number,
  out: Float32Array,
): void {
  const idx = (i: number, j: number) => (j * nu + i) * 3
  const ax = [0, 0, 0]
  const bx = [0, 0, 0]
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const i0 = i > 0 ? i - 1 : i
      const i1 = i < nu - 1 ? i + 1 : i
      const j0 = j > 0 ? j - 1 : j
      const j1 = j < nv - 1 ? j + 1 : j
      const a = idx(i1, j)
      const b = idx(i0, j)
      const c = idx(i, j1)
      const d = idx(i, j0)
      ax[0] = positions[a] - positions[b]
      ax[1] = positions[a + 1] - positions[b + 1]
      ax[2] = positions[a + 2] - positions[b + 2]
      bx[0] = positions[c] - positions[d]
      bx[1] = positions[c + 1] - positions[d + 1]
      bx[2] = positions[c + 2] - positions[d + 2]
      // n = ax × bx
      let nx = ax[1] * bx[2] - ax[2] * bx[1]
      let ny = ax[2] * bx[0] - ax[0] * bx[2]
      let nz = ax[0] * bx[1] - ax[1] * bx[0]
      const len = Math.hypot(nx, ny, nz) || 1
      nx /= len
      ny /= len
      nz /= len
      const o = idx(i, j)
      out[o] = nx
      out[o + 1] = ny
      out[o + 2] = nz
    }
  }
}

interface HeightOpts {
  fn: ScopeFn
  varU: string
  varV: string
  uMin: number
  uMax: number
  vMin: number
  vMax: number
  res: number
  polar: boolean
  clip: number // |height| beyond this -> invalid (Infinity to disable)
}

/** Height field z = f(u, v); cartesian or polar ground mapping. */
export function buildHeightSurface(o: HeightOpts): SurfaceSample {
  const n = o.res + 1
  const count = n * n
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const scalar = new Float32Array(count)
  const valid = new Uint8Array(count)
  const scope: Scope = {}
  let smin = Infinity
  let smax = -Infinity
  let k = 0
  for (let j = 0; j < n; j++) {
    const v = o.vMin + ((o.vMax - o.vMin) * j) / o.res
    for (let i = 0; i < n; i++) {
      const u = o.uMin + ((o.uMax - o.uMin) * i) / o.res
      scope[o.varU] = u
      scope[o.varV] = v
      let h = o.fn(scope)
      let gx: number
      let gz: number
      if (o.polar) {
        gx = u * Math.cos(v)
        gz = u * Math.sin(v)
      } else {
        gx = u
        gz = v
      }
      const finite = Number.isFinite(h) && Math.abs(h) <= o.clip
      if (!finite) {
        valid[k] = 0
        h = Number.isFinite(h) ? Math.sign(h) * o.clip : 0
      } else {
        valid[k] = 1
        if (h < smin) smin = h
        if (h > smax) smax = h
      }
      const p = k * 3
      positions[p] = gx
      positions[p + 1] = h
      positions[p + 2] = gz
      scalar[k] = h
      k++
    }
  }
  if (smin > smax) {
    smin = 0
    smax = 1
  }
  computeGridNormals(positions, n, n, normals)
  return {
    kind: 'surface',
    resolution: o.res,
    positions,
    normals,
    scalar,
    scalarMin: smin,
    scalarMax: smax,
    valid,
  }
}

interface ParamOpts {
  fx: ScopeFn
  fy: ScopeFn
  fz: ScopeFn
  uMin: number
  uMax: number
  vMin: number
  vMax: number
  res: number
}

/** Parametric surface r(u, v) = (x, y, z). */
export function buildParamSurface(o: ParamOpts): SurfaceSample {
  const n = o.res + 1
  const count = n * n
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const scalar = new Float32Array(count)
  const valid = new Uint8Array(count)
  const scope: Scope = {}
  let smin = Infinity
  let smax = -Infinity
  let k = 0
  for (let j = 0; j < n; j++) {
    const v = o.vMin + ((o.vMax - o.vMin) * j) / o.res
    for (let i = 0; i < n; i++) {
      const u = o.uMin + ((o.uMax - o.uMin) * i) / o.res
      scope.u = u
      scope.v = v
      // math (x, y, z=height) -> three (x, height, y)
      const mx = o.fx(scope)
      const my = o.fy(scope)
      const mz = o.fz(scope)
      const finite = Number.isFinite(mx) && Number.isFinite(my) && Number.isFinite(mz)
      valid[k] = finite ? 1 : 0
      const p = k * 3
      positions[p] = finite ? mx : 0
      positions[p + 1] = finite ? mz : 0
      positions[p + 2] = finite ? my : 0
      scalar[k] = finite ? mz : 0
      if (finite) {
        if (mz < smin) smin = mz
        if (mz > smax) smax = mz
      }
      k++
    }
  }
  if (smin > smax) {
    smin = 0
    smax = 1
  }
  computeGridNormals(positions, n, n, normals)
  return {
    kind: 'paramSurface',
    resolution: o.res,
    positions,
    normals,
    scalar,
    scalarMin: smin,
    scalarMax: smax,
    valid,
  }
}

/** Build triangle indices for an (res+1)² grid, skipping invalid quads. */
export function buildSurfaceIndices(res: number, valid: Uint8Array): Uint32Array {
  const n = res + 1
  const out: number[] = []
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const a = j * n + i
      const b = a + 1
      const c = a + n
      const d = c + 1
      if (valid[a] && valid[b] && valid[c] && valid[d]) {
        out.push(a, c, b, b, c, d)
      }
    }
  }
  return new Uint32Array(out)
}
