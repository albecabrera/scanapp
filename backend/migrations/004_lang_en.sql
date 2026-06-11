-- Add English to supported user languages
ALTER TABLE users MODIFY lang ENUM('de','es','en') NOT NULL DEFAULT 'de';
