import { CLIError } from './errors.js';
import { OutputFormatter } from './output.js';

/**
 * Error handling decorator for methods
 */
export function handleErrors<T extends (...args: any[]) => any>(
  target: any,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T>;
/**
 * Error handling function wrapper (alternative to decorator)
 */
export function handleErrors<T extends (...args: any[]) => any>(fn: T): T;
export function handleErrors<T extends (...args: any[]) => any>(
  targetOrFn: any,
  propertyKey?: string | symbol,
  descriptor?: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> | T {
  // If called as a function wrapper (1 argument)
  if (arguments.length === 1 && typeof targetOrFn === 'function') {
    return withErrorHandling(targetOrFn);
  }
  
  // If called as a method decorator (2 or 3 arguments)
  if (arguments.length >= 2) {
    // Handle both 2-argument (target, propertyKey) and 3-argument (target, propertyKey, descriptor) cases
    const actualDescriptor = descriptor || Object.getOwnPropertyDescriptor(targetOrFn, propertyKey!) || {
      value: targetOrFn[propertyKey!],
      writable: true,
      enumerable: true,
      configurable: true
    };
    
    const originalMethod = actualDescriptor.value!;

    actualDescriptor.value = (async function (this: any, ...args: any[]) {
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
    }) as T;

    // If descriptor was not provided, define the property
    if (!descriptor) {
      Object.defineProperty(targetOrFn, propertyKey!, actualDescriptor);
      return actualDescriptor;
    }
    
    return actualDescriptor;
  }
  
  throw new Error('handleErrors: Invalid arguments provided');
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