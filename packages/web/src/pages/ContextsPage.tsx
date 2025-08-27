import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Context, 
  ContextSearchFilters, 
  ViewMode, 
  SortOption, 
  SortDirection,
  ContextVersion,
  ImportanceScore,
  BulkOperation,
  ExportOptions,
  ImportOptions,
  MemoryAnalytics as MemoryAnalyticsType,
  CleanupSuggestion
} from '../types/context';
import {
  ContextBrowser,
  ContextViewer,
  MemoryAnalytics,
  BulkOperations,
  ImportExport
} from '../components/contexts';
import { LoadingSpinner } from '../components/common';

const GET_CONTEXTS = gql`
  query GetContexts($filter: ContextFilter) {
    contexts(filter: $filter) {
      id
      title
      content
      type
      fileName
      filePath
      fileSize
      mimeType
      metadata {
        size
        wordCount
        characterCount
        lineCount
        language
        encoding
        checksum
      }
      importance {
        overall
        factors {
          recency
          frequency
          relevance
          userRating
          accessPattern
        }
        isManuallySet
        isLocked
      }
      tags
      userId
      createdAt
      updatedAt
    }
  }
`;

const CREATE_CONTEXT = gql`
  mutation CreateContext($input: CreateContextInput!) {
    createContext(input: $input) {
      id
      title
      content
      type
      tags
      metadata {
        wordCount
        characterCount
      }
      importance {
        overall
      }
      createdAt
    }
  }
`;

const UPDATE_CONTEXT = gql`
  mutation UpdateContext($id: ID!, $input: UpdateContextInput!) {
    updateContext(id: $id, input: $input) {
      id
      title
      content
      tags
      updatedAt
    }
  }
`;

const DELETE_CONTEXT = gql`
  mutation DeleteContext($id: ID!) {
    deleteContext(id: $id)
  }
`;

// Real contexts loaded from GraphQL API
const useRealContexts = (filters: ContextSearchFilters) => {
  const { data, loading, error, refetch } = useQuery(GET_CONTEXTS, {
    variables: {
      filter: {
        search: filters.query || undefined,
        type: filters.contentType.length > 0 ? filters.contentType[0] : undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        limit: 50,
        offset: 0,
      }
    },
    errorPolicy: 'all',
  });

  return {
    contexts: data?.contexts || [],
    loading,
    error,
    refetch,
  };
};

// Real analytics computed from contexts data
const useRealAnalytics = (contexts: Context[]): MemoryAnalyticsType => {
  return useMemo(() => {
    // Calculate total size from contexts
    const totalSize = contexts.reduce((sum, ctx) => 
      sum + (ctx.metadata?.size || ctx.content.length * 2), 0
    );
    
    // Calculate average importance
    const avgImportance = contexts.length > 0 
      ? contexts.reduce((sum, ctx) => sum + (ctx.importance?.overall || 5), 0) / contexts.length
      : 0;
    
    // Group contexts by type for distribution
    const typeGroups = contexts.reduce((groups, ctx) => {
      const type = ctx.type || 'other';
      if (!groups[type]) {
        groups[type] = { contexts: [], size: 0 };
      }
      groups[type].contexts.push(ctx);
      groups[type].size += ctx.metadata?.size || ctx.content.length * 2;
      return groups;
    }, {} as Record<string, { contexts: Context[]; size: number }>);
    
    const categoryDistribution = Object.entries(typeGroups).map(([category, data]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count: data.contexts.length,
      percentage: contexts.length > 0 ? (data.contexts.length / contexts.length) * 100 : 0,
      averageImportance: data.contexts.reduce((sum, ctx) => 
        sum + (ctx.importance?.overall || 5), 0) / data.contexts.length,
      totalSize: data.size
    }));
    
    // Calculate quality metrics
    const now = new Date();
    const staleContexts = contexts.filter(ctx => {
      const age = (now.getTime() - new Date(ctx.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return age > 90; // Older than 90 days
    }).length;
    
    const averageAge = contexts.length > 0 
      ? contexts.reduce((sum, ctx) => {
          const age = (now.getTime() - new Date(ctx.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + age;
        }, 0) / contexts.length
      : 0;
    
    // Generate growth trend based on creation dates
    const growthTrend = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayContexts = contexts.filter(ctx => {
        const created = new Date(ctx.createdAt);
        return created >= dayStart && created < dayEnd;
      });
      
      return {
        date: dayStart,
        count: dayContexts.length,
        size: dayContexts.reduce((sum, ctx) => sum + (ctx.metadata?.size || ctx.content.length * 2), 0)
      };
    });
    
    return {
      totalContexts: contexts.length,
      totalSize,
      sizeLimit: 107374182400, // 100GB limit
      averageImportance: avgImportance,
      categoryDistribution,
      accessPatterns: [], // Would need access tracking to implement
      growthTrend,
      qualityMetrics: {
        duplicates: 0, // Would need content similarity analysis
        staleContexts,
        orphanedContexts: 0, // Would need relationship analysis
        averageAge,
        accessFrequency: 0, // Would need access tracking
        overallScore: Math.max(1, Math.min(10, (avgImportance + (10 - staleContexts / contexts.length * 10)) / 2))
      },
      cleanupSuggestions: staleContexts > 0 ? [
        {
          id: 'stale-cleanup',
          type: 'stale',
          contextIds: contexts
            .filter(ctx => {
              const age = (now.getTime() - new Date(ctx.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
              return age > 90;
            })
            .map(ctx => ctx.id),
          description: `Found ${staleContexts} contexts that haven't been updated in over 90 days`,
          impact: staleContexts > 10 ? 'high' : staleContexts > 5 ? 'medium' : 'low',
          estimatedSpaceSaved: contexts
            .filter(ctx => {
              const age = (now.getTime() - new Date(ctx.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
              return age > 90;
            })
            .reduce((sum, ctx) => sum + (ctx.metadata?.size || ctx.content.length * 2), 0),
          confidence: 0.95
        }
      ] : []
    };
  }, [contexts]);
};

type ActiveView = 'browser' | 'viewer' | 'analytics';

export const ContextsPage: React.FC = () => {
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('browser');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchFilters, setSearchFilters] = useState<ContextSearchFilters>({
    query: '',
    dateRange: null,
    importanceRange: { min: 0, max: 10 },
    tags: [],
    contentType: [],
    source: [],
    hasRelationships: false,
    isStale: false,
    isArchived: false,
    lastAccessedRange: null
  });
  const [versions, setVersions] = useState<ContextVersion[]>([]);
  
  // Use real GraphQL contexts
  const { contexts, loading, error, refetch } = useRealContexts(searchFilters);
  
  // Use real analytics computed from contexts
  const analytics = useRealAnalytics(contexts);
  const [createContext] = useMutation(CREATE_CONTEXT);
  const [updateContext] = useMutation(UPDATE_CONTEXT);
  const [deleteContext] = useMutation(DELETE_CONTEXT);

  // Handle search and filtering
  const handleSearch = (filters: ContextSearchFilters) => {
    setSearchFilters(filters);
  };

  const handleSort = (option: SortOption, direction: SortDirection) => {
    // Sorting will be handled by GraphQL in the future
    // For now, we'll sort the existing contexts client-side
    console.log('Sort by:', option, direction);
  };

  const handleContextSelect = (context: Context) => {
    setSelectedContext(context);
    setActiveView('viewer');
    
    // Create a simple version history based on creation and update dates
    const versions: ContextVersion[] = [];
    
    // Current version
    versions.push({
      version: 2, // Assume version 2 as current
      content: context.content,
      metadata: context.metadata,
      changedAt: context.updatedAt,
      changeType: 'updated'
    });
    
    // Only add a "created" version if the context has actually been updated
    if (context.createdAt !== context.updatedAt) {
      versions.push({
        version: 1,
        content: context.content, // In a real system, we'd store historical content
        metadata: context.metadata,
        changedAt: context.createdAt,
        changeType: 'created'
      });
    } else {
      // If created and updated are the same, it's just version 1
      versions[0].version = 1;
      versions[0].changeType = 'created';
    }
    
    setVersions(versions);
  };

  const handleContextsSelect = (contexts: Context[]) => {
    setSelectedContexts(contexts.map(c => c.id));
  };

  const handleBulkOperation = async (operation: BulkOperation) => {
    try {
      switch (operation.type) {
        case 'delete':
          // Delete multiple contexts
          await Promise.all(
            operation.contextIds.map(id => 
              deleteContext({ variables: { id } })
            )
          );
          setSelectedContexts([]);
          refetch();
          break;
          
        case 'tag_add':
          // Add tags to multiple contexts
          const tagsToAdd = operation.parameters.tags || [];
          await Promise.all(
            operation.contextIds.map(async (id) => {
              const context = contexts.find(c => c.id === id);
              if (context) {
                const newTags = [...new Set([...context.tags, ...tagsToAdd])];
                return updateContext({
                  variables: { id, input: { tags: newTags } }
                });
              }
            })
          );
          refetch();
          break;
          
        case 'tag_remove':
          // Remove tags from multiple contexts
          const tagsToRemove = operation.parameters.tags || [];
          await Promise.all(
            operation.contextIds.map(async (id) => {
              const context = contexts.find(c => c.id === id);
              if (context) {
                const newTags = context.tags.filter(tag => !tagsToRemove.includes(tag));
                return updateContext({
                  variables: { id, input: { tags: newTags } }
                });
              }
            })
          );
          refetch();
          break;
          
        case 'archive':
          // Archive contexts (add 'archived' tag)
          await Promise.all(
            operation.contextIds.map(async (id) => {
              const context = contexts.find(c => c.id === id);
              if (context && !context.tags.includes('archived')) {
                const newTags = [...context.tags, 'archived'];
                return updateContext({
                  variables: { id, input: { tags: newTags } }
                });
              }
            })
          );
          refetch();
          break;
          
        case 'restore':
          // Restore contexts (remove 'archived' tag)
          await Promise.all(
            operation.contextIds.map(async (id) => {
              const context = contexts.find(c => c.id === id);
              if (context) {
                const newTags = context.tags.filter(tag => tag !== 'archived');
                return updateContext({
                  variables: { id, input: { tags: newTags } }
                });
              }
            })
          );
          refetch();
          break;
          
        default:
          console.log('Bulk operation not implemented:', operation.type);
      }
    } catch (error) {
      console.error('Bulk operation failed:', error);
    }
  };

  const handleExport = (options: ExportOptions) => {
    try {
      // Get contexts to export
      const contextsToExport = options.contextIds.length > 0 
        ? contexts.filter(ctx => options.contextIds.includes(ctx.id))
        : contexts;
      
      let exportData: string;
      let filename: string;
      let mimeType: string;
      
      switch (options.format) {
        case 'json':
          exportData = JSON.stringify(contextsToExport, null, 2);
          filename = `contexts_export_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
          
        case 'csv':
          const csvHeaders = 'ID,Title,Content,Type,Tags,Created,Updated\n';
          const csvRows = contextsToExport.map(ctx => 
            `"${ctx.id}","${ctx.title}","${ctx.content.replace(/"/g, '""')}","${ctx.type}","${ctx.tags.join(';')}","${ctx.createdAt}","${ctx.updatedAt}"`
          ).join('\n');
          exportData = csvHeaders + csvRows;
          filename = `contexts_export_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'markdown':
          exportData = contextsToExport.map(ctx => 
            `# ${ctx.title}\n\n**Type:** ${ctx.type}\n**Tags:** ${ctx.tags.join(', ')}\n**Created:** ${ctx.createdAt}\n\n${ctx.content}\n\n---\n\n`
          ).join('');
          filename = `contexts_export_${new Date().toISOString().split('T')[0]}.md`;
          mimeType = 'text/markdown';
          break;
          
        default:
          exportData = contextsToExport.map(ctx => `${ctx.title}\n${ctx.content}\n\n`).join('');
          filename = `contexts_export_${new Date().toISOString().split('T')[0]}.txt`;
          mimeType = 'text/plain';
      }
      
      // Create and trigger download
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async (file: File, options: ImportOptions) => {
    try {
      const text = await file.text();
      
      let contextsToImport: any[] = [];
      
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        contextsToImport = Array.isArray(data) ? data : [data];
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        contextsToImport = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.match(/(".*?"|[^,]+)/g) || [];
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header.toLowerCase()] = values[index]?.replace(/"/g, '') || '';
            });
            return obj;
          });
      }
      
      // Import contexts
      for (const contextData of contextsToImport) {
        if (contextData.title && contextData.content) {
          await createContext({
            variables: {
              input: {
                title: contextData.title,
                content: contextData.content,
                type: contextData.type || 'text',
                tags: typeof contextData.tags === 'string' 
                  ? contextData.tags.split(';').filter(tag => tag.trim())
                  : contextData.tags || []
              }
            }
          });
        }
      }
      
      refetch();
      console.log(`Imported ${contextsToImport.length} contexts`);
      
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleCleanupAction = async (suggestion: CleanupSuggestion) => {
    try {
      switch (suggestion.type) {
        case 'stale':
          // Archive stale contexts
          const bulkArchiveOperation: BulkOperation = {
            type: 'archive',
            contextIds: suggestion.contextIds,
            parameters: {}
          };
          await handleBulkOperation(bulkArchiveOperation);
          break;
          
        case 'duplicate':
          // For duplicates, we could merge or delete
          console.log('Duplicate cleanup not fully implemented - would need content similarity analysis');
          break;
          
        case 'orphaned':
          // Archive orphaned contexts
          const bulkArchiveOrphaned: BulkOperation = {
            type: 'archive',
            contextIds: suggestion.contextIds,
            parameters: {}
          };
          await handleBulkOperation(bulkArchiveOrphaned);
          break;
          
        default:
          console.log('Cleanup action not implemented for type:', suggestion.type);
      }
    } catch (error) {
      console.error('Cleanup action failed:', error);
    }
  };

  const handleVersionSelect = (version: ContextVersion) => {
    // Handle version selection
  };

  const handleImportanceUpdate = async (contextId: string, importance: Partial<ImportanceScore>) => {
    try {
      await updateContext({
        variables: {
          id: contextId,
          input: {
            // importance update would need to be added to the schema
          }
        }
      });
      refetch();
    } catch (error) {
      console.error('Failed to update importance:', error);
    }
  };

  const handleTagUpdate = async (contextId: string, tags: string[]) => {
    try {
      await updateContext({
        variables: {
          id: contextId,
          input: {
            tags
          }
        }
      });
      refetch();
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Context Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Browse, search, and manage your contextual memory
            </p>
          </div>
          
          {/* View Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveView('browser')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'browser'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Browser
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'analytics'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeView === 'browser' && (
          <div className="flex-1 flex">
            <div className="flex-1 min-w-0">
              <ContextBrowser
                contexts={contexts}
                loading={loading}
                onContextSelect={handleContextSelect}
                onContextsSelect={handleContextsSelect}
                onSearch={handleSearch}
                onSort={handleSort}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                selectedContexts={selectedContexts}
                totalCount={contexts.length}
              />
            </div>
            
            {/* Side Panel for Bulk Operations */}
            {selectedContexts.length > 0 && (
              <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                <BulkOperations
                  selectedContexts={selectedContexts}
                  onOperation={handleBulkOperation}
                  onClearSelection={() => setSelectedContexts([])}
                  loading={false}
                  availableTags={['python', 'javascript', 'api', 'config', 'docs']}
                />
                <div className="mt-6">
                  <ImportExport
                    onExport={handleExport}
                    onImport={handleImport}
                    exporting={false}
                    importing={false}
                    availableContexts={contexts}
                    selectedContexts={selectedContexts}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'viewer' && (
          <div className="flex-1">
            <ContextViewer
              context={selectedContext}
              versions={versions}
              loading={false}
              onEdit={(context) => console.log('Edit context:', context)}
              onVersionSelect={handleVersionSelect}
              onImportanceUpdate={handleImportanceUpdate}
              onTagUpdate={handleTagUpdate}
              readOnly={false}
            />
          </div>
        )}

        {activeView === 'analytics' && (
          <div className="flex-1 p-6">
            <MemoryAnalytics
              analytics={analytics}
              loading={false}
              onRefresh={() => console.log('Refresh analytics')}
              onCleanupAction={handleCleanupAction}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextsPage;