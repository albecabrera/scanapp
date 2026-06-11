const DB_NAME = 'ss-db'
const DB_VERSION = 1

let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items')
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => { _db = req.result; resolve(_db) }
    req.onerror = () => reject(req.error)
  })
}

// ── Items cache per household ──────────────────────────────────────────────

export async function getCachedItems(householdId) {
  try {
    const db = await openDB()
    return await new Promise((resolve) => {
      const req = db.transaction('items', 'readonly')
        .objectStore('items').get(String(householdId))
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch { return null }
}

export async function setCachedItems(householdId, items) {
  try {
    const db = await openDB()
    await new Promise((resolve) => {
      const tx = db.transaction('items', 'readwrite')
      tx.objectStore('items').put(items, String(householdId))
      tx.oncomplete = resolve
      tx.onerror = resolve
    })
  } catch { /* ignore */ }
}

// ── Sync queue ─────────────────────────────────────────────────────────────

export async function enqueue(op) {
  try {
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const req = db.transaction('syncQueue', 'readwrite')
        .objectStore('syncQueue').add(op)
      req.onsuccess = resolve
      req.onerror = () => reject(req.error)
    })
  } catch { /* ignore */ }
}

export async function getQueue() {
  try {
    const db = await openDB()
    return await new Promise((resolve) => {
      const req = db.transaction('syncQueue', 'readonly')
        .objectStore('syncQueue').getAll()
      req.onsuccess = () => resolve(req.result ?? [])
      req.onerror = () => resolve([])
    })
  } catch { return [] }
}

export async function dequeue(id) {
  try {
    const db = await openDB()
    await new Promise((resolve) => {
      const req = db.transaction('syncQueue', 'readwrite')
        .objectStore('syncQueue').delete(id)
      req.onsuccess = resolve
      req.onerror = resolve
    })
  } catch { /* ignore */ }
}

export async function clearQueue() {
  try {
    const db = await openDB()
    await new Promise((resolve) => {
      const req = db.transaction('syncQueue', 'readwrite')
        .objectStore('syncQueue').clear()
      req.onsuccess = resolve
      req.onerror = resolve
    })
  } catch { /* ignore */ }
}
