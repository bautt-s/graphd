// ---------------------------------------------------------------------------
// Marching cubes: extract the iso-surface f(x,y,z) = level.
// Returns three-space triangle soup (positions + smooth normals from ∇f).
// Math (x,y,z) maps to three (x, z, y) so math-z is up.
// ---------------------------------------------------------------------------

import { edgeTable, triTable } from './mcTables'
import type { ScopeFn, Scope } from '../math/evalbuilder'

const CORNER: number[][] = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 1],
]
const EDGE: number[][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
]

export interface MeshResult {
  positions: Float32Array
  normals: Float32Array
}

export function marchingCubes(
  fn: ScopeFn,
  level: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  zMin: number,
  zMax: number,
  res: number,
): MeshResult {
  const n = res + 1
  const values = new Float32Array(n * n * n)
  const scope: Scope = {}
  const X = (i: number) => xMin + ((xMax - xMin) * i) / res
  const Y = (j: number) => yMin + ((yMax - yMin) * j) / res
  const Z = (k: number) => zMin + ((zMax - zMin) * k) / res
  const vIdx = (i: number, j: number, k: number) => (k * n + j) * n + i

  for (let k = 0; k < n; k++) {
    scope.z = Z(k)
    for (let j = 0; j < n; j++) {
      scope.y = Y(j)
      for (let i = 0; i < n; i++) {
        scope.x = X(i)
        const val = fn(scope)
        values[vIdx(i, j, k)] = Number.isFinite(val) ? val : NaN
      }
    }
  }

  const hx = (xMax - xMin) / res
  const hy = (yMax - yMin) / res
  const hz = (zMax - zMin) / res
  const gradAt = (mx: number, my: number, mz: number): [number, number, number] => {
    scope.x = mx + hx
    scope.y = my
    scope.z = mz
    const fxp = fn(scope)
    scope.x = mx - hx
    const fxm = fn(scope)
    scope.x = mx
    scope.y = my + hy
    const fyp = fn(scope)
    scope.y = my - hy
    const fym = fn(scope)
    scope.y = my
    scope.z = mz + hz
    const fzp = fn(scope)
    scope.z = mz - hz
    const fzm = fn(scope)
    return [(fxp - fxm) / (2 * hx), (fyp - fym) / (2 * hy), (fzp - fzm) / (2 * hz)]
  }

  const pos: number[] = []
  const nor: number[] = []
  const cVal = new Array(8)
  const cPos: number[][] = Array.from({ length: 8 }, () => [0, 0, 0])
  const vert: number[][] = Array.from({ length: 12 }, () => [0, 0, 0])

  for (let k = 0; k < res; k++) {
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        let cubeIndex = 0
        let bad = false
        for (let c = 0; c < 8; c++) {
          const gi = i + CORNER[c][0]
          const gj = j + CORNER[c][1]
          const gk = k + CORNER[c][2]
          const val = values[vIdx(gi, gj, gk)]
          if (!Number.isFinite(val)) {
            bad = true
            break
          }
          cVal[c] = val
          cPos[c][0] = X(gi)
          cPos[c][1] = Y(gj)
          cPos[c][2] = Z(gk)
          if (val < level) cubeIndex |= 1 << c
        }
        if (bad) continue
        const edges = edgeTable[cubeIndex]
        if (edges === 0) continue
        for (let e = 0; e < 12; e++) {
          if (edges & (1 << e)) {
            const a = EDGE[e][0]
            const b = EDGE[e][1]
            const va = cVal[a]
            const vb = cVal[b]
            const denom = vb - va
            const mu = Math.abs(denom) < 1e-12 ? 0.5 : (level - va) / denom
            vert[e][0] = cPos[a][0] + mu * (cPos[b][0] - cPos[a][0])
            vert[e][1] = cPos[a][1] + mu * (cPos[b][1] - cPos[a][1])
            vert[e][2] = cPos[a][2] + mu * (cPos[b][2] - cPos[a][2])
          }
        }
        const tris = triTable[cubeIndex]
        for (let t = 0; t < tris.length; t += 3) {
          for (let w = 0; w < 3; w++) {
            const v = vert[tris[t + w]]
            // math (x,y,z) -> three (x, z, y)
            pos.push(v[0], v[2], v[1])
            const g = gradAt(v[0], v[1], v[2])
            let nx = g[0]
            let ny = g[2]
            let nz = g[1]
            const len = Math.hypot(nx, ny, nz) || 1
            nx /= len
            ny /= len
            nz /= len
            nor.push(nx, ny, nz)
          }
        }
      }
    }
  }

  return { positions: new Float32Array(pos), normals: new Float32Array(nor) }
}
