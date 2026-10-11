-- Add missing columns to license table
ALTER TABLE license ADD COLUMN license_json TEXT;
ALTER TABLE license ADD COLUMN customer TEXT;
ALTER TABLE license ADD COLUMN issued_at TEXT;

INSERT OR IGNORE INTO version (version, name) VALUES (19, 'license_table_full');
