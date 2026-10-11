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
