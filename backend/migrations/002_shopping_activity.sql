-- Shopping list + activity log (waste stats, shared-kitchen mode)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `shopping_list_items` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `household_id` INT UNSIGNED NOT NULL,
  `name`         VARCHAR(255) NOT NULL,
  `ean`          VARCHAR(14)  NOT NULL DEFAULT '',
  `quantity`     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `checked`      TINYINT(1)   NOT NULL DEFAULT 0,
  `added_by`     INT UNSIGNED NOT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sl_household` FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sl_user`      FOREIGN KEY (`added_by`)     REFERENCES `users`(`id`)      ON DELETE CASCADE,
  INDEX `idx_sl_household` (`household_id`, `checked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_log` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `household_id` INT UNSIGNED NOT NULL,
  `user_id`      INT UNSIGNED NOT NULL,
  `item_name`    VARCHAR(255) NOT NULL,
  `action`       ENUM('added','consumed','wasted','removed') NOT NULL,
  `quantity`     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_al_household` FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_al_user`      FOREIGN KEY (`user_id`)      REFERENCES `users`(`id`)      ON DELETE CASCADE,
  INDEX `idx_al_household_date` (`household_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
