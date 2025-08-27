import React from 'react';
import { AgentCategory, AgentStatus, AgentSearchParams } from '../../../types';

interface AgentFiltersProps {
  searchParams: AgentSearchParams;
  onSearchParamsChange: (params: Partial<AgentSearchParams>) => void;
  availableCategories: AgentCategory[];
  availableTags: string[];
  agentCount: number;
  className?: string;
}

const categoryLabels: Record<AgentCategory, string> = {
  development: 'Development',
  infrastructure: 'Infrastructure', 
  'ai-ml': 'AI/ML',
  security: 'Security',
  data: 'Data',
  business: 'Business',
  general: 'General',
};

const statusLabels: Record<AgentStatus, string> = {
  stopped: 'Stopped',
  starting: 'Starting',
  running: 'Running',
  stopping: 'Stopping',
  error: 'Error',
  unknown: 'Unknown',
};

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Rating' },
  { value: 'lastUpdated', label: 'Last Updated' },
];

export const AgentFilters: React.FC<AgentFiltersProps> = ({
  searchParams,
  onSearchParamsChange,
  availableCategories,
  availableTags,
  agentCount,
  className = '',
}) => {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchParamsChange({ query: e.target.value || undefined });
  };

  const handleCategoryChange = (category: AgentCategory | undefined) => {
    onSearchParamsChange({ category });
  };

  const handleStatusChange = (status: AgentStatus | undefined) => {
    onSearchParamsChange({ status });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = searchParams.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    onSearchParamsChange({ tags: newTags.length > 0 ? newTags : undefined });
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    onSearchParamsChange({ 
      sortBy: sortBy as any, 
      sortOrder 
    });
  };

  const clearFilters = () => {
    onSearchParamsChange({
      query: undefined,
      category: undefined,
      status: undefined,
      tags: undefined,
    });
  };

  const hasActiveFilters = Boolean(
    searchParams.query || 
    searchParams.category || 
    searchParams.status || 
    (searchParams.tags && searchParams.tags.length > 0)
  );

  return (
    <div className={`${className} space-y-4`}>
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search agents by name, description, or capabilities..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          value={searchParams.query || ''}
          onChange={handleQueryChange}
        />
      </div>

      {/* Quick filters row */}
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {agentCount} agents
        </span>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Clear filters
          </button>
        )}

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300">
            Sort by:
          </label>
          <select
            value={`${searchParams.sortBy || 'name'}-${searchParams.sortOrder || 'asc'}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleSortChange(sortBy, sortOrder as 'asc' | 'desc');
            }}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {sortOptions.map(({ value, label }) => (
              <React.Fragment key={value}>
                <option value={`${value}-asc`}>{label} (A-Z)</option>
                <option value={`${value}-desc`}>{label} (Z-A)</option>
              </React.Fragment>
            ))}
          </select>
        </div>
      </div>

      {/* Category filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange(undefined)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              !searchParams.category
                ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {availableCategories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                searchParams.category === category
                  ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange(undefined)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              !searchParams.status
                ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {(Object.keys(statusLabels) as AgentStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                searchParams.status === status
                  ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Tags filter */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {availableTags.slice(0, 20).map((tag) => {
              const isSelected = searchParams.tags?.includes(tag) || false;
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    isSelected
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {availableTags.length > 20 && (
              <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                +{availableTags.length - 20} more tags
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

AgentFilters.displayName = 'AgentFilters';