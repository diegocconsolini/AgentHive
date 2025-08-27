import { Command } from 'commander';
import { MemoryManagerAPI } from '../../api/index.js';
import { OutputFormatter, InteractivePrompts } from '../../utils/output.js';
import { ErrorHandler, handleErrors } from '../../utils/errors.js';
import { 
  CreateAgentOptions,
  AgentListOptions,
  AgentShowOptions,
  OutputFormat
} from '../../types/commands.js';
import * as fs from 'fs';
import * as path from 'path';

export class AgentCommand {
  private api: MemoryManagerAPI;

  constructor() {
    this.api = new MemoryManagerAPI();
  }

  getCommand(): Command {
    const agentCmd = new Command('agent')
      .description('Agent management commands')
      .addHelpText('after', `
Examples:
  $ memory agent list --format=table          # List all agents in table format
  $ memory agent create my-agent              # Create a new agent interactively
  $ memory agent show agent-id --detailed     # Show agent details with statistics
  $ memory agent run agent-id "Hello world"   # Run agent with input
  $ memory agent export agent-id --format=yaml # Export agent configuration
`);

    // Create command
    agentCmd
      .command('create')
      .argument('[name]', 'agent name')
      .description('Create a new agent')
      .option('-d, --description <description>', 'agent description')
      .option('-m, --model <model>', 'model type (haiku, sonnet, opus)', 'sonnet')
      .option('--system-prompt <prompt>', 'system prompt for the agent')
      .option('--tools <tools>', 'comma-separated list of tools')
      .option('--template <template>', 'create from template')
      .option('--from-file <file>', 'create from configuration file')
      .option('--interactive', 'use interactive mode')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.createAgent.bind(this)));

    // List command
    agentCmd
      .command('list')
      .alias('ls')
      .description('List all agents')
      .option('--format <format>', 'output format (json, table, tree)', 'table')
      .option('--filter <filter>', 'filter agents by name or description')
      .option('--sort-by <field>', 'sort by field (name, created, updated)', 'name')
      .option('--limit <limit>', 'limit number of results')
      .option('--json', 'output in JSON format')
      .action(handleErrors(this.listAgents.bind(this)));

    // Show command
    agentCmd
      .command('show')
      .alias('get')
      .argument('<id>', 'agent ID or name')
      .description('Show agent details')
      .option('--detailed', 'include detailed statistics')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.showAgent.bind(this)));

    // Update command
    agentCmd
      .command('update')
      .argument('<id>', 'agent ID or name')
      .description('Update an agent')
      .option('-d, --description <description>', 'update description')
      .option('-m, --model <model>', 'update model')
      .option('--system-prompt <prompt>', 'update system prompt')
      .option('--tools <tools>', 'update tools (comma-separated)')
      .option('--interactive', 'use interactive mode')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.updateAgent.bind(this)));

    // Delete command
    agentCmd
      .command('delete')
      .alias('rm')
      .argument('<id>', 'agent ID or name')
      .description('Delete an agent')
      .option('--force', 'force deletion without confirmation')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.deleteAgent.bind(this)));

    // Clone command
    agentCmd
      .command('clone')
      .argument('<source>', 'source agent ID or name')
      .argument('<target>', 'target agent name')
      .description('Clone an agent')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.cloneAgent.bind(this)));

    // Export command
    agentCmd
      .command('export')
      .argument('<id>', 'agent ID or name')
      .description('Export agent configuration')
      .option('--format <format>', 'export format (json, yaml)', 'json')
      .option('--output <file>', 'output file (default: stdout)')
      .action(handleErrors(this.exportAgent.bind(this)));

    // Import command
    agentCmd
      .command('import')
      .argument('<file>', 'configuration file')
      .description('Import agent configuration')
      .option('--merge', 'merge with existing agent if name conflicts')
      .option('--replace', 'replace existing agent if name conflicts')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.importAgent.bind(this)));

    // Run command
    agentCmd
      .command('run')
      .argument('<id>', 'agent ID or name')
      .argument('[input]', 'input text')
      .description('Run an agent')
      .option('--input-file <file>', 'read input from file')
      .option('--timeout <seconds>', 'timeout in seconds', '30')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.runAgent.bind(this)));

    // Test command
    agentCmd
      .command('test')
      .argument('<id>', 'agent ID or name')
      .description('Test an agent')
      .option('--scenario <file>', 'test scenario file')
      .option('--iterations <count>', 'number of test iterations', '1')
      .option('--timeout <seconds>', 'timeout per test', '30')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.testAgent.bind(this)));

    // Validate command
    agentCmd
      .command('validate')
      .argument('<id>', 'agent ID or name')
      .description('Validate agent configuration')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.validateAgent.bind(this)));

    // Benchmark command
    agentCmd
      .command('benchmark')
      .argument('<id>', 'agent ID or name')
      .description('Benchmark agent performance')
      .option('--iterations <count>', 'number of iterations', '10')
      .option('--scenario <file>', 'benchmark scenario file')
      .option('--warmup <count>', 'warmup iterations', '2')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.benchmarkAgent.bind(this)));

    return agentCmd;
  }

  @handleErrors
  private async createAgent(name: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    // If no name provided or interactive mode, prompt for details
    if (!name || options.interactive) {
      const answers = await InteractivePrompts.input(
        'Agent name:', 
        name,
        (input) => input.length > 0 ? true : 'Name is required'
      );
      name = answers;

      if (!options.description) {
        options.description = await InteractivePrompts.input('Description (optional):');
      }

      if (!options.model) {
        options.model = await InteractivePrompts.select(
          'Select model:', 
          ['haiku', 'sonnet', 'opus']
        );
      }

      if (!options.systemPrompt) {
        const usePrompt = await InteractivePrompts.confirm('Add system prompt?');
        if (usePrompt) {
          options.systemPrompt = await InteractivePrompts.editor('Enter system prompt:');
        }
      }

      if (!options.tools) {
        const addTools = await InteractivePrompts.confirm('Add tools?');
        if (addTools) {
          const toolsInput = await InteractivePrompts.input('Tools (comma-separated):');
          options.tools = toolsInput;
        }
      }
    }

    // Handle file input
    if (options.fromFile) {
      const fileContent = fs.readFileSync(options.fromFile, 'utf8');
      const config = JSON.parse(fileContent);
      Object.assign(options, config);
    }

    const createOptions: CreateAgentOptions = {
      name,
      description: options.description,
      model: options.model,
      systemPrompt: options.systemPrompt,
      tools: options.tools ? options.tools.split(',').map((t: string) => t.trim()) : undefined
    };

    const result = await this.api.agents.create(createOptions);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async listAgents(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const listOptions: AgentListOptions = {
      filter: options.filter,
      sortBy: options.sortBy,
      limit: options.limit ? parseInt(options.limit) : undefined,
      format: format as OutputFormat
    };

    const result = await this.api.agents.list(listOptions);
    
    if (result.success && result.data) {
      const output = OutputFormatter.formatList(result.data, {
        format: format as OutputFormat,
        title: 'Agents',
        columns: format === 'table' ? ['id', 'name', 'description', 'model', 'createdAt'] : undefined,
        sortBy: options.sortBy,
        limit: options.limit ? parseInt(options.limit) : undefined
      });
      console.log(output);
    } else {
      OutputFormatter.result(result, format);
    }
  }

  @handleErrors
  private async showAgent(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const showOptions: AgentShowOptions = {
      detailed: options.detailed
    };

    const result = await this.api.agents.show(id, showOptions);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async updateAgent(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    if (options.interactive) {
      // Get current agent details first
      const current = await this.api.agents.show(id);
      if (!current.success || !current.data) {
        OutputFormatter.error('Agent not found', undefined, format);
        return;
      }

      const agent = current.data;
      
      // Interactive updates
      const newDescription = await InteractivePrompts.input(
        'Description:', 
        agent.description
      );
      if (newDescription !== agent.description) {
        options.description = newDescription;
      }

      const newModel = await InteractivePrompts.select(
        'Model:', 
        ['haiku', 'sonnet', 'opus'],
        agent.model
      );
      if (newModel !== agent.model) {
        options.model = newModel;
      }

      const updatePrompt = await InteractivePrompts.confirm('Update system prompt?');
      if (updatePrompt) {
        options.systemPrompt = await InteractivePrompts.editor(
          'System prompt:', 
          agent.systemPrompt || ''
        );
      }
    }

    const updates: Partial<CreateAgentOptions> = {};
    if (options.description) updates.description = options.description;
    if (options.model) updates.model = options.model;
    if (options.systemPrompt) updates.systemPrompt = options.systemPrompt;
    if (options.tools) updates.tools = options.tools.split(',').map((t: string) => t.trim());

    const result = await this.api.agents.update(id, updates);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async deleteAgent(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    if (!options.force) {
      const confirmed = await InteractivePrompts.confirm(
        `Are you sure you want to delete agent "${id}"?`
      );
      if (!confirmed) {
        OutputFormatter.info('Cancelled', format);
        return;
      }
    }

    const result = await this.api.agents.delete(id, options.force);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async cloneAgent(source: string, target: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.agents.clone(source, target);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async exportAgent(id: string, options: any): Promise<void> {
    const format = options.format || 'json';

    const result = await this.api.agents.export(id, format);
    
    if (result.success && result.data) {
      if (options.output) {
        fs.writeFileSync(options.output, result.data);
        OutputFormatter.success(`Agent exported to ${options.output}`, undefined, 'json');
      } else {
        console.log(result.data);
      }
    } else {
      OutputFormatter.result(result, 'json');
    }
  }

  @handleErrors
  private async importAgent(file: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    if (!fs.existsSync(file)) {
      OutputFormatter.error(`File not found: ${file}`, undefined, format);
      return;
    }

    const content = fs.readFileSync(file, 'utf8');
    const importOptions = {
      merge: options.merge,
      overwrite: options.replace
    };

    const result = await this.api.agents.import(content, importOptions);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async runAgent(id: string, input: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    // Get input from file if specified
    if (options.inputFile) {
      if (!fs.existsSync(options.inputFile)) {
        OutputFormatter.error(`Input file not found: ${options.inputFile}`, undefined, format);
        return;
      }
      input = fs.readFileSync(options.inputFile, 'utf8');
    }

    // Prompt for input if not provided
    if (!input) {
      input = await InteractivePrompts.input('Enter input:');
    }

    const runOptions = {
      timeout: parseInt(options.timeout) * 1000
    };

    const result = await this.api.agents.run(id, input, runOptions);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async testAgent(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    let scenario;
    if (options.scenario) {
      if (!fs.existsSync(options.scenario)) {
        OutputFormatter.error(`Scenario file not found: ${options.scenario}`, undefined, format);
        return;
      }
      const content = fs.readFileSync(options.scenario, 'utf8');
      scenario = JSON.parse(content);
    }

    const result = await this.api.agents.test(id, scenario);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async validateAgent(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.agents.validate(id);
    OutputFormatter.result(result, format);
  }

  @handleErrors
  private async benchmarkAgent(id: string, options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const benchmarkOptions = {
      iterations: parseInt(options.iterations),
      scenario: options.scenario
    };

    const result = await this.api.agents.benchmark(id, benchmarkOptions);
    OutputFormatter.result(result, format);
  }
}