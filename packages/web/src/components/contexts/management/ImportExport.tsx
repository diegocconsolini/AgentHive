import React, { useState } from 'react';
import { ImportExportProps, ExportOptions, ImportOptions, ExportFormat } from '../../../types/context';

export const ImportExport: React.FC<ImportExportProps> = ({
  onExport,
  onImport,
  exporting,
  importing,
  exportProgress,
  importProgress,
  availableContexts,
  selectedContexts
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeRelationships: true,
    includeVersionHistory: false,
    compression: false
  });
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    format: 'json',
    overwriteExisting: false,
    preserveIds: true,
    importRelationships: true,
    importVersionHistory: false
  });

  const handleExport = () => {
    const options = {
      ...exportOptions,
      selectedContexts: selectedContexts.length > 0 ? selectedContexts : undefined
    };
    onExport(options);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file, importOptions);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('export')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'export'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Export
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'import'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Import
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Export Contexts
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedContexts.length > 0 
                  ? `Export ${selectedContexts.length} selected contexts`
                  : `Export all ${availableContexts.length} contexts`
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Format
                </label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as ExportFormat }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="markdown">Markdown</option>
                  <option value="txt">Plain Text</option>
                  <option value="zip">ZIP Archive</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeMetadata}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Include metadata
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeRelationships}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeRelationships: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Include relationships
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeVersionHistory}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeVersionHistory: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Include version history
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.compression}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, compression: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Compress output
                  </span>
                </label>
              </div>
            </div>

            {exporting && exportProgress !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Exporting...</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
            >
              {exporting ? 'Exporting...' : 'Export Contexts'}
            </button>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Import Contexts
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Import contexts from a previously exported file
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  File Format
                </label>
                <select
                  value={importOptions.format}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, format: e.target.value as ExportFormat }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="zip">ZIP Archive</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.overwriteExisting}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Overwrite existing
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.preserveIds}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, preserveIds: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Preserve IDs
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.importRelationships}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, importRelationships: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Import relationships
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.importVersionHistory}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, importVersionHistory: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Import version history
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select File
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      JSON, CSV, ZIP files
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json,.csv,.zip"
                    onChange={handleFileUpload}
                    disabled={importing}
                  />
                </label>
              </div>
            </div>

            {importing && importProgress !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Importing...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExport;