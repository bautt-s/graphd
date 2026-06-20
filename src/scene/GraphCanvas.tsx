import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useStore } from '../state/store'
import { SceneRoot } from './SceneRoot'

export function GraphCanvas() {
  const initial = useStore.getState().camera
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      gl={{
        logarithmicDepthBuffer: true,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: false,
      }}
      camera={{ position: initial.position, fov: 50, near: 0.01, far: 5000 }}
    >
      <Suspense fallback={null}>
        <SceneRoot />
      </Suspense>
    </Canvas>
  )
}
