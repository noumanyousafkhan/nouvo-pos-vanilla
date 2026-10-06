import { machineIdSync } from 'node-machine-id'
import { createHash } from 'crypto'
import { logger } from '../utils/logger'

let cachedMachineId: string | null = null

export class MachineService {
  static getMachineId(): string {
    if (cachedMachineId) return cachedMachineId

    try {
      const raw = machineIdSync(true)
      const hwid = createHash('sha256').update(raw).digest('hex')
      cachedMachineId = hwid
      logger.info({ hwid: hwid.slice(0, 16) + '...' }, 'Machine ID generated')
      return hwid
    } catch (err) {
      logger.error({ err }, 'Failed to generate machine ID')
      throw new Error('Could not generate machine ID')
    }
  }

  static getMachineIdShort(): string {
    return this.getMachineId().slice(0, 16).toUpperCase()
  }
}
