const STYLES = {
  danger:  { background: 'var(--color-danger-bg)',  color: 'var(--color-danger)' },
  warn:    { background: 'var(--color-warn-bg)',    color: 'var(--color-warn)' },
  neutral: { background: 'var(--color-surface2)',  color: 'var(--color-ink-soft)' },
}

export default function Badge({ label, kind = 'neutral' }) {
  return (
    <span style={{
      ...STYLES[kind],
      borderRadius: 'var(--radius-chip)',
      padding: '3px 9px',
      fontSize: 12, fontWeight: 600,
      fontFamily: 'var(--font-body)',
      whiteSpace: 'nowrap', lineHeight: '16px',
      display: 'inline-block',
    }}>
      {label}
    </span>
  )
}
