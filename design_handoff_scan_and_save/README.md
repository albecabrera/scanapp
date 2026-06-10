# Handoff: Scan & Save — Familien-Vorrats-App (PWA)

## Überblick

**Scan & Save** ist eine Multiplattform-PWA für Familien/Haushalte: Lebensmittel per EAN-Barcode scannen, gemeinsamer Haushalts-Vorrat (Kühlschrank / Gefrierfach / Vorrat), Ablaufdaten (MHD) verfolgen, Erinnerungen bevor etwas abläuft. Mehrere Haushalte pro Nutzer, Rollen (Admin/Member), Einladung per teilbarem Link/Code.

**Gewählter Stack (vom Product Owner festgelegt):**
- **Frontend:** PWA (eine Codebasis für Phone / Tablet / Desktop), responsive
- **Backend:** PHP (REST-API) — siehe `API_SPEC.md`
- **Datenbank:** SQL (MySQL/MariaDB) — siehe `schema.sql`
- **Produktdaten:** Open Food Facts API (EAN-Lookup, serverseitig gecacht)

## Über die Design-Dateien

Die Dateien in `design/` sind **Design-Referenzen in HTML/React** — klickbare Prototypen, die das beabsichtigte Aussehen und Verhalten zeigen. Sie sind **kein Produktionscode**. Aufgabe ist es, diese Designs in der Ziel-Codebasis nachzubauen. Da noch keine Codebasis existiert: Framework frei wählbar (empfohlen: ein leichtes SPA-Framework wie React/Vue/Svelte oder auch Vanilla JS + Web Components — Hauptsache PWA-fähig und die PHP-API bleibt sauber getrennt).

Die Prototypen lokal ansehen: HTML-Dateien im Browser öffnen (benötigt Internet für React/Babel/Fonts via CDN). `design/lib/ios-frame.jsx`, `browser-window.jsx`, `design-canvas.jsx`, `tweaks-panel.jsx` sind nur Präsentations-Hüllen (Geräterahmen, Tweak-Panel) — **nicht** Teil des App-Designs.

## Fidelity

**High-fidelity.** Farben, Typografie, Abstände, Radien und Animationen sind final und sollen pixelgenau übernommen werden (siehe `DESIGN_TOKENS.css`). Die UI ist zweisprachig **Deutsch + Spanisch** (alle Strings in `design/lib/scansave-data.js` + `proto-data.js` — als i18n-Basis übernehmen). Heller + dunkler Modus sind beide spezifiziert.

## Designsprache „Fresco"

- Naturnahe Grüntöne, viel Licht, großzügige Radien (22px Karten, Pillen-Chips)
- **Liquid-Glass-Elemente** (Apple-artig): Header-Pills, Tab-Bar und Glas-Buttons mit `backdrop-filter: blur(14–18px) saturate(160–180%)`, halbtransparentem Hintergrund und innerem Glanz (inset-Schatten) — Rezept in `design/lib/proto-shared.jsx` → `SSGlass`
- Schrift: **Schibsted Grotesk** (Google Fonts), Display 700–800, Body 400–600
- Easing überall: `cubic-bezier(0.32, 0.72, 0, 1)` (Apple-Spring-Charakter)

## Screens / Views

### 1. Onboarding (nur Phone-Flow gezeigt, gilt analog überall)
1. **Welcome** — Logo-Tile (76px, Radius 24, Primärgrün, Scan-Icon), Titel 40px/800, Tagline, 3 Feature-Bullets (40px-Tile mit Icon in Primärtint + Text 15px/600, gestaffelte fade-up-Animation 0.1s Versatz), Primär-CTA unten.
2. **Start wählen** — zwei große Options-Karten: „Haushalt erstellen" / „Mit Code beitreten" (Icon-Tile 46px, Titel 16px/700, Subzeile 13px, Chevron).
3. **Formular** — Name des Haushalts ODER Einladungscode; Eingabefeld mit Primär-Border (1.5px) + Fokus-Ring `0 0 0 4px primary/10%` + blinkendem Caret.
4. **Fertig** — Häkchen-Kreis 92px mit Pop-Animation (`scale 0.4→1.08→1`, 0.6s) + SVG-Strich-Animation (stroke-dashoffset), Haushalts-Pill, CTA „Zu den Vorräten".

### 2. Vorräte (Inventar) — Haupt-Tab
- **Header:** Haushalts-Pill links (Glas, Avatar-Stapel + Name + Chevron → öffnet Haushaltswechsler-Sheet), Glocken-Button rechts (Glas, roter Punkt bei fälligen Produkten → öffnet Mitteilungen-Sheet)
- **Titel** 32px/700 + Zusammenfassung „N Produkte · M laufen bald ab" (14px, inkSoft)
- **„Läuft bald ab"-Karussell:** horizontal scrollbar, Karten 128px (Tile 38px + Badge oben, Name 13.5px/600, Detail 11.5px)
- **Filter-Chips:** Alle / Kühlschrank / Gefrierfach / Vorrat — aktiv: ink-Hintergrund mit bg-Text; 0.3s Übergang
- **Sektionen** je Ort: Karte (surface, Radius 22, 1px Border) mit Zeilen: Tile 46px (getönter Platzhalter mit Initial — in Produktion echte Produktbilder von Open Food Facts), Name 15.5px/600 (+ „×N" bei Menge >1), Detail 13px, rechts MHD-Badge + 18px-Avatar des Hinzufügenden
- **MHD-Badge-Logik:** Heute/Morgen → rot (danger auf dangerBg) · ≤7 Tage → bernstein (warn) · sonst neutral „N Monate"
- **Tab-Bar:** Glas (blur 18px), 3 Einträge, Mitte = erhabener runder Scan-Button 56px (Primärfarbe, Schatten `0 8px 20px primary/33%`, ragt 20px über die Bar)

### 3. Scannen (Phone)
- Vollbild-Kamera (dunkler Verlauf als Platzhalter — in Produktion `getUserMedia`-Stream)
- Glas-Buttons oben: Schließen (X), Blitz
- Sucher 252×150px: weiße Eckwinkel (Radius), wandernde Scan-Linie (Primärfarbe, Glow, `1.8s ease-in-out infinite`), Fake-Barcode
- **Gefunden:** Ecken färben sich primärgrün, EAN-Pill poppt auf (dunkles Glas, Häkchen + Nummer mit letter-spacing 0.12em), ~650ms später springt das Sheet hoch
- **Hinzufügen-Sheet:** Produkt (Tile 54 + Name 19px + „Open Food Facts"-Tag in Primärtint), Ort-Segmented-Control (3 Optionen), MHD-Datumsfeld + Mengen-Stepper nebeneinander, Zuständig-Avatare (38px, Auswahl = Primär-Ring + volle Deckkraft), Primär-CTA „Zum Haushalt hinzufügen"
- Nach dem Hinzufügen: Wechsel zu Vorräte, neue Zeile blitzt in Primärtint auf (2s ausblendend), Toast „Zum Haushalt hinzugefügt"

### 4. Haushalt
- Titel = Haushaltsname 32px/700, Zahnrad-Glas-Button
- **Einladungs-Karte** (Primärtint-Hintergrund, Border primary/20%): Label, Code 27px/700 mit letter-spacing 0.06em, Kopier-Button (rund 38px, wird beim Klick primärgrün mit Häkchen, 1.8s), Teilen-CTA mit Share-Icon, Hinweis „Code läuft in 7 Tagen ab"
- **Mitglieder-Karte:** Zeilen mit Avatar 38px, Name (+ „· du"), Rollen-Badge (Admin = warn-Stil, Mitglied = neutral), Chevron
- **Ablauf-Erinnerungen-Karte:** Schwellen-Chips 1/3/7 Tage (mehrfach wählbar, an = Primärtint + Primär-Text), Toggle „Alle warnen, wenn morgen abläuft", Fußnote „Standardmäßig wird benachrichtigt, wer das Produkt hinzugefügt hat."

### 5. Sheets (Phone, überall)
Bottom-Sheets: Radius 28px oben, Grabber 38×5px, Scrim `rgba(8,16,11,0.45)` + leichtes Blur, Federung `transform 0.55s cubic-bezier(0.32,0.72,0,1)`.
- **Produkt-Detail:** Kopf (Tile 58 + Name 21px + Badge), Zeilen MHD / Ort / Hinzugefügt von / Menge (Stepper), Buttons „1 verbrauchen" (primär) + „Entfernen" (danger-Text)
- **Haushaltswechsler:** Karten je Haushalt (Avatar-Stapel, Name, Mitgliederzahl, Auswahl = Primär-Border + Ring + Häkchen-Kreis), gestrichelte „Neuer Haushalt"-Karte
- **Mitteilungen:** Liste der bald ablaufenden Produkte mit Badge

### 6. Desktop (≥ ~1100px) — `design/Scan & Save — Desktop.html`
- **Sidebar 232px** (surface, rechte Border): Logo, Primär-CTA „Produkt scannen", Nav (Vorräte/Haushalt, aktiv = Primärtint-Pill), unten Haushaltswechsler
- **Inventar:** Kopfzeile (Titel + Suchfeld 230px + Glocke), Filter-Chips, **Karten-Grid** `repeat(auto-fill, minmax(200px, 1fr))`, Karte: Tile + Badge oben, Name/Detail, unten Ort-Chip + Avatar; Auswahl = Primär-Border + Ring
- **Detail-Panel rechts 318px** (statt Sheet): gleicher Inhalt wie Produkt-Detail, schiebt sich via margin-Animation ein
- **Scannen = Modal** 420px zentriert: EAN-Eingabefeld (+ in Produktion: Webcam-Option), „Nachschlagen" → Formular klappt auf (max-height-Übergang), gleiche Felder wie Phone
- **Haushalt:** max. 860px, zweispaltiges Grid (Einladung + Erinnerungen links, Mitglieder rechts)

### 7. Tablet (~768–1099px)
Wie Desktop, aber: Sidebar kollabiert zur **Icon-Leiste 76px**, Detail-Panel wird **Overlay** (slide-in von rechts mit Schatten), Grid `minmax(180px,1fr)`, Suchfeld schmaler.

## Interaktionen & Verhalten

- **Easing global:** `cubic-bezier(0.32, 0.72, 0, 1)`; Dauer 0.25–0.6s (klein → schnell)
- **Press-Feedback:** alle tappbaren Elemente skalieren beim Drücken auf 0.85–0.98 (`transform 0.25s`)
- **Tab-Wechsel (Phone):** Crossfade + 8px translateY + scale 0.992, 0.4–0.5s
- **Onboarding-Schritte:** 56px-Slide + Fade, 0.45–0.55s
- **Toast:** Pille (ink-Hintergrund, bg-Text, 13.5px/600) mit animiertem Häkchen (stroke-dashoffset), erscheint 2.2s; Phone: unten über der Tab-Bar, Desktop: oben mittig
- **Verbrauchen:** Menge >1 → dekrementieren, sonst Zeile entfernen; Toast
- **Reduced Motion:** `@media (prefers-reduced-motion: reduce)` → Entrance-Animationen aus
- **Responsive Breakpoints:** `<768px` Phone (Tab-Bar) · `768–1099px` Tablet (Icon-Rail) · `≥1100px` Desktop (Sidebar)

## State Management (Client)

- `session` (User, Token), `households[]`, `activeHouseholdId` (persistiert)
- `items[]` des aktiven Haushalts: `{ id, ean, name, brand, image, location, expiresAt, quantity, addedBy, assignedTo }`
- UI-State: aktiver Tab/View, Filter (`all|fridge|freezer|pantry`), offene Sheets/Modals, Toast-Queue, Sprache (`de|es`), Theme (`light|dark|system`)
- Mutationen optimistisch anwenden, dann API; bei Fehler zurückrollen + Toast

## Design Tokens

Vollständig in **`DESIGN_TOKENS.css`** (hell + dunkel als CSS Custom Properties). Kernwerte hell: bg `#F4F6EF`, surface `#FFFFFF`, ink `#122319`, primary `#237A4B`, primaryTint `#DCEDDD`, danger `#BC3D26`, warn `#A1700E`. Radien: Karte 22 / Tile 14 / Button 16 / Chip pillenförmig. Schrift Schibsted Grotesk.

## Backend & Daten

- **`schema.sql`** — MySQL-Schema: users, households, household_members (Rollen), invites (Code + Ablauf), products (EAN-Cache), inventory_items, notification_settings (+ per-User-Overrides), push_subscriptions (für v1)
- **`API_SPEC.md`** — PHP-REST-Endpunkte inkl. Zugriffsregeln (Membership-/Admin-Checks als Middleware — das MySQL-Äquivalent zu RLS) und Open-Food-Facts-Proxy
- **`PWA_SPEC.md`** — Manifest, Service Worker, Barcode-Scanning (BarcodeDetector + ZXing-Fallback), Benachrichtigungs-Strategie (MVP lokal → v1 Web Push per Cron)

## Assets

- Keine Bild-Assets im Design — Produkt-„Tiles" sind getönte Platzhalter mit Initialen. In Produktion: `image_url` von Open Food Facts, Fallback = Initial-Tile (Farben siehe Tokens `--tile-*`)
- Icons: Inline-SVG, 24×24-Viewbox, Stroke 1.7–2px, runde Kappen — Pfade in `design/lib/scansave-ui.jsx` (`SS_ICON_PATHS`)
- App-Icon für PWA-Manifest muss noch erstellt werden (Vorlage: Scan-Icon auf Primärgrün, Radius ~24%)

## Dateien

| Datei | Inhalt |
|---|---|
| `design/Scan & Save — Prototyp.html` | Phone-Prototyp (Onboarding + 3 Tabs + Sheets) |
| `design/Scan & Save — Desktop.html` | Desktop/Tablet-Layout |
| `design/lib/scansave-themes.js` | Theme-Tokens (Quelle für DESIGN_TOKENS.css) |
| `design/lib/scansave-data.js`, `proto-data.js` | **Alle DE/ES-Strings** (i18n-Basis) |
| `design/lib/scansave-ui.jsx` | Atome: Icons, Avatare, Badges, Tiles, Karten |
| `design/lib/proto-shared.jsx` | Liquid-Glass, Sheets, Toast, Tab-Bar, Press-Feedback, Easing |
| `design/lib/proto-onboarding.jsx`, `proto-inventory.jsx`, `proto-scan-household.jsx` | Phone-Screens |
| `design/lib/desktop-app.jsx` | Desktop-/Tablet-Komponenten |
| `schema.sql`, `API_SPEC.md`, `PWA_SPEC.md`, `DESIGN_TOKENS.css` | Implementierungs-Spezifikationen |
| `CLAUDE_CODE_PROMPT.md` | Fertiger Start-Prompt für Claude Code |
