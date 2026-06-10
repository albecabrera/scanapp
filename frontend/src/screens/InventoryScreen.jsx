import { useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useStore, getActiveHousehold } from '../lib/store'
import { useT } from '../lib/i18n'
import { daysUntil, expiryKind, expiryLabel, countExpiringSoon } from '../lib/expiry'
import Icon from '../components/atoms/Icon'
import Avatar, { AvatarStack } from '../components/atoms/Avatar'
import Tile from '../components/atoms/Tile'
import Badge from '../components/atoms/Badge'
import Sheet from '../components/molecules/Sheet'
import ProductDetailSheet from './sheets/ProductDetailSheet'

export default function InventoryScreen({ onOpenScan }) {
  const lang = useStore(s => s.lang)
  const t = useT(lang)
  const items = useStore(s => s.items)
  const setItems = useStore(s => s.setItems)
  const locationFilter = useStore(s => s.locationFilter)
  const setLocationFilter = useStore(s => s.setLocationFilter)
  const openSheet = useStore(s => s.openSheet)
  const activeItemId = useStore(s => s.activeItemId)
  const openSheetWith = useStore(s => s.openSheetWith)
  const closeSheet = useStore(s => s.closeSheet)
  const newItemId = useStore(s => s.newItemId)
  const activeHouseholdId = useStore(s => s.activeHouseholdId)
  const households = useStore(s => s.households)
  const hh = getActiveHousehold({ households, activeHouseholdId })

  useEffect(() => {
    if (!activeHouseholdId) return
    api.items.list(activeHouseholdId).then(r => setItems(r.items)).catch(() => {})
  }, [activeHouseholdId])

  const soonItems = items.filter(i => {
    const d = daysUntil(i.expires_at)
    return d !== null && d >= 0 && d <= 7
  })

  const LOCATIONS = ['fridge', 'freezer', 'pantry']
  const filtered = locationFilter === 'all' ? items : items.filter(i => i.location === locationFilter)
  const grouped = LOCATIONS.reduce((acc, loc) => {
    const group = filtered.filter(i => i.location === loc)
    if (group.length) acc.push({ loc, items: group })
    return acc
  }, [])

  const soonCount = countExpiringSoon(items)

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--color-bg)',
      paddingBottom: 100, overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '60px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          {/* Household pill */}
          <button onClick={() => openSheetWith('household-switcher')} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--glass-bg-light)', backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: 'var(--glass-border-light)',
            borderRadius: 'var(--radius-chip)', padding: '6px 12px 6px 8px',
            boxShadow: 'var(--glass-shine-light)', cursor: 'pointer',
          }}>
            {hh && <AvatarStack members={hh.members ?? []} size={22} max={3} />}
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)' }}>
              {hh?.name ?? '…'}
            </span>
            <Icon name="chevDown" size={14} color="var(--color-ink-soft)" />
          </button>

          {/* Bell */}
          <button onClick={() => openSheetWith('notifications')} style={{
            width: 38, height: 38, borderRadius: 'var(--radius-chip)',
            background: 'var(--glass-bg-light)', backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: 'var(--glass-border-light)', boxShadow: 'var(--glass-shine-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            position: 'relative',
          }}>
            <Icon name="bell" size={20} color="var(--color-ink)" />
            {soonCount > 0 && (
              <div style={{
                position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                borderRadius: '50%', background: 'var(--color-danger)',
              }} />
            )}
          </button>
        </div>

        <h1 style={{
          fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px',
          color: 'var(--color-ink)', fontFamily: 'var(--font-display)',
        }}>
          {t.inv.title}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', margin: 0 }}>
          {t.inv.summary(items.length, soonCount)}
        </p>
      </div>

      {/* Expiring soon carousel */}
      {soonItems.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink-soft)', letterSpacing: '0.02em' }}>
              {t.inv.soon.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingLeft: 20, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 4 }}>
            {soonItems.map(item => {
              const days = daysUntil(item.expires_at)
              const kind = expiryKind(days)
              return (
                <div key={item.id} onClick={() => openSheetWith('product-detail', item.id)} style={{
                  flexShrink: 0, width: 128, borderRadius: 'var(--radius-card)',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  padding: '12px 12px 14px', cursor: 'pointer', scrollSnapAlign: 'start',
                  transition: 'transform 0.25s var(--ease-spring)',
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
                onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                  <div style={{ position: 'relative', marginBottom: 8, display: 'inline-block' }}>
                    <Tile label={item.name} tileIndex={item.tile_index} size={38} />
                    <div style={{ position: 'absolute', top: -6, right: -6 }}>
                      <Badge label={expiryLabel(days, t)} kind={kind} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', marginTop: 8 }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-ink-soft)', marginTop: 2 }}>
                    {item.location === 'fridge' ? t.inv.sections.fridge : item.location === 'freezer' ? t.inv.sections.freezer : t.inv.sections.pantry}
                  </div>
                </div>
              )
            })}
            <div style={{ width: 12, flexShrink: 0 }} />
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 20px 0', overflowX: 'auto' }}>
        {t.inv.filters.map((label, i) => {
          const key = t.inv.filterKeys[i]
          const active = locationFilter === key
          return (
            <button key={key} onClick={() => setLocationFilter(key)} style={{
              borderRadius: 'var(--radius-chip)', padding: '7px 16px',
              background: active ? 'var(--color-ink)' : 'var(--color-surface)',
              color: active ? 'var(--color-bg)' : 'var(--color-ink-soft)',
              border: active ? 'none' : '1px solid var(--color-border)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
              fontFamily: 'var(--font-body)',
              transition: 'background 0.3s, color 0.3s',
            }}>
              {label}
            </button>
          )
        })}
      </div>

      {/* Item list by section */}
      <div style={{ padding: '16px 20px 0' }}>
        {grouped.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ fontSize: 15, color: 'var(--color-ink-soft)', marginBottom: 8 }}>{t.inv.empty}</p>
            <p style={{ fontSize: 13, color: 'var(--color-ink-faint)' }}>{t.inv.emptyHint}</p>
          </div>
        )}

        {grouped.map(({ loc, items: groupItems }) => (
          <div key={loc} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink-soft)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>
              {t.inv.sections[loc]}
            </p>
            <div style={{
              background: 'var(--color-surface)', borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)',
              overflow: 'hidden',
            }}>
              {groupItems.map((item, idx) => {
                const days = daysUntil(item.expires_at)
                const kind = expiryKind(days)
                const isNew = item.id === newItemId
                return (
                  <div
                    key={item.id}
                    onClick={() => openSheetWith('product-detail', item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '13px 16px',
                      borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none',
                      cursor: 'pointer',
                      animation: isNew ? 'ss-newitem 2s ease forwards' : 'none',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Tile label={item.name} tileIndex={item.tile_index} size={46} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 2 }}>
                        {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>
                        {item.brand || (item.ean || '')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      {item.expires_at && <Badge label={expiryLabel(days, t)} kind={kind} />}
                      {item.added_by && (
                        <Avatar name={item.added_by.display_name} avatarIndex={item.added_by.avatar_index} size={18} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Sheet */}
      <ProductDetailSheet
        open={openSheet === 'product-detail'}
        itemId={activeItemId}
        onClose={closeSheet}
        t={t}
      />

      {/* Household Switcher Sheet */}
      <HouseholdSwitcherSheet
        open={openSheet === 'household-switcher'}
        onClose={closeSheet}
        t={t}
      />
    </div>
  )
}

function HouseholdSwitcherSheet({ open, onClose, t }) {
  const households = useStore(s => s.households)
  const activeHouseholdId = useStore(s => s.activeHouseholdId)
  const setActiveHousehold = useStore(s => s.setActiveHousehold)
  const setItems = useStore(s => s.setItems)

  async function switchTo(hh) {
    setActiveHousehold(hh.id)
    onClose()
    try {
      const r = await api.items.list(hh.id)
      setItems(r.items)
    } catch {}
  }

  return (
    <Sheet open={open} onClose={onClose} title={t?.hh?.title ?? 'Hogar'}>
      {households.map(hh => {
        const active = hh.id === activeHouseholdId
        return (
          <button key={hh.id} onClick={() => switchTo(hh)} style={{
            width: '100%', background: 'none', border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)', padding: '14px 16px', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            boxShadow: active ? `0 0 0 4px rgba(35,122,75,0.12)` : 'none',
          }}>
            <AvatarStack members={hh.members ?? []} size={28} max={3} />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)' }}>{hh.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
                {(t?.hh?.membersCount ?? (n => `${n} m.`))(hh.member_count ?? hh.members?.length ?? 1)}
              </div>
            </div>
            {active && <Icon name="check" size={20} color="var(--color-primary)" />}
          </button>
        )
      })}
    </Sheet>
  )
}
