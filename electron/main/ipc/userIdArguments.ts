// Number of business arguments expected before the trusted user ID.
const USER_ID_ARGUMENT_COUNTS: Record<string, number> = {
  'menu:categories:create': 1, 'menu:categories:update': 2,
  'menu:categories:delete': 1, 'menu:categories:toggle': 1,
  'menu:categories:reorder': 1,
  'menu:products:create': 1, 'menu:products:update': 2,
  'menu:products:softDelete': 1, 'menu:products:toggle': 1,
  'menu:products:upsertFull': 1,
  'deals:create': 1, 'deals:update': 2, 'deals:updateFull': 2,
  'deals:replaceItems': 2, 'deals:delete': 1, 'deals:toggle': 1,
  'orders:create': 1, 'orders:void': 1, 'orders:restore': 1,
  'orders:markCompleted': 1,
  'backup:create': 1, 'backup:delete': 1, 'backup:restore': 1,
  'export:orders': 1, 'export:products': 1, 'export:categories': 0,
  'export:payments': 1, 'export:report': 1, 'export:fullBackup': 0
}

export function withTrustedUserId(channel: string, args: unknown[], userId: number): unknown[] {
  const expectedArgs = USER_ID_ARGUMENT_COUNTS[channel]
  if (expectedArgs === undefined) return args
  const normalized = [...args]
  // Compatibility for older renderer calls that appended their own user ID.
  if (normalized.length > expectedArgs) normalized.pop()
  normalized.push(userId)
  return normalized
}
