// Presentational mesh for surface samples (z=f(x,y) and parametric surfaces).
// Reuses a single BufferGeometry; rebuilds index from validity on each sample.

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildSurfaceIndices } from '../../geometry/surfaceGeometry'
import type { PlotStyle, SurfaceSample } from '../../types'
import { applyVertexColors, surfaceMaterialProps } from './colors'

interface Props {
  sample: SurfaceSample | null
  style: PlotStyle
  visible: boolean
}

export function SurfaceMesh({ sample, style, visible }: Props) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    const g = geomRef.current
    if (!g || !sample) return
    g.setAttribute('position', new THREE.BufferAttribute(sample.positions, 3))
    g.setAttribute('normal', new THREE.BufferAttribute(sample.normals, 3))
    g.setIndex(new THREE.BufferAttribute(buildSurfaceIndices(sample.resolution, sample.valid), 1))
    applyVertexColors(g, sample.scalar, sample.scalarMin, sample.scalarMax, style.colormap)
    g.computeBoundingSphere()
    invalidate()
  }, [sample, style.colormap, invalidate])

  if (!sample) return null
  const mat = surfaceMaterialProps(style)
  return (
    <mesh visible={visible && (style.showSurface || style.wireframe)}>
      <bufferGeometry ref={geomRef} />
      <meshStandardMaterial key={style.colormap === 'none' ? 'flat' : 'vc'} {...mat} />
    </mesh>
  )
}
