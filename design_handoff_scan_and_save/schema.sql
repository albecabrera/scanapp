-- ============================================================
-- schema.sql — Scan & Save · MySQL / MariaDB
-- ============================================================
-- Zeichensatz: utf8mb4 (Emoji-sicher)
-- Timezone:    UTC überall (TIMESTAMP-Spalten in UTC speichern)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ─────────────────── USERS ───────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(320) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,               -- bcrypt, cost ≥ 12
  `display_name`  VARCHAR(80)  NOT NULL DEFAULT '',
  `avatar_index`  TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0–3, index in DESIGN_TOKENS --avatar-*
  `lang`          ENUM('de','es') NOT NULL DEFAULT 'de',
  `theme`         ENUM('light','dark','system') NOT NULL DEFAULT 'system',
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────── HOUSEHOLDS ───────────────────
CREATE TABLE IF NOT EXISTS `households` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(120) NOT NULL,
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_hh_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────── HOUSEHOLD MEMBERS ───────────────────
-- Jeder User kann Mitglied in mehreren Haushalten sein.
-- Admin = darf Mitglieder entfernen, Einladungen erstellen, Haushalt umbenennen.
CREATE TABLE IF NOT EXISTS `household_members` (
  `household_id` INT UNSIGNED NOT NULL,
  `user_id`      INT UNSIGNED NOT NULL,
  `role`         ENUM('admin','member') NOT NULL DEFAULT 'member',
  `joined_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`household_id`, `user_id`),
  CONSTRAINT `fk_hm_household` FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hm_user`      FOREIGN KEY (`user_id`)      REFERENCES `users`(`id`)      ON DELETE CASCADE,
  INDEX `idx_hm_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────── INVITES ───────────────────
-- Einladungscodes: alphanumerisch, z.B. "CASA-7K2M", Ablauf 7 Tage.
CREATE TABLE IF NOT EXISTS `invites` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `household_id` INT UNSIGNED NOT NULL,
  `code`         VARCHAR(20)  NOT NULL,
  `created_by`   INT UNSIGNED NOT NULL,
  `expires_at`   TIMESTAMP    NOT NULL,
  `used_count`   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_code` (`code`),
  CONSTRAINT `fk_inv_household` FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_creator`   FOREIGN KEY (`created_by`)   REFERENCES `users`(`id`)      ON DELETE CASCADE,
  INDEX `idx_inv_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────── PRODUCTS (Open Food Facts Cache) ───────────────────
-- Serverseiter EAN-Cache, um OFF-Anfragen zu reduzieren.
CREATE TABLE IF NOT EXISTS `products` (
  `ean`          VARCHAR(14)  NOT NULL,                 -- EAN-8 oder EAN-13
  `name`         VARCHAR(255) NOT NULL DEFAULT '',
  `brand`        VARCHAR(120) NOT NULL DEFAULT '',
  `image_url`    TEXT         NOT NULL DEFAULT '',      -- von Open Food Facts
  `raw_json`     JSON         NULL,                     -- vollständige OFF-Antwort
  `fetched_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ean`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────── INVENTORY ITEMS ───────────────────
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id`           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `household_id` INT UNSIGNED  NOT NULL,
  `ean`          VARCHAR(14)   NOT NULL DEFAULT '',     -- leer = manuell hinzugefügt
  `name`         VARCHAR(255)  NOT NULL,                -- kann von OFF-Name abweichen
  `location`     ENUM('fridge','freezer','pantry') NOT NULL DEFAULT 'fridge',
  `expires_at`   DATE          NULL,                    -- NULL = kein MHD bekannt
  `quantity`     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `tile_index`   TINYINT UNSIGNED NOT NULL DEFAULT 0,   -- 0–5, Farb-Slot aus DESIGN_TOKENS
  `added_by`     INT UNSIGNED  NOT NULL,
  `assigned_to`  INT UNSIGNED  NULL,                    -- Verantwortlich (UI: Zuständig)
  `added_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_item_household` FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_item_added_by`  FOREIGN KEY (`added_by`)     REFERENCES `users`(`id`)      ON DELETE RESTRICT,
  CONSTRAINT `fk_item_assigned`  FOREIGN KEY (`assigned_to`)  REFERENCES `users`(`id`)      ON DELETE SET NULL,
  INDEX `idx_item_household_expires` (`household_id`, `expires_at`),
  INDEX `idx_item_household_loc`     (`household_id`, `location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────── NOTIFICATION SETTINGS ───────────────────
-- Pro Haushalt: globale Schwellen + "alle warnen wenn morgen"
CREATE TABLE IF NOT EXISTS `notification_settings` (
  `household_id`    INT UNSIGNED NOT NULL,
  `threshold_days`  SET('1','3','7') NOT NULL DEFAULT '3',  -- mehrere wählbar
  `warn_all_tomorrow` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`household_id`),
  CONSTRAINT `fk_ns_household` FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pro User, pro Haushalt: kann Standardbenachrichtigung überschreiben
CREATE TABLE IF NOT EXISTS `notification_overrides` (
  `household_id`  INT UNSIGNED NOT NULL,
  `user_id`       INT UNSIGNED NOT NULL,
  `muted`         TINYINT(1)   NOT NULL DEFAULT 0,
  `threshold_days` SET('1','3','7') NULL,  -- NULL = Haushalt-Standard verwenden
  `updated_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`household_id`, `user_id`),
  CONSTRAINT `fk_no_household` FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_no_user`      FOREIGN KEY (`user_id`)      REFERENCES `users`(`id`)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────── PUSH SUBSCRIPTIONS (v1) ───────────────────
-- Web Push: endpoint + keys pro Browser-/Gerätesession eines Users.
CREATE TABLE IF NOT EXISTS `push_subscriptions` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `endpoint`    TEXT         NOT NULL,
  `p256dh`      VARCHAR(512) NOT NULL,  -- öffentlicher Empfängerschlüssel (Base64url)
  `auth`        VARCHAR(128) NOT NULL,  -- Auth-Secret (Base64url)
  `user_agent`  VARCHAR(255) NOT NULL DEFAULT '',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ps_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_ps_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;

-- ─────────────────── CRON: Ablauf-Benachrichtigungen ───────────────────
-- Täglich laufender Cron-Job (PHP-Script oder systemd-Timer):
-- SELECT i.*, u.email, ns.threshold_days, ns.warn_all_tomorrow
--   FROM inventory_items i
--   JOIN household_members hm ON hm.household_id = i.household_id
--   JOIN users u ON u.id = hm.user_id
--   JOIN notification_settings ns ON ns.household_id = i.household_id
--   LEFT JOIN notification_overrides no ON no.household_id = i.household_id AND no.user_id = u.id
--  WHERE i.expires_at IS NOT NULL
--    AND DATEDIFF(i.expires_at, CURDATE()) IN (  -- gem. Schwellen
--         CASE WHEN FIND_IN_SET('1', COALESCE(no.threshold_days, ns.threshold_days)) THEN 1 ELSE NULL END,
--         ...
--    )
--    AND COALESCE(no.muted, 0) = 0;
-- → dann Web-Push senden oder Benachrichtigung in Tabelle schreiben
