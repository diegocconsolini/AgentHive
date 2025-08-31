import inquirer from 'inquirer';
import { CLIError, ErrorCode } from './errors.js';

export interface PromptOptions {
  message: string;
  default?: any;
  choices?: string[];
  validate?: (input: any) => boolean | string;
  filter?: (input: any) => any;
  when?: boolean | ((answers: any) => boolean);
}

export class InteractivePrompts {
  static async text(name: string, options: PromptOptions): Promise<string> {
    try {
      const answers = await inquirer.prompt([{
        type: 'input',
        name,
        message: options.message,
        default: options.default,
        validate: options.validate,
        filter: options.filter,
        when: options.when
      }]);
      return answers[name];
    } catch (error) {
      throw new CLIError(
        'Failed to get user input',
        ErrorCode.USER_INPUT_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  static async select(name: string, options: PromptOptions & { choices: string[] }): Promise<string> {
    try {
      const answers = await inquirer.prompt([{
        type: 'list',
        name,
        message: options.message,
        choices: options.choices,
        default: options.default,
        when: options.when
      }]);
      return answers[name];
    } catch (error) {
      throw new CLIError(
        'Failed to get user selection',
        ErrorCode.USER_INPUT_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  static async multiSelect(name: string, options: PromptOptions & { choices: string[] }): Promise<string[]> {
    try {
      const answers = await inquirer.prompt([{
        type: 'checkbox',
        name,
        message: options.message,
        choices: options.choices,
        default: options.default,
        validate: options.validate,
        when: options.when
      }]);
      return answers[name];
    } catch (error) {
      throw new CLIError(
        'Failed to get user selections',
        ErrorCode.USER_INPUT_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  static async confirm(name: string, options: PromptOptions): Promise<boolean> {
    try {
      const answers = await inquirer.prompt([{
        type: 'confirm',
        name,
        message: options.message,
        default: options.default ?? true,
        when: options.when
      }]);
      return answers[name];
    } catch (error) {
      throw new CLIError(
        'Failed to get confirmation',
        ErrorCode.USER_INPUT_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  static async password(name: string, options: PromptOptions): Promise<string> {
    try {
      const answers = await inquirer.prompt([{
        type: 'password',
        name,
        message: options.message,
        validate: options.validate,
        when: options.when
      }]);
      return answers[name];
    } catch (error) {
      throw new CLIError(
        'Failed to get password input',
        ErrorCode.USER_INPUT_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  static async number(name: string, options: PromptOptions & { min?: number; max?: number }): Promise<number> {
    try {
      const answers = await inquirer.prompt([{
        type: 'number',
        name,
        message: options.message,
        default: options.default,
        validate: (input: number) => {
          if (typeof input !== 'number' || isNaN(input)) {
            return 'Please enter a valid number';
          }
          if (options.min !== undefined && input < options.min) {
            return `Number must be at least ${options.min}`;
          }
          if (options.max !== undefined && input > options.max) {
            return `Number must be at most ${options.max}`;
          }
          return options.validate ? options.validate(input) : true;
        },
        when: options.when
      }]);
      return answers[name];
    } catch (error) {
      throw new CLIError(
        'Failed to get number input',
        ErrorCode.USER_INPUT_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  static async editor(name: string, options: PromptOptions): Promise<string> {
    try {
      const answers = await inquirer.prompt([{
        type: 'editor',
        name,
        message: options.message,
        default: options.default,
        validate: options.validate,
        when: options.when
      }]);
      return answers[name];
    } catch (error) {
      throw new CLIError(
        'Failed to open editor for input',
        ErrorCode.USER_INPUT_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  static async autocomplete(name: string, options: PromptOptions & { 
    choices: string[];
    source?: (answers: any, input: string) => Promise<string[]> | string[];
  }): Promise<string> {
    try {
      // Note: This requires inquirer-autocomplete-prompt plugin
      // For now, fall back to regular select
      return await this.select(name, options);
    } catch (error) {
      throw new CLIError(
        'Failed to get autocomplete input',
        ErrorCode.USER_INPUT_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Simple input method - alias for text method for backward compatibility
   */
  static async input(options: PromptOptions): Promise<string> {
    return await this.text('input', options);
  }

  /**
   * Prompt for multiple values in sequence
   */
  static async sequence(prompts: Array<{
    name: string;
    type: 'text' | 'select' | 'multiSelect' | 'confirm' | 'password' | 'number' | 'editor';
    options: PromptOptions & any;
  }>): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const prompt of prompts) {
      switch (prompt.type) {
        case 'text':
          results[prompt.name] = await this.text(prompt.name, prompt.options);
          break;
        case 'select':
          results[prompt.name] = await this.select(prompt.name, prompt.options);
          break;
        case 'multiSelect':
          results[prompt.name] = await this.multiSelect(prompt.name, prompt.options);
          break;
        case 'confirm':
          results[prompt.name] = await this.confirm(prompt.name, prompt.options);
          break;
        case 'password':
          results[prompt.name] = await this.password(prompt.name, prompt.options);
          break;
        case 'number':
          results[prompt.name] = await this.number(prompt.name, prompt.options);
          break;
        case 'editor':
          results[prompt.name] = await this.editor(prompt.name, prompt.options);
          break;
        default:
          results[prompt.name] = await this.text(prompt.name, prompt.options);
      }
    }
    
    return results;
  }
}