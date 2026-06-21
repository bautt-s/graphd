import { useRef, useState } from 'react'
import { useStore } from '../state/store'
import { useTelemetry, useViewportBus } from '../state/viewport'
import { GraphCanvas } from '../scene/GraphCanvas'
import { FunctionList } from './panels/FunctionList'
import { PropertiesPanel } from './panels/PropertiesPanel'
import { ObjectEditor } from './panels/ObjectEditor'
import { ScenePanel } from './panels/ScenePanel'
import { ExportPanel } from './panels/ExportPanel'
import { Gallery } from './panels/Gallery'
import { Logo } from './Logo'
import { coordLabelFor, exprPreview } from './shared'

type Tab = 'object' | 'scene' | 'export'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'object', label: 'Función' },
  { id: 'scene', label: 'Escena' },
  { id: 'export', label: 'Exportar' },
]

function FBtn({
  icon,
  accent,
  onClick,
  label,
}: {
  icon: string
  accent?: boolean
  onClick?: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-[38px] w-[42px] items-center justify-center rounded-lg border border-app-border text-lg"
      style={{
        background: 'linear-gradient(#2e3744,#222a36)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), 0 2px 5px rgba(0,0,0,.35)',
        color: accent ? 'var(--color-app-accent)' : '#aebbd0',
      }}
    >
      {icon}
    </button>
  )
}

export function MobileApp() {
  const [tab, setTab] = useState<Tab>('object')
  const [expanded, setExpanded] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)

  const objects = useStore((s) => s.objects)
  const selectedId = useStore((s) => s.selectedId)
  const resetCamera = useStore((s) => s.resetCamera)
  const resetGraph = useStore((s) => s.resetGraph)
  const selected = objects.find((o) => o.id === selectedId) ?? null
  const fps = useTelemetry((s) => s.fps)
  const ms = useTelemetry((s) => s.ms)
  const zoom = useViewportBus((s) => s.zoom)

  const openTab = (t: Tab) => {
    setTab(t)
    setExpanded(true)
  }

  // ---- Bottom-sheet drag-to-resize (touch) ----
  const COLLAPSED_H = 158
  const EXPANDED_FRAC = 0.62
  const drag = useRef<{ startY: number; baseH: number; moved: number } | null>(null)
  const lastMoved = useRef(0)
  const [dragH, setDragH] = useState<number | null>(null)

  const onSheetTouchStart = (e: React.TouchEvent) => {
    const baseH = expanded ? window.innerHeight * EXPANDED_FRAC : COLLAPSED_H
    drag.current = { startY: e.touches[0].clientY, baseH, moved: 0 }
    setDragH(baseH)
  }
  const onSheetTouchMove = (e: React.TouchEvent) => {
    const d = drag.current
    if (!d) return
    const dy = e.touches[0].clientY - d.startY
    d.moved = dy
    const max = window.innerHeight * EXPANDED_FRAC
    setDragH(Math.min(max, Math.max(COLLAPSED_H, d.baseH - dy)))
  }
  const onSheetTouchEnd = () => {
    const d = drag.current
    drag.current = null
    setDragH(null)
    if (!d) return
    lastMoved.current = d.moved
    const THRESHOLD = 48
    if (d.moved < -THRESHOLD) setExpanded(true)
    else if (d.moved > THRESHOLD) setExpanded(false)
  }
  const onGripClick = () => {
    // Ignore the click synthesized at the end of a real swipe.
    if (Math.abs(lastMoved.current) > 8) {
      lastMoved.current = 0
      return
    }
    setExpanded((v) => !v)
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-app-bg text-app-text">
      {/* ---- App bar ---- */}
      <div
        className="flex h-12 shrink-0 items-center gap-2 px-3"
        style={{ background: 'linear-gradient(#2e3744,#222a36)', borderBottom: '1px solid #11151c' }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Capas"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border text-base text-[#aebbd0]"
          style={{ background: 'linear-gradient(#3c4859,#2a3340)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)' }}
        >
          ☰
        </button>
        <div className="flex flex-1 items-center justify-center gap-2">
          <Logo size={22} className="text-app-accent" />
          <span className="text-base font-semibold text-[#dfe7f2]">Graphd</span>
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Más"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border text-base text-[#aebbd0]"
          style={{ background: 'linear-gradient(#3c4859,#2a3340)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)' }}
        >
          ⋯
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-2 top-12 z-40 flex w-44 flex-col gap-1 rounded-md border border-app-border bg-app-panel p-1 shadow-2xl">
              {[
                { label: 'Guardados', fn: () => setGalleryOpen(true) },
                { label: 'Reiniciar vista', fn: resetCamera },
                { label: 'Reiniciar gráfico', fn: resetGraph },
              ].map((it) => (
                <button
                  key={it.label}
                  onClick={() => {
                    it.fn()
                    setMenuOpen(false)
                  }}
                  className="rounded px-3 py-2 text-left text-sm text-app-muted hover:bg-app-panel-2 hover:text-app-text"
                >
                  {it.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ---- Viewport ---- */}
      <main className="relative min-h-0 flex-1 bg-app-viewport">
        <GraphCanvas />
        {/* floating toolbar */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          <FBtn icon="↻" accent label="Reiniciar vista" onClick={resetCamera} />
          <FBtn icon="+" label="Acercar" onClick={() => zoom?.(0.8)} />
          <FBtn icon="−" label="Alejar" onClick={() => zoom?.(1.25)} />
          <FBtn icon="⌂" label="Reiniciar gráfico" onClick={resetGraph} />
        </div>
        {/* coord badge */}
        <div
          className="absolute right-2.5 top-2.5 rounded-md border border-app-border px-2.5 py-1 text-[11px] text-app-muted"
          style={{ background: 'rgba(26,32,41,.85)', backdropFilter: 'blur(3px)' }}
        >
          {coordLabelFor(selected)}
        </div>
        {/* status strip */}
        <div className="gd-statusbar absolute inset-x-0 bottom-0 flex h-6 items-center gap-4 px-3 text-[11px] text-app-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-[6px] w-[6px] rounded-full bg-app-ok" style={{ boxShadow: '0 0 5px #7ad151' }} />
            {fps} fps
          </span>
          <span>
            {objects.length} capa{objects.length === 1 ? '' : 's'}
          </span>
          <span>render {ms} ms</span>
        </div>
      </main>

      {/* ---- Bottom sheet ---- */}
      <div
        className="z-20 flex shrink-0 flex-col border-t border-app-border bg-app-panel"
        style={{
          height: dragH != null ? `${dragH}px` : expanded ? '62vh' : '158px',
          transition: dragH != null ? 'none' : 'height .25s ease',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -6px 18px rgba(0,0,0,.45)',
        }}
      >
        <div
          onTouchStart={onSheetTouchStart}
          onTouchMove={onSheetTouchMove}
          onTouchEnd={onSheetTouchEnd}
          style={{ touchAction: 'none' }}
          className="shrink-0"
        >
          <button
            onClick={onGripClick}
            aria-label={expanded ? 'Contraer' : 'Expandir'}
            className="flex w-full shrink-0 justify-center py-2.5"
          >
            <span className="h-1 w-10 rounded-full bg-[#4a5870]" />
          </button>

          <div className="flex shrink-0 gap-1.5 border-b border-app-border px-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => openTab(t.id)}
              className={`flex-1 py-2 text-sm font-medium ${
                tab === t.id
                  ? 'border-b-2 border-app-accent text-app-accent'
                  : 'text-app-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
          </div>
        </div>

        {!expanded ? (
          // Compact peek (Función summary), tap to expand
          <button
            onClick={() => setExpanded(true)}
            className="flex flex-col gap-2 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-[3px]"
                style={{ background: selected?.style.color ?? '#3f7ac4' }}
              />
              <span className="text-sm font-semibold text-app-text">{selected?.label ?? 'Sin selección'}</span>
              <span className="flex-1" />
              <span className="text-[11px] text-app-ok">● continua</span>
            </div>
            <div className="gd-input flex items-center gap-2 px-3 py-2.5">
              <span className="flex-1 truncate font-mono text-[15px] italic" style={{ color: '#ffd9a3' }}>
                {exprPreview(selected)}
              </span>
              <span className="text-app-faint">⌨</span>
            </div>
          </button>
        ) : (
          <div className="gd-scroll flex-1 overflow-y-auto overflow-x-hidden">
            {tab === 'object' &&
              (selected ? (
                <ObjectEditor obj={selected} />
              ) : (
                <p className="p-4 text-sm text-app-muted">Selecciona una función.</p>
              ))}
            {tab === 'scene' && <ScenePanel />}
            {tab === 'export' && <ExportPanel />}
          </div>
        )}
      </div>

      {/* ---- Layers drawer ---- */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-[78%] max-w-[300px] flex-col border-r border-app-border bg-app-panel">
            <div className="flex items-center justify-between border-b border-app-border px-3 py-3">
              <span className="text-sm font-semibold text-app-text">Capas</span>
              <button onClick={() => setDrawerOpen(false)} className="text-app-faint">
                ✕
              </button>
            </div>
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
        </>
      )}

      <Gallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </div>
  )
}
