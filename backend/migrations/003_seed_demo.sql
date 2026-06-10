-- Demo seed: alimentos, lista de compras y actividad de ejemplo.
-- Ajustar @HH (hogar) y @UID (usuario) antes de ejecutar:
--   docker exec -i xampp-mariadb mysql -u root scanapp < 003_seed_demo.sql
SET @HH  := 1;
SET @UID := 2;

INSERT INTO inventory_items (household_id, ean, name, location, expires_at, quantity, tile_index, added_by) VALUES
(@HH, '4061458069885', 'Leche entera 1L',      'fridge',  DATE_ADD(CURDATE(), INTERVAL 1 DAY),   2, 0, @UID),
(@HH, '4311501043592', 'Yogur natural',         'fridge',  DATE_ADD(CURDATE(), INTERVAL 3 DAY),   4, 1, @UID),
(@HH, '7613035833272', 'Queso Gouda lonchas',   'fridge',  DATE_ADD(CURDATE(), INTERVAL 6 DAY),   1, 2, @UID),
(@HH, '4388844025671', 'Jamón cocido',          'fridge',  DATE_ADD(CURDATE(), INTERVAL 2 DAY),   1, 3, @UID),
(@HH, '4337185501631', 'Mantequilla',           'fridge',  DATE_ADD(CURDATE(), INTERVAL 42 DAY),  1, 4, @UID),
(@HH, '4316268596533', 'Huevos camperos x10',   'fridge',  DATE_ADD(CURDATE(), INTERVAL 14 DAY),  1, 5, @UID),
(@HH, '4056489040712', 'Pizza margherita',      'freezer', DATE_ADD(CURDATE(), INTERVAL 158 DAY), 2, 0, @UID),
(@HH, '4337185407222', 'Espinacas congeladas',  'freezer', DATE_ADD(CURDATE(), INTERVAL 234 DAY), 1, 1, @UID),
(@HH, '4008400401621', 'Helado vainilla',       'freezer', DATE_ADD(CURDATE(), INTERVAL 90 DAY),  1, 2, @UID),
(@HH, '8410188012096', 'Garbanzos cocidos',     'pantry',  DATE_ADD(CURDATE(), INTERVAL 431 DAY), 3, 3, @UID),
(@HH, '8480000591647', 'Pasta penne 500g',      'pantry',  DATE_ADD(CURDATE(), INTERVAL 539 DAY), 2, 4, @UID),
(@HH, '4002359017728', 'Tomate triturado',      'pantry',  DATE_ADD(CURDATE(), INTERVAL 4 DAY),   1, 5, @UID),
(@HH, '4000417025005', 'Chocolate negro 70%',   'pantry',  DATE_ADD(CURDATE(), INTERVAL 132 DAY), 2, 0, @UID),
(@HH, '8076809513753', 'Aceite de oliva 1L',    'pantry',  DATE_ADD(CURDATE(), INTERVAL 354 DAY), 1, 1, @UID);

INSERT INTO shopping_list_items (household_id, name, quantity, checked, added_by) VALUES
(@HH, 'Yogur natural',    4, 0, @UID),
(@HH, 'Jamón cocido',     1, 0, @UID),
(@HH, 'Plátanos',         6, 1, @UID),
(@HH, 'Tomates frescos',  1, 0, @UID),
(@HH, 'Papel de cocina',  2, 0, @UID),
(@HH, 'Café molido',      1, 0, @UID),
(@HH, 'Arroz basmati',    1, 0, @UID),
(@HH, 'Pan integral',     1, 1, @UID);

INSERT INTO activity_log (household_id, user_id, item_name, action, quantity, created_at) VALUES
(@HH, @UID, 'Leche entera 1L',  'added',    2, NOW() - INTERVAL 2 DAY),
(@HH, @UID, 'Yogur natural',    'consumed', 1, NOW() - INTERVAL 1 DAY),
(@HH, @UID, 'Jamón cocido',     'consumed', 1, NOW() - INTERVAL 5 HOUR),
(@HH, @UID, 'Pizza margherita', 'consumed', 1, NOW() - INTERVAL 3 HOUR),
(@HH, @UID, 'Lechuga romana',   'wasted',   1, NOW() - INTERVAL 1 HOUR);
