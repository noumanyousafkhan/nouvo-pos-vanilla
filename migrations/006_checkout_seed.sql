-- NOUVO POS VANILLA — Checkout Seed
-- Version: 6

CREATE TABLE IF NOT EXISTS order_counter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prefix TEXT NOT NULL,
  date_key TEXT NOT NULL,
  last_number INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(prefix, date_key)
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('order.number_format', 'ORD-YYYYMMDD-####'),
  ('order.invoice_format', 'INV-####'),
  ('order.require_payment_confirmation', 'true'),
  ('order.allow_overpayment', 'true'),
  ('order.round_total', 'false'),
  ('order.round_precision', '2');

INSERT OR IGNORE INTO version (version, name) VALUES (6, 'checkout_seed');
