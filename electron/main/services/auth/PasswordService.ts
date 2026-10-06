import argon2 from 'argon2'

export class PasswordService {
  private static readonly OPTIONS = {
    type: 2 as 2,        // 2 = argon2id
    memoryCost: 65536,   // 64 MB
    timeCost: 3,         // 3 iterations
    parallelism: 1,
    hashLength: 32
  }

  static async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, this.OPTIONS)
  }

  static async verifyPassword(plain: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain)
    } catch {
      return false
    }
  }

  static needsRehash(hash: string): boolean {
    try {
      return argon2.needsRehash(hash, this.OPTIONS)
    } catch {
      return false
    }
  }

  static async verifyAndRehash(plain: string, hash: string): Promise<{ valid: boolean; newHash: string | null }> {
    const valid = await this.verifyPassword(plain, hash)
    if (!valid) return { valid: false, newHash: null }

    if (this.needsRehash(hash)) {
      const newHash = await this.hashPassword(plain)
      return { valid: true, newHash }
    }

    return { valid: true, newHash: null }
  }
}
