# NOUVO POS Vanilla — QA Report

**Build:** 0.1.20  
**Date:** 2026-10-14  
**Environment:** Ubuntu Linux x64; isolated temporary user-data directories used for startup/migration checks.

## Automated checks — PASS

- npm run typecheck
- npm test: 18 tests passed across 3 files
  - 9 input-validation, receipt-formatting, and role-policy tests
  - 4 trusted IPC user-ID normalization tests
  - 5 checkout arithmetic tests (tax-exclusive, tax-inclusive, line total, subtotal, final total)
- git diff --check
- Static IPC policy audit: all 101 preload-exposed channels are either explicitly public or have a permission mapping; no unmapped or unexposed policy entries were found.
- Migration upgrade simulation: all 23 SQL migrations applied to a temporary database upgraded from version 18 to version 32. A pre-existing test order, user, and business setting were preserved. SQLite integrity_check returned ok; foreign_key_check returned zero rows. Re-running migrations did not duplicate the test order.
- Packaged Linux startup smoke test: app reached Migrations complete, Backup created, IPC handlers registered, and Window created. No startup-failure or IPC-error log lines were observed during the smoke window.
- Fresh-start database assertions: schema version 32, SQLite integrity ok, 35 seeded products, one automatic backup record, and its backup file present.
- Windows NSIS installer archive test: Everything is Ok.
- Debian package metadata validated.
- Windows/Linux updater metadata filenames resolve to generated release artifacts.

## Release artifacts

- release/NOUVO-POS-Vanilla-Setup-0.1.20.exe
- release/NOUVO-POS-Vanilla-Setup-0.1.20.exe.blockmap
- release/NOUVO-POS-Vanilla-0.1.20.AppImage
- release/nouvo-pos-vanilla_0.1.20_amd64.deb
- release/latest.yml
- release/latest-linux.yml

## Code fixes included

- Trusted IPC user ID injection now preserves business payloads and ignores a renderer-supplied user ID when a legacy extra argument is present.
- Checkout validates item line totals and subtotal, handles tax-inclusive pricing without adding tax twice, validates current product/variant/modifier prices, and enforces configured order types, discount limits, and delivery-charge settings.
- Restoring a voided order now sets completed_at so it can appear in completed-order history.
- Automatic backup runs on startup if today's backup is missing, in addition to the configured daily schedule.
- Restore upgrades the restored database schema and retains backup-file metadata, including the pre-restore safety backup.
- Session expiry uses consistent SQLite date comparisons; renderer settings load only after session validation.

## Not yet verified end-to-end

These checks require an actual target environment or a live published release and must not be represented as passed:

- Installing 0.1.20 over a real existing Windows installation and proving its real sales/settings survive the in-place upgrade.
- Running a real backup → mutate data → restore cycle through the packaged application's UI/IPC on a disposable customer-like database.
- Printing customer and kitchen receipts on the target USB/network thermal printer, including paper width, cutter, cash drawer, and printer-disconnected behavior.
- Activating a real vendor-signed license, expiry/revocation, and machine-mismatch handling.
- Publishing 0.1.20 to the configured GitHub Releases repository and confirming an installed Windows client can discover, download, and install it.
- Verifying offline USB/WhatsApp installer update on a Windows client.
- Full interactive UI journeys for every menu/deal/checkout/report/export/permission combination.

**Release recommendation:** build artifacts and automated checks are ready, but do not call the product 100% end-to-end verified until the environment-dependent checks above are run.
