// Instanced arrows for vector / gradient fields. One draw call.

import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { sampleColormap } from '../../lib/colormaps'
import type { PlotStyle, VectorSample } from '../../types'

interface Props {
  sample: VectorSample | null
  style: PlotStyle
  visible: boolean
  spacing: number
  normalize: boolean
}

function arrowGeometry(): THREE.BufferGeometry {
  const shaft = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8)
  shaft.translate(0, 0.35, 0)
  const head = new THREE.ConeGeometry(0.12, 0.3, 10)
  head.translate(0, 0.85, 0)
  return mergeGeometries([shaft, head])!
}

export function ArrowField({ sample, style, visible, spacing, normalize }: Props) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const geom = useMemo(() => arrowGeometry(), [])
  useEffect(() => () => geom.dispose(), [geom])

  const count = sample?.count ?? 0

  useEffect(() => {
    const mesh = ref.current
    if (!mesh || !sample) return
    const up = new THREE.Vector3(0, 1, 0)
    const unit = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    const m = new THREE.Matrix4()
    const col = new THREE.Color()
    const arrowLen = spacing * 0.85
    const t = arrowLen * 0.9
    const magSpan = sample.magMax - sample.magMin || 1
    const flat = new THREE.Color(style.color)

    for (let i = 0; i < sample.count; i++) {
      const o = i * 6
      const mag = sample.magnitudes[i]
      unit.set(sample.data[o + 3], sample.data[o + 4], sample.data[o + 5])
      let length = arrowLen
      if (mag < 1e-9) {
        scl.set(0, 0, 0)
        m.compose(pos.set(0, 0, 0), quat, scl)
        mesh.setMatrixAt(i, m)
        continue
      }
      if (!normalize) {
        unit.divideScalar(mag)
        length = arrowLen * Math.min(1.6, Math.max(0.15, mag / sample.magMax))
      }
      quat.setFromUnitVectors(up, unit)
      pos.set(sample.data[o], sample.data[o + 1], sample.data[o + 2])
      pos.addScaledVector(unit, -length / 2)
      scl.set(t, length, t)
      m.compose(pos, quat, scl)
      mesh.setMatrixAt(i, m)
      if (style.colormap !== 'none') {
        const [r, g, b] = sampleColormap(style.colormap, (mag - sample.magMin) / magSpan)
        col.setRGB(r, g, b)
        mesh.setColorAt(i, col)
      } else {
        mesh.setColorAt(i, flat)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
    invalidate()
  }, [sample, style.color, style.colormap, spacing, normalize, invalidate])

  if (!sample || count === 0) return null
  return (
    <instancedMesh
      ref={ref}
      key={count}
      args={[geom, undefined, count]}
      visible={visible}
    >
      <meshStandardMaterial
        roughness={style.roughness}
        metalness={style.metalness}
        transparent={style.opacity < 1}
        opacity={style.opacity}
      />
    </instancedMesh>
  )
}
