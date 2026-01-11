/**
 * Comprehensive Error Handling System
 * Provides structured error types and centralized error handling
 */

export enum ErrorCode {
  // Authentication & Authorization
  INVALID_API_KEY = 'INVALID_API_KEY',
  MISSING_API_KEY = 'MISSING_API_KEY',
  ORIGIN_NOT_ALLOWED = 'ORIGIN_NOT_ALLOWED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Validation
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  REQUEST_TOO_LARGE = 'REQUEST_TOO_LARGE',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  
  // AI & External Services
  AI_MODEL_ERROR = 'AI_MODEL_ERROR',
  SEARCH_SERVICE_ERROR = 'SEARCH_SERVICE_ERROR',
  STRIPE_ERROR = 'STRIPE_ERROR',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.metadata && { details: this.metadata })
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(ErrorCode.INVALID_REQUEST, message, 400, field ? { field } : undefined);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(code, message, 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number, limitType: 'hourly' | 'daily') {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', 429, { retryAfter, limitType });
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, originalError?: Error) {
    super(ErrorCode.DATABASE_ERROR, `Database operation failed: ${operation}`, 500, {
      operation,
      originalError: originalError?.message
    });
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, operation: string, originalError?: Error) {
    super(ErrorCode.AI_MODEL_ERROR, `${service} service error: ${operation}`, 503, {
      service,
      operation,
      originalError: originalError?.message
    });
    this.name = 'ExternalServiceError';
  }
}

/**
 * Centralized error handler with monitoring integration
 */
export class ErrorHandler {
  constructor(
    private environment: string,
    private analytics?: any,
    private monitoring?: any
  ) {}

  async handleError(error: Error, context?: Record<string, any>): Promise<Response> {
    const timestamp = Date.now();
    
    // Convert unknown errors to AppError
    let appError: AppError;
    if (error instanceof AppError) {
      appError = error;
    } else {
      appError = new AppError(
        ErrorCode.INTERNAL_ERROR,
        this.environment === 'production' ? 'Internal server error' : error.message,
        500,
        { originalError: error.message, stack: error.stack }
      );
    }

    // Log error with context
    const logData = {
      error: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      timestamp,
      ...context,
      ...(appError.metadata && { metadata: appError.metadata })
    };

    console.error('Error handled:', JSON.stringify(logData));

    // Send to analytics if available
    if (this.analytics) {
      try {
        this.analytics.writeDataPoint({
          blobs: [appError.code, appError.message, this.environment],
          doubles: [appError.statusCode, timestamp],
          indexes: [appError.code, 'error']
        });
      } catch (analyticsError) {
        console.error('Failed to log error to analytics:', analyticsError);
      }
    }

    // Send alert for critical errors
    if (appError.statusCode >= 500 && this.monitoring) {
      try {
        await this.monitoring.sendAlert({
          level: 'error',
          title: `${appError.code} Error`,
          message: appError.message,
          metadata: { ...logData, environment: this.environment },
          timestamp
        });
      } catch (monitoringError) {
        console.error('Failed to send error alert:', monitoringError);
      }
    }

    // Create response
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
    };

    // Add retry-after header for rate limit errors
    if (appError instanceof RateLimitError && appError.metadata?.retryAfter) {
      headers['Retry-After'] = String(appError.metadata.retryAfter);
    }

    return new Response(JSON.stringify(appError.toJSON()), {
      status: appError.statusCode,
      headers
    });
  }
}

/**
 * Async operation wrapper with timeout and error handling
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AppError(ErrorCode.TIMEOUT_ERROR, `Operation ${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(ErrorCode.INTERNAL_ERROR, `Operation ${operationName} failed: ${error}`);
  }
}

/**
 * Database operation wrapper with error handling
 */
export async function withDatabase<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Database operation ${operationName} failed:`, error);
    throw new DatabaseError(operationName, error as Error);
  }
}

/**
 * External service call wrapper with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) break;
      
      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new ExternalServiceError('external-service', operationName, lastError!);
}