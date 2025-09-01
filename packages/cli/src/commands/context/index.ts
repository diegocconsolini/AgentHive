import { Command } from 'commander';
import { MemoryManagerAPI } from '../../api/index.js';
import { OutputFormatter, InteractivePrompts } from '../../utils/output.js';
import { ErrorHandler } from '../../utils/errors.js';
import { handleErrors, withErrorHandling } from '../../utils/decorators.js';
import { 
  CreateContextOptions,
  ContextListOptions,
  ContextMergeOptions,
  OutputFormat
} from '../../types/commands.js';
import * as fs from 'fs';

export class ContextCommand {
  private api: MemoryManagerAPI;

  constructor() {
    this.api = new MemoryManagerAPI();
  }

  getCommand(): Command {
    const contextCmd = new Command('context')
      .description('Context management commands')
      .addHelpText('after', `
Examples:
  $ memory context list                      # List all contexts
  $ memory context create "My Context"       # Create a new context
  $ memory context show ctx-id --include-memories # Show context with memories
  $ memory context analyze ctx-id --depth=deep    # Analyze context
  $ memory context merge source target --strategy=union # Merge contexts
`);

    // Create command
    contextCmd
      .command('create')
      .argument('[name]', 'context name')
      .description('Create a new context')
      .option('-d, --description <description>', 'context description')
      .option('--agent <agent>', 'associate with agent (ID or name)')
      .option('--from-template <template>', 'create from template')
      .option('--interactive', 'use interactive mode')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.createContext.bind(this)));

    // List command
    contextCmd
      .command('list')
      .alias('ls')
      .description('List all contexts')
      .option('--agent <agent>', 'filter by agent name')
      .option('--status <status>', 'filter by status (active, archived)')
      .option('--format <format>', 'output format (json, table, tree)', 'table')
      .option('--json', 'output in JSON format')
      .action(withErrorHandling(this.listContexts.bind(this)));

    // Show command
    contextCmd
      .command('show')
      .alias('get')
      .argument('<id>', 'context ID')
      .description('Show context details')
      .option('--include-memories', 'include memories in output')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.showContext.bind(this)));

    // Update command
    contextCmd
      .command('update')
      .argument('<id>', 'context ID')
      .description('Update a context')
      .option('-n, --name <name>', 'update name')
      .option('-d, --description <description>', 'update description')
      .option('--agent <agent>', 'update associated agent')
      .option('--interactive', 'use interactive mode')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.updateContext.bind(this)));

    // Delete command
    contextCmd
      .command('delete')
      .alias('rm')
      .argument('<id>', 'context ID')
      .description('Delete a context')
      .option('--cascade', 'delete associated memories')
      .option('--force', 'force deletion without confirmation')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.deleteContext.bind(this)));

    // Archive command
    contextCmd
      .command('archive')
      .argument('<id>', 'context ID')
      .description('Archive a context')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.archiveContext.bind(this)));

    // Restore command
    contextCmd
      .command('restore')
      .argument('<id>', 'context ID')
      .description('Restore an archived context')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.restoreContext.bind(this)));

    // Analyze command
    contextCmd
      .command('analyze')
      .argument('<id>', 'context ID')
      .description('Analyze context content and relationships')
      .option('--depth <depth>', 'analysis depth (shallow, deep)', 'shallow')
      .option('--include-metrics', 'include detailed metrics')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.analyzeContext.bind(this)));

    // Merge command
    contextCmd
      .command('merge')
      .argument('<source>', 'source context ID')
      .argument('<target>', 'target context ID')
      .description('Merge two contexts')
      .option('--strategy <strategy>', 'merge strategy (union, priority)', 'union')
      .option('--conflict-resolution <resolution>', 'conflict resolution (source, target, merge)', 'merge')
      .option('--dry-run', 'preview merge without applying')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.mergeContexts.bind(this)));

    // Diff command
    contextCmd
      .command('diff')
      .argument('<id1>', 'first context ID')
      .argument('<id2>', 'second context ID')
      .description('Compare two contexts')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.diffContexts.bind(this)));

    // Export command
    contextCmd
      .command('export')
      .argument('<id>', 'context ID')
      .description('Export context data')
      .option('--format <format>', 'export format (json, yaml, markdown)', 'json')
      .option('--output <file>', 'output file (default: stdout)')
      .option('--include-memories', 'include memories in export')
      .action(withErrorHandling(this.exportContext.bind(this)));

    // Stats command
    contextCmd
      .command('stats')
      .argument('[id]', 'context ID (optional, shows global stats if omitted)')
      .description('Show context statistics')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.contextStats.bind(this)));

    return contextCmd;
  }

  @handleErrors
  private async createContext(name: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    // Interactive mode or missing name
    if (!name || options.interactive) {
      if (!name) {
        name = await InteractivePrompts.input(
          'Context name:', 
          name,
          (input) => input.length > 0 ? true : 'Name is required'
        );
      }

      if (!options.description) {
        options.description = await InteractivePrompts.input('Description (optional):');
      }

      if (!options.agent) {
        const useAgent = await InteractivePrompts.confirm('Associate with an agent?');
        if (useAgent) {
          options.agent = await InteractivePrompts.input('Agent ID or name:');
        }
      }
    }

    const createOptions: CreateContextOptions = {
      name,
      description: options.description,
      agentId: options.agent,
      fromTemplate: options.fromTemplate
    };

    const result = await this.api.contexts.create(createOptions);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async listContexts(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const listOptions: ContextListOptions = {
      agent: options.agent,
      status: options.status as 'active' | 'archived',
      format: format as OutputFormat
    };

    const result = await this.api.contexts.list(listOptions);
    
    if (result.success && result.data) {
      const output = OutputFormatter.formatList(result.data, {
        format: format as OutputFormat,
        title: 'Contexts',
        columns: format === 'table' ? ['id', 'name', 'description', 'status', 'agent.name', 'memoryCount', 'createdAt'] : undefined
      });
      console.log(output);
    } else {
      OutputFormatter.result(result, format);
    }
  }

  @handleErrors
  private async showContext(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.contexts.show(id, {
      includeMemories: options.includeMemories
    });
    
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async updateContext(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    if (options.interactive) {
      // Get current context details
      const current = await this.api.contexts.show(id);
      if (!current.success || !current.data) {
        OutputFormatter.error('Context not found', undefined, format);
        return;
      }

      const context = current.data;
      
      // Interactive updates
      const newName = await InteractivePrompts.input('Name:', context.name);
      if (newName !== context.name) {
        options.name = newName;
      }

      const newDescription = await InteractivePrompts.input(
        'Description:', 
        context.description || ''
      );
      if (newDescription !== (context.description || '')) {
        options.description = newDescription;
      }

      const updateAgent = await InteractivePrompts.confirm('Update associated agent?');
      if (updateAgent) {
        options.agent = await InteractivePrompts.input(
          'Agent ID or name:', 
          context.agentId || ''
        );
      }
    }

    const updates: Partial<CreateContextOptions> = {};
    if (options.name) updates.name = options.name;
    if (options.description) updates.description = options.description;
    if (options.agent) updates.agentId = options.agent;

    const result = await this.api.contexts.update(id, updates);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async deleteContext(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    if (!options.force) {
      let message = `Are you sure you want to delete context "${id}"?`;
      if (options.cascade) {
        message += '\nThis will also delete all associated memories.';
      }
      
      const confirmed = await InteractivePrompts.confirm(message);
      if (!confirmed) {
        OutputFormatter.info('Cancelled', format);
        return;
      }
    }

    const result = await this.api.contexts.delete(id, options.cascade);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async archiveContext(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.contexts.archive(id);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async restoreContext(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.contexts.restore(id);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async analyzeContext(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.contexts.analyze(id, {
      depth: options.depth as 'shallow' | 'deep'
    });
    
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async mergeContexts(source: string, target: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    if (options.dryRun) {
      // Show diff first for dry run
      const diffResult = await this.api.contexts.diff(source, target);
      if (diffResult.success) {
        OutputFormatter.info('Merge preview:', format);
        OutputFormatter.result(diffResult, format);
        return;
      }
    }

    const mergeOptions: ContextMergeOptions = {
      strategy: options.strategy as 'union' | 'priority',
      conflictResolution: options.conflictResolution as 'source' | 'target' | 'merge'
    };

    const result = await this.api.contexts.merge(source, target, mergeOptions);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async diffContexts(id1: string, id2: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.contexts.diff(id1, id2);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async exportContext(id: string, options: any): Promise<void> {
    const exportFormat = options.format || 'json';

    const result = await this.api.contexts.export(id, exportFormat);
    
    if (result.success && result.data) {
      if (options.output) {
        fs.writeFileSync(options.output, result.data);
        OutputFormatter.success(`Context exported to ${options.output}`, undefined, 'json');
      } else {
        console.log(result.data);
      }
    } else {
      OutputFormatter.result(result, 'json');
    }
  }

  @handleErrors
  private async contextStats(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.contexts.getStats(id);
    OutputFormatter.result(result, format);
  }
}