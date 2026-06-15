import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Capture install prompt before it's dismissed by browser
let _installPrompt = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  _installPrompt = e
  window.dispatchEvent(new CustomEvent('ss-installable'))
})
export function getInstallPrompt() { return _installPrompt }
export function clearInstallPrompt() { _installPrompt = null }

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const base = import.meta.env.BASE_URL
      const reg = await navigator.serviceWorker.register(`${base}sw.js`, { scope: base })

      // Notify app when a new SW version is waiting
      function notifyUpdate(sw) {
        window.dispatchEvent(new CustomEvent('ss-sw-update', { detail: sw }))
      }

      // Already waiting from a prior visit
      if (reg.waiting && navigator.serviceWorker.controller) {
        notifyUpdate(reg.waiting)
      }

      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing
        newSW?.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            notifyUpdate(newSW)
          }
        })
      })

      // Listen for background sync completion — refresh items
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'SS_SYNC_DONE') {
          window.dispatchEvent(new CustomEvent('ss-sync-done'))
        }
      })
    } catch { /* ignore */ }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
