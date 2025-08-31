import { ApiClient } from './client.js';
import { 
  Memory, 
  MemorySearchOptions,
  MemoryTagOptions,
  MemoryCluster,
  MemoryGraph,
  CommandResult
} from '../types/commands.js';
import { Validator } from '../utils/validation.js';
import { createSuccessResult } from '../utils/errors.js';

export class MemoryService {
  constructor(private apiClient: ApiClient) {}

  async search(options: MemorySearchOptions): Promise<CommandResult<Memory[]>> {
    Validator.required(options.query, 'search query');

    if (options.agent) {
      Validator.string(options.agent, 'agent name');
    }

    if (options.context) {
      Validator.uuid(options.context, 'context ID');
    }

    const query = `
      query SearchMemories($query: String!, $filter: MemorySearchFilter, $options: SearchOptions) {
        searchMemories(query: $query, filter: $filter, options: $options) {
          memories {
            id
            title
            content
            tags
            contextId
            agentId
            createdAt
            updatedAt
            similarity
          }
          totalCount
          searchTime
          suggestions
        }
      }
    `;

    const filter: any = {};
    if (options.agent) filter.agentName = options.agent;
    if (options.context) filter.contextId = options.context;
    if (options.tags) filter.tags = options.tags;

    const searchOptions: any = {};
    if (options.limit) searchOptions.limit = options.limit;
    if (options.similarity) searchOptions.minSimilarity = options.similarity;

    const response = await this.apiClient.request(query, {
      query: options.query,
      filter,
      options: searchOptions
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to search memories', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    const result = response.data?.searchMemories;
    return createSuccessResult(result?.memories || [], `Found ${result?.totalCount || 0} memories`);
  }

  async create(memory: { title: string; content: string; tags?: string[]; contextId?: string }): Promise<CommandResult<Memory>> {
    Validator.required(memory.title, 'title');
    Validator.required(memory.content, 'content');
    Validator.string(memory.title, 'title', { minLength: 1, maxLength: 255 });

    if (memory.contextId) {
      Validator.uuid(memory.contextId, 'context ID');
    }

    const mutation = `
      mutation CreateMemory($input: CreateMemoryInput!) {
        createMemory(input: $input) {
          id
          title
          content
          tags
          contextId
          agentId
          metadata
          createdAt
          updatedAt
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      input: {
        title: memory.title,
        content: memory.content,
        tags: memory.tags || [],
        contextId: memory.contextId,
        metadata: {}
      }
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to create memory', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.createMemory, 'Memory created successfully');
  }

  async update(id: string, updates: { title?: string; content?: string; tags?: string[] }): Promise<CommandResult<Memory>> {
    Validator.required(id, 'memory ID');
    Validator.uuid(id, 'memory ID');

    if (updates.title !== undefined) {
      Validator.string(updates.title, 'title', { minLength: 1, maxLength: 255 });
    }

    const mutation = `
      mutation UpdateMemory($id: ID!, $input: UpdateMemoryInput!) {
        updateMemory(id: $id, input: $input) {
          id
          title
          content
          tags
          contextId
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
        error: 'Failed to update memory', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.updateMemory, 'Memory updated successfully');
  }

  async delete(id: string, force = false): Promise<CommandResult<void>> {
    Validator.required(id, 'memory ID');
    Validator.uuid(id, 'memory ID');

    const mutation = `
      mutation DeleteMemory($id: ID!, $force: Boolean!) {
        deleteMemory(id: $id, force: $force)
      }
    `;

    const response = await this.apiClient.request(mutation, {
      id,
      force
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to delete memory', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(undefined, 'Memory deleted successfully');
  }

  async tag(id: string, options: MemoryTagOptions): Promise<CommandResult<Memory>> {
    Validator.required(id, 'memory ID');
    Validator.uuid(id, 'memory ID');

    const mutation = `
      mutation TagMemory($id: ID!, $options: TagOptions!) {
        tagMemory(id: $id, options: $options) {
          id
          title
          tags
          updatedAt
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
        error: 'Failed to update memory tags', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.tagMemory, 'Memory tags updated successfully');
  }

  async analyze(options: { agent?: string; timeRange?: string } = {}): Promise<CommandResult<any>> {
    const query = `
      query AnalyzeMemories($filter: MemoryAnalysisFilter, $options: AnalysisOptions) {
        analyzeMemories(filter: $filter, options: $options) {
          totalMemories
          averageLength
          topTags {
            tag
            count
            percentage
          }
          sentimentDistribution {
            positive
            neutral
            negative
          }
          activityOverTime {
            date
            count
          }
          topicClusters {
            topic
            memories
            keywords
          }
          insights
          recommendations
        }
      }
    `;

    const filter: any = {};
    if (options.agent) filter.agentName = options.agent;
    if (options.timeRange) {
      const timeRange = Validator.timeRange(options.timeRange);
      filter.dateRange = {
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString()
      };
    }

    const response = await this.apiClient.request(query, {
      filter,
      options: {}
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to analyze memories', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.analyzeMemories, 'Memory analysis completed');
  }

  async cluster(options: { method?: 'semantic' | 'temporal' | 'hybrid'; clusters?: number } = {}): Promise<CommandResult<MemoryCluster[]>> {
    const query = `
      query ClusterMemories($options: ClusterOptions) {
        clusterMemories(options: $options) {
          id
          name
          memories {
            id
            title
            content
            tags
            similarity
          }
          centroid
          similarity
          keywords
          insights
        }
      }
    `;

    const response = await this.apiClient.request(query, {
      options: {
        method: options.method || 'semantic',
        targetClusters: options.clusters || 5
      }
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to cluster memories', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.clusterMemories || [], 'Memory clustering completed');
  }

  async summarize(memoryIds: string[], options: { format?: 'bullet' | 'paragraph' } = {}): Promise<CommandResult<string>> {
    if (!memoryIds || memoryIds.length === 0) {
      return { 
        success: false, 
        error: 'At least one memory ID is required',
        timestamp: new Date().toISOString()
      };
    }

    memoryIds.forEach(id => Validator.uuid(id, 'memory ID'));

    const mutation = `
      mutation SummarizeMemories($memoryIds: [ID!]!, $options: SummarizationOptions) {
        summarizeMemories(memoryIds: $memoryIds, options: $options) {
          summary
          keyPoints
          themes
          wordCount
          compressionRatio
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      memoryIds,
      options: {
        format: options.format || 'paragraph'
      }
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to summarize memories', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.summarizeMemories, 'Memory summarization completed');
  }

  async graph(options: { output?: 'svg' | 'png' | 'dot' | 'json'; layout?: 'force' | 'circular' | 'hierarchical' } = {}): Promise<CommandResult<MemoryGraph | string>> {
    const query = `
      query MemoryGraph($options: GraphOptions) {
        memoryGraph(options: $options) {
          nodes {
            id
            memoryId
            title
            size
            color
            metadata
          }
          edges {
            source
            target
            weight
            type
            metadata
          }
          layout
          metadata
        }
      }
    `;

    const response = await this.apiClient.request(query, {
      options: {
        outputFormat: options.output || 'json',
        layoutAlgorithm: options.layout || 'force'
      }
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to generate memory graph', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.memoryGraph, 'Memory graph generated successfully');
  }

  async getRelated(id: string, options: { limit?: number; threshold?: number } = {}): Promise<CommandResult<Memory[]>> {
    Validator.required(id, 'memory ID');
    Validator.uuid(id, 'memory ID');

    const query = `
      query RelatedMemories($id: ID!, $options: RelatedOptions) {
        relatedMemories(id: $id, options: $options) {
          id
          title
          content
          tags
          similarity
          relationshipType
          createdAt
        }
      }
    `;

    const response = await this.apiClient.request(query, {
      id,
      options: {
        limit: options.limit || 10,
        minSimilarity: options.threshold || 0.3
      }
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to get related memories', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.relatedMemories || [], 'Related memories retrieved successfully');
  }

  async duplicate(id: string, newTitle?: string): Promise<CommandResult<Memory>> {
    Validator.required(id, 'memory ID');
    Validator.uuid(id, 'memory ID');

    const mutation = `
      mutation DuplicateMemory($id: ID!, $newTitle: String) {
        duplicateMemory(id: $id, newTitle: $newTitle) {
          id
          title
          content
          tags
          contextId
          createdAt
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      id,
      newTitle
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to duplicate memory', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.duplicateMemory, 'Memory duplicated successfully');
  }

  async bulkDelete(memoryIds: string[], force = false): Promise<CommandResult<{ deleted: number; errors: any[] }>> {
    if (!memoryIds || memoryIds.length === 0) {
      return { 
        success: false, 
        error: 'At least one memory ID is required',
        timestamp: new Date().toISOString()
      };
    }

    memoryIds.forEach(id => Validator.uuid(id, 'memory ID'));

    const mutation = `
      mutation BulkDeleteMemories($memoryIds: [ID!]!, $force: Boolean!) {
        bulkDeleteMemories(memoryIds: $memoryIds, force: $force) {
          deleted
          errors {
            memoryId
            error
          }
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      memoryIds,
      force
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to delete memories', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    const result = response.data?.bulkDeleteMemories;
    return createSuccessResult(result, `Deleted ${result?.deleted || 0} memories`);
  }

  async export(memoryIds: string[], format: 'json' | 'csv' | 'markdown' = 'json'): Promise<CommandResult<string>> {
    if (!memoryIds || memoryIds.length === 0) {
      return { 
        success: false, 
        error: 'At least one memory ID is required',
        timestamp: new Date().toISOString()
      };
    }

    memoryIds.forEach(id => Validator.uuid(id, 'memory ID'));

    const query = `
      query ExportMemories($memoryIds: [ID!]!, $format: ExportFormat!) {
        exportMemories(memoryIds: $memoryIds, format: $format)
      }
    `;

    const response = await this.apiClient.request(query, {
      memoryIds,
      format: format.toUpperCase()
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to export memories', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.exportMemories, 'Memories exported successfully');
  }
}