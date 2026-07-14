import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { suggestExpiryDays, addDays } from '../lib/expirySuggest'
import Icon from '../components/atoms/Icon'
import Avatar from '../components/atoms/Avatar'
import LangSwitcher from '../components/atoms/LangSwitcher'

export default function ShoppingScreen() {
  const lang = useStore(s => s.lang)
  const t = useT(lang)
  const ts = t.shop
  const activeHouseholdId = useStore(s => s.activeHouseholdId)
  const addToast = useStore(s => s.addToast)
  const theme = useStore(s => s.theme)
  const setTheme = useStore(s => s.setTheme)

  const isDark = theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    api.auth.update({ theme: next }).catch(() => {})
  }

  const [items, setItems] = useState([])
  const [input, setInput] = useState('')
  const [qty, setQty] = useState(1)
  const [unit, setUnit] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeHouseholdId) return
    api.shopping.list(activeHouseholdId).then(r => setItems(r.items)).catch(() => {})
  }, [activeHouseholdId])

  // Refresh when an item is auto-added elsewhere (consume last unit)
  useEffect(() => {
    const handler = () => {
      api.shopping.list(activeHouseholdId).then(r => setItems(r.items)).catch(() => {})
    }
    window.addEventListener('ss-shopping-changed', handler)
    return () => window.removeEventListener('ss-shopping-changed', handler)
  }, [activeHouseholdId])

  async function add() {
    const name = input.trim()
    if (!name) return
    setLoading(true)
    setInput('')
    setQty(1)
    setUnit('')
    try {
      const item = await api.shopping.add(activeHouseholdId, { name, quantity: qty, unit })
      setItems(prev => {
        const idx = prev.findIndex(i => i.id === item.id)
        return idx >= 0 ? prev.map((i, n) => n === idx ? item : i) : [item, ...prev]
      })
    } catch {
      addToast(t.toast.error)
    } finally {
      setLoading(false)
    }
  }

  async function toggle(item) {
    const next = !item.checked
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: next } : i))
    try {
      await api.shopping.update(activeHouseholdId, item.id, { checked: next })
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: !next } : i))
    }
  }

  async function remove(item) {
    setItems(prev => prev.filter(i => i.id !== item.id))
    try {
      await api.shopping.delete(activeHouseholdId, item.id)
    } catch {
      setItems(prev => [item, ...prev])
    }
  }

  // Move a bought item into the inventory with a smart expiry suggestion
  async function moveToInventory(item) {
    const suggested = suggestExpiryDays(item.name)
    setItems(prev => prev.filter(i => i.id !== item.id))
    try {
      const created = await api.items.create(activeHouseholdId, {
        ean: item.ean || undefined,
        name: item.name,
        quantity: item.quantity,
        location: 'pantry',
        expires_at: suggested ? addDays(suggested) : null,
      })
      useStore.getState().upsertItem(created)
      await api.shopping.delete(activeHouseholdId, item.id)
      addToast(ts.movedToInventory(item.name))
    } catch {
      setItems(prev => [item, ...prev])
      addToast(t.toast.error)
    }
  }

  async function clearChecked() {
    const checked = items.filter(i => i.checked)
    if (!checked.length) return
    setItems(prev => prev.filter(i => !i.checked))
    try {
      await api.shopping.clearChecked(activeHouseholdId)
    } catch {
      setItems(prev => [...prev, ...checked])
    }
  }

  const pending = items.filter(i => !i.checked)
  const done = items.filter(i => i.checked)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', padding: 'var(--safe-top) var(--content-gutter) 120px', overflowY: 'auto' }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{
              fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px',
              color: 'var(--color-ink)', fontFamily: 'var(--font-display)',
            }}>
              {ts.title}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', margin: 0 }}>
              {ts.pending(pending.length)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LangSwitcher />
            <GlassIconBtn onClick={toggleTheme}>
              <Icon name={isDark ? 'sun' : 'moon'} size={19} color="var(--color-ink)" />
            </GlassIconBtn>
          </div>
        </div>

        {/* Add form */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder={ts.placeholder}
              style={{
                flex: 1, height: 48, borderRadius: 'var(--radius-btn)',
                border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
                color: 'var(--color-ink)', padding: '0 14px', fontSize: 15,
                fontFamily: 'var(--font-body)', outline: 'none',
              }}
            />
            <button className="ss-btn-primary" onClick={add} disabled={loading || !input.trim()} style={{
              height: 48, borderRadius: 'var(--radius-btn)', color: 'var(--color-on-primary)',
              border: 'none', padding: '0 18px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              opacity: (loading || !input.trim()) ? 0.6 : 1,
            }}>
              {ts.add}
            </button>
          </div>

          {/* Qty stepper + unit chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
            {/* Qty stepper */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-chip)', overflow: 'hidden', flexShrink: 0,
            }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
                width: 32, height: 32, background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 16, color: 'var(--color-ink-soft)',
                fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>−</button>
              <span style={{
                minWidth: 26, textAlign: 'center', fontSize: 13, fontWeight: 700,
                color: 'var(--color-ink)', userSelect: 'none',
              }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{
                width: 32, height: 32, background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 16, color: 'var(--color-ink-soft)',
                fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>+</button>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: 'var(--color-border)', flexShrink: 0 }} />

            {/* Unit chips */}
            {ts.unitKeys.map(key => {
              const active = unit === key
              return (
                <button key={key} onClick={() => setUnit(key)} style={{
                  flexShrink: 0, height: 32, padding: '0 11px',
                  borderRadius: 'var(--radius-chip)',
                  background: active ? 'var(--color-ink)' : 'var(--color-surface)',
                  color: active ? 'var(--color-bg)' : 'var(--color-ink-soft)',
                  border: active ? 'none' : '1px solid var(--color-border)',
                  fontSize: 12.5, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  transition: 'background 0.15s, color 0.15s',
                }}>
                  {ts.unitLabel[key]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
            <p style={{ fontSize: 15, color: 'var(--color-ink-soft)', marginBottom: 6 }}>{ts.empty}</p>
            <p style={{ fontSize: 13, color: 'var(--color-ink-faint)' }}>{ts.emptyHint}</p>
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)',
            overflow: 'hidden', marginBottom: 'var(--space-section)',
          }}>
            {pending.map((item, idx) => (
              <Row key={item.id} item={item} idx={idx} onToggle={toggle} onRemove={remove} unitLabel={ts.unitLabel} />
            ))}
          </div>
        )}

        {/* Done */}
        {done.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-ink-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                ✓
              </p>
              <button onClick={clearChecked} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: 'var(--color-primary)',
                fontFamily: 'var(--font-body)', padding: 4,
              }}>
                {ts.clearChecked}
              </button>
            </div>
            <div style={{
              background: 'var(--color-surface)', borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)', overflow: 'hidden', opacity: 0.8,
            }}>
              {done.map((item, idx) => (
                <Row key={item.id} item={item} idx={idx} onToggle={toggle} onRemove={remove}
                  onMove={moveToInventory} moveLabel={ts.toInventory} unitLabel={ts.unitLabel} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function GlassIconBtn({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      width: 38, height: 38, borderRadius: 'var(--radius-chip)',
      background: 'var(--glass-bg-light)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      border: 'var(--glass-border-light)', boxShadow: 'var(--glass-shine-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      transition: 'background 0.2s',
      ...style,
    }}>
      {children}
    </button>
  )
}

function Row({ item, idx, onToggle, onRemove, onMove = null, moveLabel = '', unitLabel = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 13,
      padding: '12px 16px',
      borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none',
    }}>
      {/* Checkbox */}
      <button onClick={() => onToggle(item)} style={{
        width: 26, height: 26, borderRadius: 9, flexShrink: 0,
        border: item.checked ? 'none' : '2px solid var(--color-border-strong)',
        background: item.checked ? 'var(--color-primary)' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s, border-color 0.2s',
        padding: 0,
      }}>
        {item.checked && (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--color-on-primary)">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 15, fontWeight: 600,
          color: item.checked ? 'var(--color-ink-faint)' : 'var(--color-ink)',
          textDecoration: item.checked ? 'line-through' : 'none',
        }}>
          {item.name}
        </span>
        {(item.unit || item.quantity > 1) && (
          <span style={{
            fontSize: 12.5, fontWeight: 500, marginLeft: 7,
            color: item.checked ? 'var(--color-ink-faint)' : 'var(--color-ink-soft)',
            background: 'var(--color-surface2)', borderRadius: 6,
            padding: '2px 7px', display: 'inline-block',
          }}>
            {item.quantity}{item.unit ? ' ' + (unitLabel[item.unit] ?? item.unit) : ''}
          </span>
        )}
      </div>

      {onMove && (
        <button onClick={() => onMove(item)} style={{
          background: 'var(--color-primary-tint)', color: 'var(--color-primary)',
          border: 'none', borderRadius: 'var(--radius-chip)', padding: '6px 12px',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'var(--font-body)', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Icon name="basket" size={13} color="currentColor" />
          {moveLabel}
        </button>
      )}

      <Avatar name={item.added_by.display_name} avatarIndex={item.added_by.avatar_index} size={20} />

      <button onClick={() => onRemove(item)} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 6,
        color: 'var(--color-ink-faint)', display: 'flex',
      }}>
        <Icon name="x" size={15} color="currentColor" />
      </button>
    </div>
  )
}
