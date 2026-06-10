# PWA_SPEC.md — Scan & Save · Progressive Web App

## Web App Manifest (`manifest.json`)

```json
{
  "name": "Scan & Save",
  "short_name": "ScanSave",
  "description": "Haushalts-Vorräte per Barcode scannen, MHD verfolgen, Ablauf-Erinnerungen.",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#F4F6EF",
  "theme_color": "#237A4B",
  "lang": "de",
  "icons": [
    { "src": "/icons/icon-192.png",   "sizes": "192x192",   "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png",   "sizes": "512x512",   "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-180.png",   "sizes": "180x180",   "type": "image/png" }
  ],
  "screenshots": [
    { "src": "/screenshots/phone.png",   "sizes": "390x844",  "form_factor": "narrow" },
    { "src": "/screenshots/desktop.png", "sizes": "1280x800", "form_factor": "wide" }
  ],
  "categories": ["food", "lifestyle", "utilities"],
  "shortcuts": [
    {
      "name": "Scannen",
      "short_name": "Scan",
      "url": "/?tab=scan",
      "icons": [{ "src": "/icons/shortcut-scan.png", "sizes": "96x96" }]
    }
  ]
}
```

**App-Icon-Design:**
- Hintergrund: `#237A4B` (primary), Radius 24% (Android adaptive)
- Icon: Scan-Rahmen (weiß, Stroke 2px) — siehe `SS_ICON_PATHS.scan` in `scansave-ui.jsx`
- Padding: ~18% Innenabstand zu den Kanten
- Maskable: sicherer Bereich (80% Mitte) muss das Scan-Icon enthalten

---

## Service Worker

### Registrierung (`main.js`)

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.error('SW registration failed:', err));
  });
}
```

### Caching-Strategie (`sw.js`)

```
CACHE_VERSION = 'ss-v1'

App Shell (Cache-first):
  /index.html, /manifest.json,
  /icons/*, /fonts/*,
  /*.js, /*.css

API-Anfragen (Network-first, Fallback auf Cache):
  /api/v1/households/:id/items  →  letzte Response gecacht (offline lesbar)
  Alle anderen API-Anfragen     →  network-only (kein Fallback)

Produktbilder (Stale-while-revalidate):
  https://images.openfoodfacts.org/*
```

**Offline-Verhalten:**
- App startet offline, zeigt zuletzt gecachte Inventardaten (read-only)
- Mutationen (Hinzufügen, Verbrauchen, Löschen) offline → in IndexedDB-Queue (`ss-offline-queue`) speichern
- Bei Wiederverbindung (`navigator.onLine` + SW `sync`-Event) Queue abarbeiten und UI aktualisieren
- Toast bei Offline-Modus: „Offline — Änderungen werden synchronisiert"

---

## Barcode-Scanning

### Phase 1 — BarcodeDetector API (Browser-nativ, Zero-Bundle)

```js
async function startCamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 1920 } }
  });
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

async function scanFrame(videoEl, detector) {
  const barcodes = await detector.detect(videoEl);
  return barcodes.find(b =>
    ['ean_13', 'ean_8', 'upc_a', 'upc_e'].includes(b.format)
  ) ?? null;
}

// Polling-Loop
async function startScanLoop(videoEl, onFound) {
  const supported = await BarcodeDetector.getSupportedFormats();
  const detector = new BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'].filter(f => supported.includes(f))
  });

  let running = true;
  const loop = async () => {
    if (!running) return;
    const result = await scanFrame(videoEl, detector);
    if (result) {
      onFound(result.rawValue);
      return;
    }
    requestAnimationFrame(loop);
  };
  loop();
  return () => { running = false; };
}
```

### Phase 2 — ZXing-js Fallback (wenn BarcodeDetector nicht verfügbar)

```js
// Lazy-load: nur laden wenn nötig
import { BrowserMultiFormatReader } from '@zxing/browser';

async function startZXingScan(videoEl, onFound) {
  const reader = new BrowserMultiFormatReader();
  const controls = await reader.decodeFromVideoDevice(
    null, videoEl,
    (result, err) => { if (result) onFound(result.getText()); }
  );
  return () => controls.stop();
}

// Feature-Detection
const hasBarcodeDetector = typeof BarcodeDetector !== 'undefined';
const startScan = hasBarcodeDetector ? startScanLoop : startZXingScan;
```

**Hinweis:** ZXing nur als Fallback einbinden — es ist ~800 KB. Im Production-Build per dynamic import + code splitting laden.

### Desktop: EAN-Eingabefeld

Auf Desktop/Tablet kein `getUserMedia`-Zugriff voraussetzen. Das Scan-Modal zeigt:
1. EAN-Eingabefeld (Autofokus, `inputmode="numeric"`, maxlength 14)
2. Optional: Webcam-Preview wenn `navigator.mediaDevices.getUserMedia` verfügbar
3. „Nachschlagen"-Button → `GET /api/v1/products/:ean`

### Kamera-Berechtigungen

```js
async function requestCameraPermission() {
  try {
    const status = await navigator.permissions.query({ name: 'camera' });
    if (status.state === 'denied') {
      // UI: Hinweis zeigen, Nutzer muss Einstellungen öffnen
      return false;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(t => t.stop()); // nur Permission-Check
    return true;
  } catch {
    return false;
  }
}
```

---

## Benachrichtigungen

### MVP: Lokal (v0)

Beim App-Start prüfen welche Items in den nächsten 1/3/7 Tagen (gem. Einstellungen) ablaufen und eine lokale Notification anzeigen:

```js
async function scheduleLocalNotifications(items, settings) {
  if (Notification.permission !== 'granted') return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  items
    .filter(item => item.expires_at)
    .forEach(item => {
      const diff = Math.ceil(
        (new Date(item.expires_at) - today) / 86_400_000
      );
      const thresholds = settings.threshold_days.map(Number);
      if (thresholds.includes(diff)) {
        new Notification(`${item.name} läuft ${diff === 0 ? 'heute' : `in ${diff} Tag(en)`} ab`, {
          body: `Haushalt: ${settings.household_name}`,
          icon: '/icons/icon-192.png',
          tag: `expiry-${item.id}`,
        });
      }
    });
}
```

### v1: Web Push (Cron-basiert)

**Ablauf:**
1. Browser abonniert: `serviceWorkerRegistration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`
2. Subscription (`endpoint`, `p256dh`, `auth`) an `POST /api/v1/push/subscribe` senden
3. PHP-Cron (täglich 08:00 UTC): Items abfragen, die heute/morgen/in N Tagen ablaufen
4. Web-Push-Library (PHP: `minishlink/web-push`) sendet Push-Nachricht pro User/Subscription
5. SW empfängt `push`-Event → `showNotification()`

**SW Push-Handler:**
```js
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Scan & Save', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: data.tag ?? 'ss-notification',
      data: { url: data.url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

**VAPID-Keys:** mit `web-push generate-vapid-keys` generieren; Public Key im Frontend einbetten, Private Key nur auf dem Server.

---

## Responsive Breakpoints

| Klasse | Breite | Layout |
|---|---|---|
| Phone | `< 768px` | Tab-Bar unten, Fullscreen-Sheets, Kamera fullscreen |
| Tablet | `768–1099px` | Icon-Rail 76px, Detail-Panel als Overlay |
| Desktop | `≥ 1100px` | Sidebar 232px, Detail-Panel 318px rechts fest, Scan als Modal |

---

## Performance-Ziele

| Metrik | Ziel |
|---|---|
| LCP | < 2.5 s (Mobilnetz 4G) |
| INP | < 200 ms |
| CLS | < 0.1 |
| Offline-Start | < 1 s (aus Cache) |
| Bundle (initial) | < 150 KB gzip (ohne ZXing) |
| ZXing (lazy) | nur laden wenn Scan geöffnet und BarcodeDetector fehlt |
