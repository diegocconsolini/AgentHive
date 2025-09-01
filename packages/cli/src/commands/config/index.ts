import { Command } from 'commander';
import { ConfigManager } from '../../lib/config.js';
import { OutputFormatter, InteractivePrompts } from '../../utils/output.js';
import { ErrorHandler } from '../../utils/errors.js';
import { handleErrors, withErrorHandling } from '../../utils/decorators.js';
import { Validator } from '../../utils/validation.js';
import { 
  ConfigGetOptions,
  ConfigSetOptions,
  ConfigListOptions,
  ConfigValidateOptions,
  ConfigExportOptions,
  ConfigImportOptions,
  Environment,
  OutputFormat
} from '../../types/commands.js';
import * as fs from 'fs';
import * as path from 'path';

export class EnhancedConfigCommand {
  private config: ConfigManager;

  constructor() {
    this.config = new ConfigManager();
  }

  getCommand(): Command {
    const configCmd = new Command('config')
      .description('Enhanced configuration and environment management')
      .addHelpText('after', `
Examples:
  $ memory config get api.url              # Get configuration value
  $ memory config set api.timeout 30      # Set configuration value
  $ memory config list --format=table     # List all configuration
  $ memory config validate --strict       # Validate configuration
  $ memory config export --format=yaml    # Export configuration
`);

    // Get command
    configCmd
      .command('get')
      .argument('<key>', 'configuration key')
      .description('Get configuration value')
      .option('--environment <env>', 'environment context')
      .option('--decrypt', 'decrypt encrypted values')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.getConfig.bind(this)));

    // Set command
    configCmd
      .command('set')
      .argument('<key>', 'configuration key')
      .argument('<value>', 'configuration value')
      .description('Set configuration value')
      .option('--environment <env>', 'environment context')
      .option('--encrypt', 'encrypt sensitive values')
      .option('--type <type>', 'value type (string, number, boolean, json)', 'string')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.setConfig.bind(this)));

    // List command
    configCmd
      .command('list')
      .alias('ls')
      .description('List all configuration values')
      .option('--environment <env>', 'environment context')
      .option('--format <format>', 'output format (json, table, tree)', 'table')
      .option('--include-secrets', 'include encrypted values (masked)')
      .option('--filter <pattern>', 'filter keys by pattern')
      .action(withErrorHandling(this.listConfig.bind(this)));

    // Delete/unset command
    configCmd
      .command('delete')
      .alias('unset')
      .argument('<key>', 'configuration key')
      .description('Delete configuration value')
      .option('--environment <env>', 'environment context')
      .option('--force', 'force deletion without confirmation')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.deleteConfig.bind(this)));

    // Validate command
    configCmd
      .command('validate')
      .description('Validate configuration')
      .option('--environment <env>', 'environment to validate')
      .option('--strict', 'strict validation mode')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.validateConfig.bind(this)));

    // Export command
    configCmd
      .command('export')
      .description('Export configuration')
      .option('--environment <env>', 'environment to export')
      .option('--output <file>', 'output file (default: stdout)')
      .option('--format <format>', 'export format (json, yaml, env)', 'json')
      .option('--include-secrets', 'include encrypted values')
      .action(withErrorHandling(this.exportConfig.bind(this)));

    // Import command
    configCmd
      .command('import')
      .argument('<file>', 'configuration file to import')
      .description('Import configuration')
      .option('--environment <env>', 'target environment')
      .option('--merge', 'merge with existing configuration')
      .option('--overwrite', 'overwrite existing values')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.importConfig.bind(this)));

    // Reset command
    configCmd
      .command('reset')
      .description('Reset configuration to defaults')
      .option('--environment <env>', 'environment to reset')
      .option('--force', 'force reset without confirmation')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.resetConfig.bind(this)));

    // Edit command
    configCmd
      .command('edit')
      .argument('[key]', 'configuration key to edit')
      .description('Edit configuration interactively')
      .option('--environment <env>', 'environment context')
      .option('--editor <editor>', 'editor to use')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.editConfig.bind(this)));

    // Path command
    configCmd
      .command('path')
      .description('Show configuration file path')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.configPath.bind(this)));

    return configCmd;
  }

  @handleErrors
  private async getConfig(key: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      const value = await this.config.get(key);
      
      if (value === undefined) {
        OutputFormatter.error(`Configuration key not found: ${key}`, undefined, format);
        return;
      }

      const result = {
        success: true,
        data: { key, value, type: typeof value },
        message: 'Configuration retrieved successfully'
      };

      OutputFormatter.result(result, format);
    } catch (error: any) {
      OutputFormatter.error(`Failed to get configuration: ${error.message}`, error, format);
    }
  }

  @handleErrors
  private async setConfig(key: string, value: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      // Validate key format
      Validator.string(key, 'key', { 
        pattern: /^[a-zA-Z0-9._-]+$/ 
      });

      // Parse value based on type
      let parsedValue: any = value;
      
      switch (options.type) {
        case 'number':
          parsedValue = Number(value);
          if (isNaN(parsedValue)) {
            OutputFormatter.error('Invalid number value', undefined, format);
            return;
          }
          break;
        case 'boolean':
          parsedValue = value.toLowerCase() === 'true';
          break;
        case 'json':
          try {
            parsedValue = JSON.parse(value);
          } catch {
            OutputFormatter.error('Invalid JSON value', undefined, format);
            return;
          }
          break;
        default:
          parsedValue = value;
      }

      await this.config.set(key, parsedValue);

      const result = {
        success: true,
        data: { key, value: parsedValue, type: options.type },
        message: 'Configuration updated successfully'
      };

      OutputFormatter.result(result, format);
    } catch (error: any) {
      OutputFormatter.error(`Failed to set configuration: ${error.message}`, error, format);
    }
  }

  @handleErrors
  private async listConfig(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      const allConfig = await this.config.getAll();
      let configEntries = Object.entries(allConfig);

      // Apply filter if specified
      if (options.filter) {
        const pattern = new RegExp(options.filter, 'i');
        configEntries = configEntries.filter(([key]) => pattern.test(key));
      }

      // Format for display
      const configList = configEntries.map(([key, value]) => ({
        key,
        value: this.formatConfigValue(value, options.includeSecrets),
        type: typeof value
      }));

      if (format === 'table' || format === 'tree') {
        const output = OutputFormatter.formatList(configList, {
          format: format as OutputFormat,
          title: 'Configuration',
          columns: ['key', 'value', 'type']
        });
        console.log(output);
      } else {
        OutputFormatter.success('Configuration retrieved', configList, format);
      }
    } catch (error: any) {
      OutputFormatter.error(`Failed to list configuration: ${error.message}`, error, format);
    }
  }

  private formatConfigValue(value: any, includeSecrets = false): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    // Mask sensitive values unless specifically requested
    const sensitiveKeys = ['password', 'secret', 'key', 'token'];
    const stringValue = String(value);
    
    if (!includeSecrets && sensitiveKeys.some(key => 
      stringValue.toLowerCase().includes(key)
    )) {
      return '***masked***';
    }
    
    return stringValue;
  }

  @handleErrors
  private async deleteConfig(key: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      const exists = await this.config.has(key);
      if (!exists) {
        OutputFormatter.error(`Configuration key not found: ${key}`, undefined, format);
        return;
      }

      if (!options.force) {
        const confirmed = await InteractivePrompts.confirm(
          `Are you sure you want to delete configuration key "${key}"?`
        );
        if (!confirmed) {
          OutputFormatter.info('Cancelled', format);
          return;
        }
      }

      await this.config.delete(key);

      OutputFormatter.success(
        `Configuration key "${key}" deleted successfully`,
        undefined,
        format
      );
    } catch (error: any) {
      OutputFormatter.error(`Failed to delete configuration: ${error.message}`, error, format);
    }
  }

  @handleErrors
  private async validateConfig(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      const allConfig = await this.config.getAll();
      const issues = [];

      // Required configuration checks
      const required = [
        { key: 'api.url', description: 'API base URL' },
        { key: 'api.graphqlUrl', description: 'GraphQL API URL' }
      ];

      for (const req of required) {
        const value = await this.config.get(req.key);
        if (!value) {
          issues.push({
            level: 'error',
            key: req.key,
            message: `Required configuration missing: ${req.description}`,
            suggestion: `Run: memory config set ${req.key} <value>`
          });
        } else if (req.key.includes('url') || req.key.includes('Url')) {
          try {
            new URL(value as string);
          } catch {
            issues.push({
              level: 'error',
              key: req.key,
              message: `Invalid URL format: ${value}`,
              suggestion: 'Provide a valid URL with protocol (http:// or https://)'
            });
          }
        }
      }

      // Deprecated configuration warnings
      const deprecated = [
        { key: 'api.oldEndpoint', replacement: 'api.url' }
      ];

      for (const dep of deprecated) {
        const value = await this.config.get(dep.key);
        if (value) {
          issues.push({
            level: 'warning',
            key: dep.key,
            message: `Configuration key is deprecated`,
            suggestion: `Use ${dep.replacement} instead`
          });
        }
      }

      const summary = {
        errors: issues.filter(i => i.level === 'error').length,
        warnings: issues.filter(i => i.level === 'warning').length,
        total: issues.length
      };

      const result = {
        success: summary.errors === 0,
        data: { issues, summary },
        message: summary.errors === 0 ? 
          'Configuration validation passed' : 
          'Configuration validation failed'
      };

      OutputFormatter.result(result, format);
    } catch (error: any) {
      OutputFormatter.error(`Failed to validate configuration: ${error.message}`, error, format);
    }
  }

  @handleErrors
  private async exportConfig(options: any): Promise<void> {
    const exportFormat = options.format || 'json';

    try {
      const allConfig = await this.config.getAll();
      let output: string;

      switch (exportFormat) {
        case 'yaml':
        case 'yml':
          const yaml = require('js-yaml');
          output = yaml.dump(allConfig, { indent: 2 });
          break;
        case 'env':
          output = Object.entries(allConfig)
            .map(([key, value]) => `${key.toUpperCase().replace(/\./g, '_')}=${value}`)
            .join('\n');
          break;
        default:
          output = JSON.stringify(allConfig, null, 2);
      }

      if (options.output) {
        fs.writeFileSync(options.output, output);
        OutputFormatter.success(`Configuration exported to ${options.output}`, undefined, 'json');
      } else {
        console.log(output);
      }
    } catch (error: any) {
      OutputFormatter.error(`Failed to export configuration: ${error.message}`, error, 'json');
    }
  }

  @handleErrors
  private async importConfig(file: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      if (!fs.existsSync(file)) {
        OutputFormatter.error(`Configuration file not found: ${file}`, undefined, format);
        return;
      }

      const content = fs.readFileSync(file, 'utf8');
      const ext = path.extname(file).toLowerCase();
      
      let config: any;
      
      switch (ext) {
        case '.yaml':
        case '.yml':
          const yaml = require('js-yaml');
          config = yaml.load(content);
          break;
        case '.env':
          config = {};
          content.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              const normalizedKey = key.toLowerCase().replace(/_/g, '.');
              config[normalizedKey] = valueParts.join('=');
            }
          });
          break;
        default:
          config = JSON.parse(content);
      }

      if (!options.merge && !options.overwrite) {
        const action = await InteractivePrompts.select(
          'Import strategy:',
          [
            { name: 'Merge with existing', value: 'merge' },
            { name: 'Overwrite existing', value: 'overwrite' }
          ]
        );
        options[action] = true;
      }

      let imported = 0;
      let skipped = 0;

      for (const [key, value] of Object.entries(config)) {
        const exists = await this.config.has(key);
        
        if (exists && !options.overwrite && !options.merge) {
          skipped++;
          continue;
        }

        await this.config.set(key, value);
        imported++;
      }

      OutputFormatter.success(
        'Configuration imported successfully',
        { imported, skipped, strategy: options.merge ? 'merge' : 'overwrite' },
        format
      );
    } catch (error: any) {
      OutputFormatter.error(`Failed to import configuration: ${error.message}`, error, format);
    }
  }

  @handleErrors
  private async resetConfig(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    if (!options.force) {
      const confirmed = await InteractivePrompts.confirm(
        'This will reset all configuration to defaults. Continue?'
      );
      if (!confirmed) {
        OutputFormatter.info('Cancelled', format);
        return;
      }
    }

    try {
      await this.config.clear();

      OutputFormatter.success(
        'Configuration reset to defaults',
        undefined,
        format
      );
    } catch (error: any) {
      OutputFormatter.error(`Failed to reset configuration: ${error.message}`, error, format);
    }
  }

  @handleErrors
  private async editConfig(key: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      if (key) {
        // Edit specific key
        const currentValue = await this.config.get(key);
        const newValue = await InteractivePrompts.editor(
          `Edit configuration for "${key}":`,
          typeof currentValue === 'object' ? 
            JSON.stringify(currentValue, null, 2) : 
            String(currentValue || '')
        );

        // Try to parse as JSON if it looks like JSON
        let parsedValue = newValue;
        if (newValue.trim().startsWith('{') || newValue.trim().startsWith('[')) {
          try {
            parsedValue = JSON.parse(newValue);
          } catch {
            // Keep as string if not valid JSON
          }
        }

        await this.config.set(key, parsedValue);
        OutputFormatter.success(`Configuration "${key}" updated`, undefined, format);
      } else {
        // Edit entire configuration
        const allConfig = await this.config.getAll();
        const configJson = JSON.stringify(allConfig, null, 2);
        
        const newConfigJson = await InteractivePrompts.editor(
          'Edit configuration:',
          configJson
        );

        const newConfig = JSON.parse(newConfigJson);
        
        // Clear and set new configuration
        await this.config.clear();
        for (const [k, v] of Object.entries(newConfig)) {
          await this.config.set(k, v);
        }

        OutputFormatter.success('Configuration updated', undefined, format);
      }
    } catch (error: any) {
      OutputFormatter.error(`Failed to edit configuration: ${error.message}`, error, format);
    }
  }

  @handleErrors
  private async configPath(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      const configPath = this.config.getPath();

      OutputFormatter.success(
        'Configuration file path',
        { path: configPath },
        format
      );
    } catch (error: any) {
      OutputFormatter.error(`Failed to get config path: ${error.message}`, error, format);
    }
  }
}

// Environment management commands
export class EnvironmentCommand {
  private config: ConfigManager;

  constructor() {
    this.config = new ConfigManager();
  }

  getCommand(): Command {
    const envCmd = new Command('env')
      .description('Environment management commands')
      .addHelpText('after', `
Examples:
  $ memory env create development        # Create development environment
  $ memory env list                     # List all environments
  $ memory env switch staging          # Switch to staging environment
  $ memory env delete test --force     # Delete test environment
`);

    // Create command
    envCmd
      .command('create')
      .argument('<name>', 'environment name')
      .description('Create a new environment')
      .option('--from-template <template>', 'create from template')
      .option('--copy-from <env>', 'copy from existing environment')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.createEnvironment.bind(this)));

    // List command
    envCmd
      .command('list')
      .alias('ls')
      .description('List all environments')
      .option('--status <status>', 'filter by status (active, inactive)')
      .option('--format <format>', 'output format', 'table')
      .action(withErrorHandling(this.listEnvironments.bind(this)));

    // Switch command
    envCmd
      .command('switch')
      .argument('<name>', 'environment name')
      .description('Switch to an environment')
      .option('--force', 'force switch without validation')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.switchEnvironment.bind(this)));

    // Show command
    envCmd
      .command('show')
      .argument('[name]', 'environment name (current if omitted)')
      .description('Show environment details')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.showEnvironment.bind(this)));

    // Delete command
    envCmd
      .command('delete')
      .alias('rm')
      .argument('<name>', 'environment name')
      .description('Delete an environment')
      .option('--force', 'force deletion without confirmation')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.deleteEnvironment.bind(this)));

    return envCmd;
  }

  @handleErrors
  private async createEnvironment(name: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      // Validate environment name
      Validator.string(name, 'environment name', {
        pattern: /^[a-zA-Z0-9_-]+$/
      });

      // Check if environment already exists
      const environments = await this.getEnvironments();
      if (environments.some(env => env.name === name)) {
        OutputFormatter.error(`Environment "${name}" already exists`, undefined, format);
        return;
      }

      let config = {};

      if (options.copyFrom) {
        const sourceEnv = environments.find(env => env.name === options.copyFrom);
        if (!sourceEnv) {
          OutputFormatter.error(`Source environment "${options.copyFrom}" not found`, undefined, format);
          return;
        }
        config = { ...sourceEnv.config };
      } else if (options.fromTemplate) {
        config = this.getEnvironmentTemplate(options.fromTemplate);
      }

      const newEnvironment: Environment = {
        name,
        active: false,
        config,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      // Save environment
      await this.saveEnvironment(newEnvironment);

      OutputFormatter.success(
        `Environment "${name}" created successfully`,
        newEnvironment,
        format
      );
    } catch (error: any) {
      OutputFormatter.error(`Failed to create environment: ${error.message}`, error, format);
    }
  }

  @handleErrors
  private async listEnvironments(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      let environments = await this.getEnvironments();

      // Apply status filter
      if (options.status) {
        const isActive = options.status === 'active';
        environments = environments.filter(env => env.active === isActive);
      }

      if (format === 'table') {
        const output = OutputFormatter.formatList(environments, {
          format: 'table',
          title: 'Environments',
          columns: ['name', 'active', 'lastUsed', 'createdAt']
        });
        console.log(output);
      } else {
        OutputFormatter.success('Environments retrieved', environments, format);
      }
    } catch (error: any) {
      OutputFormatter.error(`Failed to list environments: ${error.message}`, error, format);
    }
  }

  @handleErrors
  private async switchEnvironment(name: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      const environments = await this.getEnvironments();
      const targetEnv = environments.find(env => env.name === name);

      if (!targetEnv) {
        OutputFormatter.error(`Environment "${name}" not found`, undefined, format);
        return;
      }

      // Deactivate current environment
      for (const env of environments) {
        env.active = false;
      }

      // Activate target environment
      targetEnv.active = true;
      targetEnv.lastUsed = new Date().toISOString();

      // Save all environments
      for (const env of environments) {
        await this.saveEnvironment(env);
      }

      OutputFormatter.success(
        `Switched to environment "${name}"`,
        targetEnv,
        format
      );
    } catch (error: any) {
      OutputFormatter.error(`Failed to switch environment: ${error.message}`, error, format);
    }
  }

  @handleErrors
  private async showEnvironment(name: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      const environments = await this.getEnvironments();
      const environment = name ? 
        environments.find(env => env.name === name) :
        environments.find(env => env.active);

      if (!environment) {
        const message = name ? 
          `Environment "${name}" not found` : 
          'No active environment';
        OutputFormatter.error(message, undefined, format);
        return;
      }

      OutputFormatter.success('Environment details', environment, format);
    } catch (error: any) {
      OutputFormatter.error(`Failed to show environment: ${error.message}`, error, format);
    }
  }

  @handleErrors
  private async deleteEnvironment(name: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    try {
      const environments = await this.getEnvironments();
      const targetEnv = environments.find(env => env.name === name);

      if (!targetEnv) {
        OutputFormatter.error(`Environment "${name}" not found`, undefined, format);
        return;
      }

      if (targetEnv.active) {
        OutputFormatter.error('Cannot delete active environment', undefined, format);
        return;
      }

      if (!options.force) {
        const confirmed = await InteractivePrompts.confirm(
          `Are you sure you want to delete environment "${name}"?`
        );
        if (!confirmed) {
          OutputFormatter.info('Cancelled', format);
          return;
        }
      }

      // Delete environment
      await this.deleteEnvironmentData(name);

      OutputFormatter.success(
        `Environment "${name}" deleted successfully`,
        undefined,
        format
      );
    } catch (error: any) {
      OutputFormatter.error(`Failed to delete environment: ${error.message}`, error, format);
    }
  }

  private async getEnvironments(): Promise<Environment[]> {
    // In a real implementation, this would load from a persistent store
    const defaultEnv: Environment = {
      name: 'default',
      active: true,
      config: await this.config.getAll(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    return [defaultEnv];
  }

  private async saveEnvironment(environment: Environment): Promise<void> {
    // In a real implementation, this would save to a persistent store
    if (environment.active) {
      // Apply environment configuration
      for (const [key, value] of Object.entries(environment.config)) {
        await this.config.set(key, value);
      }
    }
  }

  private async deleteEnvironmentData(name: string): Promise<void> {
    // In a real implementation, this would delete from a persistent store
  }

  private getEnvironmentTemplate(template: string): Record<string, any> {
    const templates = {
      development: {
        'api.url': 'http://localhost:4000',
        'api.graphqlUrl': 'http://localhost:4000/graphql',
        'debug': true,
        'logLevel': 'debug'
      },
      staging: {
        'api.url': 'https://staging-api.example.com',
        'api.graphqlUrl': 'https://staging-api.example.com/graphql',
        'debug': false,
        'logLevel': 'info'
      },
      production: {
        'api.url': 'https://api.example.com',
        'api.graphqlUrl': 'https://api.example.com/graphql',
        'debug': false,
        'logLevel': 'warn'
      }
    };

    return templates[template as keyof typeof templates] || {};
  }
}