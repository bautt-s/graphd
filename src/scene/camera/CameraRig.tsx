// OrbitControls + extreme-zoom handling: near/far planes track the camera
// distance every frame so depth precision holds from very close to very far
// (paired with logarithmicDepthBuffer on the Canvas).

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useStore } from '../../state/store'
import { useViewportBus } from '../../state/viewport'

export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const invalidate = useThree((s) => s.invalidate)
  const setCamera = useStore((s) => s.setCamera)
  const setZoom = useViewportBus((s) => s.setZoom)
  const epoch = useStore((s) => s.cameraEpoch)

  // Apply stored camera on load/reset (epoch bump).
  useEffect(() => {
    const cam = useStore.getState().camera
    camera.position.set(cam.position[0], cam.position[1], cam.position[2])
    if (controls.current) {
      controls.current.target.set(cam.target[0], cam.target[1], cam.target[2])
      controls.current.update()
    }
  }, [epoch, camera])

  useFrame(() => {
    const t = controls.current?.target ?? new THREE.Vector3()
    const dist = camera.position.distanceTo(t as THREE.Vector3)
    const cam = camera as THREE.PerspectiveCamera
    cam.near = Math.max(dist / 2000, 1e-4)
    cam.far = Math.max(dist * 2000, 100)
    cam.updateProjectionMatrix()
  })

  const persist = () => {
    const t = controls.current?.target
    setCamera({
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: t ? [t.x, t.y, t.z] : [0, 0, 0],
    })
  }

  // Expose a programmatic zoom for the toolbar / viewport buttons.
  useEffect(() => {
    const zoom = (factor: number) => {
      const t = controls.current?.target ?? new THREE.Vector3()
      const offset = camera.position.clone().sub(t as THREE.Vector3)
      offset.multiplyScalar(factor)
      camera.position.copy((t as THREE.Vector3).clone().add(offset))
      controls.current?.update()
      invalidate()
      persist()
    }
    setZoom(zoom)
    return () => setZoom(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, setZoom, invalidate])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1e-3}
      maxDistance={1e6}
      onEnd={persist}
    />
  )
}
