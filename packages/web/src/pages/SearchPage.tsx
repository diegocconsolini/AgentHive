import React from 'react';
import { Search, Filter, Zap } from 'lucide-react';

export const SearchPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
          <Search className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Advanced Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find memories using powerful search capabilities
          </p>
        </div>
      </div>

      {/* Search Interface */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search across all your memories..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <button className="btn btn-secondary inline-flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </button>
          <button className="btn btn-outline inline-flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            AI Search
          </button>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Advanced Search Engine
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This page will feature full-text search, semantic search, and advanced filtering capabilities.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Coming soon in the next development phase...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};