import { hash, verify } from '@node-rs/argon2'

/**
 * Password hashing service using @node-rs/argon2.
 *
 * @node-rs/argon2 is a Rust-based, NAPI-native binding that ships
 * prebuilt binaries for Windows, macOS, and Linux — so no C++ toolchain
 * or Visual Studio Build Tools are required, on any platform or CI.
 *
 * API mapping vs `argon2` package:
 *   argon2.hash(pwd, opts)          → hash(pwd, opts)
 *   argon2.verify(hash, pwd)        → verify(hash, pwd)
 *   argon2.needsRehash(...)         → (not provided — skipped)
 *
 * Note: `verify(hash, password)` — order is hash-first here.
 */
export class PasswordService {
  /**
   * OWASP-recommended parameters for Argon2id (as of 2024-2025):
   *   - memoryCost: 19456 KiB (~19 MB)  — or 65536 (64 MB) for high-value secrets
   *   - timeCost: 2
   *   - parallelism: 1
   *
   * We use 64 MB for stronger offline-attack resistance.
   */
  private static readonly OPTIONS = {
    algorithm: 2, // Argon2id (const enum isolatedModules mein import nahi hota)
    memoryCost: 65536,   // 64 MB
    timeCost: 3,         // 3 iterations
    parallelism: 1,
    outputLen: 32
  }

  static async hashPassword(plain: string): Promise<string> {
    return hash(plain, this.OPTIONS)
  }

  static async verifyPassword(plain: string, hashed: string): Promise<boolean> {
    try {
      // IMPORTANT: @node-rs/argon2 uses (hash, password) order.
      return await verify(hashed, plain, this.OPTIONS)
    } catch {
      return false
    }
  }

  /**
   * Rehash detection.
   *
   * @node-rs/argon2 does not expose `needsRehash`, so we do a light heuristic:
   * if the stored hash does not mention the current Argon2id parameters, we
   * return true and the caller may rehash.
   *
   * This is optional and can be disabled by always returning false.
   */
  static needsRehash(hashed: string): boolean {
    if (!hashed || typeof hashed !== 'string') return false
    // PHC string example: $argon2id$v=19$m=65536,t=3,p=1$...$...
    // Check that memoryCost (m=) and timeCost (t=) match our current config.
    const m = hashed.match(/m=(\d+)/)
    const t = hashed.match(/t=(\d+)/)
    if (!m || !t) return true
    return Number(m[1]) !== this.OPTIONS.memoryCost || Number(t[1]) !== this.OPTIONS.timeCost
  }

  /**
   * Verify + optionally rehash in a single call.
   * Returns the new hash if it should be persisted, else null.
   */
  static async verifyAndRehash(
    plain: string,
    hashed: string
  ): Promise<{ valid: boolean; newHash: string | null }> {
    const valid = await this.verifyPassword(plain, hashed)
    if (!valid) return { valid: false, newHash: null }

    if (this.needsRehash(hashed)) {
      const newHash = await this.hashPassword(plain)
      return { valid: true, newHash }
    }
    return { valid: true, newHash: null }
  }
}
