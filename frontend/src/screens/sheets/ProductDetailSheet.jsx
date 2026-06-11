import { useState } from 'react'
import { useStore } from '../../lib/store'
import { daysUntil, expiryKind, expiryLabel } from '../../lib/expiry'
import { api } from '../../lib/api'
import Sheet from '../../components/molecules/Sheet'
import Tile from '../../components/atoms/Tile'
import Badge from '../../components/atoms/Badge'

export default function ProductDetailSheet({ open, itemId, onClose, t }) {
  const items = useStore(s => s.items)
  const removeItem = useStore(s => s.removeItem)
  const upsertItem = useStore(s => s.upsertItem)
  const addToast = useStore(s => s.addToast)
  const activeHouseholdId = useStore(s => s.activeHouseholdId)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const item = items.find(i => i.id === itemId)
  if (!item) return null

  const days = daysUntil(item.expires_at)
  const kind = expiryKind(days)
  const dt = t?.detail ?? {}
  const undoLabel = t?.toast?.undo ?? 'Deshacer'

  function startEdit() {
    setForm({
      name: item.name,
      location: item.location,
      expires_at: item.expires_at ?? '',
      quantity: item.quantity,
    })
    setEditing(true)
  }

  function closeAll() {
    setEditing(false)
    setForm(null)
    onClose()
  }

  async function saveEdit() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      location: form.location,
      expires_at: form.expires_at || null,
      quantity: form.quantity,
    }
    try {
      const updated = await api.items.update(activeHouseholdId, item.id, payload)
      upsertItem(updated)
      setEditing(false)
      addToast(t?.toast?.saved ?? 'Guardado')
    } catch {
      addToast(t?.toast?.error ?? 'Error')
    } finally {
      setSaving(false)
    }
  }

  // Re-create a deleted item from its snapshot (undo for delete / consume-last)
  async function recreate(snapshot) {
    try {
      const created = await api.items.create(activeHouseholdId, {
        ean: snapshot.ean || undefined,
        name: snapshot.name,
        location: snapshot.location,
        expires_at: snapshot.expires_at,
        quantity: snapshot.quantity,
        assigned_to: snapshot.assigned_to?.id ?? null,
      })
      upsertItem(created)
      addToast(t?.toast?.restored ?? 'Restaurado')
    } catch {
      addToast(t?.toast?.error ?? 'Error')
    }
  }

  async function consume() {
    const snapshot = { ...item }
    upsertItem({ ...item, quantity: Math.max(0, item.quantity - 1) })
    try {
      const res = await api.items.consume(activeHouseholdId, item.id)
      if (res.deleted) {
        removeItem(item.id)
        closeAll()
        // Last unit gone → auto-add to shopping list, offer undo
        try {
          await api.shopping.add(activeHouseholdId, { name: item.name, ean: item.ean || '' })
          window.dispatchEvent(new CustomEvent('ss-shopping-changed'))
        } catch { /* shopping add is best-effort */ }
        addToast(
          t?.shop?.autoAdded?.(item.name) ?? `${item.name} → compras`,
          { label: undoLabel, onClick: () => recreate(snapshot) },
        )
      } else {
        upsertItem({ id: item.id, quantity: res.quantity })
        addToast(t?.toast?.consumed ?? 'Consumido', {
          label: undoLabel,
          onClick: async () => {
            try {
              const restored = await api.items.update(activeHouseholdId, item.id, { quantity: snapshot.quantity })
              upsertItem(restored)
            } catch {
              addToast(t?.toast?.error ?? 'Error')
            }
          },
        })
      }
    } catch {
      upsertItem(snapshot)
      addToast(t?.toast?.error ?? 'Error')
    }
  }

  async function remove() {
    const snapshot = { ...item }
    removeItem(item.id)
    try {
      await api.items.delete(activeHouseholdId, item.id)
      closeAll()
      addToast(t?.toast?.removed ?? 'Eliminado', {
        label: undoLabel,
        onClick: () => recreate(snapshot),
      })
    } catch {
      upsertItem(snapshot)
      addToast(t?.toast?.error ?? 'Error')
    }
  }

  const inputStyle = {
    width: '100%', height: 44, borderRadius: 'var(--radius-btn)',
    border: '1px solid var(--color-border)', background: 'var(--color-surface3)',
    color: 'var(--color-ink)', padding: '0 12px', fontSize: 14.5,
    fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = {
    fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink-soft)',
    display: 'block', marginBottom: 6,
  }

  return (
    <Sheet open={open} onClose={closeAll}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <Tile label={item.name} tileIndex={item.tile_index} size={54} imageUrl={item.image_url} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ ...inputStyle, fontWeight: 700, fontSize: 17 }}
            />
          ) : (
            <>
              <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>
                {item.name}
              </div>
              {item.expires_at && <Badge label={expiryLabel(days, t)} kind={kind} />}
              {item._pending && (
                <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 4, fontStyle: 'italic' }}>
                  {t?.toast?.offline ?? 'Pendiente de sincronización'}
                </div>
              )}
            </>
          )}
        </div>
        {!editing && !item._pending && (
          <button onClick={startEdit} style={{
            background: 'var(--color-surface2)', border: 'none', cursor: 'pointer',
            borderRadius: 'var(--radius-chip)', padding: '7px 14px',
            fontSize: 13, fontWeight: 600, color: 'var(--color-ink)',
            fontFamily: 'var(--font-body)', flexShrink: 0,
          }}>
            {dt.edit ?? 'Editar'}
          </button>
        )}
      </div>

      {editing ? (
        /* ── Edit form ── */
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{dt.location ?? 'Ubicación'}</label>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5,
              background: 'var(--color-surface2)', borderRadius: 'var(--radius-seg)', padding: 4,
            }}>
              {['fridge', 'freezer', 'pantry'].map(loc => (
                <button key={loc} onClick={() => setForm(f => ({ ...f, location: loc }))} style={{
                  borderRadius: 9, padding: '8px 4px', fontSize: 12.5, fontWeight: 600,
                  background: form.location === loc ? 'var(--color-surface)' : 'transparent',
                  color: form.location === loc ? 'var(--color-ink)' : 'var(--color-ink-soft)',
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  boxShadow: form.location === loc ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                  {t?.inv?.sections?.[loc] ?? loc}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>{dt.expiry ?? 'Vencimiento'}</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{dt.qty ?? 'Cantidad'}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44 }}>
                <QtyBtn onClick={() => setForm(f => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}>−</QtyBtn>
                <span style={{ fontSize: 17, fontWeight: 700, minWidth: 24, textAlign: 'center', color: 'var(--color-ink)' }}>
                  {form.quantity}
                </span>
                <QtyBtn onClick={() => setForm(f => ({ ...f, quantity: f.quantity + 1 }))}>+</QtyBtn>
              </div>
            </div>
          </div>

          <button className="ss-btn-primary" onClick={saveEdit} disabled={saving || !form.name.trim()} style={{
            width: '100%', height: 50, borderRadius: 'var(--radius-btn)',
            color: 'var(--color-on-primary)', border: 'none',
            fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 10,
            fontFamily: 'var(--font-body)',
            opacity: (saving || !form.name.trim()) ? 0.6 : 1,
          }}>
            {saving ? '…' : (dt.save ?? 'Guardar')}
          </button>
          <button onClick={() => setEditing(false)} style={{
            width: '100%', height: 44, borderRadius: 'var(--radius-btn)',
            background: 'none', color: 'var(--color-ink-soft)', border: 'none',
            fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            {dt.cancel ?? 'Cancelar'}
          </button>
        </>
      ) : (
        /* ── Read view ── */
        <>
          <div style={{
            background: 'var(--color-surface2)', borderRadius: 'var(--radius-card)',
            overflow: 'hidden', marginBottom: 20,
          }}>
            {[
              { label: dt.location ?? 'Ubicación', value: t?.inv?.sections?.[item.location] ?? item.location },
              { label: dt.expiry ?? 'Vencimiento', value: item.expires_at ? new Date(item.expires_at).toLocaleDateString() : (dt.noExpiry ?? '—') },
              { label: dt.qty ?? 'Cantidad', value: item.quantity },
              { label: dt.addedBy ?? 'Por', value: item.added_by?.display_name ?? '—' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i < arr.length - 1 ? '0.5px solid var(--color-border)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: 'var(--color-ink-soft)', fontWeight: 500 }}>{row.label}</span>
                <span style={{ fontSize: 14, color: 'var(--color-ink)', fontWeight: 600 }}>{String(row.value)}</span>
              </div>
            ))}
          </div>

          <button
            className="ss-btn-primary"
            onClick={consume}
            disabled={!!item._pending}
            style={{
              width: '100%', height: 50, borderRadius: 'var(--radius-btn)',
              color: 'var(--color-on-primary)', border: 'none',
              fontSize: 16, fontWeight: 700, cursor: item._pending ? 'not-allowed' : 'pointer',
              marginBottom: 12, fontFamily: 'var(--font-body)',
              opacity: item._pending ? 0.5 : 1,
            }}>
            {dt.consume ?? 'Consumir 1'}
          </button>

          <button
            onClick={remove}
            disabled={!!item._pending}
            style={{
              width: '100%', height: 44, borderRadius: 'var(--radius-btn)',
              background: 'none', color: 'var(--color-danger)', border: 'none',
              fontSize: 15, fontWeight: 600, cursor: item._pending ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              opacity: item._pending ? 0.5 : 1,
            }}>
            {dt.remove ?? 'Eliminar'}
          </button>
        </>
      )}
    </Sheet>
  )
}

function QtyBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface2)',
      border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {children}
    </button>
  )
}
