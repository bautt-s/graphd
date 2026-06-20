import { Suspense, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useStore } from '../state/store'
import { THEMES } from '../lib/themes'
import { Lighting } from './env/Lighting'
import { AxesGrid } from './env/AxesGrid'
import { CameraRig } from './camera/CameraRig'
import { PlotObjects } from './plots/PlotObjects'
import { ExportController } from './export/ExportController'
import { FrameMeter } from './env/FrameMeter'

/** Force a redraw whenever scene settings change (frameloop is on demand). */
function SceneInvalidator() {
  const invalidate = useThree((s) => s.invalidate)
  const scene = useStore((s) => s.scene)
  useEffect(() => {
    invalidate()
  }, [scene, invalidate])
  return null
}

export function SceneRoot() {
  const themeName = useStore((s) => s.scene.theme)
  const theme = THEMES[themeName]
  return (
    <>
      <color attach="background" args={[theme.background]} />
      <SceneInvalidator />
      <Lighting />
      {/* Isolated so async font loading for axis labels never blanks the scene */}
      <Suspense fallback={null}>
        <AxesGrid />
      </Suspense>
      <PlotObjects />
      <CameraRig />
      <ExportController />
      <FrameMeter />
    </>
  )
}
