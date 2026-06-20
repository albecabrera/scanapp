# TODO — Scan & Save: Camino a Producción

Checklist ordenado por prioridad. Cada bloque puede hacerse independientemente del siguiente,
pero los bloques están en el orden correcto para hacer el primer deploy.

**Última actualización:** 2026-06-20

---

## NUEVO (2026-06-20) — Features core de escaneo ✅ COMPLETO

- [x] **OCR de fecha de vencimiento** — `frontend/src/lib/ocr.js` (Tesseract.js lazy-load).
  Botón "Escanear fecha" en el form de scan. Reconoce DD.MM.YYYY, MM/YYYY, ISO, "DD MES YYYY".
- [x] **Modo lote (ráfaga)** — escaneo continuo sin salir de cámara, con contador.
- [x] **Sugerencia de caducidad por categorías OFF** — `products.php` devuelve `categories_tags`;
  `expirySuggest.js` mapea categoría → shelf-life (mucha más cobertura que keywords).
- [x] **Foto del producto en el form de scan** — usa `image_url` de Open Food Facts.
- [x] **Fix bug TZ en `daysUntil`** — parseo local midnight (evita off-by-one en TZ negativas/DST).
- [x] **Fix doble prompt de cámara** — `initCamera` adquiere el stream una sola vez.
- [x] **Cron notifica a TODOS los miembros** del hogar en su umbral (antes solo al que agregó).
- [x] **Fix notificación push** — al tocar, enfoca ventana abierta y resuelve URL contra el scope
  (antes abría pestaña nueva al root del dominio, roto bajo `/scanapp/`).
- [x] **Build de producción verificado** — `DEPLOY_PATH=/tmp/... npm run build` → limpio,
  Tesseract en chunk lazy separado, SW hash inyectado.

---

## BLOQUE 0 — Antes de tocar el servidor ✅ COMPLETO

- [x] **PWA manifest** — paths corregidos a relativos; `start_url`, `scope`, `id` = `"."`
- [x] **SW update detection** — toast "Actualizar" con 15s timeout + `SKIP_WAITING` handler
- [x] **Security headers en API** — `security_headers()` en helpers.php (X-Frame-Options, nosniff, etc.)
- [x] **Health endpoint** — `GET /api/v1/health` verifica DB, devuelve 503 si falla
- [x] **Frontend .htaccess** — cache headers para assets (immutable JS/CSS, no-store SW)
- [x] **offline.html** — fallback offline con i18n (de/es/en), cacheado en SW SHELL
- [x] **CORS fix** — removido `localhost` hardcodeado; usa `CORS_DEV_ORIGIN` opcional
- [x] **Generar JWT_SECRET fuerte** — 64 chars base64, guardado en `backend/config.prod.php`
- [x] **Generar claves VAPID** — `backend/keys/vapid_private.prod.pem` (P-256, 256 bit)
  - Clave pública: `BPAFNT8lgs8jkf-OYRRvkwvPgm63ye6kIJmyW17dyL7O_olSmjBB_AdlroslnsJonWCFRq2-tBnrF5X31ZBEoLA`
- [x] **`backend/config.prod.php` creado** — JWT + VAPID pre-rellenados
- [x] **Build de producción testeado** — `DEPLOY_PATH=/tmp/... npm run build` → limpio, SW hash inyectado
- [x] **Código pusheado a GitHub** — rama `main`, 6 commits nuevos

- [ ] **Completar `backend/config.prod.php`** — rellenar 3 campos pendientes:
  - `DB_PASS` — contraseña para el usuario `scanapp_user`
  - `FRONTEND_ORIGIN` — `https://TUDOMINIO.COM`
  - `VAPID_SUBJECT` — `mailto:TU@TUDOMINIO.COM`

- [ ] **Elegir stack de servidor**
  - Nginx + PHP-FPM → usar `nginx.conf` (recomendado para VPS)
  - Apache + mod_php → usar `apache-vhost.conf` (compartido/cPanel)

---

## BLOQUE 1 — Servidor

- [ ] **Provisionar servidor** (Ubuntu 22.04+ / Debian 12+)
  - Mínimo: 1 vCPU, 512 MB RAM, 10 GB disco

- [ ] **Instalar dependencias**
  ```bash
  # Nginx + PHP-FPM
  apt install -y nginx php8.4-fpm php8.4-mysql php8.4-curl php8.4-mbstring php8.4-gmp openssl

  # Apache
  apt install -y apache2 libapache2-mod-php8.4 php8.4-mysql php8.4-curl php8.4-mbstring php8.4-gmp
  a2enmod rewrite headers deflate ssl
  ```

- [ ] **Node.js 20+** (solo si vas a hacer el build en el servidor; si buildeas local y subes, no es necesario)
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
  ```

- [ ] **MariaDB / MySQL**
  ```bash
  apt install -y mariadb-server
  mysql_secure_installation
  ```
  Crear DB y usuario:
  ```sql
  CREATE DATABASE scanapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'scanapp_user'@'localhost' IDENTIFIED BY 'contraseña-fuerte';
  GRANT ALL PRIVILEGES ON scanapp.* TO 'scanapp_user'@'localhost';
  FLUSH PRIVILEGES;
  ```

- [ ] **Configurar web server**
  ```bash
  # Nginx
  cp nginx.conf /etc/nginx/sites-available/scanapp
  ln -s /etc/nginx/sites-available/scanapp /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx

  # Apache
  cp apache-vhost.conf /etc/apache2/sites-available/scanapp.conf
  a2ensite scanapp
  apachectl configtest && apachectl graceful
  ```

- [ ] **HTTPS con Let's Encrypt**
  ```bash
  apt install -y certbot python3-certbot-nginx  # o python3-certbot-apache
  certbot --nginx -d tudominio.com              # o --apache
  # certbot configura auto-renovación via systemd timer
  ```

---

## BLOQUE 2 — Primer Deploy

- [ ] **Subir código al servidor**
  ```bash
  # Opción A: git clone directamente en el servidor
  git clone https://github.com/tu-usuario/scanapp.git /tmp/scanapp
  cd /tmp/scanapp
  cp backend/config.example.php backend/config.php
  # editar config.php...

  # Opción B: buildear local y subir con rsync
  DEPLOY_PATH=/tmp/scanapp-build npm --prefix frontend run build
  rsync -az /tmp/scanapp-build/ user@servidor:/var/www/html/scanapp/
  rsync -az backend/ user@servidor:/var/www/html/scanapp/api/
  ```

- [ ] **Ejecutar deploy.sh**
  ```bash
  DEPLOY_PATH=/var/www/html/scanapp ./deploy.sh
  ```
  El script aplica migraciones automáticamente.

- [ ] **Verificar health check**
  ```
  curl https://tudominio.com/scanapp/api/v1/health
  # Esperado: {"status":"ok","timestamp":"...","services":{"database":"connected"}}
  ```

- [ ] **Verificar que la PWA carga**
  Abrir `https://tudominio.com/scanapp/` en Chrome/Safari
  → Debe cargar sin errores de consola
  → DevTools → Application → Manifest → sin errores
  → DevTools → Application → Service Workers → "Activated and running"

---

## BLOQUE 3 — Cron (Notificaciones Push)

- [ ] **Configurar crontab en el servidor**
  ```bash
  # Editar crontab del usuario www-data (o el que corre el web server)
  crontab -u www-data -e
  ```
  Agregar:
  ```cron
  # Notificaciones de productos por vencer — todos los días a las 9:00
  0 9 * * * /usr/bin/php /var/www/html/scanapp/api/cron/notify_expiring.php >> /var/log/scanapp-cron.log 2>&1
  ```

- [ ] **Crear archivo de log y dar permisos**
  ```bash
  touch /var/log/scanapp-cron.log
  chown www-data:www-data /var/log/scanapp-cron.log
  ```

- [ ] **Test manual del cron**
  ```bash
  sudo -u www-data php /var/www/html/scanapp/api/cron/notify_expiring.php
  ```

---

## BLOQUE 4 — Seguridad (post-deploy, antes de usuarios reales)

- [ ] **Rate limiting en auth** — nginx.conf ya lo tiene con `limit_req_zone`.
  Para Apache: instalar y configurar `mod_evasive` (ver comentario en apache-vhost.conf).

- [ ] **Permisos de archivos sensibles**
  ```bash
  chmod 600 /var/www/html/scanapp/api/keys/vapid_private.pem
  chmod 640 /var/www/html/scanapp/api/config.php
  chown -R www-data:www-data /var/www/html/scanapp/
  ```

- [ ] **Bloquear acceso directo a archivos PHP internos**
  El `.htaccess` de la API ya lo hace, pero verificar que `/scanapp/api/db.php`,
  `/scanapp/api/config.php`, etc. devuelven 403/404 al acceder por URL.

- [ ] **Verificar headers de seguridad**
  ```bash
  curl -I https://tudominio.com/scanapp/
  # Debe incluir: X-Content-Type-Options, X-Frame-Options, HSTS, etc.
  ```
  O usar: https://securityheaders.com

- [ ] **Ejecutar Lighthouse / PWA audit**
  Chrome DevTools → Lighthouse → modo "Mobile" → categorías: Performance + PWA
  Target: PWA score 100, Performance >90

---

## BLOQUE 5 — Monitoreo (para después del primer deploy)

- [ ] **Uptime monitoring** — UptimeRobot (gratis) o Better Uptime
  - URL a monitorear: `https://tudominio.com/scanapp/api/v1/health`
  - Intervalo: 5 minutos
  - Alertas: email/Slack

- [ ] **Logs de errores PHP**
  Verificar que los errores van a `/var/log/php8.4-fpm.log` y no al browser.
  En `php.ini`: `display_errors = Off`, `log_errors = On`, `error_log = /var/log/php_errors.log`

- [ ] **Rotación de logs**
  ```bash
  # /etc/logrotate.d/scanapp
  /var/log/scanapp-cron.log {
      daily
      rotate 14
      compress
      missingok
      notifempty
  }
  ```

---

## BLOQUE 6 — Mejoras técnicas (backlog, no bloqueantes)

- [ ] **Cambiar JWT de localStorage a cookie httpOnly**
  JWT en localStorage es vulnerable a XSS. Cookie httpOnly + Secure + SameSite=Strict
  requiere cambios en el backend (set-cookie en login/register) y en el cliente
  (quitar Bearer header, dejar que el browser envíe la cookie).

- [ ] **Input validation centralizada**
  Agregar validaciones de formato en `helpers.php`: EAN debe ser 8 o 13 dígitos,
  email validado por regex + mx check, location ENUM validada en cada endpoint.

- [ ] **Endpoint `/auth/logout`** que invalide el JWT server-side
  Actualmente el token solo expira (7 días). Un blacklist en DB (o Redis) permitiría
  logout real.

- [ ] **Tests de integración** — PHPUnit para los endpoints críticos (auth, items, push).

- [ ] **CI/CD pipeline** — GitHub Actions: lint frontend + build + deploy automático
  al hacer push a `main`.

- [ ] **Backup automático de la DB**
  ```bash
  0 3 * * * mysqldump -u scanapp_user -p'pass' scanapp | gzip > /backups/scanapp_$(date +%Y%m%d).sql.gz
  ```

- [ ] **Soporte de idioma `navigator.language`** — auto-detectar idioma del browser
  en el primer login y setearlo como default (actualmente default es `de`).

- [ ] **OCR offline (auto-hospedar Tesseract.js)** — actualmente worker/WASM/modelo se bajan
  de jsDelivr en la primera ejecución. Copiar `tesseract.js-core` + `eng.traineddata` a
  `public/tesseract/` y setear `workerPath`/`corePath`/`langPath` locales en `lib/ocr.js`.
  Hace el OCR 100% offline y elimina la dependencia de CDN (~12 MB extra en el deploy).

- [ ] **OCR de ticket del súper** — escanear el recibo completo y crear varios items de una.
  Extiende `lib/ocr.js` con parseo de líneas. Validar primero el OCR de fecha en producción.

- [x] **Offline.html** — creada y registrada en SW (`frontend/public/offline.html`)
