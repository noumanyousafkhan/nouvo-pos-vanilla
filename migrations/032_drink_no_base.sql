-- NOUVO POS VANILLA — Remove Drink base product + update variant names
-- Version: 32

-- Delete Drink base product (id 205)
DELETE FROM products WHERE id = 205 AND is_deal_only = 1;
DELETE FROM product_modifiers WHERE product_id = 205;

-- Rename "Regular" to "250ml" in drink variants
UPDATE product_variants
SET name = '250ml'
WHERE name = 'Regular'
  AND product_id IN (15, 16, 17, 140, 141, 142);

INSERT OR IGNORE INTO version (version, name) VALUES (32, 'drink_no_base');
