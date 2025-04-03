/**
 * Définition des types d'erreur spécifiques au chat
 */
export enum ErrorType {
    VALIDATION = 'VALIDATION_ERROR',
    AUTHENTICATION = 'AUTHENTICATION_ERROR',
    NOT_FOUND = 'NOT_FOUND_ERROR',
    DATABASE = 'DATABASE_ERROR',
    INTERNAL = 'INTERNAL_ERROR'
  }
  
  /**
   * Classe d'erreur personnalisée pour le chat
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
   * Retourne un message d'erreur formaté
   */
  export function getErrorMessage(error: unknown): string {
    if (error instanceof AppError) {
      return error.message;
    } else if (error instanceof Error) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else {
      return 'Une erreur inconnue est survenue';
    }
  }
  
  /**
   * Récupère le code d'erreur HTTP
   */
  export function getErrorStatusCode(error: unknown): number {
    if (error instanceof AppError) {
      return error.statusCode;
    } else {
      return 500; // Erreur serveur par défaut
    }
  }
  
  /**
   * Journalise les erreurs dans la console
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
      console.error(`${prefix}Erreur inconnue:`, error);
    }
  }
  
  /**
   * Crée une erreur de validation
   */
  export function createValidationError(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.VALIDATION, 400, details);
  }
  
  /**
   * Crée une erreur d'authentification
   */
  export function createAuthenticationError(message: string = 'Échec de l’authentification'): AppError {
    return new AppError(message, ErrorType.AUTHENTICATION, 401);
  }
  
  /**
   * Crée une erreur "ressource non trouvée"
   */
  export function createNotFoundError(resource: string): AppError {
    return new AppError(`${resource} non trouvé(e)`, ErrorType.NOT_FOUND, 404);
  }
  
  /**
   * Crée une erreur de base de données
   */
  export function createDatabaseError(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.DATABASE, 500, details);
  }
  