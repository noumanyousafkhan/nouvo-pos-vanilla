-- NOUVO POS VANILLA — Export Seed
-- Version: 11

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('export.default_dir', ''),
  ('export.include_summary_sheet', 'true'),
  ('export.date_format', 'DD-MM-YYYY');

INSERT OR IGNORE INTO version (version, name) VALUES (11, 'export_seed');
