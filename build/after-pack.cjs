/**
 * electron-builder afterPack hook.
 *
 * Runs after packaging but before building the final installers.
 * We use this to fix chrome-sandbox permissions.
 * Note: chown requires root — deb postinst handles ownership on install.
 */
const fs = require('fs')
const path = require('path')

exports.default = async function afterPack(context) {
  const { appOutDir, electronPlatformName } = context

  if (electronPlatformName === 'linux') {
    const sandboxPath = path.join(appOutDir, 'chrome-sandbox')

    if (fs.existsSync(sandboxPath)) {
      try {
        // Try chown — will succeed only if running as root
        try {
          fs.chownSync(sandboxPath, 0, 0)
        } catch (_) {
          // Ignore — deb postinst handles this on install
        }
        // Set setuid bit (this works as non-root)
        fs.chmodSync(sandboxPath, 0o4755)
        console.log(`[after-pack] Fixed chrome-sandbox permissions: ${sandboxPath}`)
      } catch (err) {
        console.warn(`[after-pack] Failed to fix chrome-sandbox: ${err.message}`)
      }
    }
  }
}
