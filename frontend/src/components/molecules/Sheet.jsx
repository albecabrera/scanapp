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
      {/* Overlay con blur leve */}
      <div
        ref={overlayRef}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(8,16,11,0.40)',
          backdropFilter: 'blur(4px) saturate(120%)',
          WebkitBackdropFilter: 'blur(4px) saturate(120%)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 280ms var(--ease-gentle)',
        }}
      />

      {/* Sheet con glass fuerte */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          // Glass fill strong: claro rgba(255,255,255,0.92) / oscuro via CSS var
          background: 'var(--glass-fill-strong)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0',
          // Border luminoso superior
          borderTop: '0.5px solid var(--glass-border)',
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          // Entrada: spring-gentle (suave) / Salida: spring-snappy (rápida)
          transition: open
            ? 'transform 380ms var(--ease-gentle)'
            : 'transform 260ms var(--ease-snappy)',
          boxShadow: '0 -4px 48px rgba(0,0,0,0.14), 0 -1px 0 var(--glass-border)',
        }}
      >
        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{
            width: 38, height: 5, borderRadius: 100,
            // Claro: rgba(0,0,0,0.16) / Oscuro: rgba(255,255,255,0.22)
            background: 'var(--color-border-strong)',
          }} />
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
