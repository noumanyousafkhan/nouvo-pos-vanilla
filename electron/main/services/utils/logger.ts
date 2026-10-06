import pino from 'pino'
import { getAppPaths } from './paths'
import { join } from 'path'

const paths = getAppPaths()

const isDev = !process.env.NODE_ENV?.includes('production')

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
  ...(isDev
    ? {}
    : {
        destination: join(paths.logsDir, 'app.log')
      }),
  redact: {
    paths: [
      'password',
      'password_hash',
      'license_key',
      'licenseKey',
      'token',
      'secret',
      'privateKey'
    ],
    censor: '[REDACTED]'
  }
})
