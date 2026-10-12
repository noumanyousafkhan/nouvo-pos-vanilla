-- NOUVO POS VANILLA — Fix Water variants
-- Version: 27

INSERT OR IGNORE INTO product_variants (id, product_id, name, price_adjust, is_default) VALUES
  (229, 17, 'Small 500ml', 0, 1),
  (230, 17, 'Large 1.5 Liter', 50, 0);

INSERT OR IGNORE INTO version (version, name) VALUES (27, 'fix_water_variants');
