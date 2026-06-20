// ---------------------------------------------------------------------------
// Worker pool: round-robins sampling jobs across a small set of workers.
// Each worker handles one job at a time; extra jobs queue.
// ---------------------------------------------------------------------------

import SamplerWorker from './sampler.worker?worker'
import type { SampleJob, WorkerRequest, WorkerResponse } from './protocol'
import type { SampleResult } from '../types'

interface Pending {
  resolve: (r: SampleResult) => void
  reject: (e: Error) => void
}

interface QueueItem {
  job: SampleJob
  pending: Pending
}

class WorkerPool {
  private workers: Worker[] = []
  private busy: Set<Worker> = new Set()
  private inflight = new Map<number, Pending>()
  private queue: QueueItem[] = []
  private reqCounter = 0

  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      const w = new SamplerWorker()
      w.onmessage = (ev: MessageEvent<WorkerResponse>) => this.onMessage(w, ev.data)
      w.onerror = (ev) => this.onError(w, ev)
      this.workers.push(w)
    }
  }

  sample(job: SampleJob): Promise<SampleResult> {
    return new Promise<SampleResult>((resolve, reject) => {
      this.queue.push({ job, pending: { resolve, reject } })
      this.pump()
    })
  }

  private freeWorker(): Worker | null {
    for (const w of this.workers) if (!this.busy.has(w)) return w
    return null
  }

  private pump(): void {
    while (this.queue.length) {
      const w = this.freeWorker()
      if (!w) return
      const item = this.queue.shift()!
      const reqId = ++this.reqCounter
      this.busy.add(w)
      this.inflight.set(reqId, item.pending)
      const req: WorkerRequest = { reqId, job: item.job }
      ;(w as Worker & { _reqId?: number })._reqId = reqId
      w.postMessage(req)
    }
  }

  private onMessage(w: Worker, data: WorkerResponse): void {
    this.busy.delete(w)
    const p = this.inflight.get(data.reqId)
    this.inflight.delete(data.reqId)
    if (p) {
      if (data.ok && data.result) p.resolve(data.result)
      else p.reject(new Error(data.error ?? 'Error de muestreo'))
    }
    this.pump()
  }

  private onError(w: Worker, ev: ErrorEvent): void {
    this.busy.delete(w)
    const reqId = (w as Worker & { _reqId?: number })._reqId
    if (reqId != null) {
      const p = this.inflight.get(reqId)
      this.inflight.delete(reqId)
      p?.reject(new Error(ev.message))
    }
    this.pump()
  }
}

let _pool: WorkerPool | null = null

export function getPool(): WorkerPool {
  if (!_pool) {
    const cores = navigator.hardwareConcurrency || 4
    const size = Math.max(1, Math.min(4, cores - 1))
    _pool = new WorkerPool(size)
  }
  return _pool
}
