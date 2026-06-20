import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { latexToBody } from '../../math/compile'
import { tier } from '../../lib/deviceTier'
import { sampleColormap } from '../../lib/colormaps'
import type { LevelSetPlot as LevelSetPlotT, LineSetSample } from '../../types'
import type { SampleJob } from '../../workers/protocol'
import { surfaceMaterialProps } from './colors'
import { useSampler, type Quality } from './useSampler'

export function LevelSetPlot({ obj }: { obj: LevelSetPlotT }) {
  const compiled = useMemo(() => latexToBody(obj.expr), [obj.expr])
  const fineRes = Math.min(obj.resolution, tier().maxLevelSetRes)
  const invalidate = useThree((s) => s.invalidate)

  const build = (q: Quality): SampleJob | null => {
    if (!compiled.ok) return null
    const res = q === 'coarse' ? Math.min(20, fineRes) : fineRes
    return {
      kind: 'levelSet',
      body: compiled.body,
      level: obj.level,
      xMin: obj.rangeX.min,
      xMax: obj.rangeX.max,
      yMin: obj.rangeY.min,
      yMax: obj.rangeY.max,
      zMin: obj.rangeZ.min,
      zMax: obj.rangeZ.max,
      res,
    }
  }

  const { result } = useSampler(build, [
    compiled.ok ? compiled.body : compiled.error,
    obj.level,
    obj.rangeX.min,
    obj.rangeX.max,
    obj.rangeY.min,
    obj.rangeY.max,
    obj.rangeZ.min,
    obj.rangeZ.max,
    fineRes,
  ])

  const sample = result && result.kind === 'levelSet' ? (result as LineSetSample) : null

  const geometry = useMemo(() => {
    if (!sample || !sample.normals) return null
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(sample.positions, 3))
    g.setAttribute('normal', new THREE.BufferAttribute(sample.normals, 3))
    if (obj.style.colormap !== 'none') {
      const pos = sample.positions
      const n = pos.length / 3
      let ymin = Infinity
      let ymax = -Infinity
      for (let i = 0; i < n; i++) {
        const y = pos[i * 3 + 1]
        if (y < ymin) ymin = y
        if (y > ymax) ymax = y
      }
      const span = ymax - ymin || 1
      const colors = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        const [r, gg, b] = sampleColormap(obj.style.colormap, (pos[i * 3 + 1] - ymin) / span)
        colors[i * 3] = r
        colors[i * 3 + 1] = gg
        colors[i * 3 + 2] = b
      }
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }
    g.computeBoundingSphere()
    return g
  }, [sample, obj.style.colormap])

  useEffect(() => {
    if (geometry) invalidate()
    return () => geometry?.dispose()
  }, [geometry, invalidate])

  if (!geometry) return null
  const mat = surfaceMaterialProps(obj.style)
  return (
    <mesh geometry={geometry} visible={obj.visible}>
      <meshStandardMaterial key={obj.style.colormap === 'none' ? 'flat' : 'vc'} {...mat} />
    </mesh>
  )
}
