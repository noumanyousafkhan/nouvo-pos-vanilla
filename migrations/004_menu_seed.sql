-- NOUVO POS VANILLA — Menu Seed
-- Version: 4

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('menu.image_max_size_kb', '500'),
  ('menu.image_allowed_ext', '["png","jpg","jpeg","webp"]'),
  ('menu.show_out_of_stock', 'false'),
  ('menu.allow_negative_stock', 'false');

INSERT OR IGNORE INTO version (version, name) VALUES (4, 'menu_seed');
