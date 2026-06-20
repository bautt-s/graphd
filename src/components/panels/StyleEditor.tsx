import { useStore } from '../../state/store'
import type { ColormapName, PlotObject } from '../../types'
import { colormapCss } from '../../lib/colormaps'
import { ColorField, Row, Section, Slider, Toggle } from '../ui/controls'

const COLORMAPS: ColormapName[] = [
  'none',
  'viridis',
  'plasma',
  'turbo',
  'cool',
  'warm',
  'grayscale',
]

const SUPPORTS_COLORMAP: PlotObject['kind'][] = [
  'surface',
  'paramSurface',
  'vectorField',
  'gradientField',
  'levelSet',
]

const SURFACE_LIKE: PlotObject['kind'][] = ['surface', 'paramSurface', 'levelSet']
const LINE_LIKE: PlotObject['kind'][] = ['paramCurve', 'vectorField', 'gradientField']

export function StyleEditor({ obj }: { obj: PlotObject }) {
  const updateStyle = useStore((s) => s.updateStyle)
  const st = obj.style
  const set = (patch: Partial<typeof st>) => updateStyle(obj.id, patch)

  return (
    <Section title="Estilo">
      <Row label="Color">
        <ColorField value={st.color} onChange={(color) => set({ color })} />
      </Row>

      {SUPPORTS_COLORMAP.includes(obj.kind) && (
        <Row label="Gradiente">
          <div className="flex items-center gap-1">
            {st.colormap !== 'none' && (
              <span
                className="h-4 w-12 rounded"
                style={{ background: colormapCss(st.colormap) }}
              />
            )}
            <select
              value={st.colormap}
              onChange={(e) => set({ colormap: e.target.value as ColormapName })}
              className="rounded-md border border-app-border bg-app-panel-2 px-2 py-1 text-sm text-app-text outline-none focus:border-app-accent"
            >
              {COLORMAPS.map((c) => (
                <option key={c} value={c}>
                  {c === 'none' ? 'sólido' : c}
                </option>
              ))}
            </select>
          </div>
        </Row>
      )}

      <Row label={`Opacidad ${Math.round(st.opacity * 100)}%`}>
        <Slider value={st.opacity} min={0.1} max={1} onChange={(opacity) => set({ opacity })} />
      </Row>

      {SURFACE_LIKE.includes(obj.kind) && (
        <>
          <Row label="Malla (wireframe)">
            <Toggle checked={st.wireframe} onChange={(wireframe) => set({ wireframe })} />
          </Row>
          <Row label="Sombreado plano">
            <Toggle checked={st.flatShading} onChange={(flatShading) => set({ flatShading })} />
          </Row>
          <Row label={`Rugosidad ${st.roughness.toFixed(2)}`}>
            <Slider value={st.roughness} min={0} max={1} onChange={(roughness) => set({ roughness })} />
          </Row>
          <Row label={`Metalicidad ${st.metalness.toFixed(2)}`}>
            <Slider value={st.metalness} min={0} max={1} onChange={(metalness) => set({ metalness })} />
          </Row>
        </>
      )}

      {LINE_LIKE.includes(obj.kind) && (
        <Row label={`Grosor ${st.lineWidth.toFixed(1)}`}>
          <Slider value={st.lineWidth} min={0.3} max={5} step={0.1} onChange={(lineWidth) => set({ lineWidth })} />
        </Row>
      )}
    </Section>
  )
}
