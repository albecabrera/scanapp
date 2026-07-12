# Deploy de Scan & Save en un VPS con Plesk

Plan concreto para tu stack real: **frontend Vite/React 19 estático** + **backend PHP plano (PDO MySQL)** con JWT, Web Push (VAPID) y un cron de vencimientos. No necesitás Node.js en el servidor si construís el frontend localmente (recomendado).

---

## Decisión previa: subdominio (recomendado) vs subcarpeta

| Opción | URL | `vite base` | `APP_BASE` |
|---|---|---|---|
| **Subdominio (recomendado)** | `https://scanapp.tudominio.com/` | `/` | `''` |
| Subcarpeta | `https://tudominio.com/scanapp/` | `/scanapp/` | `/scanapp` |

El subdominio es más limpio: la PWA vive en la raíz, el scope del service worker es `/`, y no arrastrás el prefijo `/scanapp/` por todos lados. **El resto del plan asume subdominio.** Si vas por subcarpeta, ajustá `base` en `vite.config.js` y `APP_BASE` en `config.php`.

> **HTTPS es obligatorio**, no opcional: sin TLS el navegador no registra el service worker ni da acceso a cámara ni notificaciones. Plesk + Let's Encrypt lo resuelve gratis (paso 6).

---

## 1. Crear el dominio/subdominio en Plesk

1. **Websites & Domains → Add Subdomain** → `scanapp.tudominio.com`.
2. Document root: dejá el default (`/httpdocs` o `/scanapp.tudominio.com`). Anotá la ruta real, la vas a usar como `DEPLOY_PATH`.
3. **PHP Settings**: elegí **PHP 8.1+** (FPM). Verificá que estén activas las extensiones `pdo_mysql`, `openssl`, `mbstring`, `json`, `curl`.

## 2. Base de datos (MySQL/MariaDB)

1. **Databases → Add Database**: nombre `scanapp`.
2. Creá un **usuario dedicado** `scanapp_user` con contraseña fuerte. **No uses admin/root.**
3. Anotá host (casi siempre `127.0.0.1`), puerto `3306`, nombre, usuario y pass.

## 3. Construir el frontend (en tu Mac, no en el VPS)

Plesk normalmente no trae Node para builds. Construí localmente apuntando a una carpeta temporal:

```bash
cd ~/repos/scanapp/frontend
DEPLOY_PATH=/tmp/scanapp-dist npm ci
DEPLOY_PATH=/tmp/scanapp-dist npm run build
```

Para subdominio en la raíz, cambiá `base` a `'/'` antes de construir (o parametrizalo). El resultado en `/tmp/scanapp-dist` incluye `index.html`, `assets/`, `sw.js`, `manifest.json`, `offline.html`, `icons/` y el **`.htaccess`** ya arreglado (el fix del `no-store` del SW).

## 4. Subir archivos

Estructura final en el document root del subdominio:

```
<DEPLOY_PATH>/
├── index.html, assets/, sw.js, manifest.json, offline.html, icons/   ← build del frontend
├── .htaccess                                                          ← del build
└── api/                                                               ← backend PHP
    ├── index.php, db.php, routes/, migrations/ ...
    ├── keys/vapid_private.prod.pem
    └── config.php                                                     ← NO se commitea, se crea acá
```

Subida (elegí una):
- **SFTP/rsync**: `rsync -a /tmp/scanapp-dist/ usuario@vps:<DEPLOY_PATH>/` y `rsync -a ~/repos/scanapp/backend/ usuario@vps:<DEPLOY_PATH>/api/ --exclude config.php`.
- **Git de Plesk** (Websites & Domains → Git): clona `github.com/albecabrera/scanapp`. Útil para el backend, pero **el build del frontend igual lo hacés localmente** salvo que instales Node en el VPS.

## 5. Configurar el backend

1. Copiá `backend/config.prod.php` a `<DEPLOY_PATH>/api/config.php` y completá:
   - `DB_*` con los datos del paso 2.
   - `APP_BASE` = `''` (subdominio) o `'/scanapp'` (subcarpeta).
   - `FRONTEND_ORIGIN` = `https://scanapp.tudominio.com` (sin barra final).
   - `VAPID_SUBJECT` = tu mail real.
   - `JWT_SECRET` y las claves VAPID: **regeneralas para producción**, no reutilices las del repo (ver `config.example.php`).
2. Subí `keys/vapid_private.prod.pem`.
3. **Protegé `config.php` y `keys/`**: el `.htaccess` del backend ya bloquea lecturas web — verificá que esté presente en `api/`.

## 6. HTTPS con Let's Encrypt

**SSL/TLS Certificates → Install** (Let's Encrypt) para el subdominio, con redirect permanente HTTP→HTTPS activado. Sin esto la PWA no funciona.

## 7. Reescrituras del servidor (según Plesk use Apache o nginx)

- **Apache activo** (default de Plesk con proxy nginx): tu `.htaccess` ya hace todo (headers de seguridad, `Service-Worker-Allowed`, cache del SW, gzip). No toques nada.
- **nginx-only**: `.htaccess` se ignora. Traducí las reglas en **Apache & nginx Settings → Additional nginx directives**. Lo mínimo imprescindible:

```nginx
location = /sw.js {
    add_header Service-Worker-Allowed "/";
    add_header Cache-Control "no-store";
}
location ~* \.(js|css|woff2?)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}
location = /manifest.json { add_header Cache-Control "no-cache"; }
# SPA fallback: rutas del cliente → index.html
location / { try_files $uri $uri/ /index.html; }
```

Ya tenés un `nginx.conf` de referencia en el repo para copiar el resto.

## 8. Migraciones de base de datos

Con acceso SSH, desde `<DEPLOY_PATH>`:

```bash
mysql -h127.0.0.1 -uscanapp_user -p scanapp < <ruta>/design_handoff_scan_and_save/schema.sql
# luego los numerados en orden:
for f in api/migrations/0*.sql; do mysql -h127.0.0.1 -uscanapp_user -p scanapp < "$f"; done
```

Sin SSH: importá esos `.sql` desde **phpMyAdmin** (Databases → phpMyAdmin) en orden.

## 9. Cron de vencimientos

**Websites & Domains → Scheduled Tasks → Add Task**:
- Comando: `php <DEPLOY_PATH>/api/cron/notify_expiring.php`
- Frecuencia: 1×/día (ej. 08:00).
- Requiere que las claves VAPID y `config.php` estén bien: es lo que dispara los Web Push.

## 10. Verificación post-deploy (checklist)

```bash
curl -s https://scanapp.tudominio.com/api/v1/health      # {"status":"ok", database:"connected"}
curl -sI https://scanapp.tudominio.com/sw.js | grep -i cache-control   # → no-store
curl -sI https://scanapp.tudominio.com/assets/…​.js | grep -i cache-control # → immutable
```

En el navegador (DevTools → Application):
- **Manifest**: sin errores, íconos cargan.
- **Service Workers**: `activated and running`, scope correcto.
- **Lighthouse → PWA**: instalable, offline funciona (cortá la red y recargá → `offline.html`).
- Probá el flujo real: login → escanear → agregar item → cerrar red → sigue leyendo el inventario cacheado.

---

## Resumen del flujo de actualización futura

```bash
# local
cd ~/repos/scanapp/frontend && DEPLOY_PATH=/tmp/scanapp-dist npm run build
rsync -a /tmp/scanapp-dist/ vps:<DEPLOY_PATH>/
rsync -a ~/repos/scanapp/backend/ vps:<DEPLOY_PATH>/api/ --exclude config.php --exclude 'keys/'
# en el VPS: aplicar migraciones nuevas si las hay
```

El `deploy.sh` del repo automatiza casi todo esto, pero **asume Node en el servidor**. En Plesk, o instalás Node (extensión Node.js) y usás `deploy.sh` tal cual, o seguís el flujo de build-local de arriba (más simple y sin dependencias en el VPS).
