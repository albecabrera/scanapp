const COLORS = ['var(--avatar-0)', 'var(--avatar-1)', 'var(--avatar-2)', 'var(--avatar-3)']

export default function Avatar({ name = '?', avatarIndex = 0, size = 28, ring = false, style }) {
  const bg = COLORS[avatarIndex % COLORS.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700,
      fontSize: Math.round(size * 0.42), letterSpacing: '0.02em',
      boxShadow: ring ? `0 0 0 2.5px var(--color-primary)` : 'none',
      ...style,
    }}>
      {(name[0] ?? '?').toUpperCase()}
    </div>
  )
}

export function AvatarStack({ members = [], size = 24, max = 3 }) {
  const visible = members.slice(0, max)
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((m, i) => (
        <Avatar
          key={m.id}
          name={m.display_name}
          avatarIndex={m.avatar_index}
          size={size}
          style={{ marginLeft: i > 0 ? -size * 0.3 : 0, boxShadow: '0 0 0 1.5px var(--color-bg)' }}
        />
      ))}
    </div>
  )
}
