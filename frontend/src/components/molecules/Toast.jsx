import { useStore } from '../../lib/store'

export default function ToastStack() {
  const toastQueue = useStore(s => s.toastQueue)
  const removeToast = useStore(s => s.removeToast)
  return (
    <div style={{
      position: 'fixed', bottom: 104, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      pointerEvents: 'none',
    }}>
      {toastQueue.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }) {
  function runAction() {
    toast.action?.onClick?.()
    onDismiss()
  }

  return (
    <div style={{
      background: 'var(--color-ink)', color: 'var(--color-bg)',
      borderRadius: 'var(--radius-chip)', padding: '9px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-body)',
      whiteSpace: 'nowrap',
      animation: 'ss-fadeup 0.35s var(--ease-spring) both',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      pointerEvents: 'auto',
    }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 26, strokeDashoffset: 0, animation: 'ss-checkdraw 0.4s 0.1s ease both' }}
        />
      </svg>
      {toast.label}
      {toast.action && (
        <button onClick={runAction} style={{
          background: 'rgba(255,255,255,0.16)', color: 'inherit',
          border: 'none', borderRadius: 100, padding: '4px 12px',
          fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'var(--font-body)', marginLeft: 2,
        }}>
          {toast.action.label}
        </button>
      )}
    </div>
  )
}
