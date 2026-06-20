import { useState } from 'react'
import { useStore } from '../../state/store'
import type { PlotKind, PlotObject } from '../../types'

const KIND_LABELS: Array<{ kind: PlotKind; label: string }> = [
  { kind: 'surface', label: 'Superficie  z = f(x, y)' },
  { kind: 'paramCurve', label: 'Curva  r(t)' },
  { kind: 'paramSurface', label: 'Superficie  r(u, v)' },
  { kind: 'vectorField', label: 'Campo vectorial  F(x, y, z)' },
  { kind: 'gradientField', label: 'Gradiente  ∇f' },
  { kind: 'contour', label: 'Contornos / niveles' },
  { kind: 'levelSet', label: 'Conjunto de nivel  f = c' },
]

const clean = (s: string) =>
  s
    .replace(/\\left|\\right/g, '')
    .replace(/\\cdot/g, '·')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\\/g, '')

function summary(o: PlotObject): { kind: string; expr: string } {
  switch (o.kind) {
    case 'surface':
      return { kind: o.coords === 'polar' ? 'Superficie · polar' : 'Superficie', expr: 'z = ' + clean(o.expr) }
    case 'paramCurve':
      return { kind: 'Curva r(t)', expr: `(${clean(o.exprX)}, ${clean(o.exprY)}, ${clean(o.exprZ)})` }
    case 'paramSurface':
      return { kind: 'Superficie r(u,v)', expr: `(${clean(o.exprX)}, …)` }
    case 'vectorField':
      return { kind: 'Campo vectorial', expr: `(${clean(o.exprX)}, ${clean(o.exprY)}, ${clean(o.exprZ)})` }
    case 'gradientField':
      return { kind: 'Gradiente ∇f', expr: '∇(' + clean(o.expr) + ')' }
    case 'contour':
      return { kind: `Contornos · ${o.levels}`, expr: clean(o.expr) }
    case 'levelSet':
      return { kind: 'Conjunto de nivel', expr: clean(o.expr) + ' = ' + o.level }
  }
}

export function FunctionList() {
  const objects = useStore((s) => s.objects)
  const selectedId = useStore((s) => s.selectedId)
  const select = useStore((s) => s.select)
  const toggleVisible = useStore((s) => s.toggleVisible)
  const removeObject = useStore((s) => s.removeObject)
  const duplicateObject = useStore((s) => s.duplicateObject)
  const updateStyle = useStore((s) => s.updateStyle)
  const addObject = useStore((s) => s.addObject)
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-1.5">
        {objects.map((o) => {
          const s = summary(o)
          const active = o.id === selectedId
          return (
            <div
              key={o.id}
              onClick={() => select(o.id)}
              className={`group cursor-pointer rounded-[4px] border px-2 py-1.5 transition ${
                active
                  ? 'gd-layer-sel'
                  : 'border-transparent hover:border-app-border-soft hover:bg-app-panel-2/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleVisible(o.id)
                  }}
                  className={`text-xs ${o.visible ? '' : 'opacity-40'}`}
                  title={o.visible ? 'Ocultar' : 'Mostrar'}
                >
                  {o.visible ? '👁' : '🚫'}
                </button>
                <input
                  type="color"
                  value={o.style.color}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateStyle(o.id, { color: e.target.value })}
                  className="h-4 w-4 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  title="Color"
                />
                <span className="flex-1 truncate text-sm font-medium text-app-text">{o.label}</span>
                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateObject(o.id)
                    }}
                    className="text-app-faint hover:text-app-text"
                    title="Duplicar"
                  >
                    ⧉
                  </button>
                  {objects.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeObject(o.id)
                      }}
                      className="text-app-faint hover:text-app-danger"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-1 flex items-center gap-2 pl-6">
                <span className="rounded-[3px] border border-app-border bg-app-input px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-app-faint">
                  {s.kind}
                </span>
                <span className="truncate font-mono text-[11px] text-app-muted">{s.expr}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-1">
        {adding ? (
          <div className="flex flex-col gap-1 rounded-md border border-app-border bg-app-panel-2 p-1">
            {KIND_LABELS.map((k) => (
              <button
                key={k.kind}
                onClick={() => {
                  addObject(k.kind)
                  setAdding(false)
                }}
                className="rounded px-2 py-1 text-left text-sm text-app-muted hover:bg-app-accent hover:text-white"
              >
                {k.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="gd-bevel w-full py-2 text-sm font-semibold"
          >
            + Añadir función
          </button>
        )}
      </div>
    </div>
  )
}
