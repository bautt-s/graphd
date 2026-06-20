// Decade-aware grid + axes. Grid spacing snaps to a power of 10 based on the
// camera distance, so a roughly constant number of lines is visible at any
// zoom. Tick labels rescale automatically. Math XY plane = three XZ (y=0);
// the vertical axis (three Y) is math Z.

import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../../state/store'
import { THEMES } from '../../lib/themes'

const LINES_PER_SIDE = 12 // grid extends N steps each way from center

function niceStep(dist: number): number {
  const raw = dist / 10
  const exp = Math.floor(Math.log10(raw))
  const base = Math.pow(10, exp)
  const m = raw / base
  const mult = m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10
  return mult * base
}

function fmt(v: number): string {
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a >= 1e4 || a < 1e-3) return v.toExponential(0)
  return parseFloat(v.toPrecision(4)).toString()
}

export function AxesGrid() {
  const scene = useStore((s) => s.scene)
  const theme = THEMES[scene.theme]
  const { camera } = useThree()
  const target = useStore((s) => s.camera.target)
  const [step, setStep] = useState(1)
  const centerRef = useRef<[number, number]>([0, 0])

  useFrame(() => {
    const t = new THREE.Vector3(target[0], target[1], target[2])
    const dist = camera.position.distanceTo(t)
    const s = niceStep(dist)
    // center grid on the target, snapped to step
    const cx = Math.round(t.x / s) * s
    const cz = Math.round(t.z / s) * s
    if (s !== step || cx !== centerRef.current[0] || cz !== centerRef.current[1]) {
      centerRef.current = [cx, cz]
      setStep(s)
    }
  })

  const [cx, cz] = centerRef.current
  const N = LINES_PER_SIDE
  const half = N * step

  const { minor, major } = useMemo(() => {
    const minorPts: number[] = []
    const majorPts: number[] = []
    for (let i = -N; i <= N; i++) {
      const x = cx + i * step
      const z = cz + i * step
      const arr = i % 5 === 0 ? majorPts : minorPts
      // lines parallel to z (varying x)
      arr.push(x, 0, cz - half, x, 0, cz + half)
      // lines parallel to x (varying z)
      arr.push(cx - half, 0, z, cx + half, 0, z)
    }
    return { minor: new Float32Array(minorPts), major: new Float32Array(majorPts) }
  }, [step, cx, cz, half, N])

  const axisLen = half * 1.05
  const labels = useMemo(() => {
    const out: Array<{ pos: [number, number, number]; text: string }> = []
    for (let i = -N; i <= N; i++) {
      if (i === 0 || i % 5 !== 0) continue
      const x = cx + i * step
      const z = cz + i * step
      out.push({ pos: [x, 0, cz], text: fmt(x) })
      out.push({ pos: [cx, 0, z], text: fmt(z) })
    }
    return out
  }, [step, cx, cz, N])

  const labelSize = step * 0.35

  return (
    <group>
      {scene.showGrid && (
        <>
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[minor, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color={theme.gridColor} transparent opacity={0.55} />
          </lineSegments>
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[major, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color={theme.gridColorMajor} />
          </lineSegments>
        </>
      )}

      {scene.showAxes && (
        <>
          <AxisLine a={[-axisLen, 0, 0]} b={[axisLen, 0, 0]} color={theme.axisX} />
          <AxisLine a={[0, 0, -axisLen]} b={[0, 0, axisLen]} color={theme.axisY} />
          <AxisLine a={[0, -axisLen, 0]} b={[0, axisLen, 0]} color={theme.axisZ} />
          {scene.showLabels && (
            <>
              <AxisLabel pos={[axisLen * 1.04, 0, 0]} text="x" color={theme.axisX} size={labelSize * 1.4} />
              <AxisLabel pos={[0, 0, axisLen * 1.04]} text="y" color={theme.axisY} size={labelSize * 1.4} />
              <AxisLabel pos={[0, axisLen * 1.04, 0]} text="z" color={theme.axisZ} size={labelSize * 1.4} />
            </>
          )}
        </>
      )}

      {scene.showLabels &&
        labels.map((l, i) => (
          <AxisLabel key={i} pos={l.pos} text={l.text} color={theme.textColor} size={labelSize} />
        ))}
    </group>
  )
}

function AxisLine({
  a,
  b,
  color,
}: {
  a: [number, number, number]
  b: [number, number, number]
  color: string
}) {
  const pts = useMemo(() => new Float32Array([...a, ...b]), [a, b])
  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} linewidth={2} />
    </lineSegments>
  )
}

function AxisLabel({
  pos,
  text,
  color,
  size,
}: {
  pos: [number, number, number]
  text: string
  color: string
  size: number
}) {
  return (
    <Billboard position={pos}>
      <Text fontSize={size} color={color} anchorX="center" anchorY="middle">
        {text}
      </Text>
    </Billboard>
  )
}
