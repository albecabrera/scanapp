# CLAUDE_CODE_PROMPT.md — Prompt de arranque para Claude Code

Pega este texto completo en Claude Code al comenzar el proyecto.

---

## Contexto del proyecto

Estás implementando **Scan & Save**, una PWA multiplataforma para gestión de despensa familiar. Los usuarios escanean códigos de barras EAN para registrar alimentos, hacen seguimiento de fechas de caducidad y reciben alertas antes de que venzan.

Esta carpeta (`design_handoff_scan_and_save/`) contiene **toda la especificación técnica y visual**. Lee los archivos en este orden antes de escribir una línea de código:

1. `README.md` — visión general completa, pantallas, interacciones, decisiones de stack
2. `DESIGN_TOKENS.css` — todos los colores, radios, tipografía, animaciones como CSS custom properties
3. `schema.sql` — esquema MySQL completo (tablas, relaciones, índices)
4. `API_SPEC.md` — endpoints PHP REST completos con ejemplos de request/response
5. `PWA_SPEC.md` — manifest, service worker, barcode scanning (BarcodeDetector + ZXing fallback), notificaciones
6. `design/Scan & Save - Prototyp.html` — prototipo interactivo Phone (ábrelo en un navegador para ver el diseño en acción)
7. `design/Scan & Save - Desktop.html` — prototipo interactivo Desktop/Tablet
8. `design/lib/scansave-themes.js` — tokens de diseño en JS (fuente de verdad visual)
9. `design/lib/scansave-data.js` + `proto-data.js` — todos los strings DE/ES (base para i18n)
10. `design/lib/scansave-ui.jsx` — átomos: iconos SVG, avatares, badges, tiles, cards
11. `design/lib/proto-shared.jsx` — liquid-glass, sheets, toasts, tab bar, press feedback
12. `design/lib/proto-onboarding.jsx`, `proto-inventory.jsx`, `proto-scan-household.jsx` — pantallas Phone
13. `design/lib/desktop-app.jsx` — componentes Desktop/Tablet

---

## Stack elegido (no cambiar)

- **Frontend:** PWA responsiva (una sola codebase), framework libre — recomendado React + Vite o Svelte
- **Backend:** PHP 8.x, API REST pura (sin framework obligatorio — Laravel o puro, a tu elección)
- **Base de datos:** MySQL / MariaDB — esquema en `schema.sql`
- **Datos de productos:** Open Food Facts API (proxy server-side, cacheado en tabla `products`)
- **Fuente:** Schibsted Grotesk desde Google Fonts
- **Íconos:** inline SVG — rutas en `design/lib/scansave-ui.jsx` → `SS_ICON_PATHS`

---

## Diseño visual — reglas no negociables

- **Paleta "Fresco"**: usa exclusivamente los tokens de `DESIGN_TOKENS.css`. No inventes colores.
- **Liquid-glass**: header pills, tab bar y botones de vidrio usan `backdrop-filter: blur(14–18px) saturate(160–180%)` + fondo semitransparente + sombra inset (brillo). Ver implementación en `proto-shared.jsx` → `SSGlass`.
- **Easing global**: `cubic-bezier(0.32, 0.72, 0, 1)` para todas las transiciones.
- **Press feedback**: todos los elementos tapeables escalan a 0.85–0.98 al presionar, 0.25s.
- **Tipografía**: Schibsted Grotesk, Display 700–800, Body 400–600, letter-spacing `-0.02em` en títulos.
- **Reduced motion**: todas las animaciones de entrada dentro de `@media (prefers-reduced-motion: no-preference)`.
- **Modo oscuro**: implementar desde el inicio — tokens dark mode en `DESIGN_TOKENS.css`.

---

## Arquitectura sugerida

```
/
├── frontend/          # PWA (React+Vite o Svelte)
│   ├── src/
│   │   ├── components/   # Átomos y moléculas (seguir naming de los JSX del diseño)
│   │   ├── screens/      # Onboarding, Inventory, Scan, Household
│   │   ├── lib/
│   │   │   ├── api.js       # fetch wrapper con auth
│   │   │   ├── i18n.js      # strings DE/ES (extraer de scansave-data.js)
│   │   │   └── tokens.js    # importar DESIGN_TOKENS como JS object si necesario
│   │   ├── sw.js            # Service Worker
│   │   └── main.js
│   ├── public/
│   │   ├── manifest.json    # ver PWA_SPEC.md
│   │   └── icons/
│   └── vite.config.js
│
└── backend/           # PHP REST API
    ├── api/
    │   ├── auth/          # register, login, me
    │   ├── households/    # CRUD + members + invites
    │   ├── items/         # inventory items
    │   ├── products/      # EAN lookup / OFF proxy
    │   ├── notifications/ # settings
    │   └── push/          # subscriptions
    ├── middleware/
    │   ├── AuthMiddleware.php       # JWT validation
    │   └── MembershipMiddleware.php # household membership check
    ├── schema.sql
    └── config/db.php
```

---

## Pantallas a implementar (en orden de prioridad)

### P0 — MVP funcional
1. **Onboarding** (4 pasos: Bienvenida → Elegir → Formulario → Listo)
2. **Inventario** — lista por ubicación, carrusel "vence pronto", filtros, badges MHD
3. **Escanear** — cámara + BarcodeDetector → lookup EAN → sheet "Añadir al hogar"
4. **Haushalt/Hogar** — código de invitación, lista de miembros, ajustes de alertas
5. **Auth** — login / registro

### P1 — Completo
6. Haushaltswechsler (sheet para cambiar de hogar)
7. Detalle de producto (sheet en phone, panel lateral en desktop)
8. Notificaciones locales (al abrir la app)
9. Modo oscuro

### P2 — v1
10. Web Push (cron PHP + `minishlink/web-push`)
11. Offline con sync queue (IndexedDB)
12. Tablet layout (icon rail 76px)

---

## Comportamientos críticos de UI

- **Tab switch (Phone):** crossfade + 8px translateY + scale 0.992, 0.4–0.5s
- **Bottom sheets:** spring desde abajo, `transform 0.55s cubic-bezier(0.32,0.72,0,1)`, scrim `rgba(8,16,11,0.45)` + blur(2px)
- **Toast:** píldora con checkmark animado (stroke-dashoffset), 2.2s, aparece sobre tab bar
- **Nuevo item en lista:** fondo `--color-primary-tint` que desvanece en 2s (`ss-newitem` keyframe)
- **Escanear — found:** esquinas del viewfinder se vuelven primario, pill EAN aparece con pop, 650ms después sube el sheet
- **Onboarding steps:** slide 56px + fade, 0.45–0.55s
- **Checkmark de éxito (Onboarding step 4):** `scale 0.4→1.08→1` + SVG stroke-dashoffset en 0.6s

---

## Estado global del cliente

```js
{
  // Auth
  session: { userId, token, displayName, avatarIndex, lang, theme },

  // Households
  households: [{ id, name, role, members[] }],
  activeHouseholdId: <persisted in localStorage>,

  // Inventory del hogar activo
  items: [{ id, ean, name, brand, imageUrl, location, expiresAt, quantity, tileIndex, addedBy, assignedTo, addedAt }],

  // UI
  activeTab: 'inventory' | 'scan' | 'home',
  locationFilter: 'all' | 'fridge' | 'freezer' | 'pantry',
  openSheet: null | 'product-detail' | 'household-switcher' | 'notifications',
  activeItemId: null | <id>,
  toastQueue: [{ label, id }],
  lang: 'de' | 'es',
  theme: 'light' | 'dark' | 'system',
}
```

**Mutaciones optimistas:** aplicar cambio en UI inmediatamente, luego llamar API. Si falla: revertir + toast de error.

---

## i18n

Todos los strings están en `design/lib/scansave-data.js` (ES) y `design/lib/proto-data.js` (DE). Extraer como objeto i18n para la app. La lingua predeterminada es **Alemán (`de`)**, con Español (`es`) como segunda lengua. El usuario puede cambiar en ajustes de perfil (`PATCH /auth/me`).

---

## Notas de seguridad backend

- Passwords: bcrypt, cost ≥ 12 (`password_hash($pw, PASSWORD_BCRYPT, ['cost' => 12])`)
- JWT: `HS256` mínimo, `RS256` recomendado; expiración 7 días; refresh token opcional para MVP
- Membership check en CADA endpoint de haushalt: verificar que `user_id` esté en `household_members` para ese `household_id`
- Admin check solo donde se necesita (ver `API_SPEC.md`)
- Open Food Facts proxy: no exponer el endpoint directamente al cliente — siempre pasar por el servidor para cachear y no saturar OFF
- Rate limiting: especialmente en `/auth/login` (máx. 10 req/min por IP)
- CORS: configurar para el dominio de la PWA solamente

---

## Primer paso sugerido

1. Leer todos los archivos listados arriba
2. Abrir los prototipos HTML en el navegador para entender las interacciones
3. Crear estructura de carpetas
4. Implementar `schema.sql` y `DESIGN_TOKENS.css`
5. Comenzar por Auth + Inventario (P0, screens 1–4)

¡Buena suerte! Todo lo que necesitas está en esta carpeta.
