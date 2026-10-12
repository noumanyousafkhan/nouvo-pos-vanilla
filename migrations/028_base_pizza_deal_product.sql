-- NOUVO POS VANILLA — Base "Pizza" product for deals
-- Version: 28
-- is_deal_only = 1 → deal editor mein dikhega, POS pe normal products mein nahi

INSERT OR IGNORE INTO products (id, category_id, name, price, is_active, has_variants, has_modifiers, is_deal_only) VALUES
  (200, 1, 'Pizza', 0, 1, 0, 0, 1);

INSERT OR IGNORE INTO version (version, name) VALUES (28, 'base_pizza_deal_product');
