import { daysUntil } from './expiry'
import { api } from './api'

function b64ToUint8(base64url) {
  const padding = '='.repeat((4 - base64url.length % 4) % 4)
  const b64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

// Subscribe to Web Push and register the subscription server-side.
// Safe to call repeatedly: reuses an existing subscription.
export async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const { key } = await api.push.vapidKey()
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToUint8(key),
      })
    }
    const json = sub.toJSON()
    await api.push.subscribe({
      endpoint: sub.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent.slice(0, 250),
    })
    return true
  } catch {
    return false
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function scheduleLocalNotifications(items, t) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (!items?.length) return

  const urgent = []
  const warn = []

  for (const item of items) {
    const days = daysUntil(item.expires_at)
    if (days === null) continue
    if (days < 0) continue
    if (days <= 1) urgent.push(item)
    else if (days <= 3) warn.push(item)
  }

  if (urgent.length > 0) {
    const names = urgent.slice(0, 3).map(i => i.name).join(', ')
    const more = urgent.length > 3 ? ` +${urgent.length - 3}` : ''
    new Notification(t?.notifications?.urgentTitle ?? '⚠️ Vence hoy o mañana', {
      body: names + more,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'ss-urgent',
    })
  } else if (warn.length > 0) {
    const names = warn.slice(0, 3).map(i => i.name).join(', ')
    const more = warn.length > 3 ? ` +${warn.length - 3}` : ''
    new Notification(t?.notifications?.warnTitle ?? '🕐 Vence en los próximos días', {
      body: names + more,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'ss-warn',
    })
  }
}
