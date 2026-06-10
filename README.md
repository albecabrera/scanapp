# Scan & Save

PWA para gestión del inventario doméstico. Escanea códigos de barras, registra fechas de vencimiento y recibe notificaciones antes de que los productos expiren. Soporta múltiples miembros del hogar.

## Stack

- **Frontend** — React 19 + Vite, Zustand, ZXing browser, PWA (Service Worker + Web Push)
- **Backend** — PHP 8.4 (Apache), sin frameworks, JWT HS256 custom
- **Base de datos** — MariaDB 10.4
- **Infraestructura** — Docker (XAMPP custom)
- **Datos de productos** — Open Food Facts API (cache server-side 30 días)

## Arquitectura

```
frontend/          React + Vite (dev: localhost:5173)
backend/           PHP REST API → montado en /var/www/html/scanapp/api
htdocs/scanapp/    Build de Vite + SPA .htaccess
docker-compose     php-apache + mariadb + phpmyadmin
```

La API se sirve en `/scanapp/api/v1/*` vía Apache + `.htaccess` con mod_rewrite.

## Requisitos

- Docker + Docker Compose
- Node.js 20+
- [XAMPP Docker](../xampp-docker/) corriendo

## Setup rápido

### 1. Base de datos

```bash
docker exec xampp-mariadb mysql -u root -e "CREATE DATABASE IF NOT EXISTS scanapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker exec -i xampp-mariadb mysql -u root scanapp < design_handoff_scan_and_save/schema.sql
```

### 2. Configuración del backend

Crear `backend/config.php` (excluido del repo):

```php
<?php
define('DB_HOST', 'mariadb');
define('DB_PORT', 3306);
define('DB_NAME', 'scanapp');
define('DB_USER', 'root');
define('DB_PASS', '');
define('JWT_SECRET', 'cambiar-en-produccion');
define('APP_BASE', '/scanapp');
define('FRONTEND_ORIGIN', 'http://localhost:5173');
```

### 3. Docker

El `docker-compose.yml` en `xampp-docker/` ya incluye:
- Volume mount del backend: `backend/ → /var/www/html/scanapp/api`
- Config Apache persistente: `config/apache/scanapp.conf → /etc/apache2/conf-enabled/scanapp.conf`

```bash
cd ../xampp-docker
docker compose up -d
```

### 4. Frontend (desarrollo)

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

### 5. Frontend (producción)

```bash
cd frontend
npm run build     # output → ~/xampp-data/htdocs/scanapp/
```

## API

Base URL: `http://localhost/scanapp/api/v1`

| Módulo | Endpoints |
|--------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me` |
| Hogares | `GET/POST /households`, `GET/PATCH/DELETE /households/:id`, `GET/POST/DELETE /households/:id/members` |
| Inventario | `GET/POST /households/:id/items`, `PATCH/DELETE /items/:id`, `POST /items/:id/consume` |
| Productos | `GET /products/:ean` (lookup EAN → Open Food Facts) |
| Notificaciones | `GET/PATCH /households/:id/notifications`, `PATCH /households/:id/notifications/me` |
| Push | `POST/DELETE /push/subscribe` |

Ver `design_handoff_scan_and_save/API_SPEC.md` para documentación completa.

## Idiomas

Alemán (`de`, default) y Español (`es`). La preferencia se guarda en localStorage.

## PWA

- Instalable (manifest + Service Worker)
- Offline: inventario cacheado, imágenes de productos stale-while-revalidate
- Notificaciones push (requiere VAPID keys en producción)
- Shortcuts: acceso directo al escáner desde el homescreen
