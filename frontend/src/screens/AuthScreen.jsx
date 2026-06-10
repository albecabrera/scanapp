import { useState } from 'react'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import Icon from '../components/atoms/Icon'

export default function AuthScreen({ onAuth }) {
  const lang = useStore(s => s.lang)
  const t = useT(lang).auth
  const setSession = useStore(s => s.setSession)

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let res
      if (mode === 'login') {
        res = await api.auth.login({ email, password })
      } else {
        res = await api.auth.register({ email, password, display_name: name })
      }
      localStorage.setItem('ss_token', res.token)
      setSession({ userId: res.user.id, token: res.token, ...res.user })
      onAuth()
    } catch (err) {
      setError(err.code === 'EMAIL_TAKEN' ? t.errorEmail : t.errorInvalid)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--color-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 24px 40px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22, background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(35,122,75,0.28)',
            marginBottom: 16,
            animation: 'ss-pop 0.6s var(--ease-spring) both',
          }}>
            <Icon name="scan" size={36} color="#fff" />
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em',
            color: 'var(--color-ink)', fontFamily: 'var(--font-display)',
            margin: 0,
          }}>
            {mode === 'login' ? t.loginTitle : t.registerTitle}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--color-ink-soft)', marginTop: 6, margin: '6px 0 0' }}>
            {mode === 'login' ? t.loginSub : t.registerSub}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <InputField label={t.name} value={name} onChange={setName} placeholder="Ana García" type="text" autoComplete="name" />
          )}
          <InputField label={t.email} value={email} onChange={setEmail} placeholder="ana@example.com" type="email" autoComplete="email" />
          <InputField label={t.password} value={password} onChange={setPassword} placeholder="••••••••" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

          {error && (
            <p style={{ fontSize: 13.5, color: 'var(--color-danger)', margin: 0, animation: 'ss-fadeup 0.3s var(--ease-spring) both' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 52, borderRadius: 'var(--radius-btn)', background: 'var(--color-primary)',
              color: 'var(--color-on-primary)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-body)',
              marginTop: 4, opacity: loading ? 0.7 : 1,
              transition: 'transform 0.25s var(--ease-spring)',
              transform: 'scale(1)',
            }}
            onPointerDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.97)' }}
            onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {loading ? '…' : (mode === 'login' ? t.loginCta : t.registerCta)}
          </button>
        </form>

        {/* Switch mode */}
        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
          style={{
            display: 'block', width: '100%', marginTop: 20, background: 'none', border: 'none',
            fontSize: 14, color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', textAlign: 'center',
          }}
        >
          {mode === 'login' ? t.switchToRegister : t.switchToLogin}
        </button>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type, autoComplete }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', height: 48, borderRadius: 'var(--radius-btn)',
          border: `1.5px solid ${focused ? 'var(--color-primary)' : 'var(--color-border)'}`,
          boxShadow: focused ? '0 0 0 4px rgba(35,122,75,0.1)' : 'none',
          background: 'var(--color-surface)', color: 'var(--color-ink)',
          padding: '0 14px', fontSize: 15, fontFamily: 'var(--font-body)',
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      />
    </div>
  )
}
