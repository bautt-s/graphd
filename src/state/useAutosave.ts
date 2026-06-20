// Debounced sync of graph state to localStorage and the URL hash.

import { useEffect } from 'react'
import { shallow } from 'zustand/shallow'
import { useStore } from './store'
import { saveLocal } from './persistence'
import { writeStateToUrl } from './url'

export function useAutosave() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const unsub = useStore.subscribe(
      (s) => [s.objects, s.scene, s.camera] as const,
      () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          const g = useStore.getState().getGraph()
          saveLocal(g)
          writeStateToUrl(g)
        }, 500)
      },
      { equalityFn: shallow },
    )
    return () => {
      clearTimeout(timer)
      unsub()
    }
  }, [])
}
