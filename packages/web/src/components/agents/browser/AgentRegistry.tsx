import React, { useState, useEffect, useMemo } from 'react';
import { Agent, AgentSearchParams, AgentCategory } from '../../../types';
import { AgentCard } from './AgentCard';
import { AgentFilters } from './AgentFilters';
import { CategoryBrowser } from './CategoryBrowser';
import { LoadingSpinner } from '../../common/LoadingSpinner';

interface AgentRegistryProps {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  selectedAgent?: Agent | null;
  onAgentSelect?: (agent: Agent) => void;
  onAgentToggleStatus?: (agentId: string, currentStatus: string) => void;
  showCategories?: boolean;
  compact?: boolean;
  className?: string;
}

// Mock data for development - remove when real API is implemented
const generateMockAgents = (): Agent[] => [
  {
    id: '1',
    name: 'python-pro',
    description: 'Expert Python developer with deep knowledge of frameworks, best practices, and performance optimization.',
    version: '2.1.0',
    tags: ['python', 'django', 'flask', 'async', 'testing'],
    category: 'development',
    model: 'sonnet',
    capabilities: ['Code generation', 'Debugging', 'Performance optimization', 'Testing'],
    dependencies: ['code-formatter', 'test-runner'],
    lastUpdated: '2024-08-20T10:30:00Z',
    popularity: 15420,
    rating: 4.8,
    status: 'running',
    config: {} as any,
    performance: {
      agentId: '1',
      metrics: {
        cpuUsage: 25,
        memoryUsage: 180,
        apiCalls: 1247,
        successRate: 0.96,
        avgResponseTime: 1.2,
        medianResponseTime: 0.9,
        p95ResponseTime: 2.1,
        errorCount: 12,
        uptime: 99.8,
      },
      healthScore: 95,
      lastChecked: '2024-08-26T12:00:00Z',
      trends: {
        responseTime: [],
        apiCalls: [],
        errorRate: [],
      },
    },
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-08-20T10:30:00Z',
    isActive: true,
    hasErrors: false,
  },
  {
    id: '2', 
    name: 'rust-pro',
    description: 'Systems programming specialist with expertise in Rust, WebAssembly, and high-performance applications.',
    version: '1.8.3',
    tags: ['rust', 'wasm', 'performance', 'systems'],
    category: 'development',
    model: 'sonnet',
    capabilities: ['Memory management', 'Concurrency', 'WebAssembly', 'CLI tools'],
    dependencies: ['cargo-tools'],
    lastUpdated: '2024-08-18T14:20:00Z',
    popularity: 8930,
    rating: 4.9,
    status: 'stopped',
    config: {} as any,
    performance: {
      agentId: '2',
      metrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        apiCalls: 0,
        successRate: 0.98,
        avgResponseTime: 0.8,
        medianResponseTime: 0.7,
        p95ResponseTime: 1.5,
        errorCount: 3,
        uptime: 100,
      },
      healthScore: 100,
      lastChecked: '2024-08-26T12:00:00Z',
      trends: {
        responseTime: [],
        apiCalls: [],
        errorRate: [],
      },
    },
    createdAt: '2024-02-10T09:15:00Z',
    updatedAt: '2024-08-18T14:20:00Z',
    isActive: false,
    hasErrors: false,
  },
  {
    id: '3',
    name: 'devops-expert',
    description: 'DevOps automation specialist for CI/CD, containerization, and cloud infrastructure management.',
    version: '3.2.1',
    tags: ['docker', 'kubernetes', 'ci-cd', 'aws', 'terraform'],
    category: 'infrastructure',
    model: 'opus',
    capabilities: ['Container orchestration', 'Infrastructure as Code', 'Monitoring', 'Deployment'],
    dependencies: ['cloud-apis', 'monitoring-tools'],
    lastUpdated: '2024-08-25T16:45:00Z',
    popularity: 12350,
    rating: 4.7,
    status: 'running',
    config: {} as any,
    performance: {
      agentId: '3',
      metrics: {
        cpuUsage: 45,
        memoryUsage: 320,
        apiCalls: 2156,
        successRate: 0.94,
        avgResponseTime: 2.1,
        medianResponseTime: 1.8,
        p95ResponseTime: 3.2,
        errorCount: 24,
        uptime: 98.5,
      },
      healthScore: 88,
      lastChecked: '2024-08-26T12:00:00Z',
      trends: {
        responseTime: [],
        apiCalls: [],
        errorRate: [],
      },
    },
    createdAt: '2024-01-20T11:30:00Z',
    updatedAt: '2024-08-25T16:45:00Z',
    isActive: true,
    hasErrors: false,
  },
];

export const AgentRegistry: React.FC<AgentRegistryProps> = ({
  agents: propAgents = [],
  loading = false,
  error = null,
  selectedAgent,
  onAgentSelect,
  onAgentToggleStatus,
  showCategories = true,
  compact = false,
  className = '',
}) => {
  // Use mock data for development
  const agents = propAgents.length > 0 ? propAgents : generateMockAgents();
  
  const [searchParams, setSearchParams] = useState<AgentSearchParams>({
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: 20,
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'category'>('list');

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let filtered = [...agents];

    // Apply search filter
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(query)) ||
        agent.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (searchParams.category) {
      filtered = filtered.filter(agent => agent.category === searchParams.category);
    }

    // Apply status filter
    if (searchParams.status) {
      filtered = filtered.filter(agent => agent.status === searchParams.status);
    }

    // Apply tag filters
    if (searchParams.tags && searchParams.tags.length > 0) {
      filtered = filtered.filter(agent =>
        searchParams.tags!.every(tag => agent.tags.includes(tag))
      );
    }

    // Apply sorting
    if (searchParams.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (searchParams.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'popularity':
            aValue = a.popularity;
            bValue = b.popularity;
            break;
          case 'rating':
            aValue = a.rating;
            bValue = b.rating;
            break;
          case 'lastUpdated':
            aValue = new Date(a.lastUpdated).getTime();
            bValue = new Date(b.lastUpdated).getTime();
            break;
          default:
            return 0;
        }

        if (searchParams.sortOrder === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    return filtered;
  }, [agents, searchParams]);

  // Extract available categories and tags
  const availableCategories = useMemo(() => {
    return Array.from(new Set(agents.map(a => a.category)));
  }, [agents]);

  const availableTags = useMemo(() => {
    const allTags = agents.flatMap(a => a.tags);
    return Array.from(new Set(allTags)).sort();
  }, [agents]);

  const handleSearchParamsChange = (newParams: Partial<AgentSearchParams>) => {
    setSearchParams(prev => ({ ...prev, ...newParams }));
  };

  const handleCategorySelect = (category?: AgentCategory) => {
    handleSearchParamsChange({ category });
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-center py-12`}>
        <div className="text-red-600 dark:text-red-400 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Failed to load agents</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${className} h-full flex gap-6`}>
      {/* Sidebar - Categories and Filters */}
      {showCategories && (
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-6 space-y-6">
            <CategoryBrowser
              agents={agents}
              selectedCategory={searchParams.category}
              onCategorySelect={handleCategorySelect}
            />
            
            <AgentFilters
              searchParams={searchParams}
              onSearchParamsChange={handleSearchParamsChange}
              availableCategories={availableCategories}
              availableTags={availableTags}
              agentCount={filteredAgents.length}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Agent Registry
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Showing {filteredAgents.length} of {agents.length} agents
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* Filters bar when sidebar is hidden */}
        {!showCategories && (
          <div className="mb-6">
            <AgentFilters
              searchParams={searchParams}
              onSearchParamsChange={handleSearchParamsChange}
              availableCategories={availableCategories}
              availableTags={availableTags}
              agentCount={filteredAgents.length}
            />
          </div>
        )}

        {/* Agent list */}
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              No agents found
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        ) : (
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-4'
            }
          `}>
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgent?.id === agent.id}
                onSelect={onAgentSelect}
                onToggleStatus={onAgentToggleStatus}
                compact={viewMode === 'grid' || compact}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

AgentRegistry.displayName = 'AgentRegistry';