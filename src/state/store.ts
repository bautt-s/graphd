import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  SCHEMA_VERSION,
  type CameraState,
  type GraphState,
  type PlotKind,
  type PlotObject,
  type PlotStyle,
  type SceneSettings,
} from '../types'
import { createObject, defaultCamera, defaultGraph } from './defaults'
import { readStateFromUrl } from './url'
import { loadLocal } from './persistence'

interface GraphdState {
  objects: PlotObject[]
  scene: SceneSettings
  camera: CameraState
  version: number
  // --- ui (not serialized) ---
  selectedId: string | null
  /** Bumped when the camera should be re-applied externally (load/reset). */
  cameraEpoch: number
  // --- actions ---
  addObject: (kind: PlotKind) => void
  updateObject: (id: string, patch: Record<string, unknown>) => void
  updateStyle: (id: string, patch: Partial<PlotStyle>) => void
  removeObject: (id: string) => void
  duplicateObject: (id: string) => void
  toggleVisible: (id: string) => void
  select: (id: string | null) => void
  setScene: (patch: Partial<SceneSettings>) => void
  setCamera: (cam: CameraState) => void
  resetCamera: () => void
  loadGraph: (g: GraphState) => void
  resetGraph: () => void
  getGraph: () => GraphState
}

function initialGraph(): GraphState {
  return readStateFromUrl() ?? loadLocal() ?? defaultGraph()
}

export const useStore = create<GraphdState>()(
  subscribeWithSelector((set, get) => {
    const init = initialGraph()
    return {
      objects: init.objects,
      scene: init.scene,
      camera: init.camera,
      version: SCHEMA_VERSION,
      selectedId: init.objects[0]?.id ?? null,
      cameraEpoch: 0,

      addObject: (kind) =>
        set((s) => {
          const obj = createObject(kind, s.objects.length)
          return { objects: [...s.objects, obj], selectedId: obj.id }
        }),

      updateObject: (id, patch) =>
        set((s) => ({
          objects: s.objects.map((o) =>
            o.id === id ? ({ ...o, ...patch } as PlotObject) : o,
          ),
        })),

      updateStyle: (id, patch) =>
        set((s) => ({
          objects: s.objects.map((o) =>
            o.id === id ? { ...o, style: { ...o.style, ...patch } } : o,
          ),
        })),

      removeObject: (id) =>
        set((s) => {
          const objects = s.objects.filter((o) => o.id !== id)
          const selectedId =
            s.selectedId === id ? (objects[0]?.id ?? null) : s.selectedId
          return { objects, selectedId }
        }),

      duplicateObject: (id) =>
        set((s) => {
          const src = s.objects.find((o) => o.id === id)
          if (!src) return s
          const copy = {
            ...structuredClone(src),
            id: `${src.id}-c${s.objects.length}`,
            label: `${src.label} (copia)`,
          }
          return { objects: [...s.objects, copy], selectedId: copy.id }
        }),

      toggleVisible: (id) =>
        set((s) => ({
          objects: s.objects.map((o) =>
            o.id === id ? { ...o, visible: !o.visible } : o,
          ),
        })),

      select: (id) => set({ selectedId: id }),

      setScene: (patch) => set((s) => ({ scene: { ...s.scene, ...patch } })),

      setCamera: (camera) => set({ camera }),

      resetCamera: () =>
        set((s) => ({ camera: defaultCamera(), cameraEpoch: s.cameraEpoch + 1 })),

      loadGraph: (g) =>
        set((s) => ({
          objects: g.objects,
          scene: g.scene,
          camera: g.camera,
          version: SCHEMA_VERSION,
          selectedId: g.objects[0]?.id ?? null,
          cameraEpoch: s.cameraEpoch + 1,
        })),

      resetGraph: () => {
        const g = defaultGraph()
        set((s) => ({
          objects: g.objects,
          scene: g.scene,
          camera: g.camera,
          selectedId: g.objects[0]?.id ?? null,
          cameraEpoch: s.cameraEpoch + 1,
        }))
      },

      getGraph: () => {
        const s = get()
        return {
          version: SCHEMA_VERSION,
          objects: s.objects,
          scene: s.scene,
          camera: s.camera,
        }
      },
    }
  }),
)
