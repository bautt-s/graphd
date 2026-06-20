// ---------------------------------------------------------------------------
// Marching squares: extract iso-lines from a scalar grid.
// Returns flat segments in the (x, y) math plane: [x1,y1,x2,y2, ...].
// ---------------------------------------------------------------------------

// case -> list of [edgeA, edgeB] segments. Edges: 0 top, 1 right, 2 bottom, 3 left.
const TABLE: number[][][] = [
  [], // 0
  [[3, 0]], // 1
  [[0, 1]], // 2
  [[3, 1]], // 3
  [[1, 2]], // 4
  [[3, 0], [1, 2]], // 5 saddle
  [[0, 2]], // 6
  [[3, 2]], // 7
  [[2, 3]], // 8
  [[2, 0]], // 9
  [[0, 1], [2, 3]], // 10 saddle
  [[2, 1]], // 11
  [[1, 3]], // 12
  [[1, 0]], // 13
  [[0, 3]], // 14
  [], // 15
]

export function marchingSquares(
  values: Float32Array,
  nx: number,
  ny: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  level: number,
): number[] {
  const out: number[] = []
  const X = (i: number) => xMin + ((xMax - xMin) * i) / (nx - 1)
  const Y = (j: number) => yMin + ((yMax - yMin) * j) / (ny - 1)

  const edgePoint = (
    edge: number,
    i: number,
    j: number,
    v0: number,
    v1: number,
    v2: number,
    v3: number,
  ): [number, number] => {
    let t: number
    switch (edge) {
      case 0:
        t = (level - v0) / (v1 - v0)
        return [X(i) + (X(i + 1) - X(i)) * t, Y(j)]
      case 1:
        t = (level - v1) / (v2 - v1)
        return [X(i + 1), Y(j) + (Y(j + 1) - Y(j)) * t]
      case 2:
        t = (level - v2) / (v3 - v2)
        return [X(i + 1) + (X(i) - X(i + 1)) * t, Y(j + 1)]
      default:
        t = (level - v3) / (v0 - v3)
        return [X(i), Y(j + 1) + (Y(j) - Y(j + 1)) * t]
    }
  }

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const v0 = values[j * nx + i]
      const v1 = values[j * nx + i + 1]
      const v2 = values[(j + 1) * nx + i + 1]
      const v3 = values[(j + 1) * nx + i]
      if (
        !Number.isFinite(v0) ||
        !Number.isFinite(v1) ||
        !Number.isFinite(v2) ||
        !Number.isFinite(v3)
      ) {
        continue
      }
      let c = 0
      if (v0 > level) c |= 1
      if (v1 > level) c |= 2
      if (v2 > level) c |= 4
      if (v3 > level) c |= 8
      const segs = TABLE[c]
      for (const [ea, eb] of segs) {
        const pa = edgePoint(ea, i, j, v0, v1, v2, v3)
        const pb = edgePoint(eb, i, j, v0, v1, v2, v3)
        out.push(pa[0], pa[1], pb[0], pb[1])
      }
    }
  }
  return out
}
