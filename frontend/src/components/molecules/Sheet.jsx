import { useEffect, useRef } from 'react'

export default function Sheet({ open, onClose, children, title }) {
  const overlayRef = useRef()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div
        ref={overlayRef}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(8,16,11,0.45)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s var(--ease-spring)',
        }}
      />
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0',
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.55s var(--ease-spring)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 38, height: 5, borderRadius: 100, background: 'var(--color-border)' }} />
        </div>

        {title && (
          <div style={{
            padding: '0 20px 14px',
            fontSize: 17, fontWeight: 700,
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-display)',
            letterSpacing: 'var(--letter-spacing-display)',
          }}>
            {title}
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, padding: '0 20px 32px' }}>
          {children}
        </div>
      </div>
    </>
  )
}
