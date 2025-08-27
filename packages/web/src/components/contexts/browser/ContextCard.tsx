import React from 'react';
import { Context } from '../../../types/context';
import { ContextIcon, ImportanceBadge } from '../shared';

interface ContextCardProps {
  context: Context;
  selected?: boolean;
  onSelect?: (context: Context) => void;
  onToggleSelect?: (context: Context) => void;
  showCheckbox?: boolean;
  compact?: boolean;
  className?: string;
}

export const ContextCard: React.FC<ContextCardProps> = ({
  context,
  selected = false,
  onSelect,
  onToggleSelect,
  showCheckbox = false,
  compact = false,
  className = ''
}) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(context);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(context);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024) * 10) / 10} MB`;
  };

  const getContentPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200 cursor-pointer
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
        ${selected ? 'ring-2 ring-blue-500 border-blue-500 dark:border-blue-400' : ''}
        ${context.isArchived ? 'opacity-75' : ''}
        ${context.isStale ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700' : ''}
        ${compact ? 'p-3' : 'p-4'}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {showCheckbox && (
          <div className="pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={handleCheckboxChange}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="flex-shrink-0 pt-1">
          <ContextIcon type={context.type} size={compact ? 'sm' : 'md'} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title and Importance */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {context.title || `Untitled ${context.type}`}
            </h3>
            <ImportanceBadge 
              importance={context.importance} 
              size={compact ? 'sm' : 'md'}
            />
          </div>

          {/* Content Preview */}
          {!compact && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {getContentPreview(context.content)}
            </p>
          )}

          {/* Tags */}
          {context.tags && context.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {context.tags.slice(0, compact ? 2 : 4).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                >
                  {tag}
                </span>
              ))}
              {context.tags.length > (compact ? 2 : 4) && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{context.tags.length - (compact ? 2 : 4)} more
                </span>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <span>{formatSize(context.metadata?.size || 0)}</span>
              <span>{context.metadata?.wordCount || 0} words</span>
              {context.relationships && context.relationships.length > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  {context.relationships.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span title="Last accessed">
                {formatDate(context.accessedAt)}
              </span>
              {context.source && (
                <span className="text-blue-600 dark:text-blue-400" title="Source">
                  {context.source}
                </span>
              )}
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-2 mt-2">
            {context.isStale && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Stale
              </span>
            )}
            {context.isArchived && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                  <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Archived
              </span>
            )}
            {context.version > 1 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">
                v{context.version}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextCard;