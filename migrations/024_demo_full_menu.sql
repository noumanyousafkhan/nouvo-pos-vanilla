-- NOUVO POS VANILLA — Full Demo Menu (Products + Modifiers + Variants)
-- Version: 24
-- Idempotent — safe to run multiple times

-- ═══════════════════════════════════════════════════════
-- 0. CATEGORIES — ensure exist (foreign key safety)
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO categories (id, name, sort_order, is_active) VALUES
  (1, 'Pizza', 1, 1),
  (2, 'Burgers', 2, 1),
  (3, 'Shawarma', 3, 1),
  (4, 'Wraps', 4, 1),
  (5, 'Sides', 5, 1),
  (6, 'Drinks', 6, 1),
  (7, 'Deals', 7, 1);

-- ═══════════════════════════════════════════════════════
-- 1. BURGERS — 4 new products
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO products (id, category_id, name, price, is_active, has_variants, has_modifiers) VALUES
  (100, 2, 'Zinger Supreme', 750, 1, 0, 1),
  (101, 2, 'Chicken Cheese Burger', 800, 1, 0, 1),
  (102, 2, 'Beef Cheese Burger', 850, 1, 0, 1),
  (103, 2, 'Tower Burger', 950, 1, 0, 1);

-- Burger modifiers
INSERT OR IGNORE INTO product_modifiers (id, product_id, name, is_required, is_multiple) VALUES
  (100, 100, 'Add-ons', 0, 1),
  (101, 101, 'Add-ons', 0, 1),
  (102, 102, 'Add-ons', 0, 1),
  (103, 103, 'Add-ons', 0, 1),
  (104, 8, 'Add-ons', 0, 1),
  (105, 9, 'Add-ons', 0, 1);

INSERT OR IGNORE INTO modifier_options (id, modifier_id, name, price, is_default) VALUES
  -- Zinger Supreme (100)
  (100, 100, 'Extra Patty', 200, 0),
  (101, 100, 'Extra Cheese', 150, 0),
  (102, 100, 'Spicy Mayo', 0, 0),
  (103, 100, 'Jalapeños', 80, 0),
  (104, 100, 'Lettuce', 0, 0),
  -- Chicken Cheese Burger (101)
  (105, 101, 'Extra Patty', 200, 0),
  (106, 101, 'Extra Cheese', 150, 0),
  (107, 101, 'Spicy Mayo', 0, 0),
  (108, 101, 'Jalapeños', 80, 0),
  -- Beef Cheese Burger (102)
  (109, 102, 'Extra Patty', 200, 0),
  (110, 102, 'Extra Cheese', 150, 0),
  (111, 102, 'Spicy Mayo', 0, 0),
  (112, 102, 'Jalapeños', 80, 0),
  -- Tower Burger (103)
  (113, 103, 'Extra Patty', 200, 0),
  (114, 103, 'Extra Cheese', 150, 0),
  (115, 103, 'Spicy Mayo', 0, 0),
  -- Existing Zinger Burger (8)
  (116, 104, 'Extra Patty', 200, 0),
  (117, 104, 'Extra Cheese', 150, 0),
  (118, 104, 'Spicy Mayo', 0, 0),
  -- Existing Beef Burger (9)
  (119, 105, 'Extra Patty', 200, 0),
  (120, 105, 'Extra Cheese', 150, 0),
  (121, 105, 'Spicy Mayo', 0, 0);

-- ═══════════════════════════════════════════════════════
-- 2. SHAWARMA — 3 new products
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO products (id, category_id, name, price, is_active, has_variants, has_modifiers) VALUES
  (110, 3, 'Chicken Cheese Shawarma', 400, 1, 0, 1),
  (111, 3, 'Special Beef Shawarma', 450, 1, 0, 1),
  (112, 3, 'Shawarma Platter', 800, 1, 0, 1);

INSERT OR IGNORE INTO product_modifiers (id, product_id, name, is_required, is_multiple) VALUES
  (110, 110, 'Add-ons', 0, 1),
  (111, 111, 'Add-ons', 0, 1),
  (112, 112, 'Add-ons', 0, 1),
  (113, 10, 'Add-ons', 0, 1),
  (114, 11, 'Add-ons', 0, 1);

INSERT OR IGNORE INTO modifier_options (id, modifier_id, name, price, is_default) VALUES
  -- Chicken Cheese Shawarma (110)
  (130, 110, 'Extra Chicken', 100, 0),
  (131, 110, 'Garlic Sauce', 0, 0),
  (132, 110, 'Cheese Slice', 50, 0),
  (133, 110, 'Spicy', 0, 0),
  (134, 110, 'Fries Inside', 50, 0),
  -- Special Beef Shawarma (111)
  (135, 111, 'Extra Chicken', 100, 0),
  (136, 111, 'Garlic Sauce', 0, 0),
  (137, 111, 'Cheese Slice', 50, 0),
  (138, 111, 'Spicy', 0, 0),
  -- Shawarma Platter (112)
  (139, 112, 'Extra Chicken', 100, 0),
  (140, 112, 'Garlic Sauce', 0, 0),
  (141, 112, 'Cheese Slice', 50, 0),
  -- Existing Chicken Shawarma (10)
  (142, 113, 'Extra Chicken', 100, 0),
  (143, 113, 'Garlic Sauce', 0, 0),
  (144, 113, 'Cheese Slice', 50, 0),
  -- Existing Beef Shawarma (11)
  (145, 114, 'Extra Chicken', 100, 0),
  (146, 114, 'Garlic Sauce', 0, 0),
  (147, 114, 'Cheese Slice', 50, 0);

-- ═══════════════════════════════════════════════════════
-- 3. WRAPS — 3 new products
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO products (id, category_id, name, price, is_active, has_variants, has_modifiers) VALUES
  (120, 4, 'Beef Wrap', 450, 1, 0, 1),
  (121, 4, 'Zinger Wrap', 500, 1, 0, 1),
  (122, 4, 'BBQ Wrap', 550, 1, 0, 1);

INSERT OR IGNORE INTO product_modifiers (id, product_id, name, is_required, is_multiple) VALUES
  (120, 120, 'Add-ons', 0, 1),
  (121, 121, 'Add-ons', 0, 1),
  (122, 122, 'Add-ons', 0, 1),
  (123, 12, 'Add-ons', 0, 1);

INSERT OR IGNORE INTO modifier_options (id, modifier_id, name, price, is_default) VALUES
  -- Beef Wrap (120)
  (160, 120, 'Extra Cheese', 150, 0),
  (161, 120, 'Extra Meat', 150, 0),
  (162, 120, 'Spicy Sauce', 0, 0),
  (163, 120, 'Ranch', 50, 0),
  -- Zinger Wrap (121)
  (164, 121, 'Extra Cheese', 150, 0),
  (165, 121, 'Extra Meat', 150, 0),
  (166, 121, 'Spicy Sauce', 0, 0),
  (167, 121, 'Ranch', 50, 0),
  -- BBQ Wrap (122)
  (168, 122, 'Extra Cheese', 150, 0),
  (169, 122, 'Extra Meat', 150, 0),
  (170, 122, 'Spicy Sauce', 0, 0),
  (171, 122, 'Ranch', 50, 0),
  -- Existing Chicken Wrap (12)
  (172, 123, 'Extra Cheese', 150, 0),
  (173, 123, 'Extra Meat', 150, 0),
  (174, 123, 'Spicy Sauce', 0, 0),
  (175, 123, 'Ranch', 50, 0);

-- ═══════════════════════════════════════════════════════
-- 4. SIDES — 4 new products
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO products (id, category_id, name, price, is_active, has_variants, has_modifiers) VALUES
  (130, 5, 'Loaded Fries', 350, 1, 0, 1),
  (131, 5, 'Chicken Nuggets', 400, 1, 0, 1),
  (132, 5, 'Hot Wings', 500, 1, 0, 1),
  (133, 5, 'Onion Rings', 250, 1, 0, 1);

INSERT OR IGNORE INTO product_modifiers (id, product_id, name, is_required, is_multiple) VALUES
  (130, 130, 'Add-ons', 0, 1),
  (131, 131, 'Add-ons', 0, 1),
  (132, 132, 'Add-ons', 0, 1),
  (133, 133, 'Add-ons', 0, 1),
  (134, 13, 'Add-ons', 0, 1);

INSERT OR IGNORE INTO modifier_options (id, modifier_id, name, price, is_default) VALUES
  -- Loaded Fries (130)
  (180, 130, 'Extra Dip', 50, 0),
  (181, 130, 'Cheese Sauce', 80, 0),
  (182, 130, 'Mayo', 0, 0),
  (183, 130, 'Ketchup', 0, 0),
  -- Chicken Nuggets (131)
  (184, 131, 'Extra Dip', 50, 0),
  (185, 131, 'Cheese Sauce', 80, 0),
  (186, 131, 'Mayo', 0, 0),
  -- Hot Wings (132)
  (187, 132, 'Extra Dip', 50, 0),
  (188, 132, 'Cheese Sauce', 80, 0),
  (189, 132, 'Spicy', 0, 0),
  -- Onion Rings (133)
  (190, 133, 'Extra Dip', 50, 0),
  (191, 133, 'Cheese Sauce', 80, 0),
  -- Existing French Fries (13)
  (192, 134, 'Extra Dip', 50, 0),
  (193, 134, 'Cheese Sauce', 80, 0);

-- ═══════════════════════════════════════════════════════
-- 5. DRINKS — 3 new products + 5 variants each
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO products (id, category_id, name, price, is_active, has_variants, has_modifiers) VALUES
  (140, 6, 'Pepsi', 100, 1, 1, 0),
  (141, 6, '7Up', 100, 1, 1, 0),
  (142, 6, 'Mirinda', 100, 1, 1, 0);

-- Drinks variants — Pepsi (140), 7Up (141), Mirinda (142), existing Coke (15), Sprite (16)
INSERT OR IGNORE INTO product_variants (id, product_id, name, price_adjust, is_default) VALUES
  -- Pepsi (140)
  (200, 140, 'Regular', 0, 1),
  (201, 140, '500ml', 50, 0),
  (202, 140, '1 Liter', 150, 0),
  (203, 140, '1.5 Liter', 200, 0),
  (204, 140, '2.25 Liter', 350, 0),
  -- 7Up (141)
  (205, 141, 'Regular', 0, 1),
  (206, 141, '500ml', 50, 0),
  (207, 141, '1 Liter', 150, 0),
  (208, 141, '1.5 Liter', 200, 0),
  (209, 141, '2.25 Liter', 350, 0),
  -- Mirinda (142)
  (210, 142, 'Regular', 0, 1),
  (211, 142, '500ml', 50, 0),
  (212, 142, '1 Liter', 150, 0),
  (213, 142, '1.5 Liter', 200, 0),
  (214, 142, '2.25 Liter', 350, 0),
  -- Existing Coke (15)
  (215, 15, 'Regular', 0, 1),
  (216, 15, '500ml', 50, 0),
  (217, 15, '1 Liter', 150, 0),
  (218, 15, '1.5 Liter', 200, 0),
  (219, 15, '2.25 Liter', 350, 0),
  -- Existing Sprite (16)
  (220, 16, 'Regular', 0, 1),
  (221, 16, '500ml', 50, 0),
  (222, 16, '1 Liter', 150, 0),
  (223, 16, '1.5 Liter', 200, 0),
  (224, 16, '2.25 Liter', 350, 0);

-- ═══════════════════════════════════════════════════════
-- 6. Version record
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO version (version, name) VALUES (24, 'demo_full_menu');
