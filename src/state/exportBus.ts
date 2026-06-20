// Bridges the imperative export API (registered inside the R3F Canvas) to the
// DOM UI that lives outside the Canvas.

import { create } from 'zustand'

export interface PngOptions {
  scale: number
  transparent: boolean
}

export interface AnimOptions {
  durationSec: number
  fps: number
  scale: number
  /** Number of full turns over the duration (controls rotation speed). */
  rotations: number
  onProgress?: (p: number) => void
}

export interface ExportApi {
  exportPNG: (opts: PngOptions) => Promise<Blob | null>
  exportGIF: (opts: AnimOptions) => Promise<Blob | null>
  exportWebM: (opts: AnimOptions) => Promise<Blob | null>
}

interface ExportBus {
  api: ExportApi | null
  setApi: (api: ExportApi | null) => void
}

export const useExportBus = create<ExportBus>((set) => ({
  api: null,
  setApi: (api) => set({ api }),
}))
