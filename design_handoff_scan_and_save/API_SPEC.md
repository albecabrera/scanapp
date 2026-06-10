# API_SPEC.md — Scan & Save · PHP REST-API

## Allgemeines

| Eigenschaft | Wert |
|---|---|
| Base-URL | `/api/v1` |
| Format | JSON (`Content-Type: application/json`) |
| Auth | Bearer Token (JWT, Header: `Authorization: Bearer <token>`) |
| Fehler | `{ "error": "message", "code": "SNAKE_CASE_CODE" }` |
| Datum/Zeit | ISO 8601, UTC: `2026-06-24T00:00:00Z` · Datumsfelder: `YYYY-MM-DD` |

## Authentifizierung

Alle Endpunkte außer `/auth/register` und `/auth/login` erfordern ein gültiges JWT im `Authorization`-Header.

**Middleware-Checks (für jeden geschützten Endpunkt):**
1. Token vorhanden und gültig → User-ID extrahieren
2. Membership-Check: User ist Mitglied des angeforderten Haushalts
3. Admin-Check (nur für Admin-Aktionen): User hat Rolle `admin` in diesem Haushalt

---

## Auth

### `POST /auth/register`
Neuen Account erstellen.

**Request:**
```json
{
  "email": "ana@example.com",
  "password": "min8chars",
  "display_name": "Ana"
}
```
**Response `201`:**
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "email": "ana@example.com", "display_name": "Ana", "avatar_index": 0, "lang": "de", "theme": "system" }
}
```
**Fehler:** `409 EMAIL_TAKEN`, `422 VALIDATION_ERROR`

---

### `POST /auth/login`
**Request:**
```json
{ "email": "ana@example.com", "password": "..." }
```
**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "email": "...", "display_name": "Ana", "avatar_index": 0, "lang": "de", "theme": "system" }
}
```
**Fehler:** `401 INVALID_CREDENTIALS`

---

### `PATCH /auth/me`
Profil aktualisieren (ein oder mehrere Felder).

**Request (alle optional):**
```json
{ "display_name": "Ana C.", "avatar_index": 2, "lang": "es", "theme": "dark" }
```
**Response `200`:** aktualisiertes `user`-Objekt

---

## Haushalte

### `GET /households`
Alle Haushalte des eingeloggten Users.

**Response `200`:**
```json
{
  "households": [
    {
      "id": 1,
      "name": "Casa Cabrera",
      "role": "admin",
      "member_count": 3,
      "members": [
        { "id": 1, "display_name": "Ana", "avatar_index": 0, "role": "admin" }
      ]
    }
  ]
}
```

---

### `POST /households`
Neuen Haushalt erstellen. Ersteller wird automatisch Admin.

**Request:** `{ "name": "Casa Cabrera" }`  
**Response `201`:** Haushalt-Objekt (wie oben)

---

### `PATCH /households/:id`
Haushalt umbenennen. **Admin erforderlich.**

**Request:** `{ "name": "Neuer Name" }`  
**Response `200`:** aktualisiertes Haushalt-Objekt

---

### `DELETE /households/:id`
Haushalt löschen (alle Items + Mitglieder werden kaskadiert gelöscht). **Admin erforderlich.**  
**Response `204`**

---

## Mitglieder

### `DELETE /households/:id/members/:userId`
Mitglied entfernen. **Admin erforderlich.** Admin kann sich nicht selbst entfernen, solange keine anderen Admins existieren.  
**Response `204`**  
**Fehler:** `409 LAST_ADMIN`

---

### `PATCH /households/:id/members/:userId`
Rolle ändern (`admin` ↔ `member`). **Admin erforderlich.**  
**Request:** `{ "role": "admin" }`  
**Response `200`:** `{ "user_id": 5, "role": "admin" }`

---

## Einladungen

### `POST /households/:id/invites`
Neuen Einladungscode generieren (7 Tage gültig). **Admin erforderlich.**  

**Response `201`:**
```json
{
  "code": "CASA-7K2M",
  "expires_at": "2026-06-17T12:00:00Z",
  "share_url": "https://app.scansave.app/join/CASA-7K2M"
}
```

---

### `GET /households/:id/invites/active`
Aktuell gültigen Code abrufen (neuester nicht-abgelaufener Code).  
**Response `200`:** wie oben · `404` wenn keiner vorhanden

---

### `POST /invites/join`
Mit Code einem Haushalt beitreten.

**Request:** `{ "code": "CASA-7K2M" }`  
**Response `200`:** Haushalt-Objekt des beigetretenen Haushalts  
**Fehler:** `404 CODE_NOT_FOUND`, `410 CODE_EXPIRED`, `409 ALREADY_MEMBER`

---

## Inventar

### `GET /households/:id/items`
Alle Items des Haushalts.

**Query-Parameter (optional):**
- `location=fridge|freezer|pantry` — filtern nach Ort
- `expires_within=7` — nur Items, die in N Tagen ablaufen
- `sort=expires_at|added_at` (Standard: `expires_at ASC`)

**Response `200`:**
```json
{
  "items": [
    {
      "id": 42,
      "ean": "8410188012096",
      "name": "Leche de avena",
      "brand": "Oatly",
      "image_url": "https://images.openfoodfacts.org/...",
      "location": "fridge",
      "expires_at": "2026-06-10",
      "quantity": 1,
      "tile_index": 0,
      "added_by":   { "id": 1, "display_name": "Ana", "avatar_index": 0 },
      "assigned_to": null,
      "added_at": "2026-06-03T09:14:00Z"
    }
  ]
}
```

---

### `POST /households/:id/items`
Neues Item hinzufügen.

**Request:**
```json
{
  "ean":         "8410188012096",
  "name":        "Leche de avena",
  "location":    "fridge",
  "expires_at":  "2026-06-24",
  "quantity":    1,
  "assigned_to": null
}
```
`ean` optional (leer bei manuellem Eintrag). `name` immer erforderlich.  
**Response `201`:** Item-Objekt (wie oben)

---

### `PATCH /households/:id/items/:itemId`
Item aktualisieren (ein oder mehrere Felder).

**Request (alle optional):**
```json
{
  "name": "...",
  "location": "pantry",
  "expires_at": "2026-07-01",
  "quantity": 2,
  "assigned_to": 3
}
```
**Response `200`:** aktualisiertes Item-Objekt

---

### `POST /households/:id/items/:itemId/consume`
1 Einheit verbrauchen. Wenn `quantity` danach 0 wird, wird das Item gelöscht.

**Response `200`:**
```json
{ "id": 42, "quantity": 0, "deleted": true }
```
oder `{ "id": 42, "quantity": 1, "deleted": false }`

---

### `DELETE /households/:id/items/:itemId`
Item vollständig entfernen.  
**Response `204`**

---

## Open Food Facts Proxy

### `GET /products/:ean`
EAN nachschlagen — zuerst im lokalen Cache, dann Open Food Facts.

**Response `200`:**
```json
{
  "ean":       "8410188012096",
  "name":      "Leche de avena",
  "brand":     "Oatly",
  "image_url": "https://images.openfoodfacts.org/...",
  "cached":    true
}
```
**Fehler:** `404 PRODUCT_NOT_FOUND` (in OFF nicht gefunden)

**Cache-Logik (serverseitig):**
- Existiert EAN in `products`-Tabelle und `fetched_at` < 30 Tage → Cache zurückgeben
- Sonst OFF-API aufrufen: `https://world.openfoodfacts.org/api/v2/product/{ean}.json`
- Ergebnis in `products`-Tabelle upserten

---

## Benachrichtigungseinstellungen

### `GET /households/:id/notifications`
**Response `200`:**
```json
{
  "threshold_days": ["1", "3"],
  "warn_all_tomorrow": false,
  "my_override": { "muted": false, "threshold_days": null }
}
```

---

### `PATCH /households/:id/notifications`
Haushalt-Einstellungen. **Admin erforderlich.**

**Request:**
```json
{ "threshold_days": ["1","7"], "warn_all_tomorrow": true }
```
**Response `200`:** aktualisiertes Einstellungs-Objekt

---

### `PATCH /households/:id/notifications/me`
Eigenen Override aktualisieren.

**Request:**
```json
{ "muted": false, "threshold_days": ["3"] }
```
`threshold_days: null` → Haushalt-Standard verwenden  
**Response `200`:** `{ "muted": false, "threshold_days": ["3"] }`

---

## Push Subscriptions (v1)

### `POST /push/subscribe`
Web-Push-Subscription registrieren.

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "p256dh":   "<Base64url>",
  "auth":     "<Base64url>",
  "user_agent": "Mozilla/5.0 ..."
}
```
**Response `201`:** `{ "id": 7 }`

### `DELETE /push/subscribe`
Aktuelle Subscription des Geräts entfernen.  
**Request:** `{ "endpoint": "https://..." }`  
**Response `204`**

---

## HTTP-Statuscodes

| Code | Bedeutung |
|---|---|
| 200 | OK |
| 201 | Erstellt |
| 204 | Kein Inhalt (Löschen) |
| 400 | Ungültige Anfrage |
| 401 | Nicht authentifiziert |
| 403 | Keine Berechtigung (nicht Mitglied oder nicht Admin) |
| 404 | Nicht gefunden |
| 409 | Konflikt (z. B. E-Mail schon vergeben, bereits Mitglied) |
| 410 | Ressource abgelaufen (Einladungscode) |
| 422 | Validierungsfehler (fehlende Pflichtfelder, falsches Format) |
| 429 | Rate-Limit überschritten |
| 500 | Interner Serverfehler |
