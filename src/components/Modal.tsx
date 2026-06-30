import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title?: string
  size?: 'default' | 'small' | 'large' | 'picker'
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}

export default function Modal({
  open,
  title,
  size = 'default',
  children,
  footer,
  onClose,
}: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const sizeClass =
    size === 'small'
      ? 'small-modal'
      : size === 'large'
        ? 'modal-large'
        : size === 'picker'
          ? 'picker-modal'
          : ''

  return (
    <div className="modal-overlay modal-open" onClick={onClose}>
      <div
        className={`modal modal-content-open ${sizeClass}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="picker-header">
            <h3>{title}</h3>
            <button className="modal-close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        )}
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
