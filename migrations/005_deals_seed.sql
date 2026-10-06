-- NOUVO POS VANILLA — Deals Seed
-- Version: 5

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('deals.allow_stacking', 'false'),
  ('deals.allow_discount_on_deal', 'false'),
  ('deals.show_deal_items_in_cart', 'true'),
  ('deals.price_allocation', 'proportional');

INSERT OR IGNORE INTO version (version, name) VALUES (5, 'deals_seed');
