// localStorage autosave of the same compressed token used for sharing.

import type { GraphState } from '../types'
import { decodeState, encodeState } from './serialize'

const KEY = 'graphd:autosave'

export function saveLocal(state: GraphState): void {
  try {
    localStorage.setItem(KEY, encodeState(state))
  } catch {
    /* storage full or unavailable */
  }
}

export function loadLocal(): GraphState | null {
  try {
    const token = localStorage.getItem(KEY)
    return token ? decodeState(token) : null
  } catch {
    return null
  }
}
