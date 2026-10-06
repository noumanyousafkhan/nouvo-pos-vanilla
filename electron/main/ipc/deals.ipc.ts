import { handle } from './index'
import { DealService } from '../services/deals/DealService'

export function registerDealsIpc(): void {
  handle('deals:list', (includeInactive?: boolean, onlyValid?: boolean) =>
    DealService.list(includeInactive, onlyValid)
  )
  handle('deals:get', (id: number) => DealService.get(id))
  handle('deals:getFull', (id: number) => DealService.getFull(id))
  handle('deals:create', (data, userId) => DealService.create(data, userId))
  handle('deals:update', (id, data, userId) => DealService.update(id, data, userId))
  handle('deals:replaceItems', (id, items, userId) =>
    DealService.replaceItems(id, items, userId)
  )
  handle('deals:delete', (id, userId) => DealService.delete(id, userId))
  handle('deals:toggle', (id, userId) => DealService.toggleActive(id, userId))
  handle('deals:expandToCart', (id: number) => DealService.expandToCart(id))
}
