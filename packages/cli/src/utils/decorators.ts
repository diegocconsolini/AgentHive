import { CLIError } from './errors.js';
import { OutputFormatter } from './output.js';

/**
 * Method decorator for error handling
 */
export function handleErrors(target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor): any {
  // Handle both legacy and modern decorator patterns
  const actualDescriptor = descriptor || Object.getOwnPropertyDescriptor(target, propertyKey) || {
    value: target[propertyKey],
    writable: true,
    enumerable: false,
    configurable: true
  };
  
  if (!actualDescriptor.value) {
    return actualDescriptor;
  }
  
  const originalMethod = actualDescriptor.value;

  actualDescriptor.value = async function (this: any, ...args: any[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      if (error instanceof CLIError) {
        OutputFormatter.error(error.message, error.details);
        process.exit(error.exitCode || 1);
      } else {
        OutputFormatter.error('Unexpected error occurred', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    }
  };

  // If descriptor was not provided, define the property
  if (!descriptor) {
    Object.defineProperty(target, propertyKey, actualDescriptor);
  }
  
  return actualDescriptor;
}

/**
 * Function wrapper for error handling (alternative to decorator)
 */
export function withErrorHandling<T extends (...args: any[]) => any>(fn: T): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof CLIError) {
        OutputFormatter.error(error.message, error.details);
        process.exit(error.exitCode || 1);
      } else {
        OutputFormatter.error('Unexpected error occurred', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    }
  }) as T;
}