import { useMemo } from 'react'
import { latexToBody } from '../../math/compile'
import { tier } from '../../lib/deviceTier'
import type { VectorFieldPlot as VectorFieldPlotT, VectorSample } from '../../types'
import type { SampleJob } from '../../workers/protocol'
import { ArrowField } from './ArrowField'
import { useSampler, type Quality } from './useSampler'

export function VectorFieldPlot({ obj }: { obj: VectorFieldPlotT }) {
  const cx = useMemo(() => latexToBody(obj.exprX), [obj.exprX])
  const cy = useMemo(() => latexToBody(obj.exprY), [obj.exprY])
  const cz = useMemo(() => latexToBody(obj.exprZ), [obj.exprZ])
  const ok = cx.ok && cy.ok && cz.ok
  const density = Math.min(obj.density, tier().maxFieldDensity)

  const build = (q: Quality): SampleJob | null => {
    if (!cx.ok || !cy.ok || !cz.ok) return null
    const d = q === 'coarse' ? Math.min(4, density) : density
    return {
      kind: 'vectorField',
      bodyX: cx.body,
      bodyY: cy.body,
      bodyZ: cz.body,
      xMin: obj.rangeX.min,
      xMax: obj.rangeX.max,
      yMin: obj.rangeY.min,
      yMax: obj.rangeY.max,
      zMin: obj.rangeZ.min,
      zMax: obj.rangeZ.max,
      density: d,
      normalize: obj.normalize,
    }
  }

  const { result } = useSampler(build, [
    ok,
    cx.ok ? cx.body : '',
    cy.ok ? cy.body : '',
    cz.ok ? cz.body : '',
    obj.rangeX.min,
    obj.rangeX.max,
    obj.rangeY.min,
    obj.rangeY.max,
    obj.rangeZ.min,
    obj.rangeZ.max,
    density,
    obj.normalize,
  ])

  const spacing = (obj.rangeX.max - obj.rangeX.min) / Math.max(1, density - 1)
  const sample = result && result.kind === 'vectorField' ? (result as VectorSample) : null
  return (
    <ArrowField
      sample={sample}
      style={obj.style}
      visible={obj.visible}
      spacing={spacing}
      normalize={obj.normalize}
    />
  )
}
