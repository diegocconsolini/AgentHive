import React from 'react';
import { Tags, Plus, Hash } from 'lucide-react';

export const TagsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
            <Tags className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Tags
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Organize and manage your memory tags
            </p>
          </div>
        </div>
        
        <button className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New Tag
        </button>
      </div>

      {/* Tag Cloud Preview */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Tag Cloud
          </h3>
        </div>
        <div className="card-content">
          <div className="flex flex-wrap gap-2">
            {['work', 'personal', 'ideas', 'meeting', 'important', 'todo', 'research'].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300"
              >
                <Hash className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <Tags className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Tag Management
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This page will provide comprehensive tag management including creation, editing, and organization.
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