import { handle } from './index'
import { CategoryService } from '../services/menu/CategoryService'
import { ProductService } from '../services/menu/ProductService'
import { VariantService } from '../services/menu/VariantService'
import { ModifierService } from '../services/menu/ModifierService'
import { ProductImageService } from '../services/menu/ProductImageService'

export function registerMenuIpc(): void {
  // Categories
  handle('menu:categories:list', (includeInactive?: boolean) =>
    CategoryService.list(includeInactive)
  )
  handle('menu:categories:get', (id: number) => CategoryService.get(id))
  handle('menu:categories:create', (data, userId) => CategoryService.create(data, userId))
  handle('menu:categories:update', (id, data, userId) =>
    CategoryService.update(id, data, userId)
  )
  handle('menu:categories:delete', (id, userId) => CategoryService.delete(id, userId))
  handle('menu:categories:toggle', (id, userId) => CategoryService.toggleActive(id, userId))
  handle('menu:categories:reorder', (ids, userId) => CategoryService.reorder(ids, userId))

  // Products
  handle('menu:products:list', (categoryId?: number | null, includeInactive?: boolean) =>
    ProductService.list(categoryId, includeInactive)
  )
  handle('menu:products:get', (id: number) => ProductService.get(id))
  handle('menu:products:getFull', (id: number) => ProductService.getFull(id))
  handle('menu:products:create', (data, userId) => ProductService.create(data, userId))
  handle('menu:products:update', (id, data, userId) =>
    ProductService.update(id, data, userId)
  )
  handle('menu:products:softDelete', (id, userId) => ProductService.softDelete(id, userId))
  handle('menu:products:toggle', (id, userId) => ProductService.toggleActive(id, userId))
  handle('menu:products:upsertFull', (data, userId) => ProductService.upsertFull(data, userId))

  // Variants
  handle('menu:variants:listByProduct', (productId: number) =>
    VariantService.listByProduct(productId)
  )
  handle('menu:variants:create', (data) => VariantService.create(data))
  handle('menu:variants:delete', (id) => VariantService.delete(id))

  // Modifiers
  handle('menu:modifiers:listByProduct', (productId: number) =>
    ModifierService.listByProduct(productId)
  )
  handle('menu:modifiers:create', (data) => ModifierService.createModifier(data))
  handle('menu:modifiers:delete', (id) => ModifierService.deleteModifier(id))
  handle('menu:modifierOptions:create', (data) => ModifierService.createOption(data))
  handle('menu:modifierOptions:delete', (id) => ModifierService.deleteOption(id))

  // Images
  handle('menu:images:pick', () => ProductImageService.pickAndSave())
  handle('menu:images:delete', (path: string) => ProductImageService.delete(path))
}
