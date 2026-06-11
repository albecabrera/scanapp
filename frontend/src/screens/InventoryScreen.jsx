import { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '../lib/api'
import { useStore, getActiveHousehold } from '../lib/store'
import { useT, translations, LANGS } from '../lib/i18n'
import { setCachedItems } from '../lib/idb'
import { daysUntil, expiryKind, expiryLabel, countExpiringSoon } from '../lib/expiry'
import { matchRecipes } from '../lib/recipes'
import { getInstallPrompt, clearInstallPrompt } from '../main'
import Icon from '../components/atoms/Icon'
import Avatar, { AvatarStack } from '../components/atoms/Avatar'
import Tile from '../components/atoms/Tile'
import Badge from '../components/atoms/Badge'
import Sheet from '../components/molecules/Sheet'
import ProductDetailSheet from './sheets/ProductDetailSheet'

const PTR_THRESHOLD = 72  // px of pull to trigger refresh

export default function InventoryScreen() {
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

  const theme = useStore(s => s.theme)
  const setTheme = useStore(s => s.setTheme)
  const setLangStore = useStore(s => s.setLang)

  const [refreshing, setRefreshing] = useState(false)
  const [pullY, setPullY] = useState(0)
  const [installable, setInstallable] = useState(false)
  const [query, setQuery] = useState('')
  const [langOpen, setLangOpen] = useState(false)

  const isDark = theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    api.auth.update({ theme: next }).catch(() => {})
  }

  function changeLang(l) {
    setLangStore(l)
    setLangOpen(false)
    api.auth.update({ lang: l }).catch(() => {})
  }
  const scrollRef = useRef()
  const touchStart = useRef(null)

  useEffect(() => {
    if (!activeHouseholdId) return
    api.items.list(activeHouseholdId).then(r => {
      setItems(r.items)
      setCachedItems(activeHouseholdId, r.items)
    }).catch(() => {})
  }, [activeHouseholdId])

  // Listen for PWA install availability
  useEffect(() => {
    const check = () => setInstallable(true)
    window.addEventListener('ss-installable', check)
    return () => window.removeEventListener('ss-installable', check)
  }, [])

  // Pull-to-refresh handlers
  const onTouchStart = useCallback((e) => {
    const el = scrollRef.current
    if (el && el.scrollTop === 0) {
      touchStart.current = e.touches[0].clientY
    }
  }, [])

  const onTouchMove = useCallback((e) => {
    if (touchStart.current === null) return
    const delta = e.touches[0].clientY - touchStart.current
    if (delta > 0 && scrollRef.current?.scrollTop === 0) {
      setPullY(Math.min(delta * 0.45, PTR_THRESHOLD))
    }
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (pullY >= PTR_THRESHOLD - 4 && !refreshing) {
      setRefreshing(true)
      setPullY(0)
      try {
        const r = await api.items.list(activeHouseholdId)
        setItems(r.items)
        setCachedItems(activeHouseholdId, r.items)
      } catch { /* ignore */ }
      setRefreshing(false)
    } else {
      setPullY(0)
    }
    touchStart.current = null
  }, [pullY, refreshing, activeHouseholdId])

  async function installPWA() {
    const prompt = getInstallPrompt()
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      clearInstallPrompt()
      setInstallable(false)
    }
  }

  const soonItems = items.filter(i => {
    const d = daysUntil(i.expires_at)
    return d !== null && d >= 0 && d <= 7
  })

  const LOCATIONS = ['fridge', 'freezer', 'pantry']
  const q = query.trim().toLowerCase()
  const filtered = items
    .filter(i => locationFilter === 'all' || i.location === locationFilter)
    .filter(i => !q || i.name.toLowerCase().includes(q) || (i.brand ?? '').toLowerCase().includes(q) || (i.ean ?? '').includes(q))
  const grouped = LOCATIONS.reduce((acc, loc) => {
    const group = filtered.filter(i => i.location === loc)
    if (group.length) acc.push({ loc, items: group })
    return acc
  }, [])

  const soonCount = countExpiringSoon(items)
  const recipes = matchRecipes(soonItems, lang)

  return (
    <div
      ref={scrollRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        minHeight: '100dvh', background: 'var(--color-bg)',
        paddingBottom: 100, overflowY: 'auto',
        transform: `translateY(${pullY}px)`,
        transition: pullY === 0 ? 'transform 0.3s var(--ease-spring)' : 'none',
      }}
    >
      {/* Pull-to-refresh indicator — fixed, outside content wrapper */}
      {(pullY > 0 || refreshing) && (
        <div style={{
          position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)', borderRadius: 20, padding: '6px 14px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)', fontSize: 13, fontWeight: 600,
          color: 'var(--color-primary)',
          opacity: Math.min((pullY / PTR_THRESHOLD) * 1.2, 1),
          transition: 'opacity 0.15s',
        }}>
          <div style={{
            width: 14, height: 14, border: '2px solid var(--color-primary)',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: refreshing ? 'ss-spin 0.7s linear infinite' : 'none',
            transform: refreshing ? 'none' : `rotate(${(pullY / PTR_THRESHOLD) * 360}deg)`,
          }} />
          {refreshing ? t.inv.refreshing : t.inv.pullToRefresh}
        </div>
      )}

      {/* Responsive content wrapper */}
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: 'var(--safe-top) var(--content-gutter) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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

          {/* Right controls: language, theme, bell */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Language picker */}
            <div style={{ position: 'relative' }}>
              <GlassIconBtn onClick={() => setLangOpen(o => !o)} active={langOpen}>
                <Icon name="globe" size={19} color="var(--color-ink)" />
              </GlassIconBtn>
              {langOpen && (
                <>
                  <div onClick={() => setLangOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
                  <div style={{
                    position: 'absolute', top: 44, right: 0, zIndex: 61,
                    background: 'var(--color-surface)', borderRadius: 16,
                    border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-float)',
                    padding: 6, minWidth: 150,
                    animation: 'ss-pop 0.25s var(--ease-spring) both',
                  }}>
                    {LANGS.map(l => (
                      <button key={l} onClick={() => changeLang(l)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '10px 12px', borderRadius: 11,
                        background: lang === l ? 'var(--color-primary-tint)' : 'transparent',
                        color: lang === l ? 'var(--color-primary)' : 'var(--color-ink)',
                        border: 'none', cursor: 'pointer', fontSize: 14,
                        fontWeight: lang === l ? 700 : 500, fontFamily: 'var(--font-body)',
                        textAlign: 'left',
                      }}>
                        {translations[l].langName}
                        {lang === l && <Icon name="check" size={15} color="var(--color-primary)" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme toggle */}
            <GlassIconBtn onClick={toggleTheme}>
              <Icon name={isDark ? 'sun' : 'moon'} size={19} color="var(--color-ink)" />
            </GlassIconBtn>

            {/* Bell */}
            <GlassIconBtn onClick={() => openSheetWith('notifications')} style={{ position: 'relative' }}>
              <Icon name="bell" size={20} color="var(--color-ink)" />
              {soonCount > 0 && (
                <div style={{
                  position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                  borderRadius: '50%', background: 'var(--color-danger)',
                }} />
              )}
            </GlassIconBtn>
          </div>
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

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 14,
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-chip)', padding: '0 16px', height: 44,
          boxShadow: 'var(--shadow-xs)',
        }}>
          <Icon name="search" size={17} color="var(--color-ink-faint)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.inv.search}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'none',
              fontSize: 14.5, color: 'var(--color-ink)', fontFamily: 'var(--font-body)',
              height: '100%',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              background: 'var(--color-surface2)', border: 'none', cursor: 'pointer',
              width: 22, height: 22, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: 0,
            }}>
              <Icon name="x" size={11} color="var(--color-ink-soft)" />
            </button>
          )}
        </div>
      </div>

      {/* PWA install banner */}
      {installable && (
        <div style={{
          margin: '16px var(--content-gutter) 0',
          background: 'var(--color-primary)', borderRadius: 'var(--radius-card)',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
          animation: 'ss-fadeup 0.4s var(--ease-spring) both',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {t.inv.installTitle}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
              {t.inv.installSub}
            </div>
          </div>
          <button onClick={installPWA} style={{
            background: '#fff', color: 'var(--color-primary)', border: 'none',
            borderRadius: 'var(--radius-btn)', padding: '8px 16px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>
            {t.inv.installCta}
          </button>
          <button onClick={() => setInstallable(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1,
          }}>×</button>
        </div>
      )}

      {/* Expiring soon carousel */}
      {soonItems.length > 0 && !q && (
        <div style={{ marginTop: 24 }}>
          <div style={{ padding: '0 var(--content-gutter)', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-ink-soft)', letterSpacing: '0.08em' }}>
              {t.inv.soon.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingLeft: 'var(--content-gutter)', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 4 }}>
            {soonItems.map(item => {
              const days = daysUntil(item.expires_at)
              const kind = expiryKind(days)
              return (
                <div key={item.id} className="ss-card-lift" onClick={() => openSheetWith('product-detail', item.id)} style={{
                  flexShrink: 0, width: 132, borderRadius: 'var(--radius-card)',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-xs)',
                  padding: '12px 12px 14px', cursor: 'pointer', scrollSnapAlign: 'start',
                  transition: 'transform 0.25s var(--ease-spring)',
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
                onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                  <div style={{ position: 'relative', marginBottom: 8, display: 'inline-block' }}>
                    <Tile label={item.name} tileIndex={item.tile_index} size={38} imageUrl={item.image_url} />
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

      {/* Recipe ideas with expiring items */}
      {recipes.length > 0 && !q && (
        <div style={{ marginTop: 24, padding: '0 var(--content-gutter)' }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-ink-soft)', letterSpacing: '0.08em' }}>
              {t.recipes.title.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recipes.map(r => (
              <div key={r.id} className="ss-card-lift" style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--color-surface)', borderRadius: 'var(--radius-card)',
                border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xs)',
                padding: '12px 16px',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-tile)', flexShrink: 0,
                  background: 'var(--color-primary-tint)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {r.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 2 }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--color-ink-soft)' }}>
                    {r.desc}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-primary)', fontWeight: 600, marginTop: 4 }}>
                    {t.recipes.with} {r.matched.slice(0, 3).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '16px var(--content-gutter) 0', overflowX: 'auto' }}>
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
      <div style={{ padding: '16px var(--content-gutter) 0' }}>
        {grouped.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ fontSize: 15, color: 'var(--color-ink-soft)', marginBottom: 8 }}>
              {q ? t.inv.noResults : t.inv.empty}
            </p>
            {!q && <p style={{ fontSize: 13, color: 'var(--color-ink-faint)' }}>{t.inv.emptyHint}</p>}
          </div>
        )}

        {grouped.map(({ loc, items: groupItems }) => (
          <div key={loc} className="ss-cv-auto" style={{ marginBottom: 'var(--space-section)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-ink-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                {t.inv.sections[loc]}
              </p>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-ink-faint)' }}>
                {groupItems.length}
              </span>
            </div>
            <div className="ss-item-grid" style={{
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
                    <Tile label={item.name} tileIndex={item.tile_index} size={46} imageUrl={item.image_url} />
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

      </div>{/* /content wrapper */}

      <ProductDetailSheet
        open={openSheet === 'product-detail'}
        itemId={activeItemId}
        onClose={closeSheet}
        t={t}
      />

      <HouseholdSwitcherSheet
        open={openSheet === 'household-switcher'}
        onClose={closeSheet}
        t={t}
      />
    </div>
  )
}

function GlassIconBtn({ children, onClick, active = false, style = {} }) {
  return (
    <button onClick={onClick} style={{
      width: 38, height: 38, borderRadius: 'var(--radius-chip)',
      background: active ? 'var(--color-primary-tint)' : 'var(--glass-bg-light)',
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
      setCachedItems(hh.id, r.items)
    } catch { /* ignore */ }
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
