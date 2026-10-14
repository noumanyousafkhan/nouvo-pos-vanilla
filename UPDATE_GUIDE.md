# NOUVO POS Vanilla — Update and Data Safety

## Online updates
1. Publish a GitHub Release from the NOUVO POS Vanilla repository using a version newer than the installed app.
2. Attach the platform installer and generated update metadata/blockmap files produced by electron-builder. Do not publish a release with missing update metadata.
3. In the installed POS, open Settings → System and select Check for Updates. Download the available update, then select Restart & Install Update.
4. Test each release on a copy of a real database before production deployment.

## Offline update (USB or WhatsApp)
1. Obtain the matching Windows Setup installer from the trusted release source.
2. Copy it to USB or transfer it to the target Windows PC.
3. Close NOUVO POS Vanilla and run the installer. Choose the same install location if prompted. Do not uninstall the old version first.
4. The SQLite database, backups, logo, configuration and logs live in Electron's per-user app-data directory, outside the install directory. Normal in-place installation should preserve them.
5. Before updating a production machine, create a manual backup from Settings → System → Backup & Restore. Verify a test restore periodically.

## Release gates
- Increase the application version for every release.
- Run npm run typecheck, npm test, and npm run build:win.
- Test first-run setup, existing database upgrade, login, checkout, receipt printing, backup/restore and an in-place upgrade on Windows.
- Keep a recoverable copy of the database and installer; do not treat a successful build alone as proof of release readiness.
