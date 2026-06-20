import { useMemo } from 'react'
import { latexToBody } from '../../math/compile'
import { tier } from '../../lib/deviceTier'
import { useStore } from '../../state/store'
import type { SurfacePlot as SurfacePlotT, SurfaceSample } from '../../types'
import type { SampleJob } from '../../workers/protocol'
import { SurfaceMesh } from './SurfaceMesh'
import { useSampler, type Quality } from './useSampler'

export function SurfacePlot({ obj }: { obj: SurfacePlotT }) {
  const autoClip = useStore((s) => s.scene.autoClip)
  const clipValue = useStore((s) => s.scene.clipValue)
  const compiled = useMemo(() => latexToBody(obj.expr), [obj.expr])
  const fineRes = Math.min(obj.resolution, tier().maxSurfaceRes)
  const clip = autoClip ? clipValue : Infinity

  const build = (q: Quality): SampleJob | null => {
    if (!compiled.ok) return null
    const res = q === 'coarse' ? Math.min(40, fineRes) : fineRes
    return {
      kind: 'surface',
      body: compiled.body,
      coords: obj.coords,
      uMin: obj.rangeU.min,
      uMax: obj.rangeU.max,
      vMin: obj.rangeV.min,
      vMax: obj.rangeV.max,
      res,
      clip,
    }
  }

  const { result } = useSampler(build, [
    compiled.ok ? compiled.body : compiled.error,
    obj.coords,
    obj.rangeU.min,
    obj.rangeU.max,
    obj.rangeV.min,
    obj.rangeV.max,
    fineRes,
    clip,
  ])

  const sample = result && result.kind === 'surface' ? (result as SurfaceSample) : null
  return <SurfaceMesh sample={sample} style={obj.style} visible={obj.visible} />
}
