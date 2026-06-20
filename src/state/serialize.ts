// State <-> compressed token (fflate gzip + base64url). Verified smaller than
// lz-string for non-trivial payloads, and url-safe for the location hash.

import { gunzipSync, gzipSync, strFromU8, strToU8 } from 'fflate'
import type { GraphState } from '../types'
import { migrate } from './migrate'

function base64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function encodeState(state: GraphState): string {
  const json = JSON.stringify(state)
  const gz = gzipSync(strToU8(json), { level: 9 })
  return base64urlEncode(gz)
}

export function decodeState(token: string): GraphState | null {
  try {
    const gz = base64urlDecode(token)
    const json = strFromU8(gunzipSync(gz))
    return migrate(JSON.parse(json))
  } catch {
    return null
  }
}
