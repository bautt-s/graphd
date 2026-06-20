import { useMemo } from 'react'
import { useStore } from '../../state/store'
import { validateLatex } from '../../math/compile'
import { tier } from '../../lib/deviceTier'
import type { PlotObject, Range } from '../../types'
import { MathField } from '../mathinput/MathField'
import { NumberField, Row, Section, SelectField, Slider, Toggle } from '../ui/controls'
import { StyleEditor } from './StyleEditor'

function ExprField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const err = useMemo(() => validateLatex(value), [value])
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-xs text-app-faint">{label}</span>
      <MathField value={value} onChange={onChange} invalid={!!err} />
      {err && <span className="text-xs text-app-danger">⚠ {err}</span>}
    </div>
  )
}

export function ObjectEditor({ obj }: { obj: PlotObject }) {
  const update = useStore((s) => s.updateObject)
  const u = (patch: Record<string, unknown>) => update(obj.id, patch)
  const t = tier()

  return (
    <div>
      <Section title="Función">
        <input
          value={obj.label}
          onChange={(e) => u({ label: e.target.value })}
          className="mb-1 w-full rounded-md border border-app-border bg-app-panel-2 px-2 py-1 text-sm text-app-text outline-none focus:border-app-accent"
        />

        {obj.kind === 'surface' && (
          <>
            <Row label="Coordenadas">
              <SelectField
                value={obj.coords}
                onChange={(coords) => u({ coords })}
                options={[
                  { value: 'cartesian', label: 'Cartesianas (x, y)' },
                  { value: 'polar', label: 'Polares (r, θ)' },
                ]}
              />
            </Row>
            <ExprField
              label={obj.coords === 'polar' ? 'z = f(r, θ) =' : 'z = f(x, y) ='}
              value={obj.expr}
              onChange={(expr) => u({ expr })}
            />
            <Row label={obj.coords === 'polar' ? 'r' : 'x'}>
              <RangeInputs
                min={obj.rangeU.min}
                max={obj.rangeU.max}
                onChange={(min, max) => u({ rangeU: { min, max } })}
              />
            </Row>
            <Row label={obj.coords === 'polar' ? 'θ' : 'y'}>
              <RangeInputs
                min={obj.rangeV.min}
                max={obj.rangeV.max}
                onChange={(min, max) => u({ rangeV: { min, max } })}
              />
            </Row>
            <ResolutionRow
              value={obj.resolution}
              max={t.maxSurfaceRes}
              onChange={(resolution) => u({ resolution })}
            />
          </>
        )}

        {(obj.kind === 'paramCurve' || obj.kind === 'paramSurface') && (
          <>
            <ExprField label="x =" value={obj.exprX} onChange={(exprX) => u({ exprX })} />
            <ExprField label="y =" value={obj.exprY} onChange={(exprY) => u({ exprY })} />
            <ExprField label="z =" value={obj.exprZ} onChange={(exprZ) => u({ exprZ })} />
            {obj.kind === 'paramCurve' ? (
              <Row label="t">
                <RangeInputs
                  min={obj.rangeT.min}
                  max={obj.rangeT.max}
                  onChange={(min, max) => u({ rangeT: { min, max } })}
                />
              </Row>
            ) : (
              <>
                <Row label="u">
                  <RangeInputs
                    min={obj.rangeU.min}
                    max={obj.rangeU.max}
                    onChange={(min, max) => u({ rangeU: { min, max } })}
                  />
                </Row>
                <Row label="v">
                  <RangeInputs
                    min={obj.rangeV.min}
                    max={obj.rangeV.max}
                    onChange={(min, max) => u({ rangeV: { min, max } })}
                  />
                </Row>
              </>
            )}
            <ResolutionRow
              value={obj.resolution}
              max={obj.kind === 'paramCurve' ? t.maxSurfaceRes * 8 : t.maxSurfaceRes}
              onChange={(resolution) => u({ resolution })}
            />
          </>
        )}

        {(obj.kind === 'vectorField' || obj.kind === 'gradientField') && (
          <>
            {obj.kind === 'vectorField' ? (
              <>
                <ExprField label="Fₓ =" value={obj.exprX} onChange={(exprX) => u({ exprX })} />
                <ExprField label="F_y =" value={obj.exprY} onChange={(exprY) => u({ exprY })} />
                <ExprField label="F_z =" value={obj.exprZ} onChange={(exprZ) => u({ exprZ })} />
              </>
            ) : (
              <ExprField label="f(x, y, z) =  →  ∇f" value={obj.expr} onChange={(expr) => u({ expr })} />
            )}
            <XYZRanges obj={obj} u={u} />
            <Row label="Densidad">
              <Slider
                value={obj.density}
                min={2}
                max={t.maxFieldDensity}
                step={1}
                onChange={(density) => u({ density: Math.round(density) })}
              />
            </Row>
            <Row label="Normalizar longitud">
              <Toggle checked={obj.normalize} onChange={(normalize) => u({ normalize })} />
            </Row>
          </>
        )}

        {obj.kind === 'contour' && (
          <>
            <ExprField label="f(x, y) =" value={obj.expr} onChange={(expr) => u({ expr })} />
            <Row label="x">
              <RangeInputs
                min={obj.rangeX.min}
                max={obj.rangeX.max}
                onChange={(min, max) => u({ rangeX: { min, max } })}
              />
            </Row>
            <Row label="y">
              <RangeInputs
                min={obj.rangeY.min}
                max={obj.rangeY.max}
                onChange={(min, max) => u({ rangeY: { min, max } })}
              />
            </Row>
            <Row label="Niveles">
              <Slider
                value={obj.levels}
                min={2}
                max={40}
                step={1}
                onChange={(levels) => u({ levels: Math.round(levels) })}
              />
            </Row>
            <Row label="Elevar sobre superficie">
              <Toggle checked={obj.lift} onChange={(lift) => u({ lift })} />
            </Row>
            <ResolutionRow
              value={obj.resolution}
              max={t.maxSurfaceRes}
              onChange={(resolution) => u({ resolution })}
            />
          </>
        )}

        {obj.kind === 'levelSet' && (
          <>
            <ExprField label="f(x, y, z) =" value={obj.expr} onChange={(expr) => u({ expr })} />
            <Row label="Nivel c">
              <NumberField value={obj.level} onChange={(level) => u({ level })} />
            </Row>
            <XYZRanges obj={obj} u={u} />
            <ResolutionRow
              value={obj.resolution}
              max={t.maxLevelSetRes}
              onChange={(resolution) => u({ resolution })}
            />
          </>
        )}
      </Section>

      <StyleEditor obj={obj} />
    </div>
  )
}

function RangeInputs({
  min,
  max,
  onChange,
}: {
  min: number
  max: number
  onChange: (min: number, max: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <NumberField value={min} onChange={(v) => onChange(v, max)} width="w-14" />
      <span className="text-app-faint">–</span>
      <NumberField value={max} onChange={(v) => onChange(min, v)} width="w-14" />
    </div>
  )
}

function ResolutionRow({
  value,
  max,
  onChange,
}: {
  value: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <Row label={`Resolución ${value}`}>
      <Slider
        value={Math.min(value, max)}
        min={8}
        max={max}
        step={1}
        onChange={(v) => onChange(Math.round(v))}
      />
    </Row>
  )
}

function XYZRanges({
  obj,
  u,
}: {
  obj: { rangeX: Range; rangeY: Range; rangeZ: Range }
  u: (patch: Record<string, unknown>) => void
}) {
  return (
    <>
      <Row label="x">
        <RangeInputs
          min={obj.rangeX.min}
          max={obj.rangeX.max}
          onChange={(min, max) => u({ rangeX: { min, max } })}
        />
      </Row>
      <Row label="y">
        <RangeInputs
          min={obj.rangeY.min}
          max={obj.rangeY.max}
          onChange={(min, max) => u({ rangeY: { min, max } })}
        />
      </Row>
      <Row label="z">
        <RangeInputs
          min={obj.rangeZ.min}
          max={obj.rangeZ.max}
          onChange={(min, max) => u({ rangeZ: { min, max } })}
        />
      </Row>
    </>
  )
}
