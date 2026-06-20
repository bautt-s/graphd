import { useMemo } from 'react'
import { latexToBody } from '../../math/compile'
import { tier } from '../../lib/deviceTier'
import type { ParamSurfacePlot as ParamSurfacePlotT, SurfaceSample } from '../../types'
import type { SampleJob } from '../../workers/protocol'
import { SurfaceMesh } from './SurfaceMesh'
import { useSampler, type Quality } from './useSampler'

export function ParamSurfacePlot({ obj }: { obj: ParamSurfacePlotT }) {
  const cx = useMemo(() => latexToBody(obj.exprX), [obj.exprX])
  const cy = useMemo(() => latexToBody(obj.exprY), [obj.exprY])
  const cz = useMemo(() => latexToBody(obj.exprZ), [obj.exprZ])
  const ok = cx.ok && cy.ok && cz.ok
  const fineRes = Math.min(obj.resolution, tier().maxSurfaceRes)

  const build = (q: Quality): SampleJob | null => {
    if (!cx.ok || !cy.ok || !cz.ok) return null
    const res = q === 'coarse' ? Math.min(32, fineRes) : fineRes
    return {
      kind: 'paramSurface',
      bodyX: cx.body,
      bodyY: cy.body,
      bodyZ: cz.body,
      uMin: obj.rangeU.min,
      uMax: obj.rangeU.max,
      vMin: obj.rangeV.min,
      vMax: obj.rangeV.max,
      res,
    }
  }

  const { result } = useSampler(build, [
    ok,
    cx.ok ? cx.body : '',
    cy.ok ? cy.body : '',
    cz.ok ? cz.body : '',
    obj.rangeU.min,
    obj.rangeU.max,
    obj.rangeV.min,
    obj.rangeV.max,
    fineRes,
  ])

  const sample = result && result.kind === 'paramSurface' ? (result as SurfaceSample) : null
  return <SurfaceMesh sample={sample} style={obj.style} visible={obj.visible} />
}
