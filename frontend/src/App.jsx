import { useState, useEffect } from 'react'
import { api } from './lib/api'
import { useStore } from './lib/store'
import { useT } from './lib/i18n'
import AuthScreen from './screens/AuthScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import InventoryScreen from './screens/InventoryScreen'
import ScanScreen from './screens/ScanScreen'
import HouseholdScreen from './screens/HouseholdScreen'
import TabBar from './components/molecules/TabBar'
import ToastStack from './components/molecules/Toast'

export default function App() {
  const session = useStore(s => s.session)
  const setSession = useStore(s => s.setSession)
  const lang = useStore(s => s.lang)
  const t = useT(lang)
  const households = useStore(s => s.households)
  const setHouseholds = useStore(s => s.setHouseholds)
  const setItems = useStore(s => s.setItems)
  const activeHouseholdId = useStore(s => s.activeHouseholdId)
  const activeTab = useStore(s => s.activeTab)
  const setTab = useStore(s => s.setTab)

  const [appState, setAppState] = useState('loading') // loading | auth | onboarding | app

  useEffect(() => {
    bootstrap()
  }, [])

  async function bootstrap() {
    const token = localStorage.getItem('ss_token')
    if (!token) { setAppState('auth'); return }

    try {
      const user = await api.auth.me()
      setSession({ userId: user.id, token, ...user })
      const hhRes = await api.households.list()
      setHouseholds(hhRes.households)
      if (!hhRes.households.length) {
        setAppState('onboarding')
        return
      }
      const hid = useStore.getState().activeHouseholdId ?? hhRes.households[0].id
      const itemsRes = await api.items.list(hid)
      setItems(itemsRes.items)
      setAppState('app')
    } catch {
      localStorage.removeItem('ss_token')
      setAppState('auth')
    }
  }

  function onAuth() {
    setAppState('loading')
    bootstrap()
  }

  function onOnboardingDone() {
    setAppState('loading')
    bootstrap()
  }

  useEffect(() => {
    if (session?.lang) useStore.getState().setLang(session.lang)
    if (session?.theme) useStore.getState().setTheme(session.theme)
  }, [session?.id])

  if (appState === 'loading') return <Splash />
  if (appState === 'auth') return <AuthScreen onAuth={onAuth} />
  if (appState === 'onboarding') return <OnboardingScreen onDone={onOnboardingDone} />

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'var(--color-bg)', overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0,
          opacity: activeTab === 'inventory' ? 1 : 0,
          pointerEvents: activeTab === 'inventory' ? 'auto' : 'none',
          overflowY: 'auto',
          transition: 'opacity 0.4s var(--ease-spring)',
          transform: activeTab === 'inventory' ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.992)',
        }}>
          <InventoryScreen />
        </div>

        {activeTab === 'scan' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <ScanScreen onItemAdded={() => setTab('inventory')} />
          </div>
        )}

        <div style={{
          position: 'absolute', inset: 0,
          opacity: activeTab === 'home' ? 1 : 0,
          pointerEvents: activeTab === 'home' ? 'auto' : 'none',
          overflowY: 'auto',
          transition: 'opacity 0.4s var(--ease-spring)',
          transform: activeTab === 'home' ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.992)',
        }}>
          <HouseholdScreen />
        </div>
      </div>

      {activeTab !== 'scan' && (
        <TabBar activeTab={activeTab} onTabChange={setTab} t={t} />
      )}

      <ToastStack />
    </div>
  )
}

function Splash() {
  return (
    <div style={{
      height: '100dvh', background: 'var(--color-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20, background: 'var(--color-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'ss-pop 0.6s var(--ease-spring) both',
      }}>
        <svg width={32} height={32} viewBox="0 0 24 24" stroke="#fff" fill="none">
          <g strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H8M16 4h1.5A2.5 2.5 0 0 1 20 6.5V8M20 16v1.5a2.5 2.5 0 0 1-2.5 2.5H16M8 20H6.5A2.5 2.5 0 0 1 4 17.5V16" />
            <path d="M7.5 9.5v5M10.5 9.5v5M13.5 9.5v5M16.5 9.5v5" />
          </g>
        </svg>
      </div>
    </div>
  )
}
