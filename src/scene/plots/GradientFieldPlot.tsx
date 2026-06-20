import { useMemo } from 'react'
import { latexToBody } from '../../math/compile'
import { tier } from '../../lib/deviceTier'
import type { GradientFieldPlot as GradientFieldPlotT, VectorSample } from '../../types'
import type { SampleJob } from '../../workers/protocol'
import { ArrowField } from './ArrowField'
import { useSampler, type Quality } from './useSampler'

export function GradientFieldPlot({ obj }: { obj: GradientFieldPlotT }) {
  const compiled = useMemo(() => latexToBody(obj.expr), [obj.expr])
  const density = Math.min(obj.density, tier().maxFieldDensity)

  const build = (q: Quality): SampleJob | null => {
    if (!compiled.ok) return null
    const d = q === 'coarse' ? Math.min(4, density) : density
    return {
      kind: 'gradientField',
      body: compiled.body,
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
    compiled.ok ? compiled.body : compiled.error,
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
