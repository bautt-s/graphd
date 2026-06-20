import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { latexToBody } from '../../math/compile'
import { tier } from '../../lib/deviceTier'
import type { ContourPlot as ContourPlotT, LineSetSample } from '../../types'
import type { SampleJob } from '../../workers/protocol'
import { useSampler, type Quality } from './useSampler'

export function ContourPlot({ obj }: { obj: ContourPlotT }) {
  const compiled = useMemo(() => latexToBody(obj.expr), [obj.expr])
  const fineRes = Math.min(obj.resolution, tier().maxSurfaceRes)
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const invalidate = useThree((s) => s.invalidate)

  const build = (q: Quality): SampleJob | null => {
    if (!compiled.ok) return null
    const res = q === 'coarse' ? Math.min(60, fineRes) : fineRes
    return {
      kind: 'contour',
      body: compiled.body,
      xMin: obj.rangeX.min,
      xMax: obj.rangeX.max,
      yMin: obj.rangeY.min,
      yMax: obj.rangeY.max,
      res,
      levels: obj.levels,
      lift: obj.lift,
    }
  }

  const { result } = useSampler(build, [
    compiled.ok ? compiled.body : compiled.error,
    obj.rangeX.min,
    obj.rangeX.max,
    obj.rangeY.min,
    obj.rangeY.max,
    fineRes,
    obj.levels,
    obj.lift,
  ])

  const sample = result && result.kind === 'contour' ? (result as LineSetSample) : null

  useEffect(() => {
    const g = geomRef.current
    if (!g || !sample) return
    g.setAttribute('position', new THREE.BufferAttribute(sample.positions, 3))
    g.computeBoundingSphere()
    invalidate()
  }, [sample, invalidate])

  if (!sample) return null
  return (
    <lineSegments visible={obj.visible}>
      <bufferGeometry ref={geomRef} />
      <lineBasicMaterial
        color={obj.style.color}
        transparent={obj.style.opacity < 1}
        opacity={obj.style.opacity}
      />
    </lineSegments>
  )
}
