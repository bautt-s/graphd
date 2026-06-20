// Named "saved graphs" gallery, persisted in localStorage (separate from the
// single autosave slot).

import { create } from 'zustand'
import { uid } from '../lib/download'

export interface SavedGraph {
  id: string
  name: string
  /** Compressed graph token (same format as the share URL). */
  token: string
  /** Small PNG data-URL thumbnail. */
  thumb?: string
  createdAt: number
}

const KEY = 'graphd:saves'

function read(): SavedGraph[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function write(list: SavedGraph[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* storage full */
  }
}

interface SavesStore {
  saves: SavedGraph[]
  add: (name: string, token: string, thumb?: string) => void
  remove: (id: string) => void
  rename: (id: string, name: string) => void
}

export const useSaves = create<SavesStore>((set, get) => ({
  saves: read(),
  add: (name, token, thumb) => {
    const entry: SavedGraph = { id: uid('s'), name, token, thumb, createdAt: Date.now() }
    const list = [entry, ...get().saves]
    write(list)
    set({ saves: list })
  },
  remove: (id) => {
    const list = get().saves.filter((s) => s.id !== id)
    write(list)
    set({ saves: list })
  },
  rename: (id, name) => {
    const list = get().saves.map((s) => (s.id === id ? { ...s, name } : s))
    write(list)
    set({ saves: list })
  },
}))
