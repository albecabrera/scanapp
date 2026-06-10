export default function Tile({ label = '?', tileIndex = 0, size = 46 }) {
  const i = ((tileIndex % 6) + 6) % 6
  return (
    <div style={{
      width: size, height: size, borderRadius: 'var(--radius-tile)', flexShrink: 0,
      background: `var(--tile-${i}-bg)`, color: `var(--tile-${i}-fg)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700,
      fontSize: Math.round(size * 0.42),
    }}>
      {(label[0] ?? '?').toUpperCase()}
    </div>
  )
}
