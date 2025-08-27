import React from 'react';
import { SortOption, SortDirection, ViewMode } from '../../../types/context';

interface FilterPanelProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  viewMode: ViewMode;
  onSortChange: (option: SortOption, direction: SortDirection) => void;
  onViewModeChange: (mode: ViewMode) => void;
  resultsCount: number;
  totalCount: number;
  className?: string;
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'importance', label: 'Importance' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'accessed', label: 'Last Accessed' },
  { value: 'size', label: 'Size' },
  { value: 'title', label: 'Title' },
  { value: 'relevance', label: 'Relevance' }
];

const viewModes: Array<{ value: ViewMode; label: string; icon: string }> = [
  { 
    value: 'list', 
    label: 'List', 
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' 
  },
  { 
    value: 'card', 
    label: 'Card', 
    icon: 'M4 6a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z' 
  },
  { 
    value: 'tree', 
    label: 'Tree', 
    icon: 'M8 2v4M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2M6 6h12M6 6l-2 2M6 6l2 2M18 6l-2 2M18 6l2 2M12 10v8M10 14h4M8 18h8' 
  },
  { 
    value: 'timeline', 
    label: 'Timeline', 
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' 
  },
  { 
    value: 'category', 
    label: 'Category', 
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' 
  }
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  sortBy,
  sortDirection,
  viewMode,
  onSortChange,
  onViewModeChange,
  resultsCount,
  totalCount,
  className = ''
}) => {
  const handleSortChange = (newSortBy: SortOption) => {
    if (newSortBy === sortBy) {
      // Toggle direction if same sort option
      onSortChange(sortBy, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to desc for most options, asc for title
      const defaultDirection: SortDirection = newSortBy === 'title' ? 'asc' : 'desc';
      onSortChange(newSortBy, defaultDirection);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {resultsCount === totalCount ? (
            <span>{totalCount.toLocaleString()} contexts</span>
          ) : (
            <span>
              {resultsCount.toLocaleString()} of {totalCount.toLocaleString()} contexts
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <button
              onClick={() => onSortChange(sortBy, sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
            >
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sortDirection === 'asc' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                )}
              </svg>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {viewModes.map(mode => (
              <button
                key={mode.value}
                onClick={() => onViewModeChange(mode.value)}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === mode.value
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                title={mode.label}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mode.icon} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;