import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useStore, getActiveHousehold } from '../lib/store'
import { useT } from '../lib/i18n'
import Avatar from '../components/atoms/Avatar'
import Icon from '../components/atoms/Icon'

export default function HouseholdScreen() {
  const lang = useStore(s => s.lang)
  const t = useT(lang).hh
  const households = useStore(s => s.households)
  const activeHouseholdId = useStore(s => s.activeHouseholdId)
  const session = useStore(s => s.session)
  const upsertHousehold = useStore(s => s.upsertHousehold)
  const addToast = useStore(s => s.addToast)

  const hh = getActiveHousehold({ households, activeHouseholdId })

  const [invite, setInvite] = useState(null)
  const [copied, setCopied] = useState(false)
  const [notifSettings, setNotifSettings] = useState(null)
  const [thresholds, setThresholds] = useState(['3'])
  const [warnAll, setWarnAll] = useState(false)
  const [genLoading, setGenLoading] = useState(false)

  useEffect(() => {
    if (!hh) return
    api.households.inviteActive(hh.id).then(setInvite).catch(() => {})
    api.notifications.get(hh.id).then(ns => {
      setNotifSettings(ns)
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
      addToast('Link copiado')
    }
  }

  async function toggleThreshold(key) {
    const next = thresholds.includes(key)
      ? thresholds.filter(k => k !== key)
      : [...thresholds, key]
    setThresholds(next)
    try {
      await api.notifications.update(hh.id, { threshold_days: next, warn_all_tomorrow: warnAll })
    } catch {}
  }

  async function toggleWarnAll() {
    const next = !warnAll
    setWarnAll(next)
    try {
      await api.notifications.update(hh.id, { threshold_days: thresholds, warn_all_tomorrow: next })
    } catch {}
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
      </div>{/* /content wrapper */}
    </div>
  )
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
