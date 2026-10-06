-- NOUVO POS VANILLA — Security Seed
-- Version: 2

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('security.argon2.memory', '65536'),
  ('security.argon2.iterations', '3'),
  ('security.argon2.parallelism', '1'),
  ('security.session.ttl_hours', '12'),
  ('security.license.warning_days_1', '30'),
  ('security.license.warning_days_2', '7'),
  ('security.license.warning_days_3', '1'),
  ('security.clock_rollback_tolerance_sec', '300'),
  ('security.clock_rollback_max_events', '3');

INSERT OR IGNORE INTO invoice_counter (prefix, last_number) VALUES ('INV', 0);

INSERT OR IGNORE INTO version (version, name) VALUES (2, 'security_seed');
