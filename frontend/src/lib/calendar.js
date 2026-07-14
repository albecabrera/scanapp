// Generates an RFC 5545 iCalendar (.ics) file for an item's expiry date and
// triggers a download. On iOS/macOS, opening the file adds the event to Apple
// Calendar — no credentials, no server, no CalDAV. One-way, per item.

// Escape reserved chars in TEXT values (RFC 5545 §3.3.11)
function escapeText(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// 'YYYY-MM-DD' → 'YYYYMMDD' (all-day DATE value)
function toICSDate(dateStr) {
  return String(dateStr).slice(0, 10).replace(/-/g, '')
}

// All-day DTEND is exclusive, so it must be the day AFTER expires_at.
function nextDayICS(dateStr) {
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  dt.setDate(dt.getDate() + 1)
  const p = n => String(n).padStart(2, '0')
  return `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}`
}

// UTC timestamp: 'YYYYMMDDTHHMMSSZ'
function icsStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Fold lines to 75 octets per RFC 5545 §3.1 (continuation = CRLF + space).
// Uses a byte estimate that's safe for the ASCII/short UTF-8 we emit.
function foldLine(line) {
  if (line.length <= 75) return line
  const parts = []
  let rest = line
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75))
    rest = ' ' + rest.slice(75)
  }
  parts.push(rest)
  return parts.join('\r\n')
}

/**
 * Build the .ics text for an item's expiry as an all-day event with a
 * reminder one day before.
 * @param {object} item - inventory item (needs id, name, expires_at)
 * @param {object} cal  - localized strings: { summary(name), alarm(name) }
 */
export function buildExpiryICS(item, cal) {
  const uid = `scanapp-${item.id}-${toICSDate(item.expires_at)}@scanapp`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScanApp//Expiry//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART;VALUE=DATE:${toICSDate(item.expires_at)}`,
    `DTEND;VALUE=DATE:${nextDayICS(item.expires_at)}`,
    `SUMMARY:${escapeText(cal.summary(item.name))}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(cal.alarm(item.name))}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

/**
 * Build the .ics and trigger a download. Returns true on success.
 */
export function downloadExpiryICS(item, cal) {
  if (!item?.expires_at) return false
  const ics = buildExpiryICS(item, cal)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(item.name || 'item').replace(/[^\w-]+/g, '_')}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke after the click had a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
