import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const GREEN = '#4CAF50'
const ORANGE = '#FF9800'

const RATIOS = [
  { key: 'original', label: 'Original' },
  { key: 'square', label: 'Cuadrada 1:1', ratio: 1 },
  { key: 'portrait', label: 'Vertical 4:5', ratio: 4 / 5 },
  { key: 'landscape', label: 'Horizontal 16:9', ratio: 16 / 9 },
]

const canvasToBlob = (canvas, type = 'image/webp', quality = 0.9) => new Promise((resolve) => {
  canvas.toBlob(resolve, type, quality)
})

const safeBaseName = (name = 'foto') => name
  .replace(/\.[^.]+$/, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'foto'

export default function ImageEditorModal({ file, onCancel, onApply, title = 'Ajustar foto' }) {
  const [image, setImage] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [ratioMode, setRatioMode] = useState('original')
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef(null)
  const dragRef = useRef(null)

  useEffect(() => {
    if (!file) return undefined
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setLoading(false)
      setError('')
    }
    img.onerror = () => {
      setLoading(false)
      setError('No pudimos abrir esta imagen. Probá con otra foto.')
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = oldOverflow }
  }, [])

  const rotatedSize = useMemo(() => {
    if (!image) return { width: 1, height: 1 }
    const quarterTurn = Math.abs(rotation % 180) === 90
    return quarterTurn
      ? { width: image.naturalHeight, height: image.naturalWidth }
      : { width: image.naturalWidth, height: image.naturalHeight }
  }, [image, rotation])

  const cropRatio = useMemo(() => {
    const preset = RATIOS.find((item) => item.key === ratioMode)
    return preset?.ratio || rotatedSize.width / rotatedSize.height || 1
  }, [ratioMode, rotatedSize])

  const previewSize = useMemo(() => {
    const maxWidth = 620
    const maxHeight = 500
    if (cropRatio >= 1) {
      const width = maxWidth
      return { width, height: Math.max(220, Math.round(width / cropRatio)) }
    }
    const height = maxHeight
    return { width: Math.max(230, Math.round(height * cropRatio)), height }
  }, [cropRatio])

  const clampOffset = useCallback((next, nextZoom = zoom) => {
    const baseScale = Math.max(
      previewSize.width / rotatedSize.width,
      previewSize.height / rotatedSize.height,
    )
    const scaledWidth = rotatedSize.width * baseScale * nextZoom
    const scaledHeight = rotatedSize.height * baseScale * nextZoom
    const maxX = Math.max(0, (scaledWidth - previewSize.width) / 2)
    const maxY = Math.max(0, (scaledHeight - previewSize.height) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    }
  }, [previewSize, rotatedSize, zoom])

  useEffect(() => {
    setOffset((current) => clampOffset(current))
  }, [rotation, ratioMode, zoom, clampOffset])

  useEffect(() => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(previewSize.width * dpr)
    canvas.height = Math.round(previewSize.height * dpr)
    canvas.style.width = `${previewSize.width}px`
    canvas.style.height = `${previewSize.height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, previewSize.width, previewSize.height)
    ctx.fillStyle = '#07111f'
    ctx.fillRect(0, 0, previewSize.width, previewSize.height)

    const baseScale = Math.max(
      previewSize.width / rotatedSize.width,
      previewSize.height / rotatedSize.height,
    )
    const drawScale = baseScale * zoom

    ctx.save()
    ctx.translate(previewSize.width / 2 + offset.x, previewSize.height / 2 + offset.y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(drawScale, drawScale)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
    ctx.restore()

    const gradient = ctx.createLinearGradient(0, 0, previewSize.width, previewSize.height)
    gradient.addColorStop(0, 'rgba(76,175,80,.14)')
    gradient.addColorStop(1, 'rgba(255,152,0,.10)')
    ctx.strokeStyle = gradient
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, previewSize.width - 3, previewSize.height - 3)

    ctx.strokeStyle = 'rgba(255,255,255,.18)'
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i += 1) {
      const x = (previewSize.width / 3) * i
      const y = (previewSize.height / 3) * i
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, previewSize.height); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(previewSize.width, y); ctx.stroke()
    }
  }, [image, rotation, zoom, offset, previewSize, rotatedSize])

  const rotate = (direction) => {
    setRotation((current) => (current + direction + 360) % 360)
    setOffset({ x: 0, y: 0 })
  }

  const changeZoom = (value) => {
    const nextZoom = Number(value)
    setZoom(nextZoom)
    setOffset((current) => clampOffset(current, nextZoom))
  }

  const pointerDown = (event) => {
    if (!image) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, start: offset }
  }

  const pointerMove = (event) => {
    if (!dragRef.current) return
    const rect = canvasRef.current?.getBoundingClientRect()
    const scaleX = rect?.width ? previewSize.width / rect.width : 1
    const scaleY = rect?.height ? previewSize.height / rect.height : 1
    const next = {
      x: dragRef.current.start.x + (event.clientX - dragRef.current.x) * scaleX,
      y: dragRef.current.start.y + (event.clientY - dragRef.current.y) * scaleY,
    }
    setOffset(clampOffset(next))
  }

  const pointerUp = (event) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    dragRef.current = null
  }

  const reset = () => {
    setRotation(0)
    setZoom(1)
    setRatioMode('original')
    setOffset({ x: 0, y: 0 })
  }

  const apply = async () => {
    if (!image || saving) return
    setSaving(true)
    setError('')
    try {
      const maxOutput = 1800
      let outputWidth
      let outputHeight
      if (cropRatio >= 1) {
        outputWidth = maxOutput
        outputHeight = Math.max(1, Math.round(maxOutput / cropRatio))
      } else {
        outputHeight = maxOutput
        outputWidth = Math.max(1, Math.round(maxOutput * cropRatio))
      }

      const output = document.createElement('canvas')
      output.width = outputWidth
      output.height = outputHeight
      const ctx = output.getContext('2d')
      if (!ctx) throw new Error('El navegador no pudo editar la imagen.')

      ctx.fillStyle = '#07111f'
      ctx.fillRect(0, 0, outputWidth, outputHeight)
      const baseScale = Math.max(outputWidth / rotatedSize.width, outputHeight / rotatedSize.height)
      const scale = baseScale * zoom
      const mappedOffsetX = offset.x * (outputWidth / previewSize.width)
      const mappedOffsetY = offset.y * (outputHeight / previewSize.height)

      ctx.save()
      ctx.translate(outputWidth / 2 + mappedOffsetX, outputHeight / 2 + mappedOffsetY)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(scale, scale)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
      ctx.restore()

      let quality = 0.92
      let blob = await canvasToBlob(output, 'image/webp', quality)
      const maxBytes = 5 * 1024 * 1024
      while (blob && blob.size > maxBytes && quality > 0.54) {
        quality -= 0.08
        blob = await canvasToBlob(output, 'image/webp', quality)
      }
      if (!blob) throw new Error('No pudimos guardar la imagen editada.')

      const edited = new File(
        [blob],
        `${safeBaseName(file?.name)}-editada.webp`,
        { type: 'image/webp', lastModified: Date.now() },
      )
      await onApply?.(edited)
    } catch (applyError) {
      setError(applyError.message || 'No pudimos aplicar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="vp-image-editor-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="vp-image-editor-modal">
        <div className="vp-image-editor-header">
          <div>
            <div className="vp-image-editor-eyebrow">FOTO VETPAW</div>
            <h2>{title}</h2>
            <p>Arrastrá para centrar. También podés recortar, girar y acercar.</p>
          </div>
          <button type="button" className="vp-image-editor-close" onClick={onCancel} aria-label="Cerrar">✕</button>
        </div>

        {error && <div className="vp-image-editor-error">{error}</div>}

        <div className="vp-image-editor-workspace">
          <div
            className="vp-image-editor-canvas-wrap"
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
          >
            {loading ? <div className="vp-image-editor-loading">Preparando imagen…</div> : <canvas ref={canvasRef} />}
          </div>

          <div className="vp-image-editor-controls">
            <div className="vp-image-editor-section">
              <span className="vp-image-editor-label">Formato</span>
              <div className="vp-image-editor-ratios">
                {RATIOS.map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    className={ratioMode === item.key ? 'active' : ''}
                    onClick={() => { setRatioMode(item.key); setOffset({ x: 0, y: 0 }); setZoom(1) }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="vp-image-editor-section">
              <span className="vp-image-editor-label">Girar</span>
              <div className="vp-image-editor-buttons">
                <button type="button" onClick={() => rotate(-90)}>↶ Izquierda</button>
                <button type="button" onClick={() => rotate(90)}>↷ Derecha</button>
              </div>
            </div>

            <div className="vp-image-editor-section">
              <div className="vp-image-editor-zoom-row">
                <span className="vp-image-editor-label">Zoom</span>
                <strong>{Math.round(zoom * 100)}%</strong>
              </div>
              <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => changeZoom(event.target.value)} />
            </div>

            <button type="button" className="vp-image-editor-reset" onClick={reset}>Restablecer imagen</button>
          </div>
        </div>

        <div className="vp-image-editor-footer">
          <button type="button" className="vp-image-editor-cancel" onClick={onCancel}>Cancelar</button>
          <button type="button" className="vp-image-editor-apply" disabled={loading || saving || !!error} onClick={apply}>
            {saving ? 'Aplicando…' : 'Usar esta foto'}
          </button>
        </div>
      </div>

      <style>{`
        .vp-image-editor-backdrop { position: fixed; inset: 0; z-index: 5000; background: rgba(0,0,0,.78); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 18px; font-family: ${FONT}; }
        .vp-image-editor-modal { width: min(1040px, 100%); max-height: calc(100vh - 36px); overflow-y: auto; background: linear-gradient(145deg,#101d2b,#172638); border: 1px solid rgba(255,255,255,.10); border-radius: 24px; box-shadow: 0 30px 90px rgba(0,0,0,.58); color: #fff; }
        .vp-image-editor-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding: 22px 24px 16px; border-bottom: 1px solid rgba(255,255,255,.07); }
        .vp-image-editor-eyebrow { color: ${GREEN}; font-size: 11px; font-weight: 900; letter-spacing: 1.5px; }
        .vp-image-editor-header h2 { margin: 5px 0 4px; font-size: clamp(1.35rem,3vw,2rem); }
        .vp-image-editor-header p { margin: 0; color: rgba(255,255,255,.52); font-size: 13px; }
        .vp-image-editor-close { width: 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(255,255,255,.13); background: rgba(255,255,255,.06); color: #fff; cursor: pointer; font-size: 17px; }
        .vp-image-editor-workspace { display: grid; grid-template-columns: minmax(0,1fr) 280px; gap: 20px; padding: 22px 24px; align-items: center; }
        .vp-image-editor-canvas-wrap { min-height: 300px; display: flex; justify-content: center; align-items: center; overflow: auto; border-radius: 18px; background: #07111f; border: 1px solid rgba(255,255,255,.08); cursor: grab; touch-action: none; user-select: none; padding: 14px; }
        .vp-image-editor-canvas-wrap:active { cursor: grabbing; }
        .vp-image-editor-canvas-wrap canvas { max-width: 100%; max-height: 58vh; border-radius: 10px; display: block; box-shadow: 0 18px 50px rgba(0,0,0,.45); }
        .vp-image-editor-loading { color: rgba(255,255,255,.55); }
        .vp-image-editor-controls { display: flex; flex-direction: column; gap: 18px; }
        .vp-image-editor-section { display: flex; flex-direction: column; gap: 9px; }
        .vp-image-editor-label { color: rgba(255,255,255,.58); font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .9px; }
        .vp-image-editor-ratios { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .vp-image-editor-ratios button, .vp-image-editor-buttons button, .vp-image-editor-reset { border: 1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.05); color: rgba(255,255,255,.76); padding: 10px 9px; border-radius: 10px; cursor: pointer; font: 700 12px ${FONT}; }
        .vp-image-editor-ratios button.active { color: #fff; border-color: rgba(76,175,80,.55); background: linear-gradient(135deg,rgba(76,175,80,.22),rgba(255,152,0,.13)); }
        .vp-image-editor-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .vp-image-editor-zoom-row { display: flex; justify-content: space-between; align-items: center; }
        .vp-image-editor-zoom-row strong { color: ${ORANGE}; font-size: 12px; }
        .vp-image-editor-section input[type=range] { width: 100%; accent-color: ${GREEN}; }
        .vp-image-editor-reset { width: 100%; }
        .vp-image-editor-error { margin: 14px 24px 0; padding: 11px 14px; border-radius: 11px; background: rgba(255,107,107,.12); border: 1px solid rgba(255,107,107,.32); color: #ffb1b1; font-size: 13px; }
        .vp-image-editor-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px 22px; border-top: 1px solid rgba(255,255,255,.07); }
        .vp-image-editor-cancel, .vp-image-editor-apply { border-radius: 12px; padding: 11px 18px; cursor: pointer; font: 800 13px ${FONT}; }
        .vp-image-editor-cancel { border: 1px solid rgba(255,255,255,.14); color: rgba(255,255,255,.72); background: transparent; }
        .vp-image-editor-apply { border: 0; color: #fff; background: linear-gradient(135deg,${GREEN},${ORANGE}); box-shadow: 0 8px 24px rgba(76,175,80,.22); }
        .vp-image-editor-apply:disabled { opacity: .55; cursor: wait; }
        @media (max-width: 820px) {
          .vp-image-editor-backdrop { padding: 8px; align-items: flex-end; }
          .vp-image-editor-modal { max-height: 96vh; border-radius: 22px 22px 0 0; }
          .vp-image-editor-workspace { grid-template-columns: 1fr; padding: 14px; }
          .vp-image-editor-canvas-wrap { min-height: 250px; padding: 8px; }
          .vp-image-editor-canvas-wrap canvas { max-height: 46vh; }
          .vp-image-editor-controls { gap: 13px; }
          .vp-image-editor-footer { position: sticky; bottom: 0; background: #132130; z-index: 2; }
        }
      `}</style>
    </div>
  )
}
