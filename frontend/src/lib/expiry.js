export function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr)
  exp.setHours(0, 0, 0, 0)
  return Math.ceil((exp - today) / 86_400_000)
}

export function expiryKind(days) {
  if (days === null) return 'neutral'
  if (days <= 1) return 'danger'
  if (days <= 7) return 'warn'
  return 'neutral'
}

export function expiryLabel(days, t) {
  if (days === null) return t.days.noExpiry ?? '—'
  if (days < 0) return t.days.expired
  if (days === 0) return t.days.today
  if (days === 1) return t.days.tomorrow
  if (days < 31) return t.days.inDays(days)
  return t.days.months(Math.round(days / 30))
}

export function countExpiringSoon(items, withinDays = 7) {
  return items.filter(i => {
    const d = daysUntil(i.expires_at)
    return d !== null && d >= 0 && d <= withinDays
  }).length
}
