import React, { useState, useEffect } from 'react';
import { ContextViewerProps, Context, ContextVersion, ImportanceScore } from '../../../types/context';
import ContentRenderer from './ContentRenderer';
import MetadataPanel from './MetadataPanel';
import VersionHistory from './VersionHistory';

type ViewerTab = 'content' | 'metadata' | 'history';

export const ContextViewer: React.FC<ContextViewerProps> = ({
  context,
  versions,
  loading,
  error,
  onEdit,
  onVersionSelect,
  onImportanceUpdate,
  onTagUpdate,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<ViewerTab>('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ContextVersion | null>(null);
  const [isEditingImportance, setIsEditingImportance] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editingImportance, setEditingImportance] = useState<Partial<ImportanceScore>>({});
  const [editingTags, setEditingTags] = useState<string[]>([]);

  useEffect(() => {
    if (context) {
      setSelectedVersion(null);
      setEditingImportance({});
      setEditingTags(context.tags);
    }
  }, [context?.id]);

  const currentContext = selectedVersion ? {
    ...context!,
    content: selectedVersion.content,
    metadata: selectedVersion.metadata,
    version: selectedVersion.version
  } : context;

  const handleVersionSelect = (version: ContextVersion) => {
    setSelectedVersion(version);
    onVersionSelect(version);
    setActiveTab('content');
  };

  const handleBackToCurrent = () => {
    setSelectedVersion(null);
    if (context) {
      onVersionSelect({
        version: context.version,
        content: context.content,
        metadata: context.metadata,
        changedAt: context.updatedAt,
        changeType: 'updated'
      });
    }
  };

  const handleEditImportance = () => {
    if (context) {
      setEditingImportance({
        overall: context.importance.overall,
        factors: { ...context.importance.factors },
        isManuallySet: context.importance.isManuallySet,
        isLocked: context.importance.isLocked
      });
      setIsEditingImportance(true);
    }
  };

  const handleSaveImportance = () => {
    if (context && onImportanceUpdate && Object.keys(editingImportance).length > 0) {
      onImportanceUpdate(context.id, {
        ...editingImportance,
        isManuallySet: true,
        lastCalculated: new Date()
      });
    }
    setIsEditingImportance(false);
    setEditingImportance({});
  };

  const handleCancelImportanceEdit = () => {
    setIsEditingImportance(false);
    setEditingImportance({});
  };

  const handleEditTags = () => {
    if (context) {
      setEditingTags([...context.tags]);
      setIsEditingTags(true);
    }
  };

  const handleSaveTags = () => {
    if (context && onTagUpdate) {
      onTagUpdate(context.id, editingTags);
    }
    setIsEditingTags(false);
  };

  const handleCancelTagsEdit = () => {
    if (context) {
      setEditingTags([...context.tags]);
    }
    setIsEditingTags(false);
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !editingTags.includes(tag.trim())) {
      setEditingTags(prev => [...prev, tag.trim()]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditingTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <svg className="animate-spin mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading context...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
              Error loading context
            </h3>
            <p className="mt-1 text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentContext) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Select a context to view
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
              {currentContext.title || `Untitled ${currentContext.type}`}
            </h1>
            {selectedVersion && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                Version {selectedVersion.version}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {selectedVersion && (
              <button
                onClick={handleBackToCurrent}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Back to Current
              </button>
            )}
            {!readOnly && !selectedVersion && (
              <button
                onClick={() => onEdit(currentContext)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Edit Context
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {activeTab === 'content' && (
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search in content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className={`p-2 rounded-md transition-colors ${
                showLineNumbers 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              title="Toggle line numbers"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mt-4 -mb-4">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'metadata'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Metadata
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            History ({versions.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'content' && (
          <ContentRenderer
            context={currentContext}
            searchQuery={searchQuery}
            showLineNumbers={showLineNumbers}
            editable={!readOnly && !selectedVersion}
            onChange={(content) => {
              if (onEdit && context) {
                onEdit({ ...context, content });
              }
            }}
          />
        )}

        {activeTab === 'metadata' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetadataPanel
              context={currentContext}
              relationships={currentContext.relationships}
              onEditImportance={!readOnly && !selectedVersion ? handleEditImportance : undefined}
              onEditTags={!readOnly && !selectedVersion ? handleEditTags : undefined}
              onTagClick={(tag) => setSearchQuery(tag)}
            />
            
            {/* Additional metadata panels can go here */}
            <div className="space-y-6">
              {/* Placeholder for additional metadata views */}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <VersionHistory
            versions={versions}
            currentVersion={currentContext.version}
            onVersionSelect={handleVersionSelect}
            onCompareVersions={(v1, v2) => {
              console.log(`Compare versions ${v1} and ${v2}`);
              // Implement version comparison logic
            }}
          />
        )}
      </div>

      {/* Importance Edit Modal */}
      {isEditingImportance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Edit Importance Score
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overall Score
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={editingImportance.overall || 0}
                  onChange={(e) => setEditingImportance(prev => ({
                    ...prev,
                    overall: parseFloat(e.target.value)
                  }))}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {editingImportance.overall?.toFixed(1) || '0.0'} / 10
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingImportance.isLocked || false}
                    onChange={(e) => setEditingImportance(prev => ({
                      ...prev,
                      isLocked: e.target.checked
                    }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Lock score (prevent automatic updates)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleCancelImportanceEdit}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveImportance}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Edit Modal */}
      {isEditingTags && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Edit Tags
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {editingTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              
              <div>
                <input
                  type="text"
                  placeholder="Add a tag..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Press Enter to add a tag
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleCancelTagsEdit}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTags}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextViewer;