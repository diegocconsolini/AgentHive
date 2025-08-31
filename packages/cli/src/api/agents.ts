import { ApiClient } from './client.js';
import { 
  Agent, 
  CreateAgentOptions,
  AgentListOptions,
  AgentTestScenario,
  BenchmarkResult,
  CommandResult
} from '../types/commands.js';
import { Validator } from '../utils/validation.js';
import { createSuccessResult } from '../utils/errors.js';

export class AgentsService {
  constructor(private apiClient: ApiClient) {}

  async create(options: CreateAgentOptions): Promise<CommandResult<Agent>> {
    Validator.required(options.name, 'name');
    Validator.string(options.name, 'name', { 
      minLength: 1, 
      maxLength: 255,
      pattern: /^[a-zA-Z0-9_-]+$/
    });

    if (options.model) {
      Validator.model(options.model);
    }

    const mutation = `
      mutation CreateAgent($input: CreateAgentInput!) {
        createAgent(input: $input) {
          id
          name
          description
          model
          systemPrompt
          tools
          metadata
          createdAt
          updatedAt
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      input: {
        name: options.name,
        description: options.description,
        model: options.model || 'sonnet',
        systemPrompt: options.systemPrompt,
        tools: options.tools || [],
        metadata: {}
      }
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to create agent', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.createAgent, 'Agent created successfully');
  }

  async list(options: AgentListOptions = {}): Promise<CommandResult<Agent[]>> {
    const query = `
      query ListAgents($filter: AgentFilter, $sort: AgentSort, $limit: Int, $offset: Int) {
        agents(filter: $filter, sort: $sort, limit: $limit, offset: $offset) {
          id
          name
          description
          model
          tools
          createdAt
          updatedAt
          metadata
        }
      }
    `;

    const variables: any = {};

    if (options.filter) {
      variables.filter = { search: options.filter };
    }

    if (options.sortBy) {
      variables.sort = { field: options.sortBy, direction: 'ASC' };
    }

    if (options.limit) {
      variables.limit = options.limit;
    }

    const response = await this.apiClient.request(query, variables);

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to list agents', 
        data: response.errors,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.agents || [], 'Agents retrieved successfully');
  }

  async show(id: string, options: { detailed?: boolean } = {}): Promise<CommandResult<Agent>> {
    Validator.required(id, 'agent ID');
    Validator.uuid(id, 'agent ID');

    const query = `
      query GetAgent($id: ID!, $includeStats: Boolean!) {
        agent(id: $id) {
          id
          name
          description
          model
          systemPrompt
          tools
          metadata
          createdAt
          updatedAt
          ${options.detailed ? `
          stats @include(if: $includeStats) {
            totalSessions
            totalTokens
            averageResponseTime
            lastUsed
          }
          recentSessions @include(if: $includeStats) {
            id
            startedAt
            endedAt
            tokensUsed
          }
          ` : ''}
        }
      }
    `;

    const response = await this.apiClient.request(query, {
      id,
      includeStats: !!options.detailed
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to get agent', 
        data: response.errors,
        timestamp: new Date().toISOString()
      };
    }

    if (!response.data?.agent) {
      return { 
        success: false, 
        error: `Agent not found: ${id}`,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data.agent, 'Agent retrieved successfully');
  }

  async update(id: string, updates: Partial<CreateAgentOptions>): Promise<CommandResult<Agent>> {
    Validator.required(id, 'agent ID');
    Validator.uuid(id, 'agent ID');

    if (updates.model) {
      Validator.model(updates.model);
    }

    const mutation = `
      mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {
        updateAgent(id: $id, input: $input) {
          id
          name
          description
          model
          systemPrompt
          tools
          metadata
          createdAt
          updatedAt
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      id,
      input: updates
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to update agent', 
        data: response.errors,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.updateAgent, 'Agent updated successfully');
  }

  async delete(id: string, force = false): Promise<CommandResult<void>> {
    Validator.required(id, 'agent ID');
    Validator.uuid(id, 'agent ID');

    const mutation = `
      mutation DeleteAgent($id: ID!, $force: Boolean!) {
        deleteAgent(id: $id, force: $force)
      }
    `;

    const response = await this.apiClient.request(mutation, {
      id,
      force
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to delete agent', 
        data: response.errors,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(undefined, 'Agent deleted successfully');
  }

  async clone(sourceId: string, targetName: string): Promise<CommandResult<Agent>> {
    Validator.required(sourceId, 'source agent ID');
    Validator.uuid(sourceId, 'source agent ID');
    Validator.required(targetName, 'target name');
    Validator.string(targetName, 'target name', { 
      minLength: 1, 
      maxLength: 255,
      pattern: /^[a-zA-Z0-9_-]+$/
    });

    const mutation = `
      mutation CloneAgent($sourceId: ID!, $targetName: String!) {
        cloneAgent(sourceId: $sourceId, targetName: $targetName) {
          id
          name
          description
          model
          systemPrompt
          tools
          metadata
          createdAt
          updatedAt
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      sourceId,
      targetName
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to clone agent', 
        data: response.errors,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.cloneAgent, 'Agent cloned successfully');
  }

  async export(id: string, format: 'json' | 'yaml' = 'json'): Promise<CommandResult<string>> {
    Validator.required(id, 'agent ID');
    Validator.uuid(id, 'agent ID');

    const query = `
      query ExportAgent($id: ID!, $format: ExportFormat!) {
        exportAgent(id: $id, format: $format)
      }
    `;

    const response = await this.apiClient.request(query, {
      id,
      format: format.toUpperCase()
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to export agent', 
        data: response.errors,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.exportAgent, 'Agent exported successfully');
  }

  async import(data: string, options: { merge?: boolean; overwrite?: boolean } = {}): Promise<CommandResult<Agent>> {
    Validator.required(data, 'import data');

    // Try to parse as JSON first, then YAML
    let agentData;
    try {
      agentData = JSON.parse(data);
    } catch {
      try {
        const yaml = require('js-yaml');
        agentData = yaml.load(data);
      } catch (error) {
        return { 
          success: false, 
          error: 'Invalid import data format. Must be valid JSON or YAML.',
          timestamp: new Date().toISOString()
        };
      }
    }

    const mutation = `
      mutation ImportAgent($data: JSON!, $options: ImportOptions) {
        importAgent(data: $data, options: $options) {
          id
          name
          description
          model
          systemPrompt
          tools
          metadata
          createdAt
          updatedAt
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      data: agentData,
      options
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to import agent', 
        data: response.errors,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.importAgent, 'Agent imported successfully');
  }

  async run(id: string, input: string, options: { timeout?: number } = {}): Promise<CommandResult<any>> {
    Validator.required(id, 'agent ID');
    Validator.uuid(id, 'agent ID');
    Validator.required(input, 'input');

    const mutation = `
      mutation RunAgent($id: ID!, $input: String!, $options: RunOptions) {
        runAgent(id: $id, input: $input, options: $options) {
          output
          tokensUsed
          duration
          model
          metadata
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      id,
      input,
      options
    }, { timeout: options.timeout });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to run agent', 
        data: response.errors,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.runAgent, 'Agent executed successfully');
  }

  async test(id: string, scenario?: AgentTestScenario): Promise<CommandResult<any>> {
    Validator.required(id, 'agent ID');
    Validator.uuid(id, 'agent ID');

    const mutation = `
      mutation TestAgent($id: ID!, $scenario: TestScenario) {
        testAgent(id: $id, scenario: $scenario) {
          passed
          output
          expectedOutput
          duration
          tokensUsed
          errors
          warnings
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      id,
      scenario
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to test agent', 
        data: response.errors,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.testAgent, 'Agent test completed');
  }

  async validate(id: string): Promise<CommandResult<any>> {
    Validator.required(id, 'agent ID');
    Validator.uuid(id, 'agent ID');

    const query = `
      query ValidateAgent($id: ID!) {
        validateAgent(id: $id) {
          valid
          issues {
            level
            message
            field
            suggestion
          }
          score
        }
      }
    `;

    const response = await this.apiClient.request(query, { id });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to validate agent', 
        data: response.errors,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.validateAgent, 'Agent validation completed');
  }

  async benchmark(id: string, options: { iterations?: number; scenario?: string } = {}): Promise<CommandResult<BenchmarkResult>> {
    Validator.required(id, 'agent ID');
    Validator.uuid(id, 'agent ID');

    const mutation = `
      mutation BenchmarkAgent($id: ID!, $options: BenchmarkOptions) {
        benchmarkAgent(id: $id, options: $options) {
          name
          iterations
          duration
          throughput
          p50
          p95
          p99
          errors
          metadata
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      id,
      options
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to benchmark agent', 
        data: response.errors,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.benchmarkAgent, 'Agent benchmark completed');
  }
}