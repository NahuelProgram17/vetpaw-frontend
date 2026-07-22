import { useState } from 'react'

export default function ProfileShareButton({ title, text, path, className = 'social-action secondary' }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = path?.startsWith('http') ? path : `${window.location.origin}${path || window.location.pathname}`
    const payload = { title, text: text || `Mirá el perfil de ${title} en VetPaw`, url }
    try {
      if (navigator.share) {
        await navigator.share(payload)
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // El usuario puede cancelar el menú nativo de compartir.
    }
  }

  return <button type="button" className={className} onClick={share}>{copied ? '✓ Enlace copiado' : '↗ Compartir'}</button>
}
