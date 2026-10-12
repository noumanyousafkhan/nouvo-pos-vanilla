-- NOUVO POS VANILLA — Only Pizza base product for deals
-- Version: 31
-- Burger, Shawarma, Wrap, Side, Drink base products delete
-- Deal editor will show actual products for those categories

-- Delete extra base products (only Pizza base kept)
DELETE FROM products WHERE id IN (201, 202, 203, 204, 205) AND is_deal_only = 1;

-- Delete their flavour modifiers
DELETE FROM product_modifiers WHERE product_id IN (201, 202, 203, 204, 205);

INSERT OR IGNORE INTO version (version, name) VALUES (31, 'only_pizza_base');
