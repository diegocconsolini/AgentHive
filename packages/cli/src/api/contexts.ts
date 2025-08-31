import { ApiClient } from './client.js';
import { 
  Context, 
  CreateContextOptions,
  ContextListOptions,
  ContextAnalysis,
  ContextMergeOptions,
  CommandResult
} from '../types/commands.js';
import { Validator } from '../utils/validation.js';
import { createSuccessResult } from '../utils/errors.js';

export class ContextsService {
  constructor(private apiClient: ApiClient) {}

  async create(options: CreateContextOptions): Promise<CommandResult<Context>> {
    Validator.required(options.name, 'name');
    Validator.string(options.name, 'name', { minLength: 1, maxLength: 255 });

    if (options.agentId) {
      Validator.uuid(options.agentId, 'agent ID');
    }

    const mutation = `
      mutation CreateContext($input: CreateContextInput!) {
        createContext(input: $input) {
          id
          name
          description
          agentId
          memories {
            id
            title
            content
            tags
            createdAt
          }
          metadata
          status
          createdAt
          updatedAt
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      input: {
        name: options.name,
        description: options.description,
        agentId: options.agentId,
        metadata: {}
      }
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to create context', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.createContext, 'Context created successfully');
  }

  async list(options: ContextListOptions = {}): Promise<CommandResult<Context[]>> {
    const query = `
      query ListContexts($filter: ContextFilter, $sort: ContextSort, $limit: Int, $offset: Int) {
        contexts(filter: $filter, sort: $sort, limit: $limit, offset: $offset) {
          id
          name
          description
          agentId
          status
          createdAt
          updatedAt
          memoryCount
          agent {
            name
          }
        }
      }
    `;

    const variables: any = {};

    if (options.agent || options.status) {
      variables.filter = {};
      if (options.agent) {
        variables.filter.agentName = options.agent;
      }
      if (options.status) {
        variables.filter.status = options.status.toUpperCase();
      }
    }

    const response = await this.apiClient.request(query, variables);

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to list contexts', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.contexts || [], 'Contexts retrieved successfully');
  }

  async show(id: string, options: { includeMemories?: boolean } = {}): Promise<CommandResult<Context>> {
    Validator.required(id, 'context ID');
    Validator.uuid(id, 'context ID');

    const query = `
      query GetContext($id: ID!, $includeMemories: Boolean!) {
        context(id: $id) {
          id
          name
          description
          agentId
          status
          metadata
          createdAt
          updatedAt
          agent {
            name
            model
          }
          memories @include(if: $includeMemories) {
            id
            title
            content
            tags
            createdAt
            updatedAt
          }
        }
      }
    `;

    const response = await this.apiClient.request(query, {
      id,
      includeMemories: !!options.includeMemories
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to get context', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    if (!response.data?.context) {
      return { 
        success: false, 
        error: `Context not found: ${id}`,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data.context, 'Context retrieved successfully');
  }

  async update(id: string, updates: Partial<CreateContextOptions>): Promise<CommandResult<Context>> {
    Validator.required(id, 'context ID');
    Validator.uuid(id, 'context ID');

    if (updates.agentId) {
      Validator.uuid(updates.agentId, 'agent ID');
    }

    const mutation = `
      mutation UpdateContext($id: ID!, $input: UpdateContextInput!) {
        updateContext(id: $id, input: $input) {
          id
          name
          description
          agentId
          metadata
          status
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
        error: 'Failed to update context', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.updateContext, 'Context updated successfully');
  }

  async delete(id: string, cascade = false): Promise<CommandResult<void>> {
    Validator.required(id, 'context ID');
    Validator.uuid(id, 'context ID');

    const mutation = `
      mutation DeleteContext($id: ID!, $cascade: Boolean!) {
        deleteContext(id: $id, cascade: $cascade)
      }
    `;

    const response = await this.apiClient.request(mutation, {
      id,
      cascade
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to delete context', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(undefined, 'Context deleted successfully');
  }

  async archive(id: string): Promise<CommandResult<Context>> {
    Validator.required(id, 'context ID');
    Validator.uuid(id, 'context ID');

    const mutation = `
      mutation ArchiveContext($id: ID!) {
        archiveContext(id: $id) {
          id
          name
          status
          updatedAt
        }
      }
    `;

    const response = await this.apiClient.request(mutation, { id });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to archive context', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.archiveContext, 'Context archived successfully');
  }

  async restore(id: string): Promise<CommandResult<Context>> {
    Validator.required(id, 'context ID');
    Validator.uuid(id, 'context ID');

    const mutation = `
      mutation RestoreContext($id: ID!) {
        restoreContext(id: $id) {
          id
          name
          status
          updatedAt
        }
      }
    `;

    const response = await this.apiClient.request(mutation, { id });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to restore context', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.restoreContext, 'Context restored successfully');
  }

  async analyze(id: string, options: { depth?: 'shallow' | 'deep' } = {}): Promise<CommandResult<ContextAnalysis>> {
    Validator.required(id, 'context ID');
    Validator.uuid(id, 'context ID');

    const query = `
      query AnalyzeContext($id: ID!, $options: AnalysisOptions) {
        analyzeContext(id: $id, options: $options) {
          contextId
          memoryCount
          topics
          sentiment
          complexity
          relationships {
            type
            strength
            description
          }
          insights
          recommendations
        }
      }
    `;

    const response = await this.apiClient.request(query, {
      id,
      options: { depth: options.depth || 'shallow' }
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to analyze context', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.analyzeContext, 'Context analysis completed');
  }

  async merge(sourceId: string, targetId: string, options: ContextMergeOptions = {}): Promise<CommandResult<Context>> {
    Validator.required(sourceId, 'source context ID');
    Validator.required(targetId, 'target context ID');
    Validator.uuid(sourceId, 'source context ID');
    Validator.uuid(targetId, 'target context ID');

    const mutation = `
      mutation MergeContexts($sourceId: ID!, $targetId: ID!, $options: MergeOptions) {
        mergeContexts(sourceId: $sourceId, targetId: $targetId, options: $options) {
          id
          name
          description
          memoryCount
          updatedAt
          mergeReport {
            totalMemories
            duplicatesResolved
            conflictsResolved
          }
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      sourceId,
      targetId,
      options
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to merge contexts', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.mergeContexts, 'Contexts merged successfully');
  }

  async diff(id1: string, id2: string): Promise<CommandResult<any>> {
    Validator.required(id1, 'first context ID');
    Validator.required(id2, 'second context ID');
    Validator.uuid(id1, 'first context ID');
    Validator.uuid(id2, 'second context ID');

    const query = `
      query DiffContexts($id1: ID!, $id2: ID!) {
        diffContexts(id1: $id1, id2: $id2) {
          similarities {
            commonMemories
            sharedTopics
            similarityScore
          }
          differences {
            uniqueToFirst
            uniqueToSecond
            conflicting
          }
          recommendations {
            mergeability
            suggestions
          }
        }
      }
    `;

    const response = await this.apiClient.request(query, { id1, id2 });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to compare contexts', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.diffContexts, 'Context comparison completed');
  }

  async export(id: string, format: 'json' | 'yaml' | 'markdown' = 'json'): Promise<CommandResult<string>> {
    Validator.required(id, 'context ID');
    Validator.uuid(id, 'context ID');

    const query = `
      query ExportContext($id: ID!, $format: ExportFormat!) {
        exportContext(id: $id, format: $format)
      }
    `;

    const response = await this.apiClient.request(query, {
      id,
      format: format.toUpperCase()
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to export context', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.exportContext, 'Context exported successfully');
  }

  async getStats(id?: string): Promise<CommandResult<any>> {
    const query = id ? `
      query ContextStats($id: ID!) {
        contextStats(id: $id) {
          totalMemories
          averageMemoryLength
          topTags
          activityOverTime
          sentimentDistribution
        }
      }
    ` : `
      query AllContextStats {
        allContextStats {
          totalContexts
          activeContexts
          archivedContexts
          averageMemoriesPerContext
          mostActiveContexts {
            id
            name
            memoryCount
          }
        }
      }
    `;

    const variables = id ? { id } : {};
    const response = await this.apiClient.request(query, variables);

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to get context statistics', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    const data = id ? response.data?.contextStats : response.data?.allContextStats;
    return createSuccessResult(data, 'Context statistics retrieved successfully');
  }
}