/**
 * Error types of application
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  FILE = 'FILE_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL = 'INTERNAL_ERROR'
}

/**
 * Class for application errors
 */
export class AppError extends Error {
  type: ErrorType;
  statusCode: number;
  details?: any;

  constructor(message: string, type: ErrorType, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Transform error to message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  } else if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'An unknown error occurred';
  }
}

/**
 * Get status code from error
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  } else {
    // Default status code for unknown errors
    return 400;
  }
}

/**
 * Log error to console
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}] ` : '';
  
  if (error instanceof AppError) {
    console.error(
      `${prefix}[${error.type}] ${error.message}`, 
      error.details ? { details: error.details } : ''
    );
  } else if (error instanceof Error) {
    console.error(`${prefix}${error.name}: ${error.message}`, error.stack);
  } else {
    console.error(`${prefix}Unknown error:`, error);
  }
}

/**
 * Creaye validation errors
 */
export function createValidationError(message: string, details?: any): AppError {
  return new AppError(message, ErrorType.VALIDATION, 400, details);
}

/**
 * Create authentication errors
 */
export function createAuthenticationError(message: string = 'Authentication failed'): AppError {
  return new AppError(message, ErrorType.AUTHENTICATION, 401);
}

/**
 * Create authorization errors
 */
export function createAuthorizationError(message: string = 'Permission denied'): AppError {
  return new AppError(message, ErrorType.AUTHORIZATION, 403);
}

/**
 * Create not found errors
 */
export function createNotFoundError(resource: string): AppError {
  return new AppError(`${resource} not found`, ErrorType.NOT_FOUND, 404);
}

/**
 * Create conflict errors
 */
export function createConflictError(message: string): AppError {
  return new AppError(message, ErrorType.CONFLICT, 409);
}

/**
 * Create file errors
 */
export function createFileError(message: string, details?: any): AppError {
  return new AppError(message, ErrorType.FILE, 400, details);
}

/**
 * Create database errors
 */
export function createDatabaseError(message: string, details?: any): AppError {
  return new AppError(message, ErrorType.DATABASE, 500, details);
}