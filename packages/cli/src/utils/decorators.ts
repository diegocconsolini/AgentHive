import { CLIError } from './errors.js';
import { OutputFormatter } from './output.js';

/**
 * Error handling decorator replacement for methods
 */
export function handleErrors<T extends (...args: any[]) => any>(
  target: any,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> {
  const originalMethod = descriptor.value!;

  descriptor.value = (async function (this: any, ...args: any[]) {
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

  return descriptor;
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