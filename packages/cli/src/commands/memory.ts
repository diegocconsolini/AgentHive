import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GraphQLClient } from '../lib/graphql-client.js';
import { DateUtils } from '@memory-manager/shared';

export class MemoryCommand {
  private client: GraphQLClient;

  constructor() {
    this.client = new GraphQLClient();
  }

  getCommand(): Command {
    const memoryCmd = new Command('memory')
      .alias('mem')
      .description('Memory management commands');

    memoryCmd
      .command('list')
      .alias('ls')
      .description('List memories')
      .option('-l, --limit <number>', 'limit number of results', '10')
      .option('-s, --search <query>', 'search memories')
      .option('-t, --tags <tags>', 'filter by tags (comma-separated)')
      .option('--json', 'output in JSON format')
      .action(async (options) => {
        await this.list(options);
      });

    memoryCmd
      .command('create')
      .alias('new')
      .description('Create a new memory')
      .option('-t, --title <title>', 'memory title')
      .option('-c, --content <content>', 'memory content')
      .option('--tags <tags>', 'tags (comma-separated)')
      .option('--json', 'output in JSON format')
      .action(async (options) => {
        await this.create(options);
      });

    memoryCmd
      .command('show <id>')
      .description('Show a specific memory')
      .option('--json', 'output in JSON format')
      .action(async (id, options) => {
        await this.show(id, options);
      });

    memoryCmd
      .command('update <id>')
      .description('Update a memory')
      .option('-t, --title <title>', 'new title')
      .option('-c, --content <content>', 'new content')
      .option('--tags <tags>', 'new tags (comma-separated)')
      .option('--json', 'output in JSON format')
      .action(async (id, options) => {
        await this.update(id, options);
      });

    memoryCmd
      .command('delete <id>')
      .alias('rm')
      .description('Delete a memory')
      .option('-f, --force', 'skip confirmation')
      .option('--json', 'output in JSON format')
      .action(async (id, options) => {
        await this.delete(id, options);
      });

    return memoryCmd;
  }

  private async list(options: {
    limit?: string;
    search?: string;
    tags?: string;
    json?: boolean;
  }): Promise<void> {
    const spinner = options.json ? null : ora('Fetching memories...').start();

    try {
      const query = `
        query GetMemories($filter: MemoryFilter) {
          memories(filter: $filter) {
            id
            title
            content
            tags
            createdAt
            updatedAt
          }
        }
      `;

      const filter: any = {
        limit: parseInt(options.limit || '10'),
      };

      if (options.search) {
        filter.search = options.search;
      }

      if (options.tags) {
        filter.tags = options.tags.split(',').map(tag => tag.trim());
      }

      const result = await this.client.request(query, { filter });

      if (result.data?.memories) {
        const memories = result.data.memories;

        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            count: memories.length,
            memories
          }, null, 2));
          return;
        }

        if (spinner) spinner.stop();

        if (memories.length === 0) {
          console.log(chalk.yellow('No memories found'));
          return;
        }

        console.log(chalk.blue(`Found ${memories.length} memories:\n`));

        memories.forEach((memory: any) => {
          console.log(chalk.green(`📝 ${memory.title}`));
          console.log(chalk.gray(`   ID: ${memory.id}`));
          console.log(chalk.gray(`   Created: ${DateUtils.formatDate(memory.createdAt)}`));
          if (memory.tags.length > 0) {
            console.log(chalk.cyan(`   Tags: ${memory.tags.join(', ')}`));
          }
          console.log(chalk.white(`   ${memory.content.substring(0, 100)}...`));
          console.log();
        });
      }
    } catch (error: any) {
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: 'Failed to fetch memories',
          message: error.message || 'Unknown error'
        }, null, 2));
      } else {
        if (spinner) spinner.fail(chalk.red('Failed to fetch memories'));
        console.error(chalk.red(error.message || 'Unknown error'));
      }
    }
  }

  private async create(options: {
    title?: string;
    content?: string;
    tags?: string;
    json?: boolean;
  }): Promise<void> {
    let { title, content, tags } = options;

    // Prompt for missing data (skip prompts in JSON mode)
    if ((!title || !content) && !options.json) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Memory title:',
          when: () => !title,
          validate: (input) => input.trim() ? true : 'Title is required',
        },
        {
          type: 'editor',
          name: 'content',
          message: 'Memory content (opens editor):',
          when: () => !content,
          validate: (input) => input.trim() ? true : 'Content is required',
        },
        {
          type: 'input',
          name: 'tags',
          message: 'Tags (comma-separated, optional):',
          when: () => !tags,
        },
      ]);

      title = title || answers.title;
      content = content || answers.content;
      tags = tags || answers.tags;
    }

    // In JSON mode, require title and content
    if (options.json && (!title || !content)) {
      console.log(JSON.stringify({
        success: false,
        error: 'Missing required fields',
        message: 'Title and content are required for creating a memory'
      }, null, 2));
      process.exit(1);
    }

    const spinner = options.json ? null : ora('Creating memory...').start();

    try {
      const mutation = `
        mutation CreateMemory($input: CreateMemoryInput!) {
          createMemory(input: $input) {
            id
            title
            content
            tags
            createdAt
          }
        }
      `;

      const input: any = {
        title: title!.trim(),
        content: content!.trim(),
      };

      if (tags) {
        input.tags = tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      }

      const result = await this.client.request(mutation, { input });

      if (result.data?.createMemory) {
        const memory = result.data.createMemory;
        
        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            memory,
            message: 'Memory created successfully'
          }, null, 2));
        } else {
          if (spinner) spinner.succeed(chalk.green(`Memory created successfully!`));
          console.log(chalk.blue(`ID: ${memory.id}`));
          console.log(chalk.blue(`Title: ${memory.title}`));
        }
      }
    } catch (error: any) {
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: 'Failed to create memory',
          message: error.message || 'Unknown error'
        }, null, 2));
      } else {
        if (spinner) spinner.fail(chalk.red('Failed to create memory'));
        console.error(chalk.red(error.message || 'Unknown error'));
      }
    }
  }

  private async show(id: string, options: { json?: boolean } = {}): Promise<void> {
    const spinner = options.json ? null : ora('Fetching memory...').start();

    try {
      const query = `
        query GetMemory($id: ID!) {
          memory(id: $id) {
            id
            title
            content
            tags
            createdAt
            updatedAt
          }
        }
      `;

      const result = await this.client.request(query, { id });

      if (result.data?.memory) {
        const memory = result.data.memory;

        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            memory
          }, null, 2));
        } else {
          if (spinner) spinner.stop();
          console.log(chalk.green(`📝 ${memory.title}`));
          console.log(chalk.gray(`ID: ${memory.id}`));
          console.log(chalk.gray(`Created: ${DateUtils.formatDateTime(memory.createdAt)}`));
          console.log(chalk.gray(`Updated: ${DateUtils.formatDateTime(memory.updatedAt)}`));
          
          if (memory.tags.length > 0) {
            console.log(chalk.cyan(`Tags: ${memory.tags.join(', ')}`));
          }
          
          console.log('\n' + chalk.white(memory.content));
        }
      } else {
        if (options.json) {
          console.log(JSON.stringify({
            success: false,
            error: 'Memory not found',
            message: `No memory found with ID: ${id}`
          }, null, 2));
        } else {
          if (spinner) spinner.fail(chalk.red('Memory not found'));
        }
      }
    } catch (error: any) {
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: 'Failed to fetch memory',
          message: error.message || 'Unknown error'
        }, null, 2));
      } else {
        if (spinner) spinner.fail(chalk.red('Failed to fetch memory'));
        console.error(chalk.red(error.message || 'Unknown error'));
      }
    }
  }

  private async update(id: string, options: {
    title?: string;
    content?: string;
    tags?: string;
    json?: boolean;
  }): Promise<void> {
    const spinner = options.json ? null : ora('Updating memory...').start();

    try {
      const input: any = {};

      if (options.title) {
        input.title = options.title.trim();
      }

      if (options.content) {
        input.content = options.content.trim();
      }

      if (options.tags) {
        input.tags = options.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      }

      if (Object.keys(input).length === 0) {
        if (options.json) {
          console.log(JSON.stringify({
            success: false,
            error: 'No updates provided',
            message: 'At least one field (title, content, or tags) must be provided for update'
          }, null, 2));
        } else {
          if (spinner) spinner.fail(chalk.red('No updates provided'));
        }
        return;
      }

      const mutation = `
        mutation UpdateMemory($id: ID!, $input: UpdateMemoryInput!) {
          updateMemory(id: $id, input: $input) {
            id
            title
            content
            tags
            updatedAt
          }
        }
      `;

      const result = await this.client.request(mutation, { id, input });

      if (result.data?.updateMemory) {
        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            memory: result.data.updateMemory,
            message: 'Memory updated successfully'
          }, null, 2));
        } else {
          if (spinner) spinner.succeed(chalk.green('Memory updated successfully!'));
        }
      }
    } catch (error: any) {
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: 'Failed to update memory',
          message: error.message || 'Unknown error'
        }, null, 2));
      } else {
        if (spinner) spinner.fail(chalk.red('Failed to update memory'));
        console.error(chalk.red(error.message || 'Unknown error'));
      }
    }
  }

  private async delete(id: string, options: { force?: boolean; json?: boolean }): Promise<void> {
    if (!options.force && !options.json) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to delete this memory?',
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Cancelled'));
        return;
      }
    } else if (!options.force && options.json) {
      // In JSON mode without force, require explicit confirmation
      console.log(JSON.stringify({
        success: false,
        error: 'Confirmation required',
        message: 'Use --force flag to delete without confirmation in JSON mode'
      }, null, 2));
      return;
    }

    const spinner = options.json ? null : ora('Deleting memory...').start();

    try {
      const mutation = `
        mutation DeleteMemory($id: ID!) {
          deleteMemory(id: $id)
        }
      `;

      await this.client.request(mutation, { id });
      
      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          message: 'Memory deleted successfully',
          deletedId: id
        }, null, 2));
      } else {
        if (spinner) spinner.succeed(chalk.green('Memory deleted successfully!'));
      }
    } catch (error: any) {
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: 'Failed to delete memory',
          message: error.message || 'Unknown error'
        }, null, 2));
      } else {
        if (spinner) spinner.fail(chalk.red('Failed to delete memory'));
        console.error(chalk.red(error.message || 'Unknown error'));
      }
    }
  }
}