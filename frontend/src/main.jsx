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
      await navigator.serviceWorker.register('/sw.js', { scope: '/' })

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
