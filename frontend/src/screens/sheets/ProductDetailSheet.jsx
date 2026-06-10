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

  const item = items.find(i => i.id === itemId)
  if (!item) return null

  const days = daysUntil(item.expires_at)
  const kind = expiryKind(days)
  const dt = t?.detail ?? {}

  async function consume() {
    const snapshot = { ...item }
    upsertItem({ ...item, quantity: Math.max(0, item.quantity - 1) })
    try {
      const res = await api.items.consume(activeHouseholdId, item.id)
      if (res.deleted) {
        removeItem(item.id)
        onClose()
        // Last unit gone → auto-add to shopping list
        try {
          await api.shopping.add(activeHouseholdId, { name: item.name, ean: item.ean || '' })
          window.dispatchEvent(new CustomEvent('ss-shopping-changed'))
          addToast(t?.shop?.autoAdded?.(item.name) ?? `${item.name} → compras`)
        } catch {
          addToast(t?.toast?.consumed ?? 'Consumido')
        }
      } else {
        upsertItem({ id: item.id, quantity: res.quantity })
        addToast(t?.toast?.consumed ?? 'Consumido')
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
      onClose()
      addToast(t?.toast?.removed ?? 'Eliminado')
    } catch {
      // Restore item and keep sheet open so user sees the failure
      upsertItem(snapshot)
      addToast(t?.toast?.error ?? 'Error')
    }
  }

  return (
    <Sheet open={open} onClose={onClose}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <Tile label={item.name} tileIndex={item.tile_index} size={54} imageUrl={item.image_url} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>
            {item.name}
          </div>
          {item.expires_at && <Badge label={expiryLabel(days, t)} kind={kind} />}
          {item._pending && (
            <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 4, fontStyle: 'italic' }}>
              {t?.toast?.offline ?? 'Pendiente de sincronización'}
            </div>
          )}
        </div>
      </div>

      {/* Info rows */}
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

      {/* Actions — disabled for pending items */}
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
        }}
        onPointerDown={e => { if (!item._pending) e.currentTarget.style.transform = 'scale(0.97)' }}
        onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
        onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
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
    </Sheet>
  )
}
