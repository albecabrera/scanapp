-- Add unit column to shopping list items
SET NAMES utf8mb4;

ALTER TABLE `shopping_list_items`
  ADD COLUMN `unit` VARCHAR(10) NOT NULL DEFAULT '' AFTER `quantity`;
