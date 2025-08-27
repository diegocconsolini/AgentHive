import { CLIError, ErrorCode } from './errors.js';
import { z, ZodSchema } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

export class Validator {
  static validateSchema<T>(data: unknown, schema: ZodSchema<T>, fieldName = 'data'): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        
        throw new CLIError(
          `Validation error in ${fieldName}: ${issues}`,
          ErrorCode.VALIDATION_ERROR,
          { issues: error.issues },
          ['Check your input data', 'Refer to the documentation for valid formats']
        );
      }
      throw error;
    }
  }

  static required(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new CLIError(
        `${fieldName} is required`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName },
        [`Provide a value for ${fieldName}`, 'Use --help for usage information']
      );
    }
  }

  static string(value: any, fieldName: string, options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    choices?: string[];
  } = {}): void {
    if (typeof value !== 'string') {
      throw new CLIError(
        `${fieldName} must be a string`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value }
      );
    }

    if (options.minLength && value.length < options.minLength) {
      throw new CLIError(
        `${fieldName} must be at least ${options.minLength} characters long`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value, minLength: options.minLength }
      );
    }

    if (options.maxLength && value.length > options.maxLength) {
      throw new CLIError(
        `${fieldName} must be at most ${options.maxLength} characters long`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value, maxLength: options.maxLength }
      );
    }

    if (options.pattern && !options.pattern.test(value)) {
      throw new CLIError(
        `${fieldName} does not match required pattern`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value, pattern: options.pattern.source }
      );
    }

    if (options.choices && !options.choices.includes(value)) {
      throw new CLIError(
        `${fieldName} must be one of: ${options.choices.join(', ')}`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value, choices: options.choices },
        [`Use one of: ${options.choices.join(', ')}`]
      );
    }
  }

  static number(value: any, fieldName: string, options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}): void {
    const num = Number(value);
    
    if (isNaN(num)) {
      throw new CLIError(
        `${fieldName} must be a number`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value }
      );
    }

    if (options.integer && !Number.isInteger(num)) {
      throw new CLIError(
        `${fieldName} must be an integer`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value }
      );
    }

    if (options.min !== undefined && num < options.min) {
      throw new CLIError(
        `${fieldName} must be at least ${options.min}`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value, min: options.min }
      );
    }

    if (options.max !== undefined && num > options.max) {
      throw new CLIError(
        `${fieldName} must be at most ${options.max}`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value, max: options.max }
      );
    }
  }

  static email(value: string, fieldName = 'email'): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new CLIError(
        `${fieldName} must be a valid email address`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value },
        ['Provide a valid email address like user@example.com']
      );
    }
  }

  static url(value: string, fieldName = 'URL'): void {
    try {
      new URL(value);
    } catch {
      throw new CLIError(
        `${fieldName} must be a valid URL`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value },
        ['Provide a valid URL including protocol (http:// or https://)']
      );
    }
  }

  static uuid(value: string, fieldName = 'ID'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new CLIError(
        `${fieldName} must be a valid UUID`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value },
        ['Provide a valid UUID format like: 12345678-1234-1234-1234-123456789012']
      );
    }
  }

  static fileExists(filePath: string, fieldName = 'file'): void {
    if (!fs.existsSync(filePath)) {
      throw new CLIError(
        `${fieldName} does not exist: ${filePath}`,
        ErrorCode.FILE_ERROR,
        { field: fieldName, filePath },
        ['Check the file path', 'Make sure the file exists and is accessible']
      );
    }
  }

  static fileReadable(filePath: string, fieldName = 'file'): void {
    this.fileExists(filePath, fieldName);
    
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch {
      throw new CLIError(
        `${fieldName} is not readable: ${filePath}`,
        ErrorCode.FILE_ERROR,
        { field: fieldName, filePath },
        ['Check file permissions', 'Make sure you have read access to the file']
      );
    }
  }

  static directoryExists(dirPath: string, fieldName = 'directory'): void {
    if (!fs.existsSync(dirPath)) {
      throw new CLIError(
        `${fieldName} does not exist: ${dirPath}`,
        ErrorCode.FILE_ERROR,
        { field: fieldName, dirPath },
        ['Check the directory path', 'Create the directory first if needed']
      );
    }

    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) {
      throw new CLIError(
        `${fieldName} is not a directory: ${dirPath}`,
        ErrorCode.FILE_ERROR,
        { field: fieldName, dirPath },
        ['Provide a valid directory path']
      );
    }
  }

  static json(value: string, fieldName = 'JSON'): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new CLIError(
        `${fieldName} contains invalid JSON`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value, parseError: (error as Error).message },
        ['Check JSON syntax', 'Use a JSON validator to verify the format']
      );
    }
  }

  static arrayNotEmpty(value: any[], fieldName: string): void {
    if (!Array.isArray(value) || value.length === 0) {
      throw new CLIError(
        `${fieldName} must be a non-empty array`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value }
      );
    }
  }

  static dateString(value: string, fieldName = 'date'): void {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new CLIError(
        `${fieldName} must be a valid date string`,
        ErrorCode.VALIDATION_ERROR,
        { field: fieldName, value },
        ['Use ISO format like 2023-12-31T23:59:59Z', 'Or relative format like "1 day ago"']
      );
    }
  }

  static timeRange(value: string, fieldName = 'time range'): { start: Date; end: Date } {
    // Handle relative time ranges like "1h", "24h", "7d", etc.
    const relativeMatch = value.match(/^(\d+)([smhd])$/);
    if (relativeMatch) {
      const [, amount, unit] = relativeMatch;
      const now = new Date();
      const milliseconds = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
      };

      const duration = parseInt(amount) * milliseconds[unit as keyof typeof milliseconds];
      return {
        start: new Date(now.getTime() - duration),
        end: now
      };
    }

    // Handle absolute time ranges like "2023-01-01,2023-12-31"
    const parts = value.split(',');
    if (parts.length === 2) {
      const start = new Date(parts[0].trim());
      const end = new Date(parts[1].trim());
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new CLIError(
          `${fieldName} contains invalid dates`,
          ErrorCode.VALIDATION_ERROR,
          { field: fieldName, value }
        );
      }

      if (start >= end) {
        throw new CLIError(
          `${fieldName} start date must be before end date`,
          ErrorCode.VALIDATION_ERROR,
          { field: fieldName, value, start, end }
        );
      }

      return { start, end };
    }

    throw new CLIError(
      `${fieldName} must be either a relative format (1h, 24h, 7d) or absolute format (start,end)`,
      ErrorCode.VALIDATION_ERROR,
      { field: fieldName, value },
      [
        'Use relative format: 1h, 24h, 7d (s=seconds, m=minutes, h=hours, d=days)',
        'Use absolute format: 2023-01-01T00:00:00Z,2023-12-31T23:59:59Z'
      ]
    );
  }

  static tags(value: string | string[], fieldName = 'tags'): string[] {
    if (typeof value === 'string') {
      // Split by comma and clean up
      return value.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }

    if (Array.isArray(value)) {
      return value.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
    }

    throw new CLIError(
      `${fieldName} must be a string or array of strings`,
      ErrorCode.VALIDATION_ERROR,
      { field: fieldName, value }
    );
  }

  static model(value: string, fieldName = 'model'): void {
    const validModels = ['haiku', 'sonnet', 'opus'];
    this.string(value, fieldName, { choices: validModels });
  }

  static outputFormat(value: string, fieldName = 'output format'): void {
    const validFormats = ['json', 'table', 'tree', 'yaml', 'csv'];
    this.string(value, fieldName, { choices: validFormats });
  }
}

// Zod schemas for complex validation
export const AgentCreateSchema = z.object({
  name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9_-]+$/, 'Name can only contain letters, numbers, hyphens and underscores'),
  description: z.string().min(1).max(1000).optional(),
  model: z.enum(['haiku', 'sonnet', 'opus']).default('sonnet'),
  systemPrompt: z.string().min(1).optional(),
  tools: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({})
});

export const ContextCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(1000).optional(),
  agentId: z.string().uuid().optional(),
  metadata: z.record(z.any()).default({})
});

export const MemoryCreateSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  contextId: z.string().uuid().optional(),
  metadata: z.record(z.any()).default({})
});

export const ConfigKeySchema = z.object({
  key: z.string().min(1).regex(/^[a-zA-Z0-9._-]+$/, 'Key can only contain letters, numbers, dots, hyphens and underscores'),
  value: z.any(),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional()
});

export const TimeRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime()
}).refine(data => new Date(data.start) < new Date(data.end), {
  message: 'Start date must be before end date'
});

// Environment configuration schema
export const EnvironmentSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Environment name can only contain letters, numbers, hyphens and underscores'),
  config: z.record(z.any()).default({}),
  active: z.boolean().default(false)
});

// File validation utilities
export class FileValidator {
  static isValidExtension(filePath: string, allowedExtensions: string[]): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return allowedExtensions.includes(ext);
  }

  static validateConfigFile(filePath: string): any {
    Validator.fileReadable(filePath, 'configuration file');
    
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf8');
    
    switch (ext) {
      case '.json':
        return Validator.json(content, 'configuration file');
      case '.yaml':
      case '.yml':
        try {
          const yaml = require('js-yaml');
          return yaml.load(content);
        } catch (error) {
          throw new CLIError(
            `Invalid YAML in configuration file: ${filePath}`,
            ErrorCode.VALIDATION_ERROR,
            { filePath, parseError: (error as Error).message }
          );
        }
      default:
        throw new CLIError(
          `Unsupported configuration file format: ${ext}`,
          ErrorCode.VALIDATION_ERROR,
          { filePath, extension: ext },
          ['Use .json or .yaml/.yml files for configuration']
        );
    }
  }

  static validateTemplateFile(filePath: string): any {
    return this.validateConfigFile(filePath);
  }

  static ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static validateWritable(filePath: string): void {
    const dir = path.dirname(filePath);
    this.ensureDirectory(dir);
    
    try {
      // Test write access by creating a temporary file
      const tempFile = path.join(dir, '.write-test-' + Date.now());
      fs.writeFileSync(tempFile, '');
      fs.unlinkSync(tempFile);
    } catch (error) {
      throw new CLIError(
        `Cannot write to directory: ${dir}`,
        ErrorCode.FILE_ERROR,
        { directory: dir, error: (error as Error).message },
        ['Check directory permissions', 'Make sure the directory exists and is writable']
      );
    }
  }
}