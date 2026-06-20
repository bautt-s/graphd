// Read-only "PROPIEDADES" panel for the sidebar — derived stats about the
// selected object, in the steel workstation style.

import type { PlotObject } from '../../types'

function span(min: number, max: number) {
  return Math.round((max - min) * 10) / 10
}

function rows(o: PlotObject): Array<[string, string, boolean?]> {
  const out: Array<[string, string, boolean?]> = []
  switch (o.kind) {
    case 'surface':
    case 'paramSurface':
      out.push(['Tipo', 'malla'])
      out.push(['Caras', (o.resolution * o.resolution * 2).toLocaleString('es')])
      out.push(['Dominio', `${span(o.rangeU.min, o.rangeU.max)}×${span(o.rangeV.min, o.rangeV.max)}`])
      out.push(['Continua', 'sí', true])
      break
    case 'paramCurve':
      out.push(['Tipo', 'curva'])
      out.push(['Segmentos', o.resolution.toLocaleString('es')])
      out.push(['Param.', `t ∈ [${o.rangeT.min}, ${o.rangeT.max}]`])
      break
    case 'vectorField':
    case 'gradientField':
      out.push(['Tipo', 'campo'])
      out.push(['Vectores', (o.density ** 3).toLocaleString('es')])
      out.push(['Dominio', `${span(o.rangeX.min, o.rangeX.max)}³`])
      out.push(['Normaliza', o.normalize ? 'sí' : 'no', o.normalize])
      break
    case 'contour':
      out.push(['Tipo', 'líneas'])
      out.push(['Niveles', String(o.levels)])
      out.push(['Dominio', `${span(o.rangeX.min, o.rangeX.max)}×${span(o.rangeY.min, o.rangeY.max)}`])
      break
    case 'levelSet':
      out.push(['Tipo', 'isosup.'])
      out.push(['Nivel', String(o.level)])
      out.push(['Dominio', `${span(o.rangeX.min, o.rangeX.max)}³`])
      break
  }
  out.push(['Visible', o.visible ? 'sí' : 'no', o.visible])
  return out
}

export function PropertiesPanel({ obj }: { obj: PlotObject | null }) {
  if (!obj) {
    return <div className="px-1 text-[11px] text-app-faint">Sin selección</div>
  }
  return (
    <div className="flex flex-col gap-0.5 px-1 text-[11px] leading-relaxed">
      {rows(obj).map(([k, v, ok], i) => (
        <div key={i} className="flex justify-between">
          <span className="text-app-muted">{k}</span>
          <span className={ok ? 'text-app-ok' : 'text-app-text'}>{v}</span>
        </div>
      ))}
    </div>
  )
}
