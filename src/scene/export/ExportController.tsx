// Registers the imperative export API. PNG is rendered through an offscreen
// supersampled render target (no global preserveDrawingBuffer). Animations
// rotate the camera and capture frames (GIF via gifenc, WebM via MediaRecorder).

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import { useExportBus, type AnimOptions, type PngOptions } from '../../state/exportBus'
import { useStore } from '../../state/store'

interface Pixels {
  data: Uint8ClampedArray<ArrayBuffer>
  width: number
  height: number
}

export function ExportController() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const setApi = useExportBus((s) => s.setApi)

  useEffect(() => {
    // Render the scene to an offscreen target and return top-down RGBA pixels.
    const renderToPixels = (scale: number, transparent: boolean): Pixels => {
      const w = Math.max(2, Math.round(size.width * scale))
      const h = Math.max(2, Math.round(size.height * scale))
      const rt = new THREE.WebGLRenderTarget(w, h, {
        samples: 4,
        colorSpace: THREE.SRGBColorSpace,
      })
      const prevBg = scene.background
      const prevAlpha = gl.getClearAlpha()
      const prevTarget = gl.getRenderTarget()
      if (transparent) {
        scene.background = null
        gl.setClearAlpha(0)
      }
      gl.setRenderTarget(rt)
      gl.clear()
      gl.render(scene, camera)
      const raw = new Uint8Array(w * h * 4)
      gl.readRenderTargetPixels(rt, 0, 0, w, h, raw)
      gl.setRenderTarget(prevTarget)
      scene.background = prevBg
      gl.setClearAlpha(prevAlpha)
      rt.dispose()
      // Flip vertically (GL is bottom-up) into top-down RGBA.
      const out = new Uint8ClampedArray(w * h * 4)
      const rowBytes = w * 4
      for (let y = 0; y < h; y++) {
        const src = (h - 1 - y) * rowBytes
        out.set(raw.subarray(src, src + rowBytes), y * rowBytes)
      }
      return { data: out, width: w, height: h }
    }

    const pixelsToCanvas = (px: Pixels): HTMLCanvasElement => {
      const c = document.createElement('canvas')
      c.width = px.width
      c.height = px.height
      const ctx = c.getContext('2d')!
      ctx.putImageData(new ImageData(px.data, px.width, px.height), 0, 0)
      return c
    }

    const exportPNG = async (opts: PngOptions): Promise<Blob | null> => {
      const px = renderToPixels(opts.scale, opts.transparent)
      const c = pixelsToCanvas(px)
      return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'))
    }

    const getTarget = (): THREE.Vector3 => {
      const t = useStore.getState().camera.target
      return new THREE.Vector3(t[0], t[1], t[2])
    }

    // Rotate the camera around the vertical axis through the target.
    const rotated = (angle: number, target: THREE.Vector3): THREE.Vector3 => {
      const offset = camera.position.clone().sub(target)
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
      return target.clone().add(offset)
    }

    const animateFrames = async (
      opts: AnimOptions,
      frameDelayMs: number,
      onFrame: (px: Pixels, index: number, total: number) => void,
    ): Promise<void> => {
      const total = Math.max(2, Math.round(opts.durationSec * opts.fps))
      const startPos = camera.position.clone()
      const target = getTarget()
      const turns = opts.rotations || 1
      for (let i = 0; i < total; i++) {
        const angle = (i / total) * Math.PI * 2 * turns
        camera.position.copy(rotated(angle, target))
        camera.lookAt(target)
        const px = renderToPixels(opts.scale, false)
        onFrame(px, i, total)
        opts.onProgress?.((i + 1) / total)
        await new Promise((r) => setTimeout(r, frameDelayMs))
      }
      camera.position.copy(startPos)
      camera.lookAt(target)
    }

    const exportGIF = async (opts: AnimOptions): Promise<Blob | null> => {
      const enc = GIFEncoder()
      const delay = Math.round(1000 / opts.fps)
      await animateFrames(opts, 0, (px) => {
        const palette = quantize(px.data, 256)
        const index = applyPalette(px.data, palette)
        enc.writeFrame(index, px.width, px.height, { palette, delay })
      })
      enc.finish()
      return new Blob([enc.bytes() as BlobPart], { type: 'image/gif' })
    }

    const exportWebM = async (opts: AnimOptions): Promise<Blob | null> => {
      const w = Math.round(size.width * opts.scale)
      const h = Math.round(size.height * opts.scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      const stream = canvas.captureStream(opts.fps)
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6 })
      const chunks: BlobPart[] = []
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      const done = new Promise<Blob>((resolve) => {
        rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
      })
      rec.start()
      await animateFrames(opts, Math.round(1000 / opts.fps), (px) => {
        ctx.putImageData(new ImageData(px.data, px.width, px.height), 0, 0)
      })
      rec.stop()
      return done
    }

    setApi({ exportPNG, exportGIF, exportWebM })
    return () => setApi(null)
  }, [gl, scene, camera, size, setApi])

  return null
}
