-- Rebuild license table to the final schema (matches LicenseService INSERT).
-- Needed because DBs that already applied version 19 from an older file
-- never re-run the fixed 019. Existing activation is dropped; re-activate.
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

INSERT OR IGNORE INTO version (version, name) VALUES (20, 'license_rebuild');
