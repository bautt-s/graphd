// ---------------------------------------------------------------------------
// MathJSON -> JavaScript source-string transpiler.
//
// This is the performance-critical core. It turns a parsed expression into a
// plain JS expression string that reads variables from a scope object `_s`
// (e.g. `_s.x`). The string is serializable, so it can be posted to a worker
// which rebuilds a native closure once via `new Function`. Native JS in the hot
// loop is ~15x faster than interpreting MathJSON or math.js per grid point.
// ---------------------------------------------------------------------------

export type MathJson =
  | number
  | string
  | boolean
  | { num: string }
  | { sym: string }
  | { str: string }
  | { fn: MathJson[] }
  | MathJson[]

/** Variable symbols (non-ascii forms normalized to these). */
const GREEK: Record<string, string> = {
  'θ': 'theta',
  'ϑ': 'theta',
  'φ': 'phi',
  'ϕ': 'phi',
  'ρ': 'rho',
}

/** Symbolic constants -> JS literals. */
const CONSTANTS: Record<string, string> = {
  Pi: 'Math.PI',
  ExponentialE: 'Math.E',
  MachineEpsilon: 'Number.EPSILON',
  GoldenRatio: '1.618033988749895',
  CatalanConstant: '0.915965594177219',
  EulerGamma: '0.5772156649015329',
  Degrees: '(Math.PI/180)',
  Nothing: 'NaN',
}

/** Unary Math.* wrappers. */
const UNARY: Record<string, string> = {
  Sqrt: 'Math.sqrt',
  Abs: 'Math.abs',
  Exp: 'Math.exp',
  Ln: 'Math.log',
  Lb: 'Math.log2',
  Lg: 'Math.log10',
  Sin: 'Math.sin',
  Cos: 'Math.cos',
  Tan: 'Math.tan',
  Arcsin: 'Math.asin',
  Arccos: 'Math.acos',
  Arctan: 'Math.atan',
  Sinh: 'Math.sinh',
  Cosh: 'Math.cosh',
  Tanh: 'Math.tanh',
  Arcsinh: 'Math.asinh',
  Arccosh: 'Math.acosh',
  Arctanh: 'Math.atanh',
  Floor: 'Math.floor',
  Ceil: 'Math.ceil',
  Round: 'Math.round',
  Sign: 'Math.sign',
}

/** Reciprocal trig (inlined). */
const RECIP: Record<string, string> = {
  Cot: 'Math.tan',
  Sec: 'Math.cos',
  Csc: 'Math.sin',
  Coth: 'Math.tanh',
  Sech: 'Math.cosh',
  Csch: 'Math.sinh',
}

export class TranspileError extends Error {}

function num(v: string | number): string {
  const s = String(v)
  if (s === 'Infinity' || s === '+Infinity') return 'Infinity'
  if (s === '-Infinity') return '(-Infinity)'
  if (s === 'NaN') return 'NaN'
  // Wrap negative numbers so they compose safely.
  return Number(s) < 0 ? `(${s})` : s
}

function symbol(name: string): string {
  if (name in CONSTANTS) return CONSTANTS[name]
  const canon = GREEK[name] ?? name
  // Reference from scope; falls back to NaN if the variable is absent.
  return `(_s.${canon})`
}

function asRecord(n: MathJson): Record<string, unknown> | null {
  return typeof n === 'object' && n !== null && !Array.isArray(n)
    ? (n as Record<string, unknown>)
    : null
}

/** Decompose a node into [head, args] for function applications, or null. */
function asApply(n: MathJson): [string, MathJson[]] | null {
  if (Array.isArray(n)) {
    const [head, ...args] = n
    if (typeof head === 'string') return [head, args]
    return null
  }
  const rec = asRecord(n)
  if (rec && Array.isArray(rec.fn)) {
    const fn = rec.fn as MathJson[]
    const [head, ...args] = fn
    if (typeof head === 'string') return [head, args]
  }
  return null
}

export function transpile(node: MathJson): string {
  // Literals
  if (typeof node === 'number') return num(node)
  if (typeof node === 'boolean') return node ? 'true' : 'false'
  if (typeof node === 'string') return symbol(node)
  const rec = asRecord(node)
  if (rec) {
    if ('num' in rec) return num(rec.num as string)
    if ('sym' in rec) return symbol(rec.sym as string)
    if ('str' in rec) throw new TranspileError('Las cadenas de texto no son evaluables')
  }

  const app = asApply(node)
  if (!app) throw new TranspileError('Expresión no reconocida')
  const [head, args] = app
  const a = args.map(transpile)

  switch (head) {
    case 'Add':
      return a.length ? `(${a.join('+')})` : '0'
    case 'Subtract':
      return `(${a[0]}-${a[1]})`
    case 'Negate':
      return `(-${a[0]})`
    case 'Multiply':
      return a.length ? `(${a.join('*')})` : '1'
    case 'Divide':
    case 'Rational':
      return `(${a[0]}/${a[1]})`
    case 'Power':
      return `Math.pow(${a[0]},${a[1]})`
    case 'Square':
      return `Math.pow(${a[0]},2)`
    case 'Root':
      return `Math.pow(${a[0]},1/(${a[1]}))`
    case 'Sqrt':
      return `Math.sqrt(${a[0]})`
    case 'Log':
      return a.length === 2
        ? `(Math.log(${a[0]})/Math.log(${a[1]}))`
        : `Math.log10(${a[0]})`
    case 'Max':
      return `Math.max(${a.join(',')})`
    case 'Min':
      return `Math.min(${a.join(',')})`
    case 'Arctan': // Arctan2 form: ["Arctan", y, x]
      return a.length === 2 ? `Math.atan2(${a[0]},${a[1]})` : `Math.atan(${a[0]})`
    case 'Hypot':
      return `Math.hypot(${a.join(',')})`
    case 'Factorial':
      return `_gamma(${a[0]}+1)`
    case 'Gamma':
      return `_gamma(${a[0]})`
    case 'Piecewise':
    case 'Which':
      return piecewise(args)
    case 'Delimiter':
    case 'InvisibleOperator':
      // Wrapper nodes: treat as product / passthrough.
      return a.length === 1 ? `(${a[0]})` : `(${a.join('*')})`
    default:
      if (head in UNARY) return `${UNARY[head]}(${a[0]})`
      if (head in RECIP) return `(1/${RECIP[head]}(${a[0]}))`
      throw new TranspileError(`Función no soportada: ${head}`)
  }
}

/** Relational operators used inside piecewise conditions. */
function relational(node: MathJson): string {
  const app = asApply(node)
  if (app) {
    const [head, args] = app
    const a = args.map((x) =>
      relationalLeaf(x),
    )
    switch (head) {
      case 'Less':
        return `(${a[0]}<${a[1]})`
      case 'LessEqual':
        return `(${a[0]}<=${a[1]})`
      case 'Greater':
        return `(${a[0]}>${a[1]})`
      case 'GreaterEqual':
        return `(${a[0]}>=${a[1]})`
      case 'Equal':
        return `(${a[0]}===${a[1]})`
      case 'NotEqual':
        return `(${a[0]}!==${a[1]})`
      case 'And':
        return `(${a.join('&&')})`
      case 'Or':
        return `(${a.join('||')})`
      case 'Not':
        return `(!${a[0]})`
    }
  }
  return relationalLeaf(node)
}

function relationalLeaf(node: MathJson): string {
  // Could itself be a relation (nested) or an arithmetic expression.
  const app = asApply(node)
  if (app && /^(Less|Greater|Equal|NotEqual|And|Or|Not)/.test(app[0])) {
    return relational(node)
  }
  return transpile(node)
}

function piecewise(args: MathJson[]): string {
  // CE Piecewise: ["Piecewise", ["List", ["Tuple", value, cond], ...]]
  // Which: ["Which", cond1, val1, cond2, val2, ...]
  const pairs: Array<[string, string]> = []
  const list = asApply(args[0])
  if (list && (list[0] === 'List' || list[0] === 'Sequence')) {
    for (const item of list[1]) {
      const tup = asApply(item)
      if (tup && (tup[0] === 'Tuple' || tup[0] === 'Pair')) {
        pairs.push([relational(tup[1][1]), transpile(tup[1][0])])
      }
    }
  } else {
    for (let i = 0; i + 1 < args.length; i += 2) {
      pairs.push([relational(args[i]), transpile(args[i + 1])])
    }
  }
  if (!pairs.length) throw new TranspileError('Piecewise vacío')
  let out = 'NaN'
  for (let i = pairs.length - 1; i >= 0; i--) {
    out = `(${pairs[i][0]}?(${pairs[i][1]}):${out})`
  }
  return out
}
