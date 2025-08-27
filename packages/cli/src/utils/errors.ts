import chalk from 'chalk';
import { CommandResult } from '../types/commands.js';

export enum ErrorCode {
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  USER_CANCELLED = 'USER_CANCELLED'
}

export class CLIError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly suggestions?: string[];
  public readonly exitCode: number;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    details?: Record<string, any>,
    suggestions?: string[],
    exitCode = 1
  ) {
    super(message);
    this.name = 'CLIError';
    this.code = code;
    this.details = details;
    this.suggestions = suggestions;
    this.exitCode = exitCode;
  }

  static fromApiError(error: any): CLIError {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data || error.response.errors;
      
      switch (status) {
        case 401:
          return new CLIError(
            'Authentication required or token expired',
            ErrorCode.AUTHENTICATION_REQUIRED,
            { status, data },
            ['Run "memory auth login" to authenticate', 'Check if your token is valid with "memory auth whoami"'],
            401
          );
        case 403:
          return new CLIError(
            'Insufficient permissions for this operation',
            ErrorCode.AUTHORIZATION_FAILED,
            { status, data },
            ['Contact your administrator for access', 'Check your user role and permissions'],
            403
          );
        case 404:
          return new CLIError(
            'Resource not found',
            ErrorCode.RESOURCE_NOT_FOUND,
            { status, data },
            ['Check if the resource ID is correct', 'List available resources first'],
            404
          );
        case 409:
          return new CLIError(
            'Resource already exists or conflict detected',
            ErrorCode.RESOURCE_ALREADY_EXISTS,
            { status, data },
            ['Use a different name', 'Use --force flag to overwrite if supported'],
            409
          );
        case 422:
          return new CLIError(
            'Validation error in request data',
            ErrorCode.VALIDATION_ERROR,
            { status, data },
            ['Check your input parameters', 'Review the API documentation for required fields'],
            422
          );
        case 429:
          return new CLIError(
            'Rate limit exceeded',
            ErrorCode.RATE_LIMIT_ERROR,
            { status, data },
            ['Wait a moment before retrying', 'Consider upgrading your plan for higher limits'],
            429
          );
        default:
          return new CLIError(
            `API error: ${error.message}`,
            ErrorCode.API_ERROR,
            { status, data },
            ['Check the API status', 'Try again later'],
            1
          );
      }
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new CLIError(
        'Unable to connect to the API server',
        ErrorCode.NETWORK_ERROR,
        { originalError: error.message },
        [
          'Check your internet connection',
          'Verify the API URL with "memory config get api.url"',
          'Check if the server is running'
        ],
        1
      );
    }

    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return new CLIError(
        'Network timeout or connection reset',
        ErrorCode.TIMEOUT_ERROR,
        { originalError: error.message },
        ['Try again with a stable connection', 'Check if the server is experiencing issues'],
        1
      );
    }

    return new CLIError(
      error.message || 'An unknown error occurred',
      ErrorCode.INTERNAL_ERROR,
      { originalError: error },
      ['Try again', 'Report this issue if it persists'],
      1
    );
  }

  toCommandResult<T = any>(): CommandResult<T> {
    return {
      success: false,
      error: this.message,
      data: this.details as T,
      timestamp: new Date().toISOString()
    };
  }
}

export class ErrorHandler {
  static handle(error: any, json = false): never {
    let cliError: CLIError;

    if (error instanceof CLIError) {
      cliError = error;
    } else {
      cliError = CLIError.fromApiError(error);
    }

    if (json) {
      console.log(JSON.stringify(cliError.toCommandResult(), null, 2));
    } else {
      this.formatError(cliError);
    }

    process.exit(cliError.exitCode);
  }

  private static formatError(error: CLIError): void {
    console.error();
    console.error(chalk.red.bold('✗ Error:'), chalk.red(error.message));
    
    if (error.code !== ErrorCode.INTERNAL_ERROR) {
      console.error(chalk.gray(`   Code: ${error.code}`));
    }

    if (error.details) {
      console.error(chalk.gray('   Details:'));
      Object.entries(error.details).forEach(([key, value]) => {
        console.error(chalk.gray(`     ${key}: ${JSON.stringify(value, null, 2)}`));
      });
    }

    if (error.suggestions && error.suggestions.length > 0) {
      console.error();
      console.error(chalk.yellow('💡 Suggestions:'));
      error.suggestions.forEach(suggestion => {
        console.error(chalk.yellow(`   • ${suggestion}`));
      });
    }

    console.error();
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry certain error types
        if (error instanceof CLIError) {
          const nonRetryableCodes = [
            ErrorCode.AUTHENTICATION_REQUIRED,
            ErrorCode.AUTHORIZATION_FAILED,
            ErrorCode.VALIDATION_ERROR,
            ErrorCode.RESOURCE_NOT_FOUND,
            ErrorCode.USER_CANCELLED
          ];
          
          if (nonRetryableCodes.includes(error.code)) {
            throw error;
          }
        }

        if (attempt < maxRetries) {
          const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
          console.error(chalk.yellow(`⚠ Attempt ${attempt} failed, retrying in ${delay}ms...`));
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  static validateRequired(value: any, name: string): void {
    if (value === undefined || value === null || value === '') {
      throw new CLIError(
        `${name} is required`,
        ErrorCode.VALIDATION_ERROR,
        { field: name },
        [`Provide a value for ${name}`, 'Use --help for usage information']
      );
    }
  }

  static validateFileExists(filePath: string): void {
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      throw new CLIError(
        `File does not exist: ${filePath}`,
        ErrorCode.FILE_ERROR,
        { filePath },
        ['Check the file path', 'Make sure the file exists and is accessible']
      );
    }
  }

  static validateUrl(url: string, name = 'URL'): void {
    try {
      new URL(url);
    } catch {
      throw new CLIError(
        `Invalid ${name}: ${url}`,
        ErrorCode.VALIDATION_ERROR,
        { url, field: name },
        ['Provide a valid URL including protocol (http:// or https://)']
      );
    }
  }

  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new CLIError(
        `Invalid email address: ${email}`,
        ErrorCode.VALIDATION_ERROR,
        { email },
        ['Provide a valid email address']
      );
    }
  }

  static validateUuid(id: string, name = 'ID'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new CLIError(
        `Invalid ${name} format: ${id}`,
        ErrorCode.VALIDATION_ERROR,
        { id, field: name },
        ['Provide a valid UUID']
      );
    }
  }

  static validateChoices(value: string, choices: string[], name = 'value'): void {
    if (!choices.includes(value)) {
      throw new CLIError(
        `Invalid ${name}: ${value}. Must be one of: ${choices.join(', ')}`,
        ErrorCode.VALIDATION_ERROR,
        { value, choices, field: name },
        [`Use one of: ${choices.join(', ')}`]
      );
    }
  }

  static wrapAsync(fn: Function): Function {
    return async (...args: any[]) => {
      try {
        await fn(...args);
      } catch (error) {
        // Extract json flag from commander options if available
        const lastArg = args[args.length - 1];
        const json = lastArg?.parent?.opts?.()?.json || lastArg?.opts?.()?.json || false;
        ErrorHandler.handle(error, json);
      }
    };
  }
}

export function handleErrors(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = ErrorHandler.wrapAsync(method);
}

// Utility function for consistent error responses
export function createErrorResult(error: string | CLIError, data?: any): CommandResult {
  if (typeof error === 'string') {
    return {
      success: false,
      error,
      data,
      timestamp: new Date().toISOString()
    };
  } else {
    return error.toCommandResult();
  }
}

export function createSuccessResult<T>(data: T, message?: string): CommandResult<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}