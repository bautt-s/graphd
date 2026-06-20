// Presentational mesh for surface samples (z=f(x,y) and parametric surfaces).
// Builds a fresh BufferGeometry per sample via useMemo (declarative) and
// disposes the previous one — robust against ref-timing / stale-attribute bugs
// when the domain or resolution changes.

import { useEffect, useMemo } from 'react'
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
  const invalidate = useThree((s) => s.invalidate)

  const geometry = useMemo(() => {
    if (!sample) return null
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(sample.positions, 3))
    g.setAttribute('normal', new THREE.BufferAttribute(sample.normals, 3))
    g.setIndex(new THREE.BufferAttribute(buildSurfaceIndices(sample.resolution, sample.valid), 1))
    applyVertexColors(g, sample.scalar, sample.scalarMin, sample.scalarMax, style.colormap)
    g.computeBoundingSphere()
    return g
  }, [sample, style.colormap])

  useEffect(() => {
    if (geometry) invalidate()
    return () => geometry?.dispose()
  }, [geometry, invalidate])

  if (!geometry) return null
  const mat = surfaceMaterialProps(style)
  return (
    <mesh geometry={geometry} visible={visible && (style.showSurface || style.wireframe)}>
      <meshStandardMaterial key={style.colormap === 'none' ? 'flat' : 'vc'} {...mat} />
    </mesh>
  )
}
