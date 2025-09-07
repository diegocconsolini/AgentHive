import { EnvironmentConfig } from '../types/api.js';

export class EnvUtils {
  /**
   * Get environment configuration with defaults
   */
  static getConfig(): EnvironmentConfig {
    return {
      NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
      API_URL: process.env.API_URL || 'http://localhost:4000',
      GRAPHQL_URL: process.env.GRAPHQL_URL || 'http://localhost:4000/graphql',
      SYSTEM_API_URL: process.env.SYSTEM_API_URL || 'http://localhost:4001',
      WS_URL: process.env.WS_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
      REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    };
  }

  /**
   * Check if running in development
   */
  static isDevelopment(): boolean {
    return this.getConfig().NODE_ENV === 'development';
  }

  /**
   * Check if running in production
   */
  static isProduction(): boolean {
    return this.getConfig().NODE_ENV === 'production';
  }

  /**
   * Get required environment variable
   */
  static getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * Get optional environment variable with default
   */
  static getOptional(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || defaultValue;
  }

  /**
   * Parse boolean environment variable
   */
  static getBoolean(key: string, defaultValue = false): boolean {
    const value = process.env[key];
    if (!value) return defaultValue;
    
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Parse number environment variable
   */
  static getNumber(key: string, defaultValue?: number): number | undefined {
    const value = process.env[key];
    if (!value) return defaultValue;
    
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}