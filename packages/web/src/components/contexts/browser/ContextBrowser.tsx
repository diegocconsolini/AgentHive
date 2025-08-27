import React, { useState, useMemo } from 'react';
import { ContextBrowserProps, Context, ViewMode, SortOption, SortDirection } from '../../../types/context';
import FilterPanel from './FilterPanel';
import SearchInterface from './SearchInterface';
import ContextCard from './ContextCard';
import ContextTree from './ContextTree';

interface ContextListProps {
  contexts: Context[];
  selectedContexts: string[];
  onContextSelect: (context: Context) => void;
  onContextToggle: (context: Context) => void;
  showCheckboxes: boolean;
  compact?: boolean;
}

const ContextList: React.FC<ContextListProps> = ({
  contexts,
  selectedContexts,
  onContextSelect,
  onContextToggle,
  showCheckboxes,
  compact = false
}) => {
  if (contexts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-sm">No contexts found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {contexts.map(context => (
        <ContextCard
          key={context.id}
          context={context}
          selected={selectedContexts.includes(context.id)}
          onSelect={onContextSelect}
          onToggleSelect={onContextToggle}
          showCheckbox={showCheckboxes}
          compact={compact}
        />
      ))}
    </div>
  );
};

interface TimelineViewProps {
  contexts: Context[];
  selectedContexts: string[];
  onContextSelect: (context: Context) => void;
  onContextToggle: (context: Context) => void;
  showCheckboxes: boolean;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  contexts,
  selectedContexts,
  onContextSelect,
  onContextToggle,
  showCheckboxes
}) => {
  // Group contexts by date
  const groupedContexts = useMemo(() => {
    const groups: Record<string, Context[]> = {};
    
    contexts.forEach(context => {
      const date = new Date(context.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(context);
    });

    // Sort groups by date (newest first)
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    return sortedGroups;
  }, [contexts]);

  if (contexts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-4 text-sm">No contexts in timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {groupedContexts.map(([date, dateContexts]) => (
        <div key={date}>
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="ml-4 flex-1 border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="space-y-3">
            {dateContexts.map(context => (
              <ContextCard
                key={context.id}
                context={context}
                selected={selectedContexts.includes(context.id)}
                onSelect={onContextSelect}
                onToggleSelect={onContextToggle}
                showCheckbox={showCheckboxes}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface CategoryViewProps {
  contexts: Context[];
  selectedContexts: string[];
  onContextSelect: (context: Context) => void;
  onContextToggle: (context: Context) => void;
  showCheckboxes: boolean;
}

const CategoryView: React.FC<CategoryViewProps> = ({
  contexts,
  selectedContexts,
  onContextSelect,
  onContextToggle,
  showCheckboxes
}) => {
  // Group contexts by type and then by tags
  const groupedContexts = useMemo(() => {
    const groups: Record<string, Context[]> = {};
    
    contexts.forEach(context => {
      const category = context.type.charAt(0).toUpperCase() + context.type.slice(1);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(context);
    });

    // Sort groups by context count
    const sortedGroups = Object.entries(groups).sort(([,a], [,b]) => b.length - a.length);
    return sortedGroups;
  }, [contexts]);

  if (contexts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="mt-4 text-sm">No contexts to categorize</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {groupedContexts.map(([category, categoryContexts]) => (
        <div key={category}>
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {category}
            </h3>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
              {categoryContexts.length}
            </span>
            <div className="ml-4 flex-1 border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryContexts.map(context => (
              <ContextCard
                key={context.id}
                context={context}
                selected={selectedContexts.includes(context.id)}
                onSelect={onContextSelect}
                onToggleSelect={onContextToggle}
                showCheckbox={showCheckboxes}
                compact
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ContextBrowser: React.FC<ContextBrowserProps> = ({
  contexts,
  loading,
  error,
  onContextSelect,
  onContextsSelect,
  onSearch,
  onSort,
  viewMode,
  onViewModeChange,
  selectedContexts,
  totalCount
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('importance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [availableTags] = useState<string[]>(['python', 'api', 'debug', 'config', 'docs', 'tutorial']);
  const [availableSources] = useState<string[]>(['cli', 'web', 'agent', 'manual', 'import']);

  // Sort contexts
  const sortedContexts = useMemo(() => {
    const sorted = [...contexts].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Handle nested properties
      if (sortBy === 'importance') {
        aValue = a.importance.overall;
        bValue = b.importance.overall;
      }

      // Handle dates
      if (sortBy === 'created' || sortBy === 'updated' || sortBy === 'accessed') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle size
      if (sortBy === 'size') {
        aValue = a.metadata.size;
        bValue = b.metadata.size;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [contexts, sortBy, sortDirection]);

  const handleSort = (option: SortOption, direction: SortDirection) => {
    setSortBy(option);
    setSortDirection(direction);
    onSort(option, direction);
  };

  const handleContextToggle = (context: Context) => {
    const newSelected = selectedContexts.includes(context.id)
      ? selectedContexts.filter(id => id !== context.id)
      : [...selectedContexts, context.id];
    
    const selectedContextObjects = sortedContexts.filter(c => newSelected.includes(c.id));
    onContextsSelect(selectedContextObjects);
  };

  const relationships = contexts.flatMap(c => c.relationships || []);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading contexts
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Search Interface */}
      <SearchInterface
        onSearch={onSearch}
        onClear={() => onSearch({ 
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
        })}
        availableTags={availableTags}
        availableSources={availableSources}
        loading={loading}
        className="mx-4 mt-4"
      />

      {/* Filter Panel */}
      <FilterPanel
        sortBy={sortBy}
        sortDirection={sortDirection}
        viewMode={viewMode}
        onSortChange={handleSort}
        onViewModeChange={onViewModeChange}
        resultsCount={contexts.length}
        totalCount={totalCount}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="animate-spin mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading contexts...</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'list' && (
              <ContextList
                contexts={sortedContexts}
                selectedContexts={selectedContexts}
                onContextSelect={onContextSelect}
                onContextToggle={handleContextToggle}
                showCheckboxes={true}
              />
            )}
            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {sortedContexts.map(context => (
                  <ContextCard
                    key={context.id}
                    context={context}
                    selected={selectedContexts.includes(context.id)}
                    onSelect={onContextSelect}
                    onToggleSelect={handleContextToggle}
                    showCheckbox={true}
                    compact
                  />
                ))}
              </div>
            )}
            {viewMode === 'tree' && (
              <ContextTree
                contexts={sortedContexts}
                relationships={relationships}
                selectedContexts={selectedContexts}
                onContextSelect={onContextSelect}
                onContextToggle={handleContextToggle}
                showCheckboxes={true}
              />
            )}
            {viewMode === 'timeline' && (
              <TimelineView
                contexts={sortedContexts}
                selectedContexts={selectedContexts}
                onContextSelect={onContextSelect}
                onContextToggle={handleContextToggle}
                showCheckboxes={true}
              />
            )}
            {viewMode === 'category' && (
              <CategoryView
                contexts={sortedContexts}
                selectedContexts={selectedContexts}
                onContextSelect={onContextSelect}
                onContextToggle={handleContextToggle}
                showCheckboxes={true}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContextBrowser;