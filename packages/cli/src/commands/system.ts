import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GraphQLClient } from '../lib/graphql-client.js';
import { ConfigManager } from '../lib/config.js';

export class SystemCommand {
  private client: GraphQLClient;
  private config: ConfigManager;

  constructor() {
    this.client = new GraphQLClient();
    this.config = new ConfigManager();
  }

  getCommand(): Command {
    const systemCmd = new Command('system')
      .description('System utilities and diagnostics');

    systemCmd
      .command('status')
      .description('Check system connectivity and API status')
      .option('--json', 'output in JSON format')
      .action(async (options) => {
        await this.status(options);
      });

    systemCmd
      .command('version')
      .description('Show detailed version information')
      .option('--json', 'output in JSON format')
      .action(async (options) => {
        await this.version(options);
      });

    systemCmd
      .command('doctor')
      .description('Run system diagnostics and health checks')
      .option('--json', 'output in JSON format')
      .action(async (options) => {
        await this.doctor(options);
      });

    return systemCmd;
  }

  private async status(options: { json?: boolean }): Promise<void> {
    const results: any = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      api: {
        reachable: false,
        url: null,
        responseTime: null,
        error: null
      },
      authentication: {
        authenticated: false,
        user: null,
        tokenValid: false
      }
    };

    if (!options.json) {
      console.log(chalk.blue('🔍 Checking system status...\n'));
    }

    // Check API connectivity
    const apiSpinner = options.json ? null : ora('Checking API connectivity...').start();
    try {
      const apiConfig = await this.config.getApiConfig();
      results.api.url = apiConfig.graphqlUrl;

      const start = Date.now();
      const healthQuery = `
        query Health {
          __schema {
            queryType {
              name
            }
          }
        }
      `;

      await this.client.request(healthQuery);
      results.api.reachable = true;
      results.api.responseTime = Date.now() - start;
      
      if (apiSpinner) {
        apiSpinner.succeed(chalk.green(`API is reachable (${results.api.responseTime}ms)`));
      }
    } catch (error: any) {
      results.api.error = error.message;
      if (apiSpinner) {
        apiSpinner.fail(chalk.red('API is not reachable'));
        console.log(chalk.gray(`   Error: ${error.message}`));
      }
    }

    // Check authentication status
    const authSpinner = options.json ? null : ora('Checking authentication...').start();
    try {
      const isAuth = await this.config.isAuthenticated();
      results.authentication.authenticated = isAuth;

      if (isAuth) {
        const user = await this.config.getUser();
        results.authentication.user = user;

        // Test token validity
        try {
          const meQuery = `
            query Me {
              me {
                id
                email
                name
              }
            }
          `;
          
          await this.client.request(meQuery);
          results.authentication.tokenValid = true;
          
          if (authSpinner) {
            authSpinner.succeed(chalk.green(`Authenticated as ${user.name} (${user.email})`));
          }
        } catch {
          results.authentication.tokenValid = false;
          if (authSpinner) {
            authSpinner.warn(chalk.yellow('Token may be expired'));
          }
        }
      } else {
        if (authSpinner) {
          authSpinner.info(chalk.gray('Not authenticated'));
        }
      }
    } catch (error: any) {
      if (authSpinner) {
        authSpinner.fail(chalk.red('Authentication check failed'));
        console.log(chalk.gray(`   Error: ${error.message}`));
      }
    }

    // Determine overall status
    if (results.api.reachable && results.authentication.authenticated && results.authentication.tokenValid) {
      results.status = 'healthy';
    } else if (results.api.reachable) {
      results.status = 'partial';
    } else {
      results.status = 'unhealthy';
    }

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log();
      const statusColor = results.status === 'healthy' ? chalk.green : 
                         results.status === 'partial' ? chalk.yellow : chalk.red;
      console.log(`Overall Status: ${statusColor(results.status.toUpperCase())}`);
    }
  }

  private async version(options: { json?: boolean }): Promise<void> {
    const { readFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    const apiConfig = await this.config.getApiConfig();
    
    const versionInfo = {
      cli: {
        version: packageJson.version,
        name: packageJson.name
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      configuration: {
        apiUrl: apiConfig.graphqlUrl,
        configPath: this.config.getPath()
      }
    };

    if (options.json) {
      console.log(JSON.stringify(versionInfo, null, 2));
    } else {
      console.log(chalk.blue('📦 Version Information\n'));
      console.log(chalk.green('CLI:'));
      console.log(`  Name: ${versionInfo.cli.name}`);
      console.log(`  Version: ${versionInfo.cli.version}`);
      console.log();
      console.log(chalk.green('Runtime:'));
      console.log(`  Node.js: ${versionInfo.node.version}`);
      console.log(`  Platform: ${versionInfo.node.platform} (${versionInfo.node.arch})`);
      console.log();
      console.log(chalk.green('Configuration:'));
      console.log(`  API URL: ${versionInfo.configuration.apiUrl}`);
      console.log(`  Config Path: ${versionInfo.configuration.configPath}`);
    }
  }

  private async doctor(options: { json?: boolean }): Promise<void> {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };

    if (!options.json) {
      console.log(chalk.blue('🏥 Running system diagnostics...\n'));
    }

    // Check 1: Configuration file exists and is readable
    await this.runCheck(
      'Configuration file accessibility',
      async () => {
        const configPath = this.config.getPath();
        const config = await this.config.getAll();
        return {
          success: true,
          message: `Configuration loaded from ${configPath}`,
          details: { configPath, keys: Object.keys(config).length }
        };
      },
      diagnostics,
      options.json || false
    );

    // Check 2: API URL configuration
    await this.runCheck(
      'API URL configuration',
      async () => {
        const apiConfig = await this.config.getApiConfig();
        if (!apiConfig.graphqlUrl) {
          throw new Error('GraphQL URL not configured');
        }
        return {
          success: true,
          message: `API URL configured: ${apiConfig.graphqlUrl}`,
          details: apiConfig
        };
      },
      diagnostics,
      options.json || false
    );

    // Check 3: API connectivity
    await this.runCheck(
      'API connectivity',
      async () => {
        const healthQuery = `query Health { __schema { queryType { name } } }`;
        const start = Date.now();
        await this.client.request(healthQuery);
        const responseTime = Date.now() - start;
        return {
          success: true,
          message: `API reachable in ${responseTime}ms`,
          details: { responseTime }
        };
      },
      diagnostics,
      options.json || false
    );

    // Check 4: Authentication configuration
    await this.runCheck(
      'Authentication configuration',
      async () => {
        const isAuth = await this.config.isAuthenticated();
        if (isAuth) {
          const user = await this.config.getUser();
          return {
            success: true,
            message: `Authenticated as ${user.name}`,
            details: { user: { name: user.name, email: user.email, role: user.role } }
          };
        } else {
          return {
            success: false,
            warning: true,
            message: 'Not authenticated (use "memory auth login")',
            details: null
          };
        }
      },
      diagnostics,
      options.json || false
    );

    // Check 5: Token validity (if authenticated)
    const isAuth = await this.config.isAuthenticated();
    if (isAuth) {
      await this.runCheck(
        'Token validity',
        async () => {
          const meQuery = `query Me { me { id email } }`;
          await this.client.request(meQuery);
          return {
            success: true,
            message: 'Authentication token is valid',
            details: null
          };
        },
        diagnostics,
        options.json || false
      );
    }

    // Check 6: Node.js version compatibility
    await this.runCheck(
      'Node.js version compatibility',
      async () => {
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (majorVersion < 18) {
          throw new Error(`Node.js ${nodeVersion} is not supported. Minimum required: Node.js 18.0.0`);
        }
        return {
          success: true,
          message: `Node.js ${nodeVersion} is supported`,
          details: { version: nodeVersion, major: majorVersion }
        };
      },
      diagnostics,
      options.json || false
    );

    if (options.json) {
      console.log(JSON.stringify(diagnostics, null, 2));
    } else {
      console.log();
      console.log(chalk.blue('📊 Diagnostic Summary:'));
      console.log(`  Total checks: ${diagnostics.summary.total}`);
      console.log(chalk.green(`  ✓ Passed: ${diagnostics.summary.passed}`));
      console.log(chalk.red(`  ✗ Failed: ${diagnostics.summary.failed}`));
      console.log(chalk.yellow(`  ⚠ Warnings: ${diagnostics.summary.warnings}`));
      console.log();

      const overallHealth = diagnostics.summary.failed === 0 ? 
        (diagnostics.summary.warnings === 0 ? 'HEALTHY' : 'HEALTHY (with warnings)') : 
        'ISSUES DETECTED';
      
      const healthColor = diagnostics.summary.failed === 0 ? 
        (diagnostics.summary.warnings === 0 ? chalk.green : chalk.yellow) : 
        chalk.red;
      
      console.log(`Overall Health: ${healthColor(overallHealth)}`);

      if (diagnostics.summary.failed > 0 || diagnostics.summary.warnings > 0) {
        console.log();
        console.log(chalk.gray('Run with --json for detailed diagnostic information'));
      }
    }
  }

  private async runCheck(
    name: string,
    checkFn: () => Promise<any>,
    diagnostics: any,
    isJsonMode: boolean
  ): Promise<void> {
    const check: any = {
      name,
      success: false,
      warning: false,
      message: '',
      details: null,
      error: null
    };

    const spinner = isJsonMode ? null : ora(name).start();

    try {
      const result = await checkFn();
      check.success = result.success;
      check.warning = result.warning || false;
      check.message = result.message;
      check.details = result.details;

      if (spinner) {
        if (result.warning) {
          spinner.warn(chalk.yellow(`⚠ ${result.message}`));
        } else {
          spinner.succeed(chalk.green(`✓ ${result.message}`));
        }
      }

      if (result.warning) {
        diagnostics.summary.warnings++;
      } else {
        diagnostics.summary.passed++;
      }
    } catch (error: any) {
      check.success = false;
      check.message = error.message || 'Unknown error';
      check.error = error.message;

      if (spinner) {
        spinner.fail(chalk.red(`✗ ${error.message}`));
      }

      diagnostics.summary.failed++;
    }

    diagnostics.checks.push(check);
    diagnostics.summary.total++;
  }
}