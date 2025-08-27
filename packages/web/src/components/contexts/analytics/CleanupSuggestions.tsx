import React from 'react';
import { CleanupSuggestion, CleanupType } from '../../../types/context';

interface CleanupSuggestionsProps {
  suggestions: CleanupSuggestion[];
  onAction: (suggestion: CleanupSuggestion) => void;
  className?: string;
}

const getTypeIcon = (type: CleanupType): string => {
  const icons = {
    duplicate: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
    stale: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    orphaned: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
    low_importance: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    unused: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    corrupted: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  };
  return icons[type];
};

const getTypeColor = (type: CleanupType): string => {
  const colors = {
    duplicate: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900',
    stale: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900',
    orphaned: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900',
    low_importance: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900',
    unused: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900',
    corrupted: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
  };
  return colors[type];
};

const getImpactColor = (impact: 'low' | 'medium' | 'high'): string => {
  const colors = {
    low: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    high: 'text-red-600 dark:text-red-400'
  };
  return colors[impact];
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const CleanupSuggestions: React.FC<CleanupSuggestionsProps> = ({
  suggestions,
  onAction,
  className = ''
}) => {
  const totalSpaceSaving = suggestions.reduce((sum, s) => sum + s.estimatedSpaceSaved, 0);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cleanup Suggestions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {suggestions.length} suggestions could save {formatBytes(totalSpaceSaving)}
            </p>
          </div>
          {suggestions.length > 0 && (
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors">
              Apply All
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {suggestions.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              All Clean!
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              No cleanup suggestions at this time. Your contexts are well organized.
            </p>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${getTypeColor(suggestion.type)}`}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTypeIcon(suggestion.type)} />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {suggestion.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleanup
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatBytes(suggestion.estimatedSpaceSaved)}
                        </div>
                        <div className={`text-xs ${getImpactColor(suggestion.impact)}`}>
                          {suggestion.impact} impact
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{suggestion.contextIds.length} contexts affected</span>
                      <span>{Math.round(suggestion.confidence * 100)}% confidence</span>
                    </div>

                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                        Preview
                      </button>
                      <button
                        onClick={() => onAction(suggestion)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Progress bar for confidence */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Confidence</span>
                      <span>{Math.round(suggestion.confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${
                          suggestion.confidence >= 0.8 
                            ? 'bg-green-500' 
                            : suggestion.confidence >= 0.6 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${suggestion.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CleanupSuggestions;