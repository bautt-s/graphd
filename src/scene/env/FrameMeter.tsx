// Measures real frame rate / frame time and publishes it to the telemetry
// store for the status bar. In demand mode this updates while the scene is
// actively rendering (interaction, animation) and holds otherwise.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTelemetry } from '../../state/viewport'

export function FrameMeter() {
  const setStats = useTelemetry((s) => s.setStats)
  const last = useRef(performance.now())
  const acc = useRef(0)
  const frames = useRef(0)
  const report = useRef(performance.now())

  useFrame(() => {
    const now = performance.now()
    const dt = now - last.current
    last.current = now
    // Ignore long idle gaps so the readout stays believable.
    if (dt < 200) {
      acc.current += dt
      frames.current++
    }
    if (now - report.current >= 400 && frames.current > 0) {
      const fps = Math.min(144, Math.round(frames.current / ((now - report.current) / 1000)))
      const ms = Math.round((acc.current / frames.current) * 10) / 10
      setStats(fps, ms)
      frames.current = 0
      acc.current = 0
      report.current = now
    }
  })
  return null
}
