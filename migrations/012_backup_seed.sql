-- NOUVO POS VANILLA — Backup Seed
-- Version: 12

-- Extend backups table with metadata
ALTER TABLE backups ADD COLUMN checksum TEXT;
ALTER TABLE backups ADD COLUMN schema_version INTEGER;
ALTER TABLE backups ADD COLUMN app_version TEXT;
ALTER TABLE backups ADD COLUMN note TEXT;

CREATE INDEX IF NOT EXISTS idx_backups_created ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(type, created_at DESC);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('backup.enabled', 'true'),
  ('backup.retention_days', '30'),
  ('backup.auto_on_start', 'true'),
  ('backup.max_count', '100'),
  ('backup.verify_after_create', 'true');

INSERT OR IGNORE INTO version (version, name) VALUES (12, 'backup_seed');
