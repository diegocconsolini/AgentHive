import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Brain, Plus, TrendingUp, Clock, Hash, BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const GET_MEMORIES = gql`
  query GetMemories {
    memories {
      id
      title
      content
      tags
      createdAt
      updatedAt
    }
  }
`;

const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      name
      role
    }
  }
`;

export const DashboardPage: React.FC = () => {
  const { data: userData, loading: userLoading } = useQuery(GET_ME);
  const { data: memoriesData, loading: memoriesLoading, error } = useQuery(GET_MEMORIES);

  if (userLoading || memoriesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
      </div>
    );
  }

  const memories = memoriesData?.memories || [];
  const user = userData?.me;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-primary-100 mt-1">
              Here's what's happening with your memories today.
            </p>
          </div>
          <Brain className="w-12 h-12 text-primary-200" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Memories
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {memories.length}
                </p>
              </div>
              <Brain className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  This Week
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  12
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Most Used Tag
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  work
                </p>
              </div>
              <Hash className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg/Day
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  3.2
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Memories */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Recent Memories
            </h3>
            <button className="btn btn-primary btn-sm inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Memory
            </button>
          </div>
        </div>
        <div className="card-content">
          {memories.length > 0 ? (
            <div className="space-y-4">
              {memories.slice(0, 5).map((memory: any) => (
                <div
                  key={memory.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {memory.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                        {memory.content.substring(0, 150)}
                        {memory.content.length > 150 && '...'}
                      </p>
                      {memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {memory.tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300"
                            >
                              {tag}
                            </span>
                          ))}
                          {memory.tags.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{memory.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-4">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No memories yet
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first memory!
              </p>
              <button className="btn btn-primary inline-flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Memory
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};