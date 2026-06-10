import Icon from '../atoms/Icon'

export default function TabBar({ activeTab, onTabChange, t }) {
  const tab = (key, icon, label) => {
    const active = activeTab === key
    return (
      <button
        key={key}
        onClick={() => onTabChange(key)}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 4, paddingTop: 12, paddingBottom: 0,
          color: active ? 'var(--color-primary)' : 'var(--color-ink-faint)',
          background: 'none', border: 'none', cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          transform: 'scale(1)',
          transition: 'transform 0.25s var(--ease-spring)',
        }}
        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.88)' }}
        onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
        onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <Icon name={icon} size={24} color="currentColor" />
        <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, letterSpacing: '0.01em' }}>
          {label}
        </span>
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
      background: 'var(--color-tab-bg)',
      backdropFilter: 'var(--glass-blur-tab)',
      WebkitBackdropFilter: 'var(--glass-blur-tab)',
      borderTop: '0.5px solid var(--color-border)',
      display: 'flex', alignItems: 'flex-start',
      paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      height: 88, boxSizing: 'border-box',
    }}>
      {tab('inventory', 'basket', t.tabs.inventory)}

      {/* Raised scan button */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => onTabChange('scan')}
          style={{
            width: 58, height: 58, borderRadius: '50%',
            background: 'var(--grad-primary)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: -22,
            boxShadow: 'var(--grad-primary-glow)',
            WebkitTapHighlightColor: 'transparent',
            transform: 'scale(1)',
            transition: 'transform 0.25s var(--ease-spring)',
          }}
          onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.9)' }}
          onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <Icon name="scan" size={28} color="var(--color-on-primary)" />
        </button>
        <span style={{
          fontSize: 11, fontWeight: activeTab === 'scan' ? 700 : 500,
          color: activeTab === 'scan' ? 'var(--color-primary)' : 'var(--color-ink-faint)',
          letterSpacing: '0.01em',
        }}>
          {t.tabs.scan}
        </span>
      </div>

      {tab('home', 'home', t.tabs.home)}
    </div>
  )
}
