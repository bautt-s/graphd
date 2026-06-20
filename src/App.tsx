import { useAutosave } from './state/useAutosave'
import { useMediaQuery } from './hooks/useMediaQuery'
import { DesktopApp } from './components/DesktopApp'
import { MobileApp } from './components/MobileApp'

export default function App() {
  useAutosave()
  const isMobile = useMediaQuery('(max-width: 820px)')
  return isMobile ? <MobileApp /> : <DesktopApp />
}
