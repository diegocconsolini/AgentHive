import React, { useState } from 'react';
import { BulkOperationsProps, BulkOperation, BulkOperationType } from '../../../types/context';

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedContexts,
  onOperation,
  onClearSelection,
  loading,
  availableTags
}) => {
  const [selectedOperation, setSelectedOperation] = useState<BulkOperationType>('delete');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [importanceValue, setImportanceValue] = useState(5);

  if (selectedContexts.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          No contexts selected
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Select contexts from the browser to perform bulk operations
        </p>
      </div>
    );
  }

  const handleOperation = () => {
    const operation: BulkOperation = {
      type: selectedOperation,
      contextIds: selectedContexts,
      parameters: getOperationParameters()
    };
    onOperation(operation);
  };

  const getOperationParameters = () => {
    switch (selectedOperation) {
      case 'tag_add':
      case 'tag_remove':
        return { tags: newTags };
      case 'importance_update':
        return { importance: importanceValue };
      default:
        return {};
    }
  };

  const operations: Array<{ value: BulkOperationType; label: string; description: string; color: string }> = [
    { value: 'delete', label: 'Delete', description: 'Permanently delete selected contexts', color: 'text-red-600 dark:text-red-400' },
    { value: 'archive', label: 'Archive', description: 'Archive selected contexts', color: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'restore', label: 'Restore', description: 'Restore archived contexts', color: 'text-green-600 dark:text-green-400' },
    { value: 'tag_add', label: 'Add Tags', description: 'Add tags to selected contexts', color: 'text-blue-600 dark:text-blue-400' },
    { value: 'tag_remove', label: 'Remove Tags', description: 'Remove tags from selected contexts', color: 'text-purple-600 dark:text-purple-400' },
    { value: 'importance_update', label: 'Update Importance', description: 'Set importance score for selected contexts', color: 'text-orange-600 dark:text-orange-400' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Bulk Operations
        </h3>
        <button
          onClick={onClearSelection}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Clear Selection
        </button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          {selectedContexts.length} context{selectedContexts.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Operation
          </label>
          <select
            value={selectedOperation}
            onChange={(e) => setSelectedOperation(e.target.value as BulkOperationType)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {operations.map(op => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {operations.find(op => op.value === selectedOperation)?.description}
          </p>
        </div>

        {(selectedOperation === 'tag_add' || selectedOperation === 'tag_remove') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (newTags.includes(tag)) {
                        setNewTags(prev => prev.filter(t => t !== tag));
                      } else {
                        setNewTags(prev => [...prev, tag]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      newTags.includes(tag)
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-2 border-blue-300 dark:border-blue-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {newTags.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {newTags.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedOperation === 'importance_update' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Importance Score: {importanceValue}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={importanceValue}
              onChange={(e) => setImportanceValue(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0 (Low)</span>
              <span>10 (Critical)</span>
            </div>
          </div>
        )}

        <button
          onClick={handleOperation}
          disabled={loading}
          className={`w-full px-4 py-2 rounded-md text-white transition-colors ${
            selectedOperation === 'delete'
              ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
              : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
          }`}
        >
          {loading ? 'Processing...' : `Apply ${operations.find(op => op.value === selectedOperation)?.label}`}
        </button>
      </div>
    </div>
  );
};

export default BulkOperations;