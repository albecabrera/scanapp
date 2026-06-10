import { daysUntil } from './expiry'

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
