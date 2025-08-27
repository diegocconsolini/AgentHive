import chalk from 'chalk';
import { table } from 'table';
import { OutputFormat, CommandResult } from '../types/commands.js';

export class OutputFormatter {
  static format<T>(data: T, format: OutputFormat = 'json', options: any = {}): string {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'yaml':
        return this.toYaml(data);
      case 'table':
        return this.toTable(data, options);
      case 'tree':
        return this.toTree(data, options);
      case 'csv':
        return this.toCsv(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  static success(message: string, data?: any, format: OutputFormat = 'json'): void {
    if (format === 'json') {
      console.log(JSON.stringify({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      console.log(chalk.green('✓'), message);
      if (data) {
        console.log(this.format(data, format));
      }
    }
  }

  static error(message: string, error?: any, format: OutputFormat = 'json'): void {
    if (format === 'json') {
      console.log(JSON.stringify({
        success: false,
        error: message,
        details: error,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      console.error(chalk.red('✗'), message);
      if (error && typeof error === 'string') {
        console.error(chalk.red(error));
      } else if (error?.message) {
        console.error(chalk.red(error.message));
      }
    }
  }

  static warning(message: string, format: OutputFormat = 'json'): void {
    if (format === 'json') {
      console.log(JSON.stringify({
        level: 'warning',
        message,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      console.log(chalk.yellow('⚠'), message);
    }
  }

  static info(message: string, format: OutputFormat = 'json'): void {
    if (format === 'json') {
      console.log(JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      console.log(chalk.blue('ℹ'), message);
    }
  }

  static result<T>(result: CommandResult<T>, format: OutputFormat = 'json'): void {
    if (result.success) {
      this.success(result.message || 'Operation completed', result.data, format);
    } else {
      this.error(result.error || 'Operation failed', result.data, format);
    }
  }

  private static toYaml(data: any, indent = 0): string {
    const spaces = ' '.repeat(indent);
    
    if (data === null) return 'null';
    if (typeof data === 'undefined') return 'undefined';
    if (typeof data === 'string') return data;
    if (typeof data === 'number' || typeof data === 'boolean') return String(data);
    
    if (Array.isArray(data)) {
      if (data.length === 0) return '[]';
      return data.map(item => `${spaces}- ${this.toYaml(item, indent + 2)}`).join('\n');
    }
    
    if (typeof data === 'object') {
      const entries = Object.entries(data);
      if (entries.length === 0) return '{}';
      return entries.map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${spaces}${key}:\n${this.toYaml(value, indent + 2)}`;
        } else {
          return `${spaces}${key}: ${this.toYaml(value, indent)}`;
        }
      }).join('\n');
    }
    
    return String(data);
  }

  private static toTable(data: any, options: any = {}): string {
    if (!Array.isArray(data)) {
      // Convert single object to single-row table
      data = [data];
    }

    if (data.length === 0) {
      return 'No data to display';
    }

    // Get all unique keys from all objects
    const allKeys = new Set<string>();
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    const headers = Array.from(allKeys);
    const rows = data.map(item => {
      return headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      });
    });

    return table([headers, ...rows], {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│',
        joinBody: '─',
        joinLeft: '├',
        joinRight: '┤',
        joinJoin: '┼'
      },
      columnDefault: {
        paddingLeft: 1,
        paddingRight: 1
      }
    });
  }

  private static toTree(data: any, options: any = {}, depth = 0): string {
    const indent = '  '.repeat(depth);
    const connector = depth === 0 ? '' : '├─ ';
    
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        let result = `${indent}${connector}Array (${data.length} items)\n`;
        data.forEach((item, index) => {
          const isLast = index === data.length - 1;
          const childConnector = isLast ? '└─ ' : '├─ ';
          result += `${indent}  ${childConnector}[${index}] ${this.toTree(item, options, depth + 2)}\n`;
        });
        return result.slice(0, -1); // Remove last newline
      } else {
        const entries = Object.entries(data);
        if (entries.length === 0) return `${indent}${connector}{}`;
        
        let result = `${indent}${connector}Object\n`;
        entries.forEach(([key, value], index) => {
          const isLast = index === entries.length - 1;
          const childConnector = isLast ? '└─ ' : '├─ ';
          result += `${indent}  ${childConnector}${key}: ${this.toTree(value, options, depth + 2)}\n`;
        });
        return result.slice(0, -1); // Remove last newline
      }
    } else {
      return String(data);
    }
  }

  private static toCsv(data: any): string {
    if (!Array.isArray(data)) {
      data = [data];
    }

    if (data.length === 0) {
      return '';
    }

    // Get headers
    const headers = Object.keys(data[0]);
    
    // Convert to CSV
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value?.toString() || '';
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  static formatList(items: any[], options: { 
    format?: OutputFormat;
    title?: string;
    columns?: string[];
    sortBy?: string;
    limit?: number;
  } = {}): string {
    const { format = 'table', title, columns, sortBy, limit } = options;

    if (title && format !== 'json') {
      console.log(chalk.bold.underline(title));
      console.log();
    }

    // Apply sorting
    if (sortBy && items.length > 0 && items[0][sortBy] !== undefined) {
      items.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal);
        }
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      });
    }

    // Apply limit
    if (limit && items.length > limit) {
      items = items.slice(0, limit);
    }

    // Filter columns if specified
    if (columns && items.length > 0) {
      items = items.map(item => {
        const filtered: any = {};
        columns.forEach(col => {
          if (item[col] !== undefined) {
            filtered[col] = item[col];
          }
        });
        return filtered;
      });
    }

    return this.format(items, format);
  }

  static progressBar(current: number, total: number, width = 40): string {
    const percentage = Math.min(current / total, 1);
    const filled = Math.round(width * percentage);
    const empty = width - filled;
    
    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    const percent = (percentage * 100).toFixed(1);
    
    return `${bar} ${percent}% (${current}/${total})`;
  }

  static timestamp(): string {
    return new Date().toISOString();
  }
}

export class InteractivePrompts {
  static async confirm(message: string, defaultValue = false): Promise<boolean> {
    const inquirer = await import('inquirer');
    const { confirmed } = await inquirer.default.prompt({
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue
    });
    return confirmed;
  }

  static async select(message: string, choices: string[] | { name: string; value: any }[]): Promise<any> {
    const inquirer = await import('inquirer');
    const { selected } = await inquirer.default.prompt({
      type: 'list',
      name: 'selected',
      message,
      choices
    });
    return selected;
  }

  static async multiSelect(message: string, choices: string[] | { name: string; value: any }[]): Promise<any[]> {
    const inquirer = await import('inquirer');
    const { selected } = await inquirer.default.prompt({
      type: 'checkbox',
      name: 'selected',
      message,
      choices
    });
    return selected;
  }

  static async input(message: string, defaultValue?: string, validate?: (input: string) => boolean | string): Promise<string> {
    const inquirer = await import('inquirer');
    const { answer } = await inquirer.default.prompt({
      type: 'input',
      name: 'answer',
      message,
      default: defaultValue,
      validate
    });
    return answer;
  }

  static async password(message: string, validate?: (input: string) => boolean | string): Promise<string> {
    const inquirer = await import('inquirer');
    const { answer } = await inquirer.default.prompt({
      type: 'password',
      name: 'answer',
      message,
      mask: '*',
      validate
    });
    return answer;
  }

  static async editor(message: string, defaultValue = ''): Promise<string> {
    const inquirer = await import('inquirer');
    const { content } = await inquirer.default.prompt({
      type: 'editor',
      name: 'content',
      message,
      default: defaultValue
    });
    return content;
  }
}