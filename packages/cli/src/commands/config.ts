import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../lib/config.js';

export class ConfigCommand {
  private config: ConfigManager;

  constructor() {
    this.config = new ConfigManager();
  }

  getCommand(): Command {
    const configCmd = new Command('config')
      .description('Configuration management');

    configCmd
      .command('get [key]')
      .description('Get configuration value(s)')
      .action(async (key) => {
        await this.get(key);
      });

    configCmd
      .command('set <key> <value>')
      .description('Set configuration value')
      .action(async (key, value) => {
        await this.set(key, value);
      });

    configCmd
      .command('delete <key>')
      .alias('del')
      .description('Delete configuration value')
      .action(async (key) => {
        await this.delete(key);
      });

    configCmd
      .command('list')
      .alias('ls')
      .description('List all configuration')
      .action(async () => {
        await this.list();
      });

    configCmd
      .command('reset')
      .description('Reset all configuration')
      .option('-f, --force', 'skip confirmation')
      .action(async (options) => {
        await this.reset(options);
      });

    return configCmd;
  }

  private async get(key?: string): Promise<void> {
    try {
      if (key) {
        const value = await this.config.get(key);
        if (value !== undefined) {
          console.log(chalk.green(`${key}:`), value);
        } else {
          console.log(chalk.yellow(`Configuration key "${key}" not found`));
        }
      } else {
        await this.list();
      }
    } catch (error: any) {
      console.error(chalk.red('Error getting configuration:', error.message));
    }
  }

  private async set(key: string, value: string): Promise<void> {
    try {
      // Try to parse as JSON for complex values
      let parsedValue: any = value;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // Keep as string if not valid JSON
      }

      await this.config.set(key, parsedValue);
      console.log(chalk.green(`✓ Set ${key} = ${JSON.stringify(parsedValue)}`));
    } catch (error: any) {
      console.error(chalk.red('Error setting configuration:', error.message));
    }
  }

  private async delete(key: string): Promise<void> {
    try {
      const existed = await this.config.has(key);
      await this.config.delete(key);
      
      if (existed) {
        console.log(chalk.green(`✓ Deleted ${key}`));
      } else {
        console.log(chalk.yellow(`Configuration key "${key}" not found`));
      }
    } catch (error: any) {
      console.error(chalk.red('Error deleting configuration:', error.message));
    }
  }

  private async list(): Promise<void> {
    try {
      const config = await this.config.getAll();
      
      if (Object.keys(config).length === 0) {
        console.log(chalk.yellow('No configuration found'));
        return;
      }

      console.log(chalk.blue('Current configuration:'));
      this.printObject(config);
    } catch (error: any) {
      console.error(chalk.red('Error listing configuration:', error.message));
    }
  }

  private async reset(options: { force?: boolean }): Promise<void> {
    if (!options.force) {
      const inquirer = (await import('inquirer')).default;
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'This will delete all configuration. Are you sure?',
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Cancelled'));
        return;
      }
    }

    try {
      await this.config.clear();
      console.log(chalk.green('✓ Configuration reset'));
    } catch (error: any) {
      console.error(chalk.red('Error resetting configuration:', error.message));
    }
  }

  private printObject(obj: any, indent = 0): void {
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        console.log(chalk.cyan(`${spaces}${key}:`));
        this.printObject(value, indent + 1);
      } else {
        console.log(chalk.green(`${spaces}${key}:`), JSON.stringify(value, null, 2));
      }
    }
  }
}