export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super('NOT_FOUND', message)
  }
}

export class PermissionError extends AppError {
  constructor(message: string) {
    super('PERMISSION_DENIED', message)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super('DATABASE_ERROR', message, details)
  }
}

export function toIpcError(err: unknown): { code: string; message: string; details?: unknown } {
  if (err instanceof AppError) {
    return { code: err.code, message: err.message, details: err.details }
  }
  if (err instanceof Error) {
    return { code: 'UNKNOWN_ERROR', message: err.message }
  }
  return { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' }
}
