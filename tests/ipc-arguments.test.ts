import { describe, expect, it } from 'vitest'
import { withTrustedUserId } from '../electron/main/ipc/userIdArguments'

describe('trusted IPC user ID injection', () => {
  it('preserves the checkout payload and appends the authenticated user ID', () => {
    const checkout = { items: [{ productId: 7 }], total: 250 }
    expect(withTrustedUserId('orders:create', [checkout], 42)).toEqual([checkout, 42])
  })

  it('removes a legacy renderer-supplied user ID instead of trusting it', () => {
    const checkout = { items: [{ productId: 7 }], total: 250 }
    expect(withTrustedUserId('orders:create', [checkout, 999], 42)).toEqual([checkout, 42])
  })

  it('handles no-payload audit channels', () => {
    expect(withTrustedUserId('export:fullBackup', [999], 42)).toEqual([42])
    expect(withTrustedUserId('export:categories', [], 42)).toEqual([42])
  })

  it('does not rewrite channels that do not accept a user ID', () => {
    const args = [{ id: 1 }]
    expect(withTrustedUserId('orders:get', args, 42)).toBe(args)
  })
})
