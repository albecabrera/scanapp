const CACHE = 'ss-v1'
const SHELL = ['/', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // API: network-first, cache households items for offline read
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.includes('/items') && request.method === 'GET') {
      e.respondWith(
        fetch(request)
          .then(res => {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
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
        const fresh = fetch(request).then(res => { c.put(request, res.clone()); return res }).catch(() => null)
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
        if (res.ok && (request.destination === 'script' || request.destination === 'style' || request.destination === 'document')) {
          caches.open(CACHE).then(c => c.put(request, res.clone()))
        }
        return res
      }).catch(() => caches.match('/'))
    })
  )
})

// Web Push
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
