-- NOUVO POS VANILLA — Printing Seed
-- Version: 7

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('printer.auto_print_customer', 'true'),
  ('printer.auto_print_kitchen', 'true'),
  ('printer.default_charset', 'PC437'),
  ('printer.line_spacing', '30'),
  ('printer.feed_lines_after', '4'),
  ('printer.use_logo', 'true'),
  ('printer.logo_max_width', '384'),
  ('printer.reprint_watermark', 'false'),
  ('printer.print_timeout_ms', '10000'),
  ('printer.fallback_to_pdf', 'true');

INSERT OR IGNORE INTO version (version, name) VALUES (7, 'printing_seed');
