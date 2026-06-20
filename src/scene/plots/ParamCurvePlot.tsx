import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { latexToBody } from '../../math/compile'
import { tier } from '../../lib/deviceTier'
import type { CurveSample, ParamCurvePlot as ParamCurvePlotT } from '../../types'
import type { SampleJob } from '../../workers/protocol'
import { useSampler, type Quality } from './useSampler'

export function ParamCurvePlot({ obj }: { obj: ParamCurvePlotT }) {
  const cx = useMemo(() => latexToBody(obj.exprX), [obj.exprX])
  const cy = useMemo(() => latexToBody(obj.exprY), [obj.exprY])
  const cz = useMemo(() => latexToBody(obj.exprZ), [obj.exprZ])
  const ok = cx.ok && cy.ok && cz.ok
  const fineRes = Math.min(obj.resolution, tier().maxSurfaceRes * 8)
  const invalidate = useThree((s) => s.invalidate)

  const build = (q: Quality): SampleJob | null => {
    if (!cx.ok || !cy.ok || !cz.ok) return null
    const res = q === 'coarse' ? Math.min(120, fineRes) : fineRes
    return {
      kind: 'paramCurve',
      bodyX: cx.body,
      bodyY: cy.body,
      bodyZ: cz.body,
      tMin: obj.rangeT.min,
      tMax: obj.rangeT.max,
      res,
    }
  }

  const { result } = useSampler(build, [
    ok,
    cx.ok ? cx.body : '',
    cy.ok ? cy.body : '',
    cz.ok ? cz.body : '',
    obj.rangeT.min,
    obj.rangeT.max,
    fineRes,
  ])

  const geometry = useMemo(() => {
    if (!result || result.kind !== 'paramCurve') return null
    const s = result as CurveSample
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < s.valid.length; i++) {
      if (s.valid[i]) {
        const p = i * 3
        pts.push(new THREE.Vector3(s.positions[p], s.positions[p + 1], s.positions[p + 2]))
      }
    }
    if (pts.length < 2) return null
    const curve = new THREE.CatmullRomCurve3(pts)
    const radius = 0.025 * Math.max(0.3, obj.style.lineWidth)
    const tube = new THREE.TubeGeometry(curve, Math.min(2000, pts.length * 2), radius, 10, false)
    invalidate()
    return tube
  }, [result, obj.style.lineWidth, invalidate])

  useEffect(() => () => geometry?.dispose(), [geometry])

  if (!geometry) return null
  return (
    <mesh geometry={geometry} visible={obj.visible}>
      <meshStandardMaterial
        color={obj.style.color}
        roughness={obj.style.roughness}
        metalness={obj.style.metalness}
        transparent={obj.style.opacity < 1}
        opacity={obj.style.opacity}
      />
    </mesh>
  )
}
