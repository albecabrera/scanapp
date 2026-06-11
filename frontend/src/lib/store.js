import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set) => ({
      // ── Auth ─────────────────────────────────────────────
      session: null,       // { userId, token, displayName, avatarIndex, lang, theme }
      setSession: (session) => set({ session }),
      clearSession: () => {
        localStorage.removeItem('ss_token')
        set({ session: null, households: [], items: [], activeHouseholdId: null })
      },

      // ── Households ───────────────────────────────────────
      households: [],
      activeHouseholdId: null,
      setHouseholds: (households) => set({ households }),
      setActiveHousehold: (id) => set({ activeHouseholdId: id }),
      upsertHousehold: (hh) => set(s => {
        const idx = s.households.findIndex(h => h.id === hh.id)
        const next = idx >= 0
          ? s.households.map((h, i) => i === idx ? { ...h, ...hh } : h)
          : [...s.households, hh]
        return { households: next }
      }),

      // ── Inventory ────────────────────────────────────────
      items: [],
      setItems: (items) => set({ items }),
      upsertItem: (item) => set(s => {
        const idx = s.items.findIndex(i => i.id === item.id)
        return {
          items: idx >= 0
            ? s.items.map((i, n) => n === idx ? { ...i, ...item } : i)
            : [item, ...s.items],
        }
      }),
      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      newItemId: null,
      setNewItemId: (id) => set({ newItemId: id }),

      // ── UI ───────────────────────────────────────────────
      activeTab: 'inventory',
      setTab: (tab) => set({ activeTab: tab }),

      locationFilter: 'all',
      setLocationFilter: (f) => set({ locationFilter: f }),

      openSheet: null,    // null | 'product-detail' | 'household-switcher' | 'notifications' | 'add-item'
      activeItemId: null,
      openSheetWith: (sheet, itemId = null) => set({ openSheet: sheet, activeItemId: itemId }),
      closeSheet: () => set({ openSheet: null, activeItemId: null }),

      toastQueue: [],
      // action: { label, onClick } — toasts with an action stay longer (undo window)
      addToast: (label, action = null) => {
        const id = Date.now() + Math.random()
        set(s => ({ toastQueue: [...s.toastQueue, { label, id, action }] }))
        setTimeout(() => set(s => ({ toastQueue: s.toastQueue.filter(t => t.id !== id) })), action ? 5000 : 2400)
      },
      removeToast: (id) => set(s => ({ toastQueue: s.toastQueue.filter(t => t.id !== id) })),

      // ── Preferences ──────────────────────────────────────
      lang: 'de',
      theme: 'system',
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),

      // ── Scan state ───────────────────────────────────────
      scannedProduct: null,
      setScannedProduct: (p) => set({ scannedProduct: p }),
      clearScannedProduct: () => set({ scannedProduct: null }),
    }),
    {
      name: 'ss-store',
      partialize: (s) => ({
        session:           s.session,
        activeHouseholdId: s.activeHouseholdId,
        lang:              s.lang,
        theme:             s.theme,
      }),
    }
  )
)

export const getActiveHousehold = (state) =>
  state.households.find(h => h.id === state.activeHouseholdId) ?? state.households[0] ?? null
