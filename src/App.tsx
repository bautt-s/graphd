import { useState } from 'react'
import { useStore } from './state/store'
import { useAutosave } from './state/useAutosave'
import { useTelemetry, useViewportBus } from './state/viewport'
import { GraphCanvas } from './scene/GraphCanvas'
import { FunctionList } from './components/panels/FunctionList'
import { PropertiesPanel } from './components/panels/PropertiesPanel'
import { ObjectEditor } from './components/panels/ObjectEditor'
import { ScenePanel } from './components/panels/ScenePanel'
import { ExportPanel } from './components/panels/ExportPanel'
import { Gallery } from './components/panels/Gallery'
import type { PlotObject } from './types'

type Tab = 'object' | 'scene' | 'export'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'object', label: 'Función' },
  { id: 'scene', label: 'Escena' },
  { id: 'export', label: 'Exportar' },
]

const MENUS = ['Archivo', 'Editar', 'Ver', 'Función', 'Render', 'Ayuda']

function exprPreview(o: PlotObject | null): string {
  if (!o) return '—'
  const clean = (s: string) => s.replace(/\\left|\\right/g, '').replace(/\\/g, '')
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

function Tool({
  icon,
  title,
  active,
  onClick,
}: {
  icon: string
  title: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button className="gd-tool" data-active={active ? 'true' : undefined} onClick={onClick} title={title}>
      {icon}
    </button>
  )
}

export default function App() {
  useAutosave()
  const [tab, setTab] = useState<Tab>('object')
  const [galleryOpen, setGalleryOpen] = useState(false)
  const objects = useStore((s) => s.objects)
  const selectedId = useStore((s) => s.selectedId)
  const scene = useStore((s) => s.scene)
  const setScene = useStore((s) => s.setScene)
  const resetCamera = useStore((s) => s.resetCamera)
  const resetGraph = useStore((s) => s.resetGraph)
  const selected = objects.find((o) => o.id === selectedId) ?? null
  const fps = useTelemetry((s) => s.fps)
  const ms = useTelemetry((s) => s.ms)
  const zoom = useViewportBus((s) => s.zoom)
  const coords = selected && selected.kind === 'surface' && selected.coords === 'polar'
    ? 'polares (r,θ)'
    : 'cartesianas (x,y)'

  return (
    <div className="flex h-full w-full flex-col bg-app-bg text-app-text">
      {/* ---- Titlebar ---- */}
      <div className="gd-titlebar flex h-8 shrink-0 items-center gap-2.5 px-2.5">
        <span
          className="flex h-[15px] w-[15px] items-center justify-center rounded-[3px] text-[9px] font-bold text-[#3a2400]"
          style={{ background: 'linear-gradient(#ffb14d,#d97a17)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)' }}
        >
          ∂z
        </span>
        <span className="text-xs font-semibold text-[#dfe7f2]">Graphd</span>
        <span className="text-[11px] text-app-faint">v2.1 — Surface Studio</span>
      </div>

      {/* ---- Menubar ---- */}
      <div className="gd-menubar flex h-6 shrink-0 items-center gap-4 px-3 text-xs text-app-muted">
        {MENUS.map((m) => (
          <span key={m} className="cursor-default select-none hover:text-app-text">
            {m}
          </span>
        ))}
      </div>

      {/* ---- Toolbar ---- */}
      <div className="gd-toolbar flex h-9 shrink-0 items-center gap-1.5 px-2">
        <Tool icon="▦" title="Grilla" active={scene.showGrid} onClick={() => setScene({ showGrid: !scene.showGrid })} />
        <Tool icon="⊞" title="Ejes" active={scene.showAxes} onClick={() => setScene({ showAxes: !scene.showAxes })} />
        <Tool icon="№" title="Etiquetas" active={scene.showLabels} onClick={() => setScene({ showLabels: !scene.showLabels })} />
        <div className="mx-1 h-5 w-px bg-app-border" />
        <Tool icon="↻" title="Reiniciar vista" onClick={resetCamera} />
        <Tool icon="⤢" title="Acercar" onClick={() => zoom?.(0.8)} />
        <Tool icon="◉" title="Reiniciar gráfico" onClick={resetGraph} />
        <span className="flex-1" />
        <button className="gd-bevel px-3 py-1 text-xs" onClick={() => setGalleryOpen(true)}>
          Guardados
        </button>
        <div className="rounded-[3px] border border-app-border bg-[#1a2029] px-2 py-1 text-[11px] text-app-faint">
          {coords}
        </div>
      </div>

      {/* ---- Main row ---- */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="flex w-[220px] shrink-0 flex-col border-r border-app-border bg-app-panel">
          <div className="gd-scroll flex-1 overflow-y-auto overflow-x-hidden p-3">
            <div className="gd-seclabel mb-2 block">CAPAS</div>
            <FunctionList />
            <div className="gd-seclabel mb-2 mt-4 block">PROPIEDADES</div>
            <PropertiesPanel obj={selected} />
          </div>
          <footer className="border-t border-app-border-soft px-3 py-2 text-[10px] text-app-faint">
            Cálculo III / IV · local
          </footer>
        </aside>

        {/* Viewport */}
        <main className="relative min-w-0 flex-1 bg-app-viewport">
          <GraphCanvas />
          <div className="absolute right-2.5 top-2.5 flex flex-col gap-1">
            <button className="gd-tool" title="Acercar" onClick={() => zoom?.(0.8)}>
              +
            </button>
            <button className="gd-tool" title="Alejar" onClick={() => zoom?.(1.25)}>
              −
            </button>
          </div>
          <div className="gd-statusbar absolute inset-x-0 bottom-0 flex h-6 items-center gap-4 px-3 text-[11px] text-app-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-[7px] w-[7px] rounded-full bg-app-ok" style={{ boxShadow: '0 0 5px #7ad151' }} />
              {fps} fps
            </span>
            <span>{objects.length} capa{objects.length === 1 ? '' : 's'}</span>
            <span>cámara: persp 45°</span>
            <span className="max-w-[220px] truncate">{exprPreview(selected)}</span>
            <span>render {ms} ms</span>
            <span className="flex-1" />
            <span className="text-app-accent">● listo</span>
          </div>
        </main>

        {/* Inspector */}
        <aside
          className="flex w-[300px] shrink-0 flex-col border-l border-app-border bg-app-panel"
          style={{ zoom: 0.9 }}
        >
          <nav className="flex border-b border-app-border" style={{ background: 'linear-gradient(#2a3340,#222a36)' }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  tab === t.id
                    ? 'border-b-2 border-app-accent bg-app-panel text-app-accent'
                    : 'text-app-muted hover:text-app-text'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="gd-scroll flex-1 overflow-y-auto overflow-x-hidden py-1">
            {tab === 'object' &&
              (selected ? (
                <ObjectEditor obj={selected} />
              ) : (
                <p className="p-4 text-sm text-app-muted">Selecciona una función para editarla.</p>
              ))}
            {tab === 'scene' && <ScenePanel />}
            {tab === 'export' && <ExportPanel />}
          </div>
        </aside>
      </div>

      <Gallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </div>
  )
}
