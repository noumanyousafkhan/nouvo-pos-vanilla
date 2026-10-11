-- Fix license schema: add license_json, customer, issued_at columns
-- Idempotent — safe to run multiple times
-- Old schema had: machine_id, license_key (NOT NULL), expiry, activated_at, is_active

-- Drop old table (SQLite has no ALTER COLUMN)
DROP TABLE IF EXISTS license;

CREATE TABLE license (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id TEXT NOT NULL,
  license_json TEXT NOT NULL,
  customer TEXT,
  issued_at TEXT,
  expiry TEXT,
  activated_at TEXT,
  is_active INTEGER DEFAULT 1
);

INSERT OR IGNORE INTO version (version, name) VALUES (19, 'fix_license_schema');
