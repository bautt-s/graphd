// Saved-graphs gallery (modal). Stores named snapshots with thumbnails in
// localStorage; lets the user save the current graph and reload any saved one.

import { useState } from 'react'
import { useSaves } from '../../state/saves'
import { useStore } from '../../state/store'
import { useExportBus } from '../../state/exportBus'
import { encodeState, decodeState } from '../../state/serialize'
import { blobToDataURL } from '../../lib/download'
import { Button } from '../ui/controls'

export function Gallery({ open, onClose }: { open: boolean; onClose: () => void }) {
  const saves = useSaves((s) => s.saves)
  const add = useSaves((s) => s.add)
  const remove = useSaves((s) => s.remove)
  const rename = useSaves((s) => s.rename)
  const getGraph = useStore((s) => s.getGraph)
  const loadGraph = useStore((s) => s.loadGraph)
  const api = useExportBus((s) => s.api)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const saveCurrent = async () => {
    setSaving(true)
    try {
      const token = encodeState(getGraph())
      let thumb: string | undefined
      if (api) {
        const blob = await api.exportPNG({ scale: 0.4, transparent: false })
        if (blob) thumb = await blobToDataURL(blob)
      }
      add(name.trim() || 'Gráfico sin título', token, thumb)
      setName('')
    } finally {
      setSaving(false)
    }
  }

  const load = (token: string) => {
    const g = decodeState(token)
    if (g) {
      loadGraph(g)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-app-border bg-app-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-app-border px-4 py-3">
          <h2 className="text-base font-semibold text-app-text">Guardados</h2>
          <button onClick={onClose} className="text-app-faint hover:text-app-text">
            ✕
          </button>
        </header>

        <div className="flex items-center gap-2 border-b border-app-border-soft px-4 py-3">
          <input
            value={name}
            placeholder="Nombre del gráfico actual…"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveCurrent()}
            className="flex-1 rounded-md border border-app-border bg-app-panel-2 px-3 py-1.5 text-sm text-app-text outline-none focus:border-app-accent"
          />
          <Button variant="primary" onClick={saveCurrent} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar actual'}
          </Button>
        </div>

        <div className="gd-scroll grid grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
          {saves.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-app-muted">
              Aún no tienes gráficos guardados. Guarda el actual para empezar tu galería.
            </p>
          )}
          {saves.map((s) => (
            <div
              key={s.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-app-border bg-app-panel-2"
            >
              <button
                onClick={() => load(s.token)}
                className="relative aspect-video w-full overflow-hidden bg-black/30"
                title="Abrir"
              >
                {s.thumb ? (
                  <img src={s.thumb} alt={s.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-2xl">📈</span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-app-accent/0 text-sm font-medium text-white opacity-0 transition group-hover:bg-app-accent/70 group-hover:opacity-100">
                  Abrir
                </span>
              </button>
              <div className="flex items-center gap-1 p-2">
                <input
                  value={s.name}
                  onChange={(e) => rename(s.id, e.target.value)}
                  className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm text-app-text outline-none hover:bg-app-panel focus:bg-app-panel"
                />
                <button
                  onClick={() => remove(s.id)}
                  className="shrink-0 px-1 text-app-faint hover:text-app-danger"
                  title="Eliminar"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
