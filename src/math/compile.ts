// ---------------------------------------------------------------------------
// LaTeX -> transpiled JS body, using Compute Engine only for parsing.
// Compute Engine stays on the main thread; only the resulting body string
// (serializable) is shipped to workers.
// ---------------------------------------------------------------------------

import { ComputeEngine } from '@cortex-js/compute-engine'
import { transpile, TranspileError, type MathJson } from './transpile'
import { makeEvaluator, type ScopeFn } from './evalbuilder'

let _ce: ComputeEngine | null = null
function engine(): ComputeEngine {
  if (!_ce) _ce = new ComputeEngine()
  return _ce
}

export interface CompileOk {
  ok: true
  /** Transpiled JS expression body (references `_s.<var>`). */
  body: string
}
export interface CompileErr {
  ok: false
  error: string
}
export type CompileResult = CompileOk | CompileErr

/** If the parsed expression is `lhs = rhs`, keep only the right-hand side. */
function stripEquation(json: MathJson): MathJson {
  if (Array.isArray(json) && json[0] === 'Equal' && json.length >= 3) {
    return json[2]
  }
  if (
    typeof json === 'object' &&
    json !== null &&
    'fn' in json &&
    Array.isArray((json as { fn: MathJson[] }).fn)
  ) {
    const fn = (json as { fn: MathJson[] }).fn
    if (fn[0] === 'Equal' && fn.length >= 3) return fn[2]
  }
  return json
}

/** Parse LaTeX and transpile to a JS body string. */
export function latexToBody(latex: string): CompileResult {
  const src = latex.trim()
  if (!src) return { ok: false, error: 'Expresión vacía' }
  try {
    const expr = engine().parse(src)
    const json = stripEquation(expr.json as MathJson)
    const body = transpile(json)
    return { ok: true, body }
  } catch (e) {
    const msg =
      e instanceof TranspileError ? e.message : (e as Error).message ?? 'Error de sintaxis'
    return { ok: false, error: msg }
  }
}

/** Compile straight to a native evaluator (main-thread use, e.g. previews). */
export function compileLatex(
  latex: string,
): { ok: true; fn: ScopeFn; body: string } | CompileErr {
  const r = latexToBody(latex)
  if (!r.ok) return r
  try {
    return { ok: true, fn: makeEvaluator(r.body), body: r.body }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Validate a LaTeX expression for the given variables; returns null if ok. */
export function validateLatex(latex: string): string | null {
  const r = latexToBody(latex)
  return r.ok ? null : r.error
}
