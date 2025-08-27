import React, { useState } from 'react';
import { ContextVersion, ContextDiff } from '../../../types/context';

interface VersionHistoryProps {
  versions: ContextVersion[];
  currentVersion: number;
  onVersionSelect: (version: ContextVersion) => void;
  onCompareVersions?: (version1: number, version2: number) => void;
  className?: string;
}

const getChangeTypeColor = (changeType: ContextVersion['changeType']): string => {
  const colorMap = {
    created: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900',
    updated: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900',
    importance_changed: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900',
    tags_updated: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900',
    archived: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900',
    restored: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900'
  };
  return colorMap[changeType] || 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900';
};

const getChangeTypeLabel = (changeType: ContextVersion['changeType']): string => {
  const labelMap = {
    created: 'Created',
    updated: 'Content Updated',
    importance_changed: 'Importance Changed',
    tags_updated: 'Tags Updated', 
    archived: 'Archived',
    restored: 'Restored'
  };
  return labelMap[changeType] || 'Changed';
};

const getChangeTypeIcon = (changeType: ContextVersion['changeType']): string => {
  const iconMap = {
    created: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    updated: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    importance_changed: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    tags_updated: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    archived: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    restored: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
  };
  return iconMap[changeType] || iconMap.updated;
};

interface DiffViewProps {
  diff: ContextDiff;
  className?: string;
}

const DiffView: React.FC<DiffViewProps> = ({ diff, className = '' }) => {
  const allLines = [
    ...diff.deletions.map(line => ({ ...line, type: 'removed' as const })),
    ...diff.additions.map(line => ({ ...line, type: 'added' as const })),
    ...diff.changes.map(line => ({ ...line, type: 'modified' as const }))
  ].sort((a, b) => a.lineNumber - b.lineNumber);

  if (allLines.length === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 dark:text-gray-400 ${className}`}>
        No changes to display
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg border ${className}`}>
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-gray-100">
        Changes ({allLines.length} lines)
      </div>
      <div className="max-h-64 overflow-y-auto">
        {allLines.map((line, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 px-3 py-1 text-sm font-mono ${
              line.type === 'added' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : line.type === 'removed'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'  
                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
            }`}
          >
            <span className="flex-shrink-0 w-8 text-right text-gray-500 dark:text-gray-400">
              {line.lineNumber}
            </span>
            <span className="flex-shrink-0 w-4">
              {line.type === 'added' && '+'}
              {line.type === 'removed' && '-'}
              {line.type === 'modified' && '~'}
            </span>
            <span className="flex-1 whitespace-pre-wrap break-all">
              {line.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  currentVersion,
  onVersionSelect,
  onCompareVersions,
  className = ''
}) => {
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [showDiff, setShowDiff] = useState<{ [key: number]: boolean }>({});

  const handleVersionSelect = (version: ContextVersion) => {
    onVersionSelect(version);
  };

  const handleCompareToggle = (versionNumber: number) => {
    if (selectedVersions.includes(versionNumber)) {
      setSelectedVersions(prev => prev.filter(v => v !== versionNumber));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions(prev => [...prev, versionNumber]);
    } else {
      // Replace the first selected version
      setSelectedVersions(prev => [prev[1], versionNumber]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompareVersions) {
      onCompareVersions(selectedVersions[0], selectedVersions[1]);
    }
  };

  const toggleDiff = (versionNumber: number) => {
    setShowDiff(prev => ({
      ...prev,
      [versionNumber]: !prev[versionNumber]
    }));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Version History
          </h3>
          {onCompareVersions && (
            <div className="flex items-center gap-2">
              {selectedVersions.length > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedVersions.length} selected
                </span>
              )}
              <button
                onClick={handleCompare}
                disabled={selectedVersions.length !== 2}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
              >
                Compare
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Version List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedVersions.map((version) => (
          <div key={version.version} className="p-4">
            <div className="flex items-start gap-3">
              {/* Compare Checkbox */}
              {onCompareVersions && (
                <input
                  type="checkbox"
                  checked={selectedVersions.includes(version.version)}
                  onChange={() => handleCompareToggle(version.version)}
                  className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
              )}

              {/* Version Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getChangeTypeColor(version.changeType)}`}>
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getChangeTypeIcon(version.changeType)} />
                      </svg>
                      {getChangeTypeLabel(version.changeType)}
                    </span>
                    
                    <span className={`font-semibold ${version.version === currentVersion ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      v{version.version}
                      {version.version === currentVersion && ' (Current)'}
                    </span>
                  </div>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(version.changedAt)}
                  </span>
                </div>

                {version.changeDescription && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {version.changeDescription}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVersionSelect(version)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    View Version
                  </button>
                  
                  {version.diff && (
                    <button
                      onClick={() => toggleDiff(version.version)}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                    >
                      {showDiff[version.version] ? 'Hide' : 'Show'} Changes
                    </button>
                  )}
                </div>

                {/* Diff Display */}
                {version.diff && showDiff[version.version] && (
                  <div className="mt-3">
                    <DiffView diff={version.diff} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedVersions.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No version history available</p>
        </div>
      )}
    </div>
  );
};

export default VersionHistory;