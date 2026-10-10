#!/bin/bash
# Fix chrome-sandbox permissions after .deb install

set -e

APP_DIR="/opt/NOUVO-POS-Vanilla"
SANDBOX="$APP_DIR/chrome-sandbox"

if [ -f "$SANDBOX" ]; then
  chown root:root "$SANDBOX"
  chmod 4755 "$SANDBOX"
  echo "[postinst] Fixed chrome-sandbox permissions"
fi

exit 0
