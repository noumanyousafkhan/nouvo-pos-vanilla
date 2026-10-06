import { PermissionError } from '../utils/errors'

export type Role = 'super_admin' | 'admin' | 'cashier'

export type Permission =
  | 'pos.use'
  | 'orders.create'
  | 'orders.view'
  | 'orders.reprint'
  | 'orders.void'
  | 'orders.restore'
  | 'menu.view'
  | 'menu.create'
  | 'menu.update'
  | 'menu.delete'
  | 'deals.manage'
  | 'reports.view'
  | 'reports.export'
  | 'settings.view'
  | 'settings.update'
  | 'users.manage'
  | 'backup.create'
  | 'backup.restore'
  | 'backup.delete'
  | 'license.view'
  | 'license.renew'
  | 'license.rebind'
  | 'audit.view'
  | 'system.update'

const PERMISSIONS: Record<Permission, Role[]> = {
  'pos.use': ['super_admin', 'admin', 'cashier'],
  'orders.create': ['super_admin', 'admin', 'cashier'],
  'orders.view': ['super_admin', 'admin', 'cashier'],
  'orders.reprint': ['super_admin', 'admin', 'cashier'],
  'orders.void': ['super_admin'],
  'orders.restore': ['super_admin'],
  'menu.view': ['super_admin', 'admin'],
  'menu.create': ['super_admin', 'admin'],
  'menu.update': ['super_admin', 'admin'],
  'menu.delete': ['super_admin', 'admin'],
  'deals.manage': ['super_admin', 'admin'],
  'reports.view': ['super_admin', 'admin'],
  'reports.export': ['super_admin', 'admin'],
  'settings.view': ['super_admin', 'admin'],
  'settings.update': ['super_admin', 'admin'],
  'users.manage': ['super_admin'],
  'backup.create': ['super_admin', 'admin'],
  'backup.restore': ['super_admin'],
  'backup.delete': ['super_admin', 'admin'],
  'license.view': ['super_admin', 'admin'],
  'license.renew': ['super_admin'],
  'license.rebind': ['super_admin'],
  'audit.view': ['super_admin'],
  'system.update': ['super_admin']
}

export class RoleService {
  static hasPermission(role: Role, permission: Permission): boolean {
    const allowed = PERMISSIONS[permission]
    if (!allowed) return false
    return allowed.includes(role)
  }

  static requirePermission(role: Role, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new PermissionError(`Role "${role}" does not have permission "${permission}"`)
    }
  }

  static getPermissions(role: Role): Permission[] {
    return (Object.keys(PERMISSIONS) as Permission[]).filter((p) =>
      PERMISSIONS[p].includes(role)
    )
  }
}
