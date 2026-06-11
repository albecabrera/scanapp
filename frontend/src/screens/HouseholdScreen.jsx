import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useStore, getActiveHousehold } from '../lib/store'
import { useT, translations, LANGS } from '../lib/i18n'
import Avatar from '../components/atoms/Avatar'
import Icon from '../components/atoms/Icon'

export default function HouseholdScreen() {
  const lang = useStore(s => s.lang)
  const tFull = useT(lang)
  const t = tFull.hh
  const households = useStore(s => s.households)
  const activeHouseholdId = useStore(s => s.activeHouseholdId)
  const session = useStore(s => s.session)
  const addToast = useStore(s => s.addToast)

  const hh = getActiveHousehold({ households, activeHouseholdId })

  const [invite, setInvite] = useState(null)
  const [copied, setCopied] = useState(false)
  const [thresholds, setThresholds] = useState(['3'])
  const [warnAll, setWarnAll] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!hh) return
    api.households.inviteActive(hh.id).then(setInvite).catch(() => {})
    api.stats.get(hh.id).then(setStats).catch(() => {})
    api.notifications.get(hh.id).then(ns => {
      setThresholds(ns.threshold_days ?? ['3'])
      setWarnAll(ns.warn_all_tomorrow ?? false)
    }).catch(() => {})
  }, [hh?.id])

  async function generateCode() {
    setGenLoading(true)
    try {
      const inv = await api.households.inviteCreate(hh.id)
      setInvite(inv)
    } catch {
      addToast('Error')
    } finally {
      setGenLoading(false)
    }
  }

  function copyCode() {
    if (!invite?.code) return
    navigator.clipboard.writeText(invite.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  async function shareLink() {
    if (!invite?.share_url) return
    try {
      await navigator.share({ title: 'Scan & Save', url: invite.share_url })
    } catch {
      navigator.clipboard.writeText(invite.share_url).catch(() => {})
      addToast(t.copied)
    }
  }

  async function toggleThreshold(key) {
    const next = thresholds.includes(key)
      ? thresholds.filter(k => k !== key)
      : [...thresholds, key]
    setThresholds(next)
    try {
      await api.notifications.update(hh.id, { threshold_days: next, warn_all_tomorrow: warnAll })
    } catch { /* ignore */ }
  }

  async function toggleWarnAll() {
    const next = !warnAll
    setWarnAll(next)
    try {
      await api.notifications.update(hh.id, { threshold_days: thresholds, warn_all_tomorrow: next })
    } catch { /* ignore */ }
  }

  if (!hh) return null

  const isAdmin = hh.members?.find(m => m.id === session?.userId)?.role === 'admin'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', padding: 'var(--safe-top) var(--content-gutter) 100px', overflowY: 'auto' }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
      <h1 style={{
        fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 24px',
        color: 'var(--color-ink)', fontFamily: 'var(--font-display)',
      }}>
        {hh.name}
      </h1>

      {/* Invite card */}
      <Card style={{ background: 'var(--color-primary-tint)', border: '1px solid rgba(35,122,75,0.2)', marginBottom: 16 }}>
        <Label>{t.invite}</Label>
        {invite ? (
          <>
            <div style={{
              fontSize: 27, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-ink)',
              margin: '10px 0', fontFamily: 'var(--font-display)',
            }}>
              {invite.code}
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <ActionBtn onClick={copyCode} icon={copied ? 'check' : 'copy'}
                label={copied ? t.copied : t.copy}
                primary={copied} />
              <ActionBtn onClick={shareLink} icon="share" label={t.share} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: 0 }}>{t.inviteHint}</p>
          </>
        ) : (
          <button onClick={generateCode} disabled={genLoading} style={{
            marginTop: 10, padding: '10px 18px', borderRadius: 'var(--radius-btn)',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            {genLoading ? '…' : t.generateCode}
          </button>
        )}
      </Card>

      {/* Waste stats card */}
      {stats && (
        <Card style={{ marginBottom: 16 }}>
          <Label style={{ marginBottom: 14 }}>{tFull.stats.title}</Label>
          {(stats.month.consumed + stats.month.wasted + stats.month.added) === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', margin: 0 }}>{tFull.stats.noData}</p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                <StatBox value={stats.month.consumed} label={tFull.stats.consumed} color="var(--color-primary)" bg="var(--color-primary-tint)" />
                <StatBox value={stats.month.wasted} label={tFull.stats.wasted} color="var(--color-danger)" bg="var(--color-danger-bg)" />
                <StatBox value={stats.month.added} label={tFull.stats.added} color="var(--color-ink-soft)" bg="var(--color-surface2)" />
              </div>
              {/* Consumed vs wasted ratio bar */}
              {(stats.month.consumed + stats.month.wasted) > 0 && (
                <div style={{ display: 'flex', height: 8, borderRadius: 100, overflow: 'hidden', background: 'var(--color-surface2)' }}>
                  <div style={{
                    width: `${(stats.month.consumed / (stats.month.consumed + stats.month.wasted)) * 100}%`,
                    background: 'var(--color-primary)', transition: 'width 0.6s var(--ease-spring)',
                  }} />
                  <div style={{ flex: 1, background: 'var(--color-danger)' }} />
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Activity feed — shared-kitchen log */}
      {stats?.activity?.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Label style={{ marginBottom: 12 }}>{tFull.activity.title}</Label>
          {stats.activity.slice(0, 10).map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 0',
              borderBottom: i < Math.min(stats.activity.length, 10) - 1 ? '0.5px solid var(--color-border)' : 'none',
            }}>
              <Avatar name={a.user.display_name} avatarIndex={a.user.avatar_index} size={28} />
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: 'var(--color-ink-soft)' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{a.user.display_name}</span>
                {' '}{tFull.activity[a.action] ?? a.action}{' '}
                <span style={{ fontWeight: 600, color: a.action === 'wasted' ? 'var(--color-danger)' : 'var(--color-ink)' }}>
                  {a.item_name}{a.quantity > 1 ? ` ×${a.quantity}` : ''}
                </span>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--color-ink-faint)', flexShrink: 0 }}>
                {timeAgo(a.created_at, lang)}
              </span>
            </div>
          ))}
        </Card>
      )}

      {/* Members card */}
      <Card style={{ marginBottom: 16 }}>
        <Label style={{ marginBottom: 12 }}>{t.membersTitle}</Label>
        {(hh.members ?? []).map(m => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '11px 0',
            borderBottom: '0.5px solid var(--color-border)',
          }}>
            <Avatar name={m.display_name} avatarIndex={m.avatar_index} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>
                {m.display_name}
                {m.id === session?.userId && (
                  <span style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginLeft: 6 }}>· {t.you}</span>
                )}
              </div>
            </div>
            <RoleBadge role={m.role} t={t} />
          </div>
        ))}
      </Card>

      {/* Notification settings card */}
      {isAdmin && (
        <Card>
          <Label style={{ marginBottom: 12 }}>{t.notif}</Label>
          <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 12 }}>{t.notifLead}</p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {t.thresholdKeys.map((key, i) => {
              const active = thresholds.includes(key)
              return (
                <button key={key} onClick={() => toggleThreshold(key)} style={{
                  borderRadius: 'var(--radius-chip)', padding: '7px 14px',
                  background: active ? 'var(--color-primary-tint)' : 'var(--color-surface2)',
                  color: active ? 'var(--color-primary)' : 'var(--color-ink-soft)',
                  border: active ? '1px solid rgba(35,122,75,0.2)' : '1px solid transparent',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'background 0.2s, color 0.2s',
                }}>
                  {t.thresholds[i]}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>{t.allCritical}</span>
            <Toggle on={warnAll} onToggle={toggleWarnAll} />
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: 0 }}>{t.perOwner}</p>
        </Card>
      )}

      {/* Preferences: language + theme */}
      <PreferencesCard tFull={tFull} />
      </div>{/* /content wrapper */}
    </div>
  )
}

function PreferencesCard({ tFull }) {
  const lang = useStore(s => s.lang)
  const theme = useStore(s => s.theme)
  const setLang = useStore(s => s.setLang)
  const setTheme = useStore(s => s.setTheme)
  const ts = tFull.settings

  function changeLang(l) {
    setLang(l)
    api.auth.update({ lang: l }).catch(() => {})
  }

  function changeTheme(th) {
    setTheme(th)
    api.auth.update({ theme: th }).catch(() => {})
  }

  const segBtn = (active) => ({
    flex: 1, borderRadius: 10, padding: '9px 4px', fontSize: 13, fontWeight: active ? 700 : 500,
    background: active ? 'var(--color-surface)' : 'transparent',
    color: active ? 'var(--color-ink)' : 'var(--color-ink-soft)',
    border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
    transition: 'background 0.2s, color 0.2s',
  })

  const segWrap = {
    display: 'flex', gap: 4, background: 'var(--color-surface2)',
    borderRadius: 'var(--radius-seg)', padding: 4,
  }

  return (
    <Card style={{ marginTop: 16 }}>
      <Label style={{ marginBottom: 14 }}>{ts.title}</Label>

      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 8 }}>
        {ts.language}
      </p>
      <div style={{ ...segWrap, marginBottom: 18 }}>
        {LANGS.map(l => (
          <button key={l} onClick={() => changeLang(l)} style={segBtn(lang === l)}>
            {translations[l].langName}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 8 }}>
        {ts.theme}
      </p>
      <div style={segWrap}>
        {['light', 'dark', 'system'].map(th => (
          <button key={th} onClick={() => changeTheme(th)} style={segBtn(theme === th)}>
            {ts.themes[th]}
          </button>
        ))}
      </div>
    </Card>
  )
}

function StatBox({ value, label, color, bg }) {
  return (
    <div style={{
      background: bg, borderRadius: 'var(--radius-tile)', padding: '12px 8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-ink-soft)', marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--color-surface)', borderRadius: 'var(--radius-card)',
      border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)',
      padding: '16px', marginBottom: 16, ...style,
    }}>
      {children}
    </div>
  )
}

function Label({ children, style = {} }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink-soft)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 4px', ...style }}>
      {children}
    </p>
  )
}

function ActionBtn({ onClick, icon, label, primary }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
      borderRadius: 'var(--radius-btn)',
      background: primary ? 'var(--color-primary)' : 'var(--color-surface)',
      color: primary ? '#fff' : 'var(--color-ink)',
      border: '1px solid var(--color-border)', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
      transition: 'background 0.2s, color 0.2s',
    }}>
      <Icon name={icon} size={16} color="currentColor" />
      {label}
    </button>
  )
}

function RoleBadge({ role, t }) {
  const isAdmin = role === 'admin'
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, borderRadius: 'var(--radius-chip)', padding: '3px 9px',
      background: isAdmin ? 'var(--color-warn-bg)' : 'var(--color-surface2)',
      color: isAdmin ? 'var(--color-warn)' : 'var(--color-ink-soft)',
    }}>
      {isAdmin ? t.admin : t.member}
    </span>
  )
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: 46, height: 28, borderRadius: 100,
      background: on ? 'var(--color-primary)' : 'var(--color-surface2)',
      border: `1px solid ${on ? 'transparent' : 'var(--color-border)'}`,
      position: 'relative', cursor: 'pointer', flexShrink: 0,
      transition: 'background 0.2s',
      padding: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2, width: 22, height: 22,
        borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}
