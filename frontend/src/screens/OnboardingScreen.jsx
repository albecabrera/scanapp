import { useState } from 'react'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import Icon from '../components/atoms/Icon'
import LangSwitcher from '../components/atoms/LangSwitcher'

export default function OnboardingScreen({ onDone }) {
  const lang = useStore(s => s.lang)
  const t = useT(lang).onboarding
  const upsertHousehold = useStore(s => s.upsertHousehold)
  const setActiveHousehold = useStore(s => s.setActiveHousehold)

  const [step, setStep] = useState(0) // 0=welcome 1=choose 2=form 3=success
  const [mode, setMode] = useState('create') // 'create' | 'join'
  const [formValue, setFormValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdName, setCreatedName] = useState('')

  function goStep(n) {
    setStep(n)
    setError('')
  }

  function chooseMode(m) {
    setMode(m)
    setFormValue('')
    goStep(2)
  }

  async function submitForm(e) {
    e.preventDefault()
    if (!formValue.trim()) return
    setLoading(true)
    setError('')
    try {
      let hh
      if (mode === 'create') {
        hh = await api.households.create({ name: formValue.trim() })
        setCreatedName(hh.name)
      } else {
        hh = await api.households.join(formValue.trim().toUpperCase())
        setCreatedName(hh.name)
      }
      upsertHousehold(hh)
      setActiveHousehold(hh.id)
      goStep(3)
    } catch (err) {
      setError(err.message ?? 'Error')
    } finally {
      setLoading(false)
    }
  }

  const slideStyle = (s) => ({
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '32px 24px',
    opacity: step === s ? 1 : 0,
    transform: step === s ? 'translateY(0)' : step < s ? 'translateY(56px)' : 'translateY(-56px)',
    transition: 'opacity 0.45s var(--ease-spring), transform 0.55s var(--ease-spring)',
    pointerEvents: step === s ? 'auto' : 'none',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--color-bg)',
      overflow: 'hidden',
    }}>
      {/* Language switcher — top right */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <LangSwitcher />
      </div>

      {/* Step 0 — Welcome */}
      <div style={slideStyle(0)}>
        <div style={{
          width: 76, height: 76, borderRadius: 24, background: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 28px rgba(35,122,75,0.32)', marginBottom: 24,
          animation: 'ss-pop 0.6s var(--ease-spring) both',
        }}>
          <Icon name="scan" size={38} color="#fff" />
        </div>

        <h1 style={{
          fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em',
          textAlign: 'center', whiteSpace: 'pre-line', margin: '0 0 10px',
          color: 'var(--color-ink)', fontFamily: 'var(--font-display)',
        }}>
          {t.welcome}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--color-ink-soft)', marginBottom: 36, textAlign: 'center' }}>
          {t.tagline}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320, marginBottom: 36 }}>
          {t.features.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              animation: `ss-fadeup 0.5s ${0.1 + i * 0.1}s var(--ease-spring) both`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 14, background: 'var(--color-primary-tint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name={f.icon} size={20} color="var(--color-primary)" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>{f.text}</span>
            </div>
          ))}
        </div>

        <PrimaryBtn onClick={() => goStep(1)} label={t.cta} />
      </div>

      {/* Step 1 — Choose */}
      <div style={slideStyle(1)}>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 28px', textAlign: 'center', color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
          {t.chooseTitle}
        </h2>

        {[
          { mode: 'create', icon: 'home', title: t.createHousehold, sub: t.createSub },
          { mode: 'join',   icon: 'user', title: t.joinHousehold,   sub: t.joinSub },
        ].map(opt => (
          <button key={opt.mode} onClick={() => chooseMode(opt.mode)} style={{
            width: '100%', maxWidth: 360, marginBottom: 14,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)', padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
            textAlign: 'left', transition: 'transform 0.25s var(--ease-spring)',
            boxShadow: 'var(--shadow-card)',
          }}
          onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
            <div style={{
              width: 46, height: 46, borderRadius: 16, background: 'var(--color-primary-tint)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name={opt.icon} size={22} color="var(--color-primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 2 }}>{opt.title}</div>
              <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>{opt.sub}</div>
            </div>
            <Icon name="chevRight" size={18} color="var(--color-ink-faint)" />
          </button>
        ))}
      </div>

      {/* Step 2 — Form */}
      <div style={slideStyle(2)}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 24px', textAlign: 'center', color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
          {mode === 'create' ? t.createHousehold : t.joinHousehold}
        </h2>

        <form onSubmit={submitForm} style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 8 }}>
              {mode === 'create' ? t.formNameLabel : t.formCodeLabel}
            </label>
            <input
              autoFocus
              value={formValue}
              onChange={e => setFormValue(e.target.value)}
              placeholder={mode === 'create' ? t.formNamePlaceholder : t.formCodePlaceholder}
              style={{
                width: '100%', height: 52, borderRadius: 'var(--radius-btn)',
                border: '1.5px solid var(--color-primary)',
                boxShadow: '0 0 0 4px rgba(35,122,75,0.1)',
                background: 'var(--color-surface)', color: 'var(--color-ink)',
                padding: '0 16px', fontSize: 16, fontFamily: 'var(--font-body)',
                outline: 'none', boxSizing: 'border-box',
                letterSpacing: mode === 'join' ? '0.08em' : '0',
                textTransform: mode === 'join' ? 'uppercase' : 'none',
              }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: 'var(--color-danger)', margin: 0 }}>{error}</p>}

          <PrimaryBtn type="submit" loading={loading} label={mode === 'create' ? t.formCreate : t.formJoin} />

          <button type="button" onClick={() => goStep(1)} style={{
            background: 'none', border: 'none', color: 'var(--color-ink-soft)',
            fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0,
          }}>
            ← {t.back}
          </button>
        </form>
      </div>

      {/* Step 3 — Success */}
      <div style={slideStyle(3)}>
        <div style={{
          width: 92, height: 92, borderRadius: '50%', border: '3px solid var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          animation: 'ss-pop 0.6s var(--ease-spring) both',
        }}>
          <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 26, strokeDashoffset: 0, animation: 'ss-checkdraw 0.6s 0.3s ease both' }}
            />
          </svg>
        </div>

        <div style={{
          background: 'var(--color-primary-tint)', borderRadius: 'var(--radius-chip)',
          padding: '6px 16px', fontSize: 14, fontWeight: 700, color: 'var(--color-primary)',
          marginBottom: 16,
        }}>
          {createdName}
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
          {mode === 'create' ? t.successCreate : t.successJoin}
        </h2>

        <PrimaryBtn onClick={onDone} label={t.goToInventory} style={{ marginTop: 32 }} />
      </div>
    </div>
  )
}

function PrimaryBtn({ onClick, label, type = 'button', loading, style = {} }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      style={{
        height: 52, borderRadius: 'var(--radius-btn)', background: 'var(--color-primary)',
        color: 'var(--color-on-primary)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-body)', width: '100%', maxWidth: 360,
        opacity: loading ? 0.7 : 1, transition: 'transform 0.25s var(--ease-spring)',
        ...style,
      }}
      onPointerDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.97)' }}
      onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {loading ? '…' : label}
    </button>
  )
}
