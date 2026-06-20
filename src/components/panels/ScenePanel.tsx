import { useStore } from '../../state/store'
import { THEMES, THEME_NAMES } from '../../lib/themes'
import { NumberField, Row, Section, Slider, Toggle } from '../ui/controls'

export function ScenePanel() {
  const scene = useStore((s) => s.scene)
  const setScene = useStore((s) => s.setScene)

  return (
    <>
      <Section title="Tema del gráfico">
        <div className="grid grid-cols-3 gap-1.5">
          {THEME_NAMES.map((name) => {
            const t = THEMES[name]
            const active = scene.theme === name
            return (
              <button
                key={name}
                onClick={() => setScene({ theme: name })}
                className={`flex flex-col items-center gap-1 rounded-md border p-1.5 text-[11px] ${
                  active
                    ? 'border-app-accent text-app-text'
                    : 'border-app-border text-app-muted hover:border-app-faint'
                }`}
              >
                <span
                  className="h-6 w-full rounded"
                  style={{
                    background: t.background,
                    boxShadow: `inset 0 0 0 1px ${t.gridColorMajor}`,
                  }}
                />
                {t.label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Ejes y grilla">
        <Row label="Ejes">
          <Toggle checked={scene.showAxes} onChange={(showAxes) => setScene({ showAxes })} />
        </Row>
        <Row label="Grilla">
          <Toggle checked={scene.showGrid} onChange={(showGrid) => setScene({ showGrid })} />
        </Row>
        <Row label="Etiquetas numéricas">
          <Toggle checked={scene.showLabels} onChange={(showLabels) => setScene({ showLabels })} />
        </Row>
      </Section>

      <Section title="Render">
        <Row label={`Luz ${scene.lightIntensity.toFixed(1)}`}>
          <Slider
            value={scene.lightIntensity}
            min={0.2}
            max={2}
            step={0.1}
            onChange={(lightIntensity) => setScene({ lightIntensity })}
          />
        </Row>
        <Row label="Recortar |z| grande">
          <Toggle checked={scene.autoClip} onChange={(autoClip) => setScene({ autoClip })} />
        </Row>
        {scene.autoClip && (
          <Row label="Límite de recorte">
            <NumberField value={scene.clipValue} onChange={(clipValue) => setScene({ clipValue })} />
          </Row>
        )}
      </Section>
    </>
  )
}
