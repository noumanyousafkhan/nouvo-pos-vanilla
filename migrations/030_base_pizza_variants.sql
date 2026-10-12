-- NOUVO POS VANILLA — Base Pizza variants (size)
-- Version: 30
-- Pizza base product ke liye Small/Medium/Large/Family size variants

INSERT OR IGNORE INTO product_variants (id, product_id, name, price_adjust, is_default) VALUES
  (300, 200, 'Small 6"', 0, 0),
  (301, 200, 'Medium 9"', 0, 1),
  (302, 200, 'Large 12"', 0, 0),
  (303, 200, 'Family 15"', 0, 0);

UPDATE products SET has_variants = 1 WHERE id = 200;

INSERT OR IGNORE INTO version (version, name) VALUES (30, 'base_pizza_variants');
