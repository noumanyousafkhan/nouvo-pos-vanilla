import { handle } from './index'
import { SettingsService } from '../services/settings/SettingsService'
import { LogoService } from '../services/settings/LogoService'

export function registerSettingsIpc(): void {
  handle('settings:getAll', () => SettingsService.getAll())
  handle('settings:getBusiness', () => SettingsService.getBusiness())
  handle('settings:getReceipt', () => SettingsService.getReceipt())
  handle('settings:getPrinter', () => SettingsService.getPrinter())
  handle('settings:getOrder', () => SettingsService.getOrder())
  handle('settings:getSystem', () => SettingsService.getSystem())

  handle('settings:updateBusiness', (data, userId) => {
    SettingsService.updateBusiness(data, userId)
    return { ok: true }
  })
  handle('settings:updateReceipt', (data, userId) => {
    SettingsService.updateReceipt(data, userId)
    return { ok: true }
  })
  handle('settings:updatePrinter', (data, userId) => {
    SettingsService.updatePrinter(data, userId)
    return { ok: true }
  })
  handle('settings:updateOrder', (data, userId) => {
    SettingsService.updateOrder(data, userId)
    return { ok: true }
  })
  handle('settings:updateSystem', (data, userId) => {
    SettingsService.updateSystem(data, userId)
    return { ok: true }
  })

  handle('settings:set', (key: string, value: string) => {
    SettingsService.set(key, value)
    return { ok: true }
  })

  handle('settings:uploadLogo', () => LogoService.pickAndSave())
  handle('settings:getLogoPath', () => LogoService.getLogoFilePath())
}
