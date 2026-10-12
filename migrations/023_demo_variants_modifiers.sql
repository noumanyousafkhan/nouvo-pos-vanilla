-- NOUVO POS VANILLA — Demo Variants + Modifiers + Deals Category
-- Version: 23

-- ═══════════════════════════════════════════════════════
-- 1. Deals Category (agar missing hai)
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO categories (id, name, sort_order, is_active) VALUES
  (7, 'Deals', 7, 1);

-- ═══════════════════════════════════════════════════════
-- 2. Product Variants (Pizza sizes)
-- ═══════════════════════════════════════════════════════

-- BBQ Chicken Pizza (id 1)
INSERT OR IGNORE INTO product_variants (id, product_id, name, price_adjust, is_default) VALUES
  (1, 1, 'Small 6"', -300, 0),
  (2, 1, 'Medium 9"', 0, 1),
  (3, 1, 'Large 12"', 400, 0),
  (4, 1, 'Family 15"', 800, 0);

-- Chaproni Pizza (id 2)
INSERT OR IGNORE INTO product_variants (id, product_id, name, price_adjust, is_default) VALUES
  (5, 2, 'Small 6"', -300, 0),
  (6, 2, 'Medium 9"', 0, 1),
  (7, 2, 'Large 12"', 400, 0),
  (8, 2, 'Family 15"', 800, 0);

-- Cheese Lover Pizza (id 3)
INSERT OR IGNORE INTO product_variants (id, product_id, name, price_adjust, is_default) VALUES
  (9, 3, 'Small 6"', -300, 0),
  (10, 3, 'Medium 9"', 0, 1),
  (11, 3, 'Large 12"', 400, 0),
  (12, 3, 'Family 15"', 800, 0);

-- Chicken Malai Tikka Pizza (id 4)
INSERT OR IGNORE INTO product_variants (id, product_id, name, price_adjust, is_default) VALUES
  (13, 4, 'Small 6"', -300, 0),
  (14, 4, 'Medium 9"', 0, 1),
  (15, 4, 'Large 12"', 400, 0),
  (16, 4, 'Family 15"', 800, 0);

-- Chicken Tikka Pizza (id 5)
INSERT OR IGNORE INTO product_variants (id, product_id, name, price_adjust, is_default) VALUES
  (17, 5, 'Small 6"', -300, 0),
  (18, 5, 'Medium 9"', 0, 1),
  (19, 5, 'Large 12"', 400, 0),
  (20, 5, 'Family 15"', 800, 0);

-- Fajita Pizza (id 6)
INSERT OR IGNORE INTO product_variants (id, product_id, name, price_adjust, is_default) VALUES
  (21, 6, 'Small 6"', -300, 0),
  (22, 6, 'Medium 9"', 0, 1),
  (23, 6, 'Large 12"', 400, 0),
  (24, 6, 'Family 15"', 800, 0);

-- Pepperoni Pizza (id 7)
INSERT OR IGNORE INTO product_variants (id, product_id, name, price_adjust, is_default) VALUES
  (25, 7, 'Small 6"', -300, 0),
  (26, 7, 'Medium 9"', 0, 1),
  (27, 7, 'Large 12"', 400, 0),
  (28, 7, 'Family 15"', 800, 0);

-- Chicken Malai Tikka Pizza (id 4) — has variants
UPDATE products SET has_variants = 1 WHERE id IN (1, 2, 3, 4, 5, 6, 7);

-- ═══════════════════════════════════════════════════════
-- 3. Product Modifiers (Pizza toppings)
-- ═══════════════════════════════════════════════════════

-- Pizza toppings modifier for all pizzas
INSERT OR IGNORE INTO product_modifiers (id, product_id, name, is_required, is_multiple) VALUES
  (1, 1, 'Extra Toppings', 0, 1),
  (2, 2, 'Extra Toppings', 0, 1),
  (3, 3, 'Extra Toppings', 0, 1),
  (4, 4, 'Extra Toppings', 0, 1),
  (5, 5, 'Extra Toppings', 0, 1),
  (6, 6, 'Extra Toppings', 0, 1),
  (7, 7, 'Extra Toppings', 0, 1);

-- Modifier options for each pizza
INSERT OR IGNORE INTO modifier_options (id, modifier_id, name, price, is_default) VALUES
  -- BBQ Chicken Pizza
  (1, 1, 'Extra Cheese', 150, 0),
  (2, 1, 'Mushrooms', 120, 0),
  (3, 1, 'Olives', 100, 0),
  (4, 1, 'Green Peppers', 80, 0),
  (5, 1, 'Malai Tikka', 200, 0),
  -- Chaproni Pizza
  (6, 2, 'Extra Cheese', 150, 0),
  (7, 2, 'Mushrooms', 120, 0),
  (8, 2, 'Olives', 100, 0),
  (9, 2, 'Green Peppers', 80, 0),
  -- Cheese Lover Pizza
  (10, 3, 'Extra Cheese', 150, 0),
  (11, 3, 'Mushrooms', 120, 0),
  (12, 3, 'Olives', 100, 0),
  -- Chicken Malai Tikka Pizza
  (13, 4, 'Extra Cheese', 150, 0),
  (14, 4, 'Mushrooms', 120, 0),
  (15, 4, 'Olives', 100, 0),
  (16, 4, 'Green Peppers', 80, 0),
  (17, 4, 'Malai Tikka', 200, 0),
  -- Chicken Tikka Pizza
  (18, 5, 'Extra Cheese', 150, 0),
  (19, 5, 'Mushrooms', 120, 0),
  (20, 5, 'Olives', 100, 0),
  (21, 5, 'Green Peppers', 80, 0),
  -- Fajita Pizza
  (22, 6, 'Extra Cheese', 150, 0),
  (23, 6, 'Mushrooms', 120, 0),
  (24, 6, 'Olives', 100, 0),
  (25, 6, 'Green Peppers', 80, 0),
  -- Pepperoni Pizza
  (26, 7, 'Extra Cheese', 150, 0),
  (27, 7, 'Mushrooms', 120, 0),
  (28, 7, 'Olives', 100, 0);

UPDATE products SET has_modifiers = 1 WHERE id IN (1, 2, 3, 4, 5, 6, 7);

-- ═══════════════════════════════════════════════════════
-- 4. Version record
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO version (version, name) VALUES (23, 'demo_variants_modifiers');
