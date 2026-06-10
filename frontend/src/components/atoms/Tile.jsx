import { useState } from 'react'

export default function Tile({ label = '?', tileIndex = 0, size = 46, imageUrl = '' }) {
  const i = ((tileIndex % 6) + 6) % 6
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = imageUrl && !imgFailed

  return (
    <div style={{
      width: size, height: size, borderRadius: 'var(--radius-tile)', flexShrink: 0,
      background: showImage ? 'var(--color-surface3)' : `var(--tile-${i}-bg)`,
      color: `var(--tile-${i}-fg)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700,
      fontSize: Math.round(size * 0.42),
      overflow: 'hidden',
      border: showImage ? '1px solid var(--color-border)' : 'none',
    }}>
      {showImage ? (
        <img
          src={imageUrl}
          alt={label}
          loading="lazy"
          onError={() => setImgFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2, boxSizing: 'border-box' }}
        />
      ) : (
        (label[0] ?? '?').toUpperCase()
      )}
    </div>
  )
}
