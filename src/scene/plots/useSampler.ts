// Adaptive sampling hook: requests a coarse sample immediately for instant
// feedback, then a fine sample after a short idle. Stale results are dropped.

import { useEffect, useRef, useState } from 'react'
import { getPool } from '../../workers/pool'
import type { SampleJob } from '../../workers/protocol'
import type { SampleResult } from '../../types'

export type Quality = 'coarse' | 'fine'

interface SamplerState {
  result: SampleResult | null
  busy: boolean
}

const IDLE_MS = 160

export function useSampler(
  buildJob: (q: Quality) => SampleJob | null,
  deps: unknown[],
): SamplerState {
  const [state, setState] = useState<SamplerState>({ result: null, busy: false })
  const token = useRef(0)

  useEffect(() => {
    const pool = getPool()
    const my = ++token.current
    let cancelled = false

    const coarse = buildJob('coarse')
    if (!coarse) {
      setState({ result: null, busy: false })
      return
    }
    setState((s) => ({ ...s, busy: true }))

    pool
      .sample(coarse)
      .then((r) => {
        if (!cancelled && token.current === my) {
          setState((s) => ({ ...s, result: r }))
        }
      })
      .catch(() => {
        if (!cancelled && token.current === my) setState({ result: null, busy: false })
      })

    const timer = setTimeout(() => {
      const fine = buildJob('fine')
      if (!fine || cancelled || token.current !== my) return
      pool
        .sample(fine)
        .then((r) => {
          if (!cancelled && token.current === my) setState({ result: r, busy: false })
        })
        .catch(() => {
          if (!cancelled && token.current === my) setState((s) => ({ ...s, busy: false }))
        })
    }, IDLE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
