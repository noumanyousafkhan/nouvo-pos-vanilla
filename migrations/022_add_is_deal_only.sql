-- NOUVO POS VANILLA — Add is_deal_only column
-- Version: 22

-- Add is_deal_only column to products table
ALTER TABLE products ADD COLUMN is_deal_only INTEGER DEFAULT 0;

INSERT OR IGNORE INTO version (version, name) VALUES (22, 'add_is_deal_only');
