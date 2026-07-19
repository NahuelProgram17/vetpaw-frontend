const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.onload = () => {
    URL.revokeObjectURL(url)
    resolve(image)
  }
  image.onerror = () => {
    URL.revokeObjectURL(url)
    reject(new Error('No pudimos leer esta imagen. Probá con una foto JPG, PNG o WebP.'))
  }
  image.src = url
})

const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => {
  canvas.toBlob(resolve, type, quality)
})

const safeBaseName = (name = 'foto') => name
  .replace(/\.[^.]+$/, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'foto'

/**
 * Valida, orienta y optimiza fotografías antes de subirlas.
 * Las fotos de cámara suelen pesar mucho; se reducen sin recortar la imagen.
 */
export async function prepareImageForUpload(file, {
  maxMB = 5,
  maxDimension = 2048,
  label = 'La foto',
} = {}) {
  if (!file) return null

  if (!ALLOWED_IMAGE_TYPES.has((file.type || '').toLowerCase())) {
    throw new Error(`${label} debe ser JPG, PNG o WebP.`)
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error(`${label} es demasiado pesada. Elegí una imagen menor a 20 MB.`)
  }

  const image = await loadImage(file)
  const originalWidth = image.naturalWidth || image.width
  const originalHeight = image.naturalHeight || image.height

  if (!originalWidth || !originalHeight) {
    throw new Error(`${label} no tiene dimensiones válidas.`)
  }

  const scale = Math.min(1, maxDimension / Math.max(originalWidth, originalHeight))
  const width = Math.max(1, Math.round(originalWidth * scale))
  const height = Math.max(1, Math.round(originalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { alpha: true })

  if (!context) throw new Error('El navegador no pudo preparar la imagen.')

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  const maxBytes = maxMB * 1024 * 1024
  const outputType = 'image/webp'
  let quality = 0.9
  let blob = await canvasToBlob(canvas, outputType, quality)

  while (blob && blob.size > maxBytes && quality > 0.52) {
    quality -= 0.08
    blob = await canvasToBlob(canvas, outputType, quality)
  }

  if (!blob) {
    throw new Error('No pudimos procesar la imagen. Probá con otra foto.')
  }
  if (blob.size > maxBytes) {
    throw new Error(`${label} no pudo reducirse a menos de ${maxMB} MB.`)
  }

  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpg' : 'webp'

  return new File(
    [blob],
    `${safeBaseName(file.name)}.${extension}`,
    { type: blob.type || outputType, lastModified: Date.now() },
  )
}

export function replaceObjectUrl(currentUrl, file) {
  if (currentUrl?.startsWith('blob:')) URL.revokeObjectURL(currentUrl)
  return file ? URL.createObjectURL(file) : ''
}

export function revokeObjectUrl(url) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}
