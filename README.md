# Scan & Save

PWA para gestión del inventario doméstico. Escanea códigos de barras, **lee la fecha de vencimiento impresa con OCR on-device**, y envía notificaciones antes de que los productos expiren. Soporta múltiples miembros del hogar con sincronización en tiempo real y modo offline.

## Funciones principales

| Función | Cómo funciona |
|---------|---------------|
| **Escaneo de código de barras** | `BarcodeDetector` nativo con fallback a ZXing. Resuelve nombre/marca/foto vía Open Food Facts (cache 30 días). |
| **OCR de fecha de vencimiento** | Tras escanear, el botón "Escanear fecha" saca foto del envase y lee el MHD/best-before con Tesseract.js. Reconoce `DD.MM.YYYY`, `MM/YYYY`, ISO y `DD MES YYYY` (es/de/en). Elige la fecha futura más cercana. Todo en el dispositivo — la imagen nunca se sube. |
| **Sugerencia inteligente de caducidad** | Heurística por nombre + fallback por categorías de Open Food Facts (yogures, lácteos, congelados…). Chips de fecha rápidos. |
| **Modo lote (ráfaga)** | Escanea varios productos seguidos sin salir de la cámara; contador en vivo. Ideal para vaciar la compra del súper. |
| **Notificaciones de vencimiento** | Web Push diario (cron) a todos los miembros del hogar según sus umbrales, + fallback de notificación local al abrir la app. |
| **Hogar compartido** | Varios miembros, roles admin/member, invitaciones, sincronización en tiempo real. |
| **Offline-first** | Inventario cacheado en IndexedDB; escrituras encoladas y reenviadas con Background Sync. |

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8, Zustand, ZXing (barcode), Tesseract.js (OCR de fecha, lazy-load), PWA (SW + Web Push) |
| Backend | PHP 8.4, sin frameworks, JWT HS256 custom, Web Push RFC 8291/8292 |
| Base de datos | MariaDB 10.4 / MySQL 8 |
| Datos de productos | Open Food Facts API (cache server-side 30 días) |
| Infraestructura dev | Docker (XAMPP custom) |

## Arquitectura

```
scanapp/
├── frontend/          React + Vite
│   └── public/
│       ├── sw.js      Service Worker (cache, background sync, push)
│       └── manifest.json
├── backend/           PHP REST API
│   ├── index.php      Router
│   ├── routes/        Un archivo por recurso
│   ├── cron/          notify_expiring.php (daily push)
│   └── keys/          VAPID private key (git-ignored)
├── design_handoff_scan_and_save/
│   ├── schema.sql     Esquema completo de la DB
│   └── API_SPEC.md    Documentación completa de la API
├── nginx.conf         Config Nginx para producción
├── apache-vhost.conf  Config Apache para producción
└── deploy.sh          Script de deploy
```

**API base:** `https://tudominio.com/scanapp/api/v1`
**Frontend base:** `https://tudominio.com/scanapp/`

---

## Desarrollo local

### Requisitos

- Docker + Docker Compose
- Node.js 20+
- [XAMPP Docker](../xampp-docker/) corriendo

### 1. Base de datos

```bash
docker exec xampp-mariadb mysql -u root \
  -e "CREATE DATABASE IF NOT EXISTS scanapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker exec -i xampp-mariadb mysql -u root scanapp \
  < design_handoff_scan_and_save/schema.sql
```

### 2. Configuración del backend

```bash
cp backend/config.example.php backend/config.php
# Editar backend/config.php con los valores del entorno Docker
```

Valores mínimos para dev:

```php
define('DB_HOST', 'mariadb');   // nombre del servicio Docker
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'scanapp');
define('JWT_SECRET', 'dev-only-no-usar-en-prod');
define('APP_BASE', '/scanapp');
define('FRONTEND_ORIGIN', 'http://localhost:5174');
```

### 3. Iniciar Docker

```bash
cd ../xampp-docker
docker compose up -d
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5174
```

O usar el script de inicio que abre el browser automáticamente:

```bash
./start.sh
```

### 5. Build local (para probar en XAMPP)

```bash
cd frontend
npm run build
# Output → ~/xampp-data/htdocs/scanapp/ (configurado en vite.config.js)
```

---

## Deploy en producción

> Ver `TODO.md` para el checklist completo paso a paso.

### Requisitos del servidor

- Ubuntu 22.04+ o Debian 12+
- PHP 8.4 con extensiones: `php8.4-mysql`, `php8.4-curl`, `php8.4-mbstring`, `php8.4-gmp`
- MariaDB 10.4+ o MySQL 8+
- Nginx (recomendado) o Apache con `mod_rewrite` + `mod_headers`
- OpenSSL (para VAPID y TLS)
- Mínimo 512 MB RAM

### Variables de configuración

Todas las configuraciones sensibles van en `backend/config.php` (nunca commitear):

| Constante | Descripción | Ejemplo prod |
|-----------|-------------|--------------|
| `DB_HOST` | Host de la DB | `127.0.0.1` |
| `DB_USER` | Usuario DB (no root) | `scanapp_user` |
| `DB_PASS` | Contraseña DB | generada con openssl |
| `DB_NAME` | Nombre de la DB | `scanapp` |
| `JWT_SECRET` | Secreto para firmar tokens | `openssl rand -base64 48` |
| `APP_BASE` | Ruta base de la app | `/scanapp` o `` (raíz) |
| `FRONTEND_ORIGIN` | Origin del frontend para CORS | `https://tudominio.com` |
| `VAPID_PUBLIC_KEY` | Clave pública VAPID (base64url) | ver abajo |
| `VAPID_PRIVATE_PEM` | Ruta al archivo PEM | `/var/www/html/scanapp/api/keys/vapid_private.pem` |
| `VAPID_SUBJECT` | Email del admin | `mailto:admin@tudominio.com` |

### Generar claves VAPID

```bash
mkdir -p backend/keys
openssl ecparam -genkey -name prime256v1 -noout -out backend/keys/vapid_private.pem
chmod 600 backend/keys/vapid_private.pem

# Derivar clave pública (pegar en config.php como VAPID_PUBLIC_KEY):
openssl ec -in backend/keys/vapid_private.pem -text -noout \
  | sed -n '/pub:/,/ASN1 OID/p' | grep -v 'pub:\|ASN1 OID' \
  | tr -d ' \n:' | xxd -r -p | base64 | tr '+/' '-_' | tr -d '='
```

### Deploy con el script

```bash
# En el servidor, desde el directorio del repo
DEPLOY_PATH=/var/www/html/scanapp ./deploy.sh
```

El script hace: git pull → npm ci → build frontend → sync archivos → migraciones DB → permisos → reload server.

Para un deploy en seco (sin hacer cambios):

```bash
DRY_RUN=1 DEPLOY_PATH=/var/www/html/scanapp ./deploy.sh
```

### Configuración web server

**Nginx** (recomendado):

```bash
cp nginx.conf /etc/nginx/sites-available/scanapp
# Reemplazar yourdomain.com con tu dominio real
nano /etc/nginx/sites-available/scanapp
ln -s /etc/nginx/sites-available/scanapp /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

**Apache**:

```bash
cp apache-vhost.conf /etc/apache2/sites-available/scanapp.conf
a2enmod rewrite headers deflate ssl
a2ensite scanapp
apachectl configtest && apachectl graceful
```

**HTTPS con Let's Encrypt:**

```bash
apt install -y certbot python3-certbot-nginx  # o python3-certbot-apache
certbot --nginx -d tudominio.com              # o --apache
```

### Base de datos

```sql
-- Crear usuario dedicado (no usar root en producción)
CREATE DATABASE scanapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'scanapp_user'@'localhost' IDENTIFIED BY 'contraseña-fuerte';
GRANT ALL PRIVILEGES ON scanapp.* TO 'scanapp_user'@'localhost';
FLUSH PRIVILEGES;
```

El schema y las migraciones las aplica automáticamente `deploy.sh`. Para aplicar manualmente:

```bash
mysql -u scanapp_user -p scanapp < design_handoff_scan_and_save/schema.sql
```

### Cron (notificaciones push)

El script `backend/cron/notify_expiring.php` busca productos próximos a vencer y envía Web Push a los usuarios suscritos.

```bash
crontab -u www-data -e
```

```cron
# Notificaciones diarias a las 9:00
0 9 * * * /usr/bin/php /var/www/html/scanapp/api/cron/notify_expiring.php >> /var/log/scanapp-cron.log 2>&1
```

Test manual:

```bash
sudo -u www-data php /var/www/html/scanapp/api/cron/notify_expiring.php
```

### Build del frontend (variable de entorno)

El output dir de Vite se controla con la variable `DEPLOY_PATH`:

```bash
# Dev (default XAMPP):
npm run build

# Producción:
DEPLOY_PATH=/var/www/html/scanapp npm run build
```

### Verificar el deploy

```bash
# Health check de la API
curl https://tudominio.com/scanapp/api/v1/health
# Respuesta esperada: {"status":"ok","timestamp":"...","services":{"database":"connected"}}
```

---

## API

Base URL: `/scanapp/api/v1`

| Módulo | Endpoints principales |
|--------|----------------------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me` |
| Hogares | `GET/POST /households`, `PATCH/DELETE /households/:id` |
| Miembros | `GET /households/:id/members`, `DELETE/PATCH /households/:id/members/:uid` |
| Invitaciones | `POST /households/:id/invites`, `POST /invites/join` |
| Inventario | `GET/POST /households/:id/items`, `PATCH/DELETE /households/:id/items/:iid`, `POST /households/:id/items/:iid/consume` |
| Productos | `GET /products/:ean` (EAN → Open Food Facts + cache 30d; devuelve nombre, marca, foto y `categories` para la sugerencia de caducidad) |
| Compras | `GET/POST /households/:id/shopping`, `PATCH/DELETE /households/:id/shopping/:sid` |
| Notificaciones | `GET/PATCH /households/:id/notifications`, `PATCH /households/:id/notifications/me` |
| Push | `POST/DELETE /push/subscribe`, `GET /push/vapid-key` |
| Stats | `GET /households/:id/stats` |
| Health | `GET /health` |

Documentación completa: `design_handoff_scan_and_save/API_SPEC.md`

---

## PWA

| Feature | Estado |
|---------|--------|
| Instalable (manifest + SW) | ✅ |
| Offline (inventario cacheado en IDB) | ✅ |
| Background sync (cola de escrituras offline) | ✅ |
| Web Push (VAPID, RFC 8291/8292) | ✅ |
| App shortcuts (escanear desde homescreen) | ✅ |
| SW update detection (toast "Actualizar") | ✅ |
| Soporte iOS (apple-mobile-web-app-*) | ✅ |
| window-controls-overlay (desktop PWA) | ✅ |
| OCR de fecha on-device (Tesseract.js, lazy chunk ~120 KB gzip) | ✅ |

**Optimización del bundle:** las pantallas y librerías pesadas (ScanScreen, ZXing, Tesseract.js) van en chunks separados con carga diferida (`import()` dinámico). El núcleo inicial pesa ~75 KB gzip; Tesseract.js (~120 KB gzip) solo se descarga la primera vez que el usuario usa "Escanear fecha".

**Nota sobre el OCR:** Tesseract.js descarga su worker, WASM y modelo de idioma desde CDN (jsDelivr) en la primera ejecución. La imagen del producto **nunca sale del dispositivo** (el OCR corre en el navegador), pero la función requiere conexión la primera vez. Para OCR 100% offline habría que auto-hospedar los assets de Tesseract (ver `TODO.md`, backlog).

---

## Idiomas

Alemán (`de`, default), Español (`es`), Inglés (`en`). La preferencia se guarda en el perfil del usuario y en localStorage.

---

## Seguridad

- **Contraseñas:** bcrypt con cost=12
- **Auth:** JWT HS256, expiración 7 días, almacenado en localStorage
- **SQL:** PDO con prepared statements en todos los endpoints
- **CORS:** whitelist de origins explícita
- **Headers:** X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS (en producción vía nginx/apache)
- **VAPID private key:** en `backend/keys/` (git-ignored), permisos 600
- **Rate limiting:** configurado en nginx.conf (5 req/min en auth, 60 req/min en API general)

> **Nota:** el JWT está en localStorage (vulnerable a XSS). Para máxima seguridad, migrar a cookie httpOnly+Secure+SameSite=Strict. Ver `TODO.md`.
