-- Version: 18 — Add completed_at to orders for Order Timer

ALTER TABLE orders ADD COLUMN completed_at TEXT;

CREATE INDEX idx_orders_status ON orders(status);

-- Backfill: mark existing completed orders with completed_at = created_at
UPDATE orders SET completed_at = created_at WHERE status = 'completed' AND completed_at IS NULL;

INSERT OR IGNORE INTO version (version, name) VALUES (18, 'order_timer');
