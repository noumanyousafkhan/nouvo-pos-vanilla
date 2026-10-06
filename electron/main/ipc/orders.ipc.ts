import { handle } from './index'
import { OrderService } from '../services/orders/OrderService'

export function registerOrdersIpc(): void {
  handle('orders:create', (data, userId) => OrderService.createOrder(data, userId))
  handle('orders:get', (id: number) => OrderService.getFullOrder(id))
  handle('orders:list', (filters) => OrderService.listOrders(filters))
  handle('orders:listExtended', (filters) => OrderService.listOrdersExtended(filters))
  handle('orders:previewNextNumbers', () => OrderService.previewNextNumbers())
  handle('orders:void', (data, userId) => OrderService.voidOrderExtended(data, userId))
  handle('orders:restore', (id, userId) => OrderService.restoreOrder(id, userId))
}
