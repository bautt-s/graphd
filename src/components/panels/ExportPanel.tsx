import { useState } from 'react'
import { useExportBus } from '../../state/exportBus'
import { useStore } from '../../state/store'
import { buildShareUrl } from '../../state/url'
import { downloadBlob } from '../../lib/download'
import { Button, Row, Section, SelectField, Slider, Toggle } from '../ui/controls'

export function ExportPanel() {
  const api = useExportBus((s) => s.api)
  const getGraph = useStore((s) => s.getGraph)

  const [scale, setScale] = useState(2)
  const [transparent, setTransparent] = useState(false)
  const [animFormat, setAnimFormat] = useState<'gif' | 'webm'>('gif')
  const [duration, setDuration] = useState(6)
  const [fps, setFps] = useState(15)
  const [rotations, setRotations] = useState(1)
  const [progress, setProgress] = useState<number | null>(null)
  const [shareMsg, setShareMsg] = useState('')

  const busy = progress !== null

  const png = async () => {
    if (!api) return
    const blob = await api.exportPNG({ scale, transparent })
    if (blob) downloadBlob(blob, 'graphd.png')
  }

  const anim = async () => {
    if (!api) return
    setProgress(0)
    const opts = { durationSec: duration, fps, scale: 1, rotations, onProgress: setProgress }
    try {
      const blob =
        animFormat === 'gif' ? await api.exportGIF(opts) : await api.exportWebM(opts)
      if (blob) downloadBlob(blob, `graphd.${animFormat}`)
    } finally {
      setProgress(null)
    }
  }

  const copyLink = async () => {
    const url = buildShareUrl(getGraph())
    try {
      await navigator.clipboard.writeText(url)
      setShareMsg('¡Enlace copiado!')
    } catch {
      setShareMsg('Copia manual: ' + url.slice(0, 40) + '…')
    }
    setTimeout(() => setShareMsg(''), 2500)
  }

  const shareNative = async () => {
    if (!api) return
    const url = buildShareUrl(getGraph())
    const blob = await api.exportPNG({ scale: 2, transparent: false })
    const file = blob ? new File([blob], 'graphd.png', { type: 'image/png' }) : null
    const nav = navigator as Navigator & {
      canShare?: (d: ShareData) => boolean
    }
    try {
      if (file && nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Graphd', text: url })
      } else if (navigator.share) {
        await navigator.share({ title: 'Graphd', text: 'Mi gráfico en Graphd', url })
      } else {
        await copyLink()
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <>
      <Section title="Imagen (PNG)">
        <Row label="Resolución">
          <SelectField
            value={String(scale)}
            onChange={(v) => setScale(Number(v))}
            options={[
              { value: '1', label: '1× (pantalla)' },
              { value: '2', label: '2× (nítido)' },
              { value: '4', label: '4× (impresión)' },
            ]}
          />
        </Row>
        <Row label="Fondo transparente">
          <Toggle checked={transparent} onChange={setTransparent} />
        </Row>
        <Button onClick={png} disabled={!api || busy} full>
          Descargar PNG
        </Button>
      </Section>

      <Section title="Animación (rotación)">
        <Row label="Formato">
          <SelectField
            value={animFormat}
            onChange={setAnimFormat}
            options={[
              { value: 'gif', label: 'GIF' },
              { value: 'webm', label: 'WebM (vídeo)' },
            ]}
          />
        </Row>
        <Row label={`Duración ${duration}s`}>
          <Slider value={duration} min={2} max={20} step={1} onChange={(v) => setDuration(Math.round(v))} />
        </Row>
        <Row label={`FPS ${fps}`}>
          <Slider value={fps} min={10} max={30} step={1} onChange={(v) => setFps(Math.round(v))} />
        </Row>
        <Row label={`Giro · ${rotations} vuelta${rotations === 1 ? '' : 's'}`}>
          <Slider value={rotations} min={0.25} max={3} step={0.25} onChange={setRotations} />
        </Row>
        <p className="text-[10px] leading-snug text-app-faint">
          Más duración y menos vueltas = giro más lento.
        </p>
        {busy && (
          <div className="h-1.5 w-full overflow-hidden rounded bg-app-panel-2">
            <div
              className="h-full bg-app-accent transition-all"
              style={{ width: `${Math.round((progress ?? 0) * 100)}%` }}
            />
          </div>
        )}
        <Button onClick={anim} disabled={!api || busy} full>
          {busy ? `Generando… ${Math.round((progress ?? 0) * 100)}%` : 'Generar animación'}
        </Button>
      </Section>

      <Section title="Compartir">
        <Button onClick={shareNative} variant="primary" disabled={!api} full>
          Compartir…
        </Button>
        <Button onClick={copyLink} full>
          Copiar enlace
        </Button>
        {shareMsg && <span className="text-center text-xs text-app-ok">{shareMsg}</span>}
      </Section>
    </>
  )
}
