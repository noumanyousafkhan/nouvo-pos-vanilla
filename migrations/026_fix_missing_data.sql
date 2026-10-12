-- NOUVO POS VANILLA — Fix missing modifiers and variants
-- Version: 26

-- ═══════════════════════════════════════════════════════
-- 1. French Fries (13) — modifiers
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO product_modifiers (id, product_id, name, is_required, is_multiple) VALUES
  (140, 13, 'Add-ons', 0, 1);

INSERT OR IGNORE INTO modifier_options (id, modifier_id, name, price, is_default) VALUES
  (200, 140, 'Extra Dip', 50, 0),
  (201, 140, 'Cheese Sauce', 80, 0),
  (202, 140, 'Mayo', 0, 0),
  (203, 140, 'Ketchup', 0, 0);

UPDATE products SET has_modifiers = 1 WHERE id = 13;

-- ═══════════════════════════════════════════════════════
-- 2. Onion Rings (14) — modifiers
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO product_modifiers (id, product_id, name, is_required, is_multiple) VALUES
  (141, 14, 'Add-ons', 0, 1);

INSERT OR IGNORE INTO modifier_options (id, modifier_id, name, price, is_default) VALUES
  (204, 141, 'Extra Dip', 50, 0),
  (205, 141, 'Cheese Sauce', 80, 0),
  (206, 141, 'Ketchup', 0, 0);

UPDATE products SET has_modifiers = 1 WHERE id = 14;

-- ═══════════════════════════════════════════════════════
-- 3. Water (17) — variants
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO product_variants (id, product_id, name, price_adjust, is_default) VALUES
  (229, 17, 'Small 500ml', 0, 1),
  (230, 17, 'Large 1.5 Liter', 50, 0);

UPDATE products SET has_variants = 1 WHERE id = 17;

INSERT OR IGNORE INTO version (version, name) VALUES (26, 'fix_missing_data');
