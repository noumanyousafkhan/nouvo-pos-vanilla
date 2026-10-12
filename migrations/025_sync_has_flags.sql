-- NOUVO POS VANILLA — Sync has_variants and has_modifiers flags
-- Version: 25

UPDATE products
SET has_variants = 1
WHERE id IN (SELECT DISTINCT product_id FROM product_variants);

UPDATE products
SET has_modifiers = 1
WHERE id IN (SELECT DISTINCT product_id FROM product_modifiers);

UPDATE products
SET has_variants = 0
WHERE id NOT IN (SELECT DISTINCT product_id FROM product_variants) AND has_variants = 1;

UPDATE products
SET has_modifiers = 0
WHERE id NOT IN (SELECT DISTINCT product_id FROM product_modifiers) AND has_modifiers = 1;

INSERT OR IGNORE INTO version (version, name) VALUES (25, 'sync_has_flags');
