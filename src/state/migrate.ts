// Schema migration / validation. Currently only v1; merges defaults so older
// or partial payloads load safely.

import { SCHEMA_VERSION, type GraphState } from '../types'
import { defaultCamera, defaultScene } from './defaults'

export function migrate(raw: Partial<GraphState> | null): GraphState | null {
  if (!raw || !Array.isArray(raw.objects)) return null
  return {
    version: SCHEMA_VERSION,
    objects: raw.objects,
    scene: { ...defaultScene(), ...(raw.scene ?? {}) },
    camera: { ...defaultCamera(), ...(raw.camera ?? {}) },
  }
}
