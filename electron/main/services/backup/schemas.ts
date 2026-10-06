import { z } from 'zod'

export const CreateBackupSchema = z.object({
  type: z.enum(['auto', 'manual', 'pre_restore']).default('manual'),
  note: z.string().max(200).optional().default('')
})

export const RestoreBackupSchema = z.object({
  backupId: z.number().int().positive(),
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'Restore must be explicitly confirmed' })
  })
})

export const DeleteBackupSchema = z.object({
  backupId: z.number().int().positive()
})
