import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GraphQLClient } from '../lib/graphql-client.js';
import { ConfigManager } from '../lib/config.js';

export class AuthCommand {
  private client: GraphQLClient;
  private config: ConfigManager;

  constructor() {
    this.client = new GraphQLClient();
    this.config = new ConfigManager();
  }

  getCommand(): Command {
    const authCmd = new Command('auth')
      .description('Authentication commands');

    authCmd
      .command('login')
      .description('Login to Memory Manager')
      .option('-e, --email <email>', 'email address')
      .option('-p, --password <password>', 'password')
      .option('-t, --token <token>', 'JWT token for direct authentication')
      .option('-i, --interactive', 'interactive login prompts')
      .option('--json', 'output in JSON format')
      .action(async (options) => {
        await this.login(options);
      });

    authCmd
      .command('logout')
      .description('Logout from Memory Manager')
      .option('--json', 'output in JSON format')
      .action(async (options) => {
        await this.logout(options);
      });

    authCmd
      .command('whoami')
      .description('Show current authenticated user')
      .option('--json', 'output in JSON format')
      .action(async (options) => {
        await this.whoami(options);
      });

    return authCmd;
  }

  private async login(options: { 
    email?: string; 
    password?: string; 
    token?: string; 
    interactive?: boolean; 
    json?: boolean 
  }): Promise<void> {
    // Handle direct token authentication
    if (options.token) {
      try {
        // Validate token by making a test query
        const testQuery = `query Me { me { id email name role } }`;
        const { GraphQLClient: GQLClient } = await import('graphql-request');
        const apiConfig = await this.config.getApiConfig();
        const tempClient = new GQLClient(apiConfig.graphqlUrl, {
          headers: { authorization: `Bearer ${options.token}` }
        });

        const data: any = await tempClient.request(testQuery);
        const result = { data };
        
        if (result.data?.me) {
          // Save token and user info
          await this.config.set('auth.accessToken', options.token);
          await this.config.set('auth.user', result.data.me);

          if (options.json) {
            console.log(JSON.stringify({
              success: true,
              user: result.data.me,
              message: 'Authentication successful'
            }, null, 2));
          } else {
            console.log(chalk.green(`✓ Successfully authenticated as ${result.data.me.name} (${result.data.me.email})`));
          }
          return;
        }
      } catch (error: any) {
        if (options.json) {
          console.log(JSON.stringify({
            success: false,
            error: 'Invalid token',
            message: error.message
          }, null, 2));
        } else {
          console.error(chalk.red('Invalid token:', error.message));
        }
        process.exit(1);
      }
    }

    let { email, password } = options;

    // Prompt for missing credentials
    if (!email || !password) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: 'Email:',
          when: () => !email,
          validate: (input) => input.includes('@') || 'Please enter a valid email',
        },
        {
          type: 'password',
          name: 'password',
          message: 'Password:',
          when: () => !password,
          mask: '*',
        },
      ]);

      email = email || answers.email;
      password = password || answers.password;
    }

    const spinner = options.json ? null : ora('Logging in...').start();

    try {
      const mutation = `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            user {
              id
              email
              name
              role
            }
            tokens {
              accessToken
              refreshToken
              expiresIn
            }
          }
        }
      `;

      const result = await this.client.request(mutation, {
        input: { email, password },
      });

      if (result.data?.login) {
        const { user, tokens } = result.data.login;
        
        // Save tokens to config
        await this.config.set('auth.accessToken', tokens.accessToken);
        await this.config.set('auth.refreshToken', tokens.refreshToken);
        await this.config.set('auth.user', user);

        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            user,
            tokens: {
              accessToken: tokens.accessToken,
              expiresIn: tokens.expiresIn
              // Note: refreshToken is not included in JSON output for security
            },
            message: 'Login successful'
          }, null, 2));
        } else {
          if (spinner) spinner.succeed(chalk.green(`Successfully logged in as ${user.name} (${user.email})`));
        }
      }
    } catch (error: any) {
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: 'Login failed',
          message: error.message || 'Unknown error'
        }, null, 2));
      } else {
        if (spinner) spinner.fail(chalk.red('Login failed'));
        console.error(chalk.red(error.message || 'Unknown error'));
      }
      process.exit(1);
    }
  }

  private async logout(options: { json?: boolean } = {}): Promise<void> {
    const spinner = options.json ? null : ora('Logging out...').start();

    try {
      // Clear auth data from config
      await this.config.delete('auth.accessToken');
      await this.config.delete('auth.refreshToken');
      await this.config.delete('auth.user');

      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          message: 'Successfully logged out'
        }, null, 2));
      } else {
        if (spinner) spinner.succeed(chalk.green('Successfully logged out'));
      }
    } catch (error: any) {
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: 'Logout failed',
          message: error.message || 'Unknown error'
        }, null, 2));
      } else {
        if (spinner) spinner.fail(chalk.red('Logout failed'));
        console.error(chalk.red(error.message || 'Unknown error'));
      }
    }
  }

  private async whoami(options: { json?: boolean }): Promise<void> {
    try {
      const user = await this.config.get('auth.user');
      const accessToken = await this.config.get('auth.accessToken');

      if (user && accessToken) {
        const result: any = {
          authenticated: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          tokenValid: false
        };

        // Check if token is valid by making a test query
        const spinner = options.json ? null : ora('Checking token validity...').start();
        try {
          const query = `
            query Me {
              me {
                id
                email
                name
              }
            }
          `;
          
          const response = await this.client.request(query);
          result.tokenValid = true;
          
          if (spinner) {
            spinner.succeed(chalk.green('Token is valid'));
          }

          // Update user info from current token if available
          if (response.data?.me) {
            result.user = { ...result.user, ...response.data.me };
          }
        } catch {
          result.tokenValid = false;
          if (spinner) {
            spinner.warn(chalk.yellow('Token may be expired'));
          }
        }

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(chalk.green('✓ Logged in'));
          console.log(`User: ${result.user.name} (${result.user.email})`);
          console.log(`Role: ${result.user.role}`);
          console.log(`ID: ${result.user.id}`);
        }
      } else {
        const result = {
          authenticated: false,
          user: null,
          tokenValid: false
        };

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(chalk.red('✗ Not logged in'));
          console.log(chalk.gray('Run "memory auth login" to authenticate'));
        }
      }
    } catch (error: any) {
      if (options.json) {
        console.log(JSON.stringify({ error: error.message }, null, 2));
      } else {
        console.error(chalk.red('Error checking auth status:', error.message));
      }
    }
  }
}