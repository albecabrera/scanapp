import { useState } from 'react'
import { useStore } from '../../lib/store'
import { LANGS, translations } from '../../lib/i18n'
import { api } from '../../lib/api'
import Icon from './Icon'

export default function LangSwitcher({ dark = false }) {
  const lang = useStore(s => s.lang)
  const setLang = useStore(s => s.setLang)
  const [open, setOpen] = useState(false)

  function changeLang(l) {
    setLang(l)
    setOpen(false)
    api.auth.update({ lang: l }).catch(() => {})
  }

  const btnStyle = dark
    ? {
        background: open ? 'rgba(255,220,50,0.22)' : 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '0.5px solid rgba(255,255,255,0.3)',
        color: '#fff',
      }
    : {
        background: open ? 'var(--color-primary-tint)' : 'var(--glass-bg-light)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: 'var(--glass-border-light)',
        boxShadow: 'var(--glass-shine-light)',
        color: 'var(--color-ink)',
      }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 38, height: 38, borderRadius: 'var(--radius-chip)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background 0.2s',
          ...btnStyle,
        }}
      >
        <Icon name="globe" size={19} color="currentColor" />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
          <div style={{
            position: 'absolute', top: 44, right: 0, zIndex: 61,
            background: 'var(--color-surface)', borderRadius: 16,
            border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-float)',
            padding: 6, minWidth: 140,
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
  )
}
