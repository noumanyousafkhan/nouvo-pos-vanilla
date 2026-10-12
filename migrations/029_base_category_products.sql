-- NOUVO POS VANILLA — Base products for each category (for deals)
-- Version: 29
-- is_deal_only = 1 → deal editor mein dikhega, POS pe normal products mein nahi

INSERT OR IGNORE INTO products (id, category_id, name, price, is_active, has_variants, has_modifiers, is_deal_only) VALUES
  (200, 1, 'Pizza', 0, 1, 0, 0, 1),
  (201, 2, 'Burger', 0, 1, 0, 0, 1),
  (202, 3, 'Shawarma', 0, 1, 0, 0, 1),
  (203, 4, 'Wrap', 0, 1, 0, 0, 1),
  (204, 5, 'Side', 0, 1, 0, 0, 1),
  (205, 6, 'Drink', 0, 1, 0, 0, 1);

INSERT OR IGNORE INTO product_modifiers (id, product_id, name, is_required, is_multiple) VALUES
  (300, 200, 'Flavour', 0, 1),
  (301, 201, 'Flavour', 0, 1),
  (302, 202, 'Flavour', 0, 1),
  (303, 203, 'Flavour', 0, 1),
  (304, 204, 'Flavour', 0, 1),
  (305, 205, 'Flavour', 0, 1);

INSERT OR IGNORE INTO version (version, name) VALUES (29, 'base_category_products');
