/**
 * Error Handling Utilities
 *
 * Centralized error handling for disk failures, network issues, etc.
 */

/**
 * Custom error types for the application
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class VaultError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VAULT_ERROR', true, details);
    this.name = 'VaultError';
  }
}

export class FileSystemError extends AppError {
  constructor(message: string, public path?: string, details?: unknown) {
    super(message, 'FILESYSTEM_ERROR', true, details);
    this.name = 'FileSystemError';
  }
}

export class SerializationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'SERIALIZATION_ERROR', true, details);
    this.name = 'SerializationError';
  }
}

export class MigrationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'MIGRATION_ERROR', true, details);
    this.name = 'MigrationError';
  }
}

/**
 * Error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  VAULT_NOT_FOUND: 'Vault not found. Please select or create a vault.',
  VAULT_INVALID: 'Invalid vault format. The selected folder is not a KOL Noter vault.',
  VAULT_PERMISSION_DENIED: 'Permission denied. Cannot access the vault folder.',

  FILE_NOT_FOUND: 'File not found.',
  FILE_READ_ERROR: 'Failed to read file.',
  FILE_WRITE_ERROR: 'Failed to write file.',
  FILE_DELETE_ERROR: 'Failed to delete file.',

  NOTE_NOT_FOUND: 'Note not found.',
  NOTE_SAVE_ERROR: 'Failed to save note.',
  NOTE_DELETE_ERROR: 'Failed to delete note.',

  SYSTEM_NOT_FOUND: 'System not found.',
  PROJECT_NOT_FOUND: 'Project not found.',

  SERIALIZATION_ERROR: 'Failed to parse file content.',
  DESERIALIZATION_ERROR: 'Failed to convert note to file format.',

  MIGRATION_FAILED: 'Migration failed. Your original data is still intact.',

  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

/**
 * Parse an unknown error into a user-friendly message
 */
export function parseError(error: unknown): {
  message: string;
  code: string;
  recoverable: boolean;
  details?: unknown;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      recoverable: error.recoverable,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    // Check for common error patterns
    const msg = error.message.toLowerCase();

    if (msg.includes('permission denied') || msg.includes('eacces')) {
      return {
        message: ERROR_MESSAGES.VAULT_PERMISSION_DENIED,
        code: 'PERMISSION_DENIED',
        recoverable: true,
        details: error,
      };
    }

    if (msg.includes('no such file') || msg.includes('enoent')) {
      return {
        message: ERROR_MESSAGES.FILE_NOT_FOUND,
        code: 'FILE_NOT_FOUND',
        recoverable: true,
        details: error,
      };
    }

    if (msg.includes('disk full') || msg.includes('enospc')) {
      return {
        message: 'Disk is full. Free up some space and try again.',
        code: 'DISK_FULL',
        recoverable: true,
        details: error,
      };
    }

    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      recoverable: true,
      details: error,
    };
  }

  return {
    message: ERROR_MESSAGES.UNKNOWN_ERROR,
    code: 'UNKNOWN_ERROR',
    recoverable: false,
    details: error,
  };
}

/**
 * Log error to console with context
 */
export function logError(error: unknown, context?: string): void {
  const parsed = parseError(error);

  console.error(
    `[${parsed.code}]${context ? ` (${context})` : ''}: ${parsed.message}`,
    parsed.details
  );
}

/**
 * Wrap an async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ success: true; data: T } | { success: false; error: ReturnType<typeof parseError> }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    logError(error, context);
    return { success: false, error: parseError(error) };
  }
}

/**
 * Retry an async function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: unknown;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        onRetry?.(attempt, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffMultiplier;
      }
    }
  }

  throw lastError;
}
