import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export default function useAccessibleDialog({ open = true, onClose, closeOnEscape = true } = {}) {
  const dialogRef = useRef(null)
  const previousFocusRef = useRef(null)
  const closeRef = useRef(onClose)
  const closeOnEscapeRef = useRef(closeOnEscape)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    closeOnEscapeRef.current = closeOnEscape
  }, [closeOnEscape])

  useEffect(() => {
    if (!open) return undefined

    const dialog = dialogRef.current
    if (!dialog) return undefined

    previousFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusable = () => Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true')

    window.requestAnimationFrame(() => {
      const first = focusable()[0]
      ;(first || dialog).focus({ preventScroll: true })
    })

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && closeOnEscapeRef.current) {
        event.preventDefault()
        closeRef.current?.()
        return
      }

      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      const previous = previousFocusRef.current
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
        window.requestAnimationFrame(() => previous.focus({ preventScroll: true }))
      }
    }
  }, [open])

  return dialogRef
}
