import React, { useState, useEffect, useCallback } from 'react';
import { ContextSearchFilters, ContextType } from '../../../types/context';

interface SearchInterfaceProps {
  onSearch: (filters: ContextSearchFilters) => void;
  onClear: () => void;
  availableTags: string[];
  availableSources: string[];
  loading?: boolean;
  className?: string;
}

const initialFilters: ContextSearchFilters = {
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
};

export const SearchInterface: React.FC<SearchInterfaceProps> = ({
  onSearch,
  onClear,
  availableTags,
  availableSources,
  loading = false,
  className = ''
}) => {
  const [filters, setFilters] = useState<ContextSearchFilters>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounced search
  const debouncedSearch = useCallback(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      onSearch(filters);
    }, 300);
    
    setSearchDebounceTimer(timer);
  }, [filters, onSearch, searchDebounceTimer]);

  useEffect(() => {
    debouncedSearch();
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [filters.query]);

  const handleFilterChange = (key: keyof ContextSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters(initialFilters);
    onClear();
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      handleFilterChange('tags', [...filters.tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    handleFilterChange('tags', filters.tags.filter(t => t !== tag));
  };

  const addSource = (source: string) => {
    if (!filters.source.includes(source)) {
      handleFilterChange('source', [...filters.source, source]);
    }
  };

  const removeSource = (source: string) => {
    handleFilterChange('source', filters.source.filter(s => s !== source));
  };

  const addContentType = (type: ContextType) => {
    if (!filters.contentType.includes(type)) {
      handleFilterChange('contentType', [...filters.contentType, type]);
    }
  };

  const removeContentType = (type: ContextType) => {
    handleFilterChange('contentType', filters.contentType.filter(t => t !== type));
  };

  const hasActiveFilters = 
    filters.query !== '' ||
    filters.dateRange !== null ||
    filters.importanceRange.min > 0 ||
    filters.importanceRange.max < 10 ||
    filters.tags.length > 0 ||
    filters.contentType.length > 0 ||
    filters.source.length > 0 ||
    filters.hasRelationships ||
    filters.isStale ||
    filters.isArchived ||
    filters.lastAccessedRange !== null;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search contexts..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
        >
          {showAdvanced ? 'Less' : 'More'} Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Clear all filters"
          >
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Created Date Range
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={filters.dateRange?.start.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const start = e.target.value ? new Date(e.target.value) : null;
                  handleFilterChange('dateRange', start ? { 
                    start, 
                    end: filters.dateRange?.end || new Date() 
                  } : null);
                }}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <input
                type="date"
                value={filters.dateRange?.end.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const end = e.target.value ? new Date(e.target.value) : null;
                  handleFilterChange('dateRange', end ? { 
                    start: filters.dateRange?.start || new Date('1970-01-01'), 
                    end 
                  } : null);
                }}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Importance Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Importance Score: {filters.importanceRange.min} - {filters.importanceRange.max}
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={filters.importanceRange.min}
                onChange={(e) => handleFilterChange('importanceRange', {
                  ...filters.importanceRange,
                  min: parseFloat(e.target.value)
                })}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={filters.importanceRange.max}
                onChange={(e) => handleFilterChange('importanceRange', {
                  ...filters.importanceRange,
                  max: parseFloat(e.target.value)
                })}
                className="flex-1"
              />
            </div>
          </div>

          {/* Content Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content Types
            </label>
            <div className="flex flex-wrap gap-2">
              {(['text', 'json', 'code', 'markdown', 'yaml', 'xml', 'csv', 'binary', 'image', 'document'] as ContextType[]).map(type => (
                <button
                  key={type}
                  onClick={() => filters.contentType.includes(type) ? removeContentType(type) : addContentType(type)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.contentType.includes(type)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-2 border-blue-300 dark:border-blue-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {availableTags.filter(tag => !filters.tags.includes(tag)).slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="px-2 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sources */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sources
            </label>
            <div className="space-y-2">
              {filters.source.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.source.map(source => (
                    <span
                      key={source}
                      className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                    >
                      {source}
                      <button
                        onClick={() => removeSource(source)}
                        className="ml-1 hover:text-green-600 dark:hover:text-green-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {availableSources.filter(source => !filters.source.includes(source)).slice(0, 10).map(source => (
                  <button
                    key={source}
                    onClick={() => addSource(source)}
                    className="px-2 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    + {source}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Boolean Filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasRelationships}
                onChange={(e) => handleFilterChange('hasRelationships', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Has relationships
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isStale}
                onChange={(e) => handleFilterChange('isStale', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show stale contexts
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isArchived}
                onChange={(e) => handleFilterChange('isArchived', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Include archived
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInterface;