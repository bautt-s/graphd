// Bridges DOM viewport controls (zoom buttons) and live telemetry (fps/ms)
// between the R3F scene and the surrounding DOM chrome.

import { create } from 'zustand'

interface Telemetry {
  fps: number
  ms: number
  setStats: (fps: number, ms: number) => void
}

export const useTelemetry = create<Telemetry>((set) => ({
  fps: 60,
  ms: 0,
  setStats: (fps, ms) => set({ fps, ms }),
}))

type ZoomFn = (factor: number) => void

interface ViewportBus {
  zoom: ZoomFn | null
  setZoom: (z: ZoomFn | null) => void
}

export const useViewportBus = create<ViewportBus>((set) => ({
  zoom: null,
  setZoom: (zoom) => set({ zoom }),
}))
