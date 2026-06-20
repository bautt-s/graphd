// Shareable-link contract: the full graph state lives in location.hash as
// `#g=<token>`. No backend required.

import type { GraphState } from '../types'
import { decodeState, encodeState } from './serialize'

const PARAM = 'g'

export function readStateFromUrl(): GraphState | null {
  const raw = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
  if (!raw) return null
  const token = new URLSearchParams(raw).get(PARAM)
  return token ? decodeState(token) : null
}

export function buildShareUrl(state: GraphState): string {
  const token = encodeState(state)
  const url = new URL(location.href)
  url.hash = `${PARAM}=${token}`
  return url.toString()
}

/** Update the address bar without adding a history entry. */
export function writeStateToUrl(state: GraphState): void {
  try {
    history.replaceState(null, '', buildShareUrl(state))
  } catch {
    /* token too long for some browsers — share button still works via copy */
  }
}
