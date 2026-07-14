// On-device OCR for printed expiry / best-before dates.
// Uses Tesseract.js (lazy-loaded — heavy WASM + lang data) so it only
// downloads when the user actually taps "scan date". Fully client-side:
// no image ever leaves the device, no API cost.

let workerPromise = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      // 'eng' digits/letters cover DD.MM.YYYY plus EN/DE/ES month words well enough.
      const worker = await createWorker('eng')
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789./-: ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzäöüÄÖÜ',
      })
      return worker
    })()
  }
  return workerPromise
}

const MONTHS = {
  jan: 1, ene: 1, januar: 1, enero: 1,
  feb: 2, febrero: 2, februar: 2,
  mar: 3, mär: 3, marzo: 3, märz: 3,
  apr: 4, abr: 4, april: 4, abril: 4,
  may: 5, mai: 5, mayo: 5,
  jun: 6, juni: 6, junio: 6,
  jul: 7, juli: 7, julio: 7,
  aug: 8, ago: 8, august: 8, agosto: 8,
  sep: 9, sept: 9, september: 9, septiembre: 9,
  oct: 10, okt: 10, october: 10, oktober: 10, octubre: 10,
  nov: 11, november: 11, noviembre: 11,
  dec: 12, dez: 12, dic: 12, december: 12, dezember: 12, diciembre: 12,
}

function toISO(y, m, d) {
  if (y < 100) y += 2000
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, m - 1, d)
  if (dt.getMonth() !== m - 1) return null // rejects e.g. 31.02
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// Extract every plausible date from raw OCR text, return ISO strings.
export function parseDates(text) {
  const found = []
  const t = text.replace(/\s+/g, ' ')

  // ISO YYYY-MM-DD
  for (const m of t.matchAll(/\b(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\b/g)) {
    const iso = toISO(+m[1], +m[2], +m[3])
    if (iso) found.push(iso)
  }
  // DD.MM.YYYY / DD/MM/YY / DD-MM-YYYY
  for (const m of t.matchAll(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})\b/g)) {
    const iso = toISO(+m[3], +m[2], +m[1])
    if (iso) found.push(iso)
  }
  // MM/YYYY or MM.YYYY (no day) → assume end of month
  for (const m of t.matchAll(/\b(\d{1,2})[.\-/](\d{4})\b/g)) {
    const mm = +m[1], yy = +m[2]
    if (mm >= 1 && mm <= 12) {
      const last = new Date(yy, mm, 0).getDate()
      const iso = toISO(yy, mm, last)
      if (iso) found.push(iso)
    }
  }
  // DD MONTH YYYY  (e.g. "20 JUN 2026", "20 ENE 26")
  for (const m of t.matchAll(/\b(\d{1,2})\s*([A-Za-zäöü]{3,9})\.?\s*(\d{2,4})\b/g)) {
    const mo = MONTHS[m[2].toLowerCase().slice(0, 4)] ?? MONTHS[m[2].toLowerCase().slice(0, 3)]
    if (mo) {
      const iso = toISO(+m[3], mo, +m[1])
      if (iso) found.push(iso)
    }
  }
  return [...new Set(found)]
}

// Best guess: the latest date that isn't in the distant past
// (printed expiry dates are future; manufacture dates are past).
export function pickExpiry(dates) {
  if (!dates.length) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const future = dates.filter(d => new Date(d) >= today).sort()
  if (future.length) return future[0]        // nearest upcoming = best before
  return dates.sort().reverse()[0]            // fallback: most recent seen
}

export async function recognizeExpiryDate(imageFile) {
  const worker = await getWorker()
  const { data } = await worker.recognize(imageFile)
  const dates = parseDates(data.text ?? '')
  return { date: pickExpiry(dates), all: dates, raw: data.text ?? '' }
}

export async function disposeOcr() {
  if (workerPromise) {
    const w = await workerPromise
    await w.terminate()
    workerPromise = null
  }
}
