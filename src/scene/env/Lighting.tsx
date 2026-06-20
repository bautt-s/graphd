import { useStore } from '../../state/store'
import { THEMES } from '../../lib/themes'

export function Lighting() {
  const scene = useStore((s) => s.scene)
  const theme = THEMES[scene.theme]
  const k = scene.lightIntensity
  return (
    <>
      <ambientLight intensity={theme.ambient * k} />
      <hemisphereLight intensity={0.35 * k} groundColor="#202020" />
      <directionalLight position={[6, 12, 8]} intensity={1.1 * k} />
      <directionalLight position={[-8, 6, -6]} intensity={0.5 * k} />
    </>
  )
}
