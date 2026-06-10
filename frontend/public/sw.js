// Cache version injected by Vite at build time; 'dev' used in development
const CACHE = 'ss-__SW_CACHE_VERSION__'
const SHELL = ['/', '/manifest.json']

// ── Install ────────────────────────────────────────────────────────────────

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  )
})

// ── Activate — prune old caches ────────────────────────────────────────────

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ──────────────────────────────────────────────────────────────────

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // API: network-first; cache GET items for offline read
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.includes('/items') && request.method === 'GET') {
      e.respondWith(
        fetch(request)
          .then(res => {
            caches.open(CACHE).then(c => c.put(request, res.clone()))
            return res
          })
          .catch(() => caches.match(request))
      )
    }
    return
  }

  // Product images: stale-while-revalidate
  if (url.hostname === 'images.openfoodfacts.org') {
    e.respondWith(
      caches.open(CACHE).then(async c => {
        const cached = await c.match(request)
        const fresh = fetch(request)
          .then(res => { c.put(request, res.clone()); return res })
          .catch(() => null)
        return cached ?? fresh
      })
    )
    return
  }

  // App shell: cache-first
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (res.ok && ['script', 'style', 'document', 'font'].includes(request.destination)) {
          caches.open(CACHE).then(c => c.put(request, res.clone()))
        }
        return res
      }).catch(() => caches.match('/'))
    })
  )
})

// ── Background Sync ────────────────────────────────────────────────────────

self.addEventListener('sync', e => {
  if (e.tag === 'ss-sync') {
    e.waitUntil(replayQueue())
  }
})

async function openSyncDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ss-db', 1)
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result
      if (!db.objectStoreNames.contains('items')) db.createObjectStore('items')
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function replayQueue() {
  const db = await openSyncDB()

  const ops = await new Promise((resolve) => {
    const req = db.transaction('syncQueue', 'readonly')
      .objectStore('syncQueue').getAll()
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror = () => resolve([])
  })

  let allOk = true
  for (const op of ops) {
    try {
      const res = await fetch(op.url, {
        method: op.method,
        headers: op.headers,
        body: op.body ? JSON.stringify(op.body) : null,
      })
      if (res.ok || res.status < 500) {
        // remove from queue on success or client error (won't fix itself)
        await new Promise(resolve => {
          const req = db.transaction('syncQueue', 'readwrite')
            .objectStore('syncQueue').delete(op.id)
          req.onsuccess = resolve
          req.onerror = resolve
        })
      } else {
        allOk = false
      }
    } catch {
      allOk = false
    }
  }

  if (allOk && ops.length > 0) {
    // Notify all open clients to refresh
    const clients = await self.clients.matchAll({ type: 'window' })
    clients.forEach(c => c.postMessage({ type: 'SS_SYNC_DONE' }))
  }
}

// ── Web Push ───────────────────────────────────────────────────────────────

self.addEventListener('push', e => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'Scan & Save', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag ?? 'ss-notification',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data.url))
})
