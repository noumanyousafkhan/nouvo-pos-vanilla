import { handle } from './index'
import { BackupService } from '../services/backup/BackupService'

export function registerBackupIpc(): void {
  handle('backup:list', () => BackupService.listBackups())
  handle('backup:create', (data, userId) => BackupService.createBackup(data, userId))
  handle('backup:delete', (id, userId) => BackupService.deleteBackup(id, userId))
  handle('backup:validate', (id: number) => {
    const record = BackupService.getBackup(id)
    return BackupService.validateBackupFile(record.path)
  })
  handle('backup:restore', (data, userId) => BackupService.restoreBackup(data, userId))
  handle('backup:stats', () => BackupService.getStats())
  handle('backup:cleanup', () => BackupService.cleanupOldBackups())
}
