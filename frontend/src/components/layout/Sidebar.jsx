import { useStore } from '../../lib/store'
import Icon from '../atoms/Icon'
import Avatar from '../atoms/Avatar'

export default function Sidebar({ activeTab, onTabChange, t, collapsed }) {
  const session = useStore(s => s.session)
  const households = useStore(s => s.households)
  const activeHouseholdId = useStore(s => s.activeHouseholdId)
  const hh = households.find(h => h.id === activeHouseholdId)

  const w = collapsed ? 68 : 224

  return (
    <aside style={{
      width: w, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      padding: collapsed ? '20px 10px' : '20px 14px',
      boxSizing: 'border-box',
      transition: 'width 0.35s var(--ease-spring)',
      overflow: 'hidden',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        marginBottom: 24, flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(35,122,75,0.3)',
        }}>
          <Icon name="scan" size={18} color="#fff" />
        </div>
        {!collapsed && (
          <span style={{
            fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em',
            color: 'var(--color-ink)', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-display)',
          }}>
            Scan & Save
          </span>
        )}
      </div>

      {/* Scan CTA */}
      <button
        onClick={() => onTabChange('scan')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: collapsed ? 0 : 9,
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 14, padding: collapsed ? '12px 0' : '12px 0',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(35,122,75,0.32)',
          marginBottom: 18, flexShrink: 0,
          fontFamily: 'var(--font-body)',
          transition: 'transform 0.2s var(--ease-spring)',
        }}
        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.96)' }}
        onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
        onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <Icon name="scan" size={18} color="#fff" />
        {!collapsed && <span>{t.tabs.scan}</span>}
      </button>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { key: 'inventory', icon: 'basket', label: t.tabs.inventory },
          { key: 'shopping',  icon: 'cart',   label: t.tabs.shopping },
          { key: 'home',      icon: 'home',   label: t.tabs.home },
        ].map(({ key, icon, label }) => {
          const active = activeTab === key
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '11px 0' : '11px 13px',
                borderRadius: 13, border: 'none', cursor: 'pointer',
                background: active ? 'var(--color-primary-tint)' : 'transparent',
                color: active ? 'var(--color-primary)' : 'var(--color-ink-soft)',
                fontSize: 14, fontWeight: active ? 700 : 600,
                fontFamily: 'var(--font-body)',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              <Icon name={icon} size={20} color="currentColor" />
              {!collapsed && <span>{label}</span>}
            </button>
          )
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Household pill */}
      {hh && (
        <button
          onClick={() => onTabChange('inventory')}
          style={{
            display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '9px 0' : '9px 11px',
            borderRadius: 13, border: '1px solid var(--color-border)',
            background: 'var(--color-bg)', cursor: 'pointer',
            flexShrink: 0, fontFamily: 'var(--font-body)',
          }}
        >
          <Avatar
            name={session?.display_name ?? '?'}
            avatarIndex={session?.avatar_index ?? 0}
            size={28}
          />
          {!collapsed && (
            <>
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hh.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>
                  {session?.display_name ?? ''}
                </div>
              </div>
              <Icon name="chevDown" size={12} color="var(--color-ink-faint)" />
            </>
          )}
        </button>
      )}
    </aside>
  )
}
