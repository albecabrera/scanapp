import { useState, useEffect, lazy, Suspense } from 'react'
import { api } from './lib/api'
import { useStore } from './lib/store'
import { useT } from './lib/i18n'
import { getCachedItems, setCachedItems } from './lib/idb'
import { scheduleLocalNotifications, requestNotificationPermission } from './lib/notifications'
import { useBreakpoint } from './lib/useBreakpoint'
import TabBar from './components/molecules/TabBar'
import Sidebar from './components/layout/Sidebar'
import ToastStack from './components/molecules/Toast'

const AuthScreen = lazy(() => import('./screens/AuthScreen'))
const OnboardingScreen = lazy(() => import('./screens/OnboardingScreen'))
const InventoryScreen = lazy(() => import('./screens/InventoryScreen'))
const ScanScreen = lazy(() => import('./screens/ScanScreen'))
const HouseholdScreen = lazy(() => import('./screens/HouseholdScreen'))
const ShoppingScreen = lazy(() => import('./screens/ShoppingScreen'))

// Preload scan chunk (ZXing) during idle so the camera opens instantly
function preloadScan() {
  const cb = () => import('./screens/ScanScreen').catch(() => {})
  if ('requestIdleCallback' in window) requestIdleCallback(cb, { timeout: 4000 })
  else setTimeout(cb, 2500)
}

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

  const [appState, setAppState] = useState('loading')
  const bp = useBreakpoint()
  const isDesktop = bp === 'desktop'
  const isTablet = bp === 'tablet'
  const showSidebar = isDesktop || isTablet

  useEffect(() => {
    bootstrap()
    preloadScan()
  }, [])

  // Refresh items when background sync completes
  useEffect(() => {
    const handler = () => {
      const hid = useStore.getState().activeHouseholdId
      if (!hid) return
      api.items.list(hid).then(r => {
        setItems(r.items)
        setCachedItems(hid, r.items)
      }).catch(() => {})
    }
    window.addEventListener('ss-sync-done', handler)
    return () => window.removeEventListener('ss-sync-done', handler)
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

      const cached = await getCachedItems(hid)
      if (cached?.length) {
        setItems(cached)
        setAppState('app')
        api.items.list(hid).then(r => {
          setItems(r.items)
          setCachedItems(hid, r.items)
          scheduleNotifs(r.items)
        }).catch(() => {})
      } else {
        const itemsRes = await api.items.list(hid)
        setItems(itemsRes.items)
        setCachedItems(hid, itemsRes.items)
        setAppState('app')
        scheduleNotifs(itemsRes.items)
      }
    } catch {
      const hid = useStore.getState().activeHouseholdId
      if (hid) {
        const cached = await getCachedItems(hid)
        if (cached) { setItems(cached); setAppState('app'); return }
      }
      localStorage.removeItem('ss_token')
      setAppState('auth')
    }
  }

  async function scheduleNotifs(items) {
    const granted = await requestNotificationPermission()
    if (granted) scheduleLocalNotifications(items, useT(useStore.getState().lang))
  }

  function onAuth() { setAppState('loading'); bootstrap() }
  function onOnboardingDone() { setAppState('loading'); bootstrap() }

  useEffect(() => {
    if (session?.lang) useStore.getState().setLang(session.lang)
    if (session?.theme) useStore.getState().setTheme(session.theme)
  }, [session?.id])

  if (appState === 'loading') return <Splash />

  if (appState === 'auth') return (
    <Suspense fallback={<Splash />}>
      <AuthScreen onAuth={onAuth} />
    </Suspense>
  )

  if (appState === 'onboarding') return (
    <Suspense fallback={<Splash />}>
      <OnboardingScreen onDone={onOnboardingDone} />
    </Suspense>
  )

  // ── App layout ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'row',
      background: 'var(--color-bg)', overflow: 'hidden',
    }}>
      {/* Sidebar — tablet & desktop */}
      {showSidebar && activeTab !== 'scan' && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={setTab}
          t={t}
          collapsed={isTablet}
        />
      )}

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* Inventory */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: activeTab === 'inventory' ? 1 : 0,
            pointerEvents: activeTab === 'inventory' ? 'auto' : 'none',
            overflowY: 'auto',
            transition: 'opacity 0.4s var(--ease-spring)',
            transform: activeTab === 'inventory' ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.992)',
          }}>
            <Suspense fallback={null}>
              <InventoryScreen />
            </Suspense>
          </div>

          {/* Scan — full screen overlay */}
          {activeTab === 'scan' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
              <Suspense fallback={<Splash />}>
                <ScanScreen onItemAdded={() => setTab('inventory')} />
              </Suspense>
            </div>
          )}

          {/* Shopping list */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: activeTab === 'shopping' ? 1 : 0,
            pointerEvents: activeTab === 'shopping' ? 'auto' : 'none',
            overflowY: 'auto',
            transition: 'opacity 0.4s var(--ease-spring)',
            transform: activeTab === 'shopping' ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.992)',
          }}>
            <Suspense fallback={null}>
              <ShoppingScreen />
            </Suspense>
          </div>

          {/* Household */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: activeTab === 'home' ? 1 : 0,
            pointerEvents: activeTab === 'home' ? 'auto' : 'none',
            overflowY: 'auto',
            transition: 'opacity 0.4s var(--ease-spring)',
            transform: activeTab === 'home' ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.992)',
          }}>
            <Suspense fallback={null}>
              <HouseholdScreen />
            </Suspense>
          </div>
        </div>

        {/* TabBar — mobile only */}
        {!showSidebar && activeTab !== 'scan' && (
          <TabBar activeTab={activeTab} onTabChange={setTab} t={t} />
        )}
      </div>

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
