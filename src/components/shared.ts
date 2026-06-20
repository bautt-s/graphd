import type { PlotObject } from '../types'

const clean = (s: string) => s.replace(/\\left|\\right/g, '').replace(/\\/g, '')

export function exprPreview(o: PlotObject | null): string {
  if (!o) return '—'
  switch (o.kind) {
    case 'surface':
      return 'z=' + clean(o.expr)
    case 'paramCurve':
    case 'paramSurface':
      return `(${clean(o.exprX)}, …)`
    case 'vectorField':
      return `F=(${clean(o.exprX)}, …)`
    case 'gradientField':
      return '∇' + clean(o.expr)
    case 'contour':
      return clean(o.expr)
    case 'levelSet':
      return clean(o.expr) + '=' + o.level
  }
}

export function coordLabelFor(o: PlotObject | null): string {
  return o && o.kind === 'surface' && o.coords === 'polar'
    ? 'polares (r,θ)'
    : 'cartesianas (x,y)'
}
