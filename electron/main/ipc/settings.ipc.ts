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

  handle('settings:updateBusiness', (data) => {
    SettingsService.updateBusiness(data)
    return { ok: true }
  })
  handle('settings:updateReceipt', (data) => {
    SettingsService.updateReceipt(data)
    return { ok: true }
  })
  handle('settings:updatePrinter', (data) => {
    SettingsService.updatePrinter(data)
    return { ok: true }
  })
  handle('settings:updateOrder', (data) => {
    SettingsService.updateOrder(data)
    return { ok: true }
  })
  handle('settings:updateSystem', (data) => {
    SettingsService.updateSystem(data)
    return { ok: true }
  })

  handle('settings:set', (key: string, value: string) => {
    SettingsService.set(key, value)
    return { ok: true }
  })

  // Logo
  handle('settings:uploadLogo', () => LogoService.pickAndSave())
  handle('settings:getLogoPath', () => SettingsService.get('business.logo_path') ?? '')
}
