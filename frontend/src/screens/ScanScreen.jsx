import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { startCamera, stopCamera, startScan, requestCameraPermission, toggleTorch } from '../lib/scanner'
import Icon from '../components/atoms/Icon'
import Tile from '../components/atoms/Tile'

export default function ScanScreen({ onItemAdded }) {
  const lang = useStore(s => s.lang)
  const t = useT(lang)
  const ts = t.scan
  const activeHouseholdId = useStore(s => s.activeHouseholdId)
  const households = useStore(s => s.households)
  const upsertItem = useStore(s => s.upsertItem)
  const setNewItemId = useStore(s => s.setNewItemId)
  const addToast = useStore(s => s.addToast)

  const hh = households.find(h => h.id === activeHouseholdId)

  const videoRef = useRef()
  const streamRef = useRef()
  const stopScanRef = useRef()

  const [phase, setPhase] = useState('scanning')
  const [foundEan, setFoundEan] = useState('')
  const [product, setProduct] = useState(null)
  const [manualEan, setManualEan] = useState('')
  const [manualName, setManualName] = useState('')
  const [location, setLocation] = useState('fridge')
  const [expiresAt, setExpiresAt] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [assignedTo, setAssignedTo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  useEffect(() => {
    initCamera()
    return () => cleanup()
  }, [])

  async function initCamera() {
    try {
      const permitted = await requestCameraPermission()
      if (!permitted) { setPhase('noCam'); return }
      const stream = await startCamera(videoRef.current)
      streamRef.current = stream
      // Check torch support
      const track = stream.getVideoTracks()[0]
      const caps = track?.getCapabilities?.()
      if (caps?.torch) setTorchSupported(true)
      const stop = await startScan(videoRef.current, handleFound)
      stopScanRef.current = stop
    } catch {
      setPhase('noCam')
    }
  }

  function cleanup() {
    stopScanRef.current?.()
    stopCamera(streamRef.current)
  }

  async function handleTorch() {
    const next = !torchOn
    const ok = await toggleTorch(streamRef.current, next)
    if (ok) setTorchOn(next)
  }

  const handleFound = useCallback(async (ean) => {
    stopScanRef.current?.()
    setFoundEan(ean)
    setPhase('found')
    setTimeout(async () => {
      setPhase('adding')
      try {
        const p = await api.products.lookup(ean)
        setProduct(p)
        if (p.name) setManualName(p.name)
      } catch {}
    }, 650)
  }, [])

  async function lookupManual() {
    if (!manualEan.trim()) return
    setLookupLoading(true)
    try {
      const p = await api.products.lookup(manualEan.trim())
      setProduct(p)
      if (p.name) setManualName(p.name)
      setFoundEan(manualEan.trim())
      setPhase('adding')
    } catch {
      addToast(ts.notFound)
    } finally {
      setLookupLoading(false)
    }
  }

  async function addItem() {
    if (!manualName.trim()) return
    setLoading(true)
    try {
      const item = await api.items.create(activeHouseholdId, {
        ean: foundEan || undefined,
        name: manualName.trim(),
        location,
        expires_at: expiresAt || null,
        quantity,
        assigned_to: assignedTo,
      })
      upsertItem(item)
      setNewItemId(item.id)
      setTimeout(() => setNewItemId(null), 2200)
      addToast(t.toast.added)
      onItemAdded()
    } catch (err) {
      if (err.offline) {
        // Queued for sync — optimistically add with temp id
        const tempItem = {
          id: `pending-${Date.now()}`,
          name: manualName.trim(),
          ean: foundEan || '',
          location,
          expires_at: expiresAt || null,
          quantity,
          tile_index: 0,
          household_id: activeHouseholdId,
          _pending: true,
        }
        upsertItem(tempItem)
        addToast(t.toast.offline ?? 'Sin conexión — cambios pendientes')
        onItemAdded()
      } else {
        addToast(t.toast.error)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── No Camera view ─────────────────────────────────────────────────────────
  if (phase === 'noCam') {
    return (
      <div style={{
        minHeight: '100dvh', background: 'var(--color-bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '24px',
      }}>
        <Icon name="scan" size={48} color="var(--color-ink-faint)" style={{ marginBottom: 20 }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
          {ts.noCameraTitle}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', margin: '0 0 24px', textAlign: 'center' }}>
          {ts.noCameraHint}
        </p>
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
          <input
            value={manualEan}
            onChange={e => setManualEan(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookupManual()}
            placeholder="8410188012096"
            inputMode="numeric"
            maxLength={14}
            style={{
              flex: 1, height: 48, borderRadius: 'var(--radius-btn)',
              border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
              color: 'var(--color-ink)', padding: '0 14px', fontSize: 15,
              fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
              letterSpacing: '0.08em',
            }}
          />
          <button onClick={lookupManual} disabled={lookupLoading} style={{
            height: 48, borderRadius: 'var(--radius-btn)', background: 'var(--color-primary)',
            color: '#fff', border: 'none', padding: '0 18px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            {lookupLoading ? '…' : ts.lookup}
          </button>
        </div>

        {product && <AddItemForm {...{ product, manualName, setManualName, location, setLocation, expiresAt, setExpiresAt, quantity, setQuantity, assignedTo, setAssignedTo, members: hh?.members ?? [], ts, t, addItem, loading }} />}
      </div>
    )
  }

  // ── Camera view ────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--cam-bg)' }}>
      <video ref={videoRef} playsInline muted style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        opacity: phase === 'scanning' ? 1 : 0.4,
        transition: 'opacity 0.3s',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* Top buttons */}
      <div style={{ position: 'absolute', top: 60, left: 20, right: 20, display: 'flex', justifyContent: 'space-between' }}>
        <GlassBtn icon="x" onClick={onItemAdded} />
        {torchSupported && (
          <GlassBtn
            icon="flash"
            onClick={handleTorch}
            active={torchOn}
          />
        )}
      </div>

      {/* Viewfinder */}
      {phase === 'scanning' && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 252, height: 150,
        }}>
          {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => (
            <div key={`${v}${h}`} style={{
              position: 'absolute', [v]: 0, [h]: 0,
              width: 20, height: 20,
              borderTop: v === 'top' ? '2px solid white' : 'none',
              borderBottom: v === 'bottom' ? '2px solid white' : 'none',
              borderLeft: h === 'left' ? '2px solid white' : 'none',
              borderRight: h === 'right' ? '2px solid white' : 'none',
              borderRadius: h === 'left' && v === 'top' ? '3px 0 0 0'
                : h === 'right' && v === 'top' ? '0 3px 0 0'
                : h === 'left' && v === 'bottom' ? '0 0 0 3px' : '0 0 3px 0',
            }} />
          ))}
          <div style={{
            position: 'absolute', left: 8, right: 8, height: 2,
            background: 'var(--scan-line-color)',
            boxShadow: 'var(--scan-line-glow)',
            animation: 'ss-scanline 1.8s ease-in-out infinite',
            borderRadius: 2,
          }} />
        </div>
      )}

      {/* Found state */}
      {phase === 'found' && (
        <div style={{ position: 'absolute', bottom: 140, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-chip)', padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            animation: 'ss-pop 0.4s var(--ease-spring) both',
          }}>
            <Icon name="check" size={16} color="var(--color-primary)" />
            <span style={{ fontSize: 13, color: '#fff', letterSpacing: '0.12em', fontWeight: 600 }}>
              {foundEan}
            </span>
          </div>
        </div>
      )}

      {/* Add item sheet */}
      {phase === 'adding' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0',
          maxHeight: '85vh', overflowY: 'auto',
          animation: 'ss-fadeup 0.55s var(--ease-spring) both',
          padding: '16px 20px 40px',
        }}>
          <div style={{ width: 38, height: 5, borderRadius: 100, background: 'var(--color-border)', margin: '0 auto 16px' }} />
          <AddItemForm {...{ product, manualName, setManualName, location, setLocation, expiresAt, setExpiresAt, quantity, setQuantity, assignedTo, setAssignedTo, members: hh?.members ?? [], ts, t, addItem, loading }} />
        </div>
      )}

      {phase === 'scanning' && (
        <p style={{
          position: 'absolute', bottom: 110, left: 0, right: 0, textAlign: 'center',
          color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500,
        }}>
          {ts.hint}
        </p>
      )}
    </div>
  )
}

function GlassBtn({ icon, onClick, active = false }) {
  return (
    <button onClick={onClick} style={{
      width: 44, height: 44, borderRadius: '50%',
      background: active ? 'rgba(255,220,50,0.35)' : 'rgba(255,255,255,0.18)',
      backdropFilter: 'blur(14px)',
      border: active ? '0.5px solid rgba(255,220,50,0.7)' : '0.5px solid rgba(255,255,255,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      <Icon name={icon} size={20} color={active ? '#FFE040' : '#fff'} />
    </button>
  )
}

function AddItemForm({ product, manualName, setManualName, location, setLocation, expiresAt, setExpiresAt, quantity, setQuantity, assignedTo, setAssignedTo, members, ts, t, addItem, loading }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 'var(--radius-tile)',
          background: 'var(--tile-0-bg)', color: 'var(--tile-0-fg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, flexShrink: 0,
        }}>
          {(manualName[0] ?? '?').toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <input
            value={manualName}
            onChange={e => setManualName(e.target.value)}
            placeholder={ts.manualName}
            style={{
              width: '100%', fontSize: 17, fontWeight: 600, color: 'var(--color-ink)',
              background: 'none', border: 'none', outline: 'none',
              fontFamily: 'var(--font-body)', padding: 0, boxSizing: 'border-box',
            }}
          />
          {product && (
            <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 2, fontWeight: 600 }}>
              {ts.source}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 8 }}>
          {ts.location}
        </label>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6,
          background: 'var(--color-surface2)', borderRadius: 'var(--radius-seg)', padding: 4,
        }}>
          {ts.locations.map((label, i) => {
            const key = ts.locationKeys[i]
            return (
              <button key={key} onClick={() => setLocation(key)} style={{
                borderRadius: 10, padding: '8px 4px', fontSize: 13, fontWeight: 600,
                background: location === key ? 'var(--color-surface)' : 'transparent',
                color: location === key ? 'var(--color-ink)' : 'var(--color-ink-soft)',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                boxShadow: location === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'background 0.2s',
              }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 6 }}>
            {ts.expiry}
          </label>
          <input
            type="date"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            style={{
              width: '100%', height: 44, borderRadius: 'var(--radius-btn)',
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              color: 'var(--color-ink)', padding: '0 10px', fontSize: 14,
              fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 6 }}>
            {ts.qty}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface2)',
              border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>−</button>
            <span style={{ fontSize: 17, fontWeight: 700, minWidth: 24, textAlign: 'center', color: 'var(--color-ink)' }}>
              {quantity}
            </span>
            <button onClick={() => setQuantity(q => q + 1)} style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface2)',
              border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>+</button>
          </div>
        </div>
      </div>

      {members.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 8 }}>
            {ts.assignee}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {members.map(m => (
              <button key={m.id} onClick={() => setAssignedTo(assignedTo === m.id ? null : m.id)} style={{
                width: 38, height: 38, borderRadius: '50%',
                background: `var(--avatar-${m.avatar_index % 4})`,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 15,
                opacity: assignedTo && assignedTo !== m.id ? 0.4 : 1,
                boxShadow: assignedTo === m.id ? `0 0 0 2.5px var(--color-primary)` : 'none',
                transition: 'opacity 0.2s, box-shadow 0.2s',
              }}>
                {m.display_name[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="ss-btn-primary" onClick={addItem} disabled={loading || !manualName.trim()} style={{
        width: '100%', height: 52, borderRadius: 'var(--radius-btn)',
        color: 'var(--color-on-primary)', border: 'none',
        fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)', opacity: (loading || !manualName.trim()) ? 0.6 : 1,
      }}>
        {loading ? '…' : ts.cta}
      </button>
    </div>
  )
}
