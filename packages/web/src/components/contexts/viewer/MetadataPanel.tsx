import React from 'react';
import { Context, ContextRelationship, RelationshipType } from '../../../types/context';
import { ContextIcon, ImportanceBadge } from '../shared';

interface MetadataPanelProps {
  context: Context;
  relationships?: ContextRelationship[];
  onRelationshipClick?: (contextId: string) => void;
  onTagClick?: (tag: string) => void;
  onEditImportance?: () => void;
  onEditTags?: () => void;
  className?: string;
}

const relationshipTypeLabels: Record<RelationshipType, string> = {
  references: 'References',
  depends_on: 'Depends on',
  similar_to: 'Similar to',
  follows: 'Follows',
  parent_of: 'Parent of',
  child_of: 'Child of',
  related_to: 'Related to'
};

const relationshipTypeColors: Record<RelationshipType, string> = {
  references: 'text-blue-600 dark:text-blue-400',
  depends_on: 'text-orange-600 dark:text-orange-400',
  similar_to: 'text-green-600 dark:text-green-400',
  follows: 'text-purple-600 dark:text-purple-400',
  parent_of: 'text-red-600 dark:text-red-400',
  child_of: 'text-pink-600 dark:text-pink-400',
  related_to: 'text-gray-600 dark:text-gray-400'
};

export const MetadataPanel: React.FC<MetadataPanelProps> = ({
  context,
  relationships = [],
  onRelationshipClick,
  onTagClick,
  onEditImportance,
  onEditTags,
  className = ''
}) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024) * 10) / 10} MB`;
    return `${Math.round(bytes / (1024 * 1024 * 1024) * 10) / 10} GB`;
  };

  const formatDuration = (startDate: Date, endDate: Date) => {
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ago`;
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <ContextIcon type={context.type} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {context.title || `Untitled ${context.type}`}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ID: {context.id}
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-2">
          {context.isStale && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100">
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Stale Context
            </span>
          )}
          {context.isArchived && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Archived
            </span>
          )}
          {context.version > 1 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h4a1 1 0 000-2H4V4h16v6a1 1 0 102 0V4a2 2 0 00-2-2H4zm4 11a1 1 0 011-1h7a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Version {context.version}
            </span>
          )}
        </div>
      </div>

      {/* Importance Score */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Importance Score
          </h3>
          {onEditImportance && (
            <button
              onClick={onEditImportance}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Edit
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <ImportanceBadge 
              importance={context.importance} 
              size="lg" 
              showFactors={false}
            />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(context.importance.overall * 10) / 10}/10
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Recency</span>
              <span className="font-medium">{Math.round(context.importance.factors.recency * 10) / 10}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div 
                className="bg-blue-600 h-1 rounded-full" 
                style={{ width: `${context.importance.factors.recency * 10}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Frequency</span>
              <span className="font-medium">{Math.round(context.importance.factors.frequency * 10) / 10}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div 
                className="bg-green-600 h-1 rounded-full" 
                style={{ width: `${context.importance.factors.frequency * 10}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Relevance</span>
              <span className="font-medium">{Math.round(context.importance.factors.relevance * 10) / 10}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div 
                className="bg-purple-600 h-1 rounded-full" 
                style={{ width: `${context.importance.factors.relevance * 10}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">User Rating</span>
              <span className="font-medium">{Math.round(context.importance.factors.userRating * 10) / 10}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div 
                className="bg-orange-600 h-1 rounded-full" 
                style={{ width: `${context.importance.factors.userRating * 10}%` }}
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {context.importance.isManuallySet && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Manually adjusted
              </span>
            )}
            {context.importance.isLocked && (
              <span className="flex items-center gap-1 mt-1">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Score locked
              </span>
            )}
            <div className="mt-1">
              Last calculated: {formatDate(context.importance.lastCalculated)}
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Tags
          </h3>
          {onEditTags && (
            <button
              onClick={onEditTags}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Edit
            </button>
          )}
        </div>
        
        {context.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {context.tags.map(tag => (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No tags assigned
          </p>
        )}
      </div>

      {/* Basic Metadata */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Metadata
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Size:</span>
            <span className="font-medium">{formatSize(context.metadata.size)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Words:</span>
            <span className="font-medium">{context.metadata.wordCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Lines:</span>
            <span className="font-medium">{context.metadata.lineCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Characters:</span>
            <span className="font-medium">{context.metadata.characterCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Encoding:</span>
            <span className="font-medium">{context.metadata.encoding}</span>
          </div>
          {context.metadata.language && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Language:</span>
              <span className="font-medium">{context.metadata.language}</span>
            </div>
          )}
          {context.source && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Source:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{context.source}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Timeline
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Created:</span>
            <span className="font-medium">{formatDate(context.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Updated:</span>
            <span className="font-medium">{formatDate(context.updatedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Last Accessed:</span>
            <span className="font-medium">
              {formatDate(context.accessedAt)}
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                ({formatDuration(context.accessedAt, new Date())})
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Relationships */}
      {relationships.length > 0 && (
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Relationships ({relationships.length})
          </h3>
          <div className="space-y-2">
            {relationships.map(rel => (
              <div 
                key={rel.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
              >
                <div className={`text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-800 ${relationshipTypeColors[rel.type]}`}>
                  {relationshipTypeLabels[rel.type]}
                </div>
                <button
                  onClick={() => onRelationshipClick?.(rel.targetContextId)}
                  className="flex-1 text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate"
                >
                  Context {rel.targetContextId.substring(0, 8)}...
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(rel.strength * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetadataPanel;