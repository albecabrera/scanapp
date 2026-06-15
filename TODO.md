# TODO — Scan & Save: Camino a Producción

Checklist ordenado por prioridad. Cada bloque puede hacerse independientemente del siguiente,
pero los bloques están en el orden correcto para hacer el primer deploy.

---

## BLOQUE 0 — Antes de tocar el servidor

- [ ] **Generar JWT_SECRET fuerte**
  ```bash
  openssl rand -base64 48
  ```
  Guardar el output; va en `config.php` como `JWT_SECRET`.

- [ ] **Generar claves VAPID**
  ```bash
  mkdir -p backend/keys
  openssl ecparam -genkey -name prime256v1 -noout -out backend/keys/vapid_private.pem
  # Derivar clave pública (ver backend/config.example.php para el one-liner completo)
  ```
  Guardar la clave pública base64url para `config.php`.

- [ ] **Crear `backend/config.php` de producción**
  Copiar de `config.example.php` y rellenar:
  - `DB_HOST` / `DB_USER` / `DB_PASS` (usuario dedicado, no root)
  - `JWT_SECRET` (el generado arriba)
  - `FRONTEND_ORIGIN` → `https://tudominio.com`
  - `APP_BASE` → `/scanapp` (o vacío si va en la raíz)
  - `VAPID_PUBLIC_KEY` / `VAPID_SUBJECT`

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

- [ ] **Offline.html** — página de fallback más elegante cuando el SW no tiene cache.
  Crear `frontend/public/offline.html` y registrarlo en sw.js.
