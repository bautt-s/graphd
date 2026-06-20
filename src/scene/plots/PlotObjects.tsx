// Maps each store object to its plot component by `kind`.

import { useStore } from '../../state/store'
import type { PlotObject } from '../../types'
import { SurfacePlot } from './SurfacePlot'
import { ParamCurvePlot } from './ParamCurvePlot'
import { ParamSurfacePlot } from './ParamSurfacePlot'
import { VectorFieldPlot } from './VectorFieldPlot'
import { GradientFieldPlot } from './GradientFieldPlot'
import { ContourPlot } from './ContourPlot'
import { LevelSetPlot } from './LevelSetPlot'

function PlotObjectView({ obj }: { obj: PlotObject }) {
  switch (obj.kind) {
    case 'surface':
      return <SurfacePlot obj={obj} />
    case 'paramCurve':
      return <ParamCurvePlot obj={obj} />
    case 'paramSurface':
      return <ParamSurfacePlot obj={obj} />
    case 'vectorField':
      return <VectorFieldPlot obj={obj} />
    case 'gradientField':
      return <GradientFieldPlot obj={obj} />
    case 'contour':
      return <ContourPlot obj={obj} />
    case 'levelSet':
      return <LevelSetPlot obj={obj} />
  }
}

export function PlotObjects() {
  const objects = useStore((s) => s.objects)
  return (
    <>
      {objects.map((o) => (
        <PlotObjectView key={o.id} obj={o} />
      ))}
    </>
  )
}
