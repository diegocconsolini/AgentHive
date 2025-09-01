import { Command } from 'commander';
import { MemoryManagerAPI } from '../../api/index.js';
import { OutputFormatter, InteractivePrompts } from '../../utils/output.js';
import { ErrorHandler } from '../../utils/errors.js';
import { handleErrors, withErrorHandling } from '../../utils/decorators.js';
import { 
  MemorySearchOptions,
  MemoryTagOptions,
  MemoryClusterOptions,
  MemoryGraphOptions,
  OutputFormat
} from '../../types/commands.js';
import * as fs from 'fs';

export class EnhancedMemoryCommand {
  private api: MemoryManagerAPI;

  constructor() {
    this.api = new MemoryManagerAPI();
  }

  getCommand(): Command {
    const memoryCmd = new Command('memory')
      .description('Enhanced memory management commands')
      .addHelpText('after', `
Examples:
  $ memory memory search "AI agents" --limit=10       # Search memories
  $ memory memory create --title="My Note"            # Create memory interactively
  $ memory memory tag mem-id --add=work,ai            # Add tags to memory
  $ memory memory analyze --agent=my-agent            # Analyze memory patterns
  $ memory memory cluster --method=semantic           # Cluster memories by similarity
  $ memory memory graph --output=svg                  # Generate memory graph
`);

    // Search command
    memoryCmd
      .command('search')
      .argument('<query>', 'search query')
      .description('Search memories with advanced filtering')
      .option('--agent <agent>', 'filter by agent name')
      .option('--context <context>', 'filter by context ID')
      .option('--tags <tags>', 'filter by tags (comma-separated)')
      .option('--limit <limit>', 'limit results', '10')
      .option('--similarity <threshold>', 'minimum similarity threshold (0-1)', '0.3')
      .option('--format <format>', 'output format', 'table')
      .action(withErrorHandling(this.searchMemories.bind(this)));

    // Create command
    memoryCmd
      .command('create')
      .description('Create a new memory')
      .option('--title <title>', 'memory title')
      .option('--content <content>', 'memory content')
      .option('--tags <tags>', 'tags (comma-separated)')
      .option('--context <context>', 'context ID')
      .option('--from-file <file>', 'read content from file')
      .option('--interactive', 'use interactive mode')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.createMemory.bind(this)));

    // Update command
    memoryCmd
      .command('update')
      .argument('<id>', 'memory ID')
      .description('Update a memory')
      .option('--title <title>', 'update title')
      .option('--content <content>', 'update content')
      .option('--tags <tags>', 'update tags (comma-separated)')
      .option('--from-file <file>', 'read content from file')
      .option('--interactive', 'use interactive mode')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.updateMemory.bind(this)));

    // Delete command
    memoryCmd
      .command('delete')
      .alias('rm')
      .argument('<id>', 'memory ID')
      .description('Delete a memory')
      .option('--force', 'force deletion without confirmation')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.deleteMemory.bind(this)));

    // Tag command
    memoryCmd
      .command('tag')
      .argument('<id>', 'memory ID')
      .description('Manage memory tags')
      .option('--add <tags>', 'add tags (comma-separated)')
      .option('--remove <tags>', 'remove tags (comma-separated)')
      .option('--replace <tags>', 'replace all tags (comma-separated)')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.tagMemory.bind(this)));

    // Untag command (alias for tag --remove)
    memoryCmd
      .command('untag')
      .argument('<id>', 'memory ID')
      .argument('<tags...>', 'tags to remove')
      .description('Remove tags from memory')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.untagMemory.bind(this)));

    // Analyze command
    memoryCmd
      .command('analyze')
      .description('Analyze memory patterns and insights')
      .option('--agent <agent>', 'analyze memories for specific agent')
      .option('--time-range <range>', 'time range (e.g., 24h, 7d, 30d)')
      .option('--include-relationships', 'include relationship analysis')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.analyzeMemories.bind(this)));

    // Cluster command
    memoryCmd
      .command('cluster')
      .description('Cluster memories by similarity')
      .option('--method <method>', 'clustering method (semantic, temporal, hybrid)', 'semantic')
      .option('--clusters <count>', 'target number of clusters', '5')
      .option('--threshold <threshold>', 'similarity threshold', '0.3')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.clusterMemories.bind(this)));

    // Summarize command
    memoryCmd
      .command('summarize')
      .argument('<ids...>', 'memory IDs to summarize')
      .description('Generate summary of multiple memories')
      .option('--format <format>', 'summary format (bullet, paragraph)', 'paragraph')
      .option('--output-format <format>', 'output format', 'json')
      .action(withErrorHandling(this.summarizeMemories.bind(this)));

    // Graph command
    memoryCmd
      .command('graph')
      .description('Generate memory relationship graph')
      .option('--output <format>', 'output format (svg, png, dot, json)', 'json')
      .option('--layout <layout>', 'graph layout (force, circular, hierarchical)', 'force')
      .option('--file <file>', 'save to file')
      .action(withErrorHandling(this.memoryGraph.bind(this)));

    // Related command
    memoryCmd
      .command('related')
      .argument('<id>', 'memory ID')
      .description('Find related memories')
      .option('--limit <limit>', 'limit results', '10')
      .option('--threshold <threshold>', 'similarity threshold', '0.3')
      .option('--format <format>', 'output format', 'table')
      .action(withErrorHandling(this.relatedMemories.bind(this)));

    // Duplicate command
    memoryCmd
      .command('duplicate')
      .argument('<id>', 'memory ID')
      .description('Duplicate a memory')
      .option('--title <title>', 'new title for duplicate')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.duplicateMemory.bind(this)));

    // Bulk delete command
    memoryCmd
      .command('bulk-delete')
      .argument('<ids...>', 'memory IDs to delete')
      .description('Delete multiple memories')
      .option('--force', 'force deletion without confirmation')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.bulkDeleteMemories.bind(this)));

    // Export command
    memoryCmd
      .command('export')
      .argument('<ids...>', 'memory IDs to export')
      .description('Export memories')
      .option('--format <format>', 'export format (json, csv, markdown)', 'json')
      .option('--output <file>', 'output file (default: stdout)')
      .action(withErrorHandling(this.exportMemories.bind(this)));

    // List command (enhanced version of existing)
    memoryCmd
      .command('list')
      .alias('ls')
      .description('List memories with advanced filtering')
      .option('--context <context>', 'filter by context ID')
      .option('--agent <agent>', 'filter by agent name')
      .option('--tags <tags>', 'filter by tags (comma-separated)')
      .option('--limit <limit>', 'limit results', '20')
      .option('--offset <offset>', 'skip results', '0')
      .option('--sort-by <field>', 'sort by field (created, updated, title)')
      .option('--format <format>', 'output format', 'table')
      .action(withErrorHandling(this.listMemories.bind(this)));

    return memoryCmd;
  }

  @handleErrors
  private async searchMemories(query: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const searchOptions: MemorySearchOptions = {
      query,
      agent: options.agent,
      context: options.context,
      tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined,
      limit: parseInt(options.limit),
      similarity: parseFloat(options.similarity)
    };

    const result = await this.api.memory.search(searchOptions);
    
    if (result.success && result.data) {
      const output = OutputFormatter.formatList(result.data, {
        format: format as OutputFormat,
        title: `Search Results for "${query}"`,
        columns: format === 'table' ? ['id', 'title', 'tags', 'similarity', 'createdAt'] : undefined
      });
      console.log(output);
    } else {
      OutputFormatter.result(result, format);
    }
  }

  @handleErrors
  private async createMemory(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    // Interactive mode or missing required fields
    if (options.interactive || (!options.title && !options.content)) {
      if (!options.title) {
        options.title = await InteractivePrompts.input(
          'Memory title:', 
          undefined,
          (input) => input.length > 0 ? true : 'Title is required'
        );
      }

      if (!options.content && !options.fromFile) {
        const useEditor = await InteractivePrompts.confirm('Use editor for content?', true);
        if (useEditor) {
          options.content = await InteractivePrompts.editor('Enter memory content:');
        } else {
          options.content = await InteractivePrompts.input('Memory content:');
        }
      }

      if (!options.tags) {
        options.tags = await InteractivePrompts.input('Tags (comma-separated, optional):');
      }

      if (!options.context) {
        const useContext = await InteractivePrompts.confirm('Associate with context?');
        if (useContext) {
          options.context = await InteractivePrompts.input('Context ID:');
        }
      }
    }

    // Read content from file if specified
    if (options.fromFile) {
      if (!fs.existsSync(options.fromFile)) {
        OutputFormatter.error(`File not found: ${options.fromFile}`, undefined, format);
        return;
      }
      options.content = fs.readFileSync(options.fromFile, 'utf8');
    }

    const memory = {
      title: options.title,
      content: options.content,
      tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined,
      contextId: options.context
    };

    const result = await this.api.memory.create(memory);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async updateMemory(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    if (options.interactive) {
      // Interactive updates
      const updateTitle = await InteractivePrompts.confirm('Update title?');
      if (updateTitle) {
        options.title = await InteractivePrompts.input('New title:');
      }

      const updateContent = await InteractivePrompts.confirm('Update content?');
      if (updateContent) {
        const useEditor = await InteractivePrompts.confirm('Use editor?', true);
        if (useEditor) {
          options.content = await InteractivePrompts.editor('Memory content:');
        } else {
          options.content = await InteractivePrompts.input('Memory content:');
        }
      }

      const updateTags = await InteractivePrompts.confirm('Update tags?');
      if (updateTags) {
        options.tags = await InteractivePrompts.input('Tags (comma-separated):');
      }
    }

    // Read content from file if specified
    if (options.fromFile) {
      if (!fs.existsSync(options.fromFile)) {
        OutputFormatter.error(`File not found: ${options.fromFile}`, undefined, format);
        return;
      }
      options.content = fs.readFileSync(options.fromFile, 'utf8');
    }

    const updates: any = {};
    if (options.title) updates.title = options.title;
    if (options.content) updates.content = options.content;
    if (options.tags) updates.tags = options.tags.split(',').map((t: string) => t.trim());

    const result = await this.api.memory.update(id, updates);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async deleteMemory(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    if (!options.force) {
      const confirmed = await InteractivePrompts.confirm(
        `Are you sure you want to delete memory "${id}"?`
      );
      if (!confirmed) {
        OutputFormatter.info('Cancelled', format);
        return;
      }
    }

    const result = await this.api.memory.delete(id, options.force);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async tagMemory(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const tagOptions: MemoryTagOptions = {};
    if (options.add) tagOptions.add = options.add.split(',').map((t: string) => t.trim());
    if (options.remove) tagOptions.remove = options.remove.split(',').map((t: string) => t.trim());
    if (options.replace) tagOptions.replace = options.replace.split(',').map((t: string) => t.trim());

    const result = await this.api.memory.tag(id, tagOptions);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async untagMemory(id: string, tags: string[], options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.memory.tag(id, { remove: tags });
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async analyzeMemories(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.memory.analyze({
      agent: options.agent,
      timeRange: options.timeRange
    });
    
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async clusterMemories(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const clusterOptions: MemoryClusterOptions = {
      method: options.method as 'semantic' | 'temporal' | 'hybrid',
      clusters: parseInt(options.clusters),
      threshold: parseFloat(options.threshold)
    };

    const result = await this.api.memory.cluster(clusterOptions);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async summarizeMemories(ids: string[], options: any): Promise<void> {
    const format = options.json ? 'json' : options.outputFormat;

    const result = await this.api.memory.summarize(ids, {
      format: options.format as 'bullet' | 'paragraph'
    });
    
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async memoryGraph(options: any): Promise<void> {
    const graphOptions: MemoryGraphOptions = {
      output: options.output as 'svg' | 'png' | 'dot' | 'json',
      layout: options.layout as 'force' | 'circular' | 'hierarchical'
    };

    const result = await this.api.memory.graph(graphOptions);
    
    if (result.success && result.data) {
      if (options.file) {
        if (typeof result.data === 'string') {
          fs.writeFileSync(options.file, result.data);
          OutputFormatter.success(`Graph saved to ${options.file}`, undefined, 'json');
        } else {
          fs.writeFileSync(options.file, JSON.stringify(result.data, null, 2));
          OutputFormatter.success(`Graph data saved to ${options.file}`, undefined, 'json');
        }
      } else {
        if (typeof result.data === 'string') {
          console.log(result.data);
        } else {
          console.log(JSON.stringify(result.data, null, 2));
        }
      }
    } else {
      OutputFormatter.result(result, 'json');
    }
  }

  @handleErrors
  private async relatedMemories(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.memory.getRelated(id, {
      limit: parseInt(options.limit),
      threshold: parseFloat(options.threshold)
    });
    
    if (result.success && result.data) {
      const output = OutputFormatter.formatList(result.data, {
        format: format as OutputFormat,
        title: 'Related Memories',
        columns: format === 'table' ? ['id', 'title', 'similarity', 'relationshipType', 'createdAt'] : undefined
      });
      console.log(output);
    } else {
      OutputFormatter.result(result, format);
    }
  }

  @handleErrors
  private async duplicateMemory(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.memory.duplicate(id, options.title);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async bulkDeleteMemories(ids: string[], options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    if (!options.force) {
      const confirmed = await InteractivePrompts.confirm(
        `Are you sure you want to delete ${ids.length} memories?`
      );
      if (!confirmed) {
        OutputFormatter.info('Cancelled', format);
        return;
      }
    }

    const result = await this.api.memory.bulkDelete(ids, options.force);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async exportMemories(ids: string[], options: any): Promise<void> {
    const exportFormat = options.format || 'json';

    const result = await this.api.memory.export(ids, exportFormat);
    
    if (result.success && result.data) {
      if (options.output) {
        fs.writeFileSync(options.output, result.data);
        OutputFormatter.success(`Memories exported to ${options.output}`, undefined, 'json');
      } else {
        console.log(result.data);
      }
    } else {
      OutputFormatter.result(result, 'json');
    }
  }

  @handleErrors
  private async listMemories(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    // Use search with empty query for listing with filters
    const searchOptions: MemorySearchOptions = {
      query: '',
      agent: options.agent,
      context: options.context,
      tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined,
      limit: parseInt(options.limit) || 20
    };

    const result = await this.api.memory.search(searchOptions);
    
    if (result.success && result.data) {
      const output = OutputFormatter.formatList(result.data, {
        format: format as OutputFormat,
        title: 'Memories',
        columns: format === 'table' ? ['id', 'title', 'tags', 'contextId', 'createdAt'] : undefined,
        sortBy: options.sortBy,
        limit: parseInt(options.limit)
      });
      console.log(output);
    } else {
      OutputFormatter.result(result, format);
    }
  }
}