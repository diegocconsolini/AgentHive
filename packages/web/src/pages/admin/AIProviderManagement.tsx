import React, { useState, useEffect } from 'react';
import {
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Activity,
  Zap,
  DollarSign,
  Clock
} from 'lucide-react';
import { useQuery, useMutation, gql } from '@apollo/client';

// GraphQL queries and mutations
const GET_AI_PROVIDERS = gql`
  query GetAIProviders {
    aiProviders {
      name
      type
      endpoint
      models
      enabled
      priority
      costPerToken
      maxTokens
      timeout
      health {
        healthy
        latency
        error
      }
      metrics {
        requestCount
        totalTokens
        averageResponseTime
        totalCost
        successRate
        lastUsed
      }
    }
  }
`;

const TEST_AI_PROVIDERS = gql`
  mutation TestAIProviders {
    testAIProviders {
      providerId
      healthy
      latency
      error
    }
  }
`;

const UPDATE_AI_PROVIDER = gql`
  mutation UpdateAIProvider($providerId: String!, $updates: AIProviderInput!) {
    updateAIProvider(providerId: $providerId, updates: $updates) {
      success
      message
    }
  }
`;

interface AIProvider {
  name: string;
  type: 'local' | 'api' | 'openai-compatible';
  endpoint: string;
  apiKey?: string;
  models: string[];
  costPerToken?: number;
  maxTokens: number;
  timeout?: number;
  enabled: boolean;
  priority: number;
  headers?: Record<string, string>;
  health?: {
    healthy: boolean;
    latency?: number;
    error?: string;
  };
  metrics?: {
    requestCount: number;
    totalTokens: number;
    averageResponseTime: number;
    totalCost: number;
    successRate: number;
    lastUsed: string;
  };
}

const AIProviderManagement: React.FC = () => {
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AIProvider>>({});

  const { data, loading, error, refetch } = useQuery(GET_AI_PROVIDERS, {
    pollInterval: 30000, // Refresh every 30 seconds
  });

  const [testProviders, { loading: testing }] = useMutation(TEST_AI_PROVIDERS, {
    onCompleted: () => refetch(),
  });

  const [updateProvider] = useMutation(UPDATE_AI_PROVIDER, {
    onCompleted: () => {
      setEditingProvider(null);
      setEditForm({});
      refetch();
    },
  });

  const providers: AIProvider[] = data?.aiProviders || [];

  const handleTest = async () => {
    try {
      await testProviders();
    } catch (err) {
      console.error('Failed to test providers:', err);
    }
  };

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider.name);
    setEditForm(provider);
  };

  const handleSave = async () => {
    if (!editingProvider) return;

    try {
      await updateProvider({
        variables: {
          providerId: editingProvider,
          updates: editForm,
        },
      });
    } catch (err) {
      console.error('Failed to update provider:', err);
    }
  };

  const toggleApiKeyVisibility = (providerName: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerName]: !prev[providerName],
    }));
  };

  const getStatusColor = (health?: { healthy: boolean; error?: string }) => {
    if (!health) return 'text-gray-500';
    return health.healthy ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (health?: { healthy: boolean; error?: string }) => {
    if (!health) return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    return health.healthy ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'openai-compatible': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'api': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'local': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-600 dark:text-red-400 p-8">
      Failed to load AI providers: {error.message}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            AI Provider Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure and monitor your AI service providers
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing...' : 'Test All'}</span>
          </button>
        </div>
      </div>

      {/* Provider List */}
      <div className="grid gap-6">
        {providers.map((provider) => (
          <div
            key={provider.name}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            {/* Provider Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(provider.health)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {provider.name} Provider
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(provider.type)}`}>
                      {provider.type.toUpperCase()}
                    </span>
                    <span className={`text-sm ${getStatusColor(provider.health)}`}>
                      {provider.health?.healthy ? 'Healthy' : 'Unhealthy'}
                      {provider.health?.latency && (
                        <span className="text-gray-500 ml-1">
                          ({provider.health.latency}ms)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Priority Badge */}
                <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                  Priority: {provider.priority}
                </span>
                
                {/* Enable/Disable Toggle */}
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={provider.enabled}
                    onChange={(e) => {
                      updateProvider({
                        variables: {
                          providerId: provider.name,
                          updates: { enabled: e.target.checked },
                        },
                      });
                    }}
                    className="sr-only"
                  />
                  <div className={`relative w-10 h-6 rounded-full transition-colors ${
                    provider.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      provider.enabled ? 'translate-x-4' : ''
                    }`} />
                  </div>
                </label>

                <button
                  onClick={() => handleEdit(provider)}
                  className="btn-ghost p-2"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Provider Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Endpoint
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded">
                    {provider.endpoint}
                  </p>
                </div>

                {provider.type !== 'local' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      API Key
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded flex-1">
                        {showApiKeys[provider.name] 
                          ? provider.apiKey || 'Not configured' 
                          : '••••••••••••••••'
                        }
                      </p>
                      <button
                        onClick={() => toggleApiKeyVisibility(provider.name)}
                        className="btn-ghost p-1"
                      >
                        {showApiKeys[provider.name] ? 
                          <EyeOff className="w-4 h-4" /> : 
                          <Eye className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Models
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {provider.models.map((model) => (
                      <span
                        key={model}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Metrics */}
                {provider.metrics && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Usage Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {provider.metrics.requestCount}
                          </div>
                          <div className="text-gray-500">Requests</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {provider.metrics.totalTokens.toLocaleString()}
                          </div>
                          <div className="text-gray-500">Tokens</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {provider.metrics.averageResponseTime}ms
                          </div>
                          <div className="text-gray-500">Avg Time</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-purple-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            ${provider.metrics.totalCost.toFixed(4)}
                          </div>
                          <div className="text-gray-500">Total Cost</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {provider.health?.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-300">
                        {provider.health.error}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingProvider && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Edit {editingProvider} Provider
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Endpoint
                </label>
                <input
                  type="url"
                  value={editForm.endpoint || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, endpoint: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key 
                  <span className="text-gray-500 text-xs ml-2">
                    {editForm.type === 'local' || editForm.endpoint?.includes('localhost') || editForm.endpoint?.includes('192.168') || editForm.endpoint?.includes('127.0.0.1') 
                      ? '(Optional - Local provider)' 
                      : '(Required for cloud providers)'
                    }
                  </span>
                </label>
                <input
                  type="password"
                  value={editForm.apiKey || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder={editForm.type === 'local' || editForm.endpoint?.includes('localhost') || editForm.endpoint?.includes('192.168') || editForm.endpoint?.includes('127.0.0.1') 
                    ? 'Leave empty for local providers like LM Studio' 
                    : 'Enter your API key'
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={editForm.priority || 0}
                  onChange={(e) => setEditForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="300000"
                  value={editForm.timeout || 30000}
                  onChange={(e) => setEditForm(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cost per Token
                </label>
                <input
                  type="number"
                  step="0.00001"
                  min="0"
                  value={editForm.costPerToken || 0}
                  onChange={(e) => setEditForm(prev => ({ ...prev, costPerToken: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingProvider(null);
                  setEditForm({});
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
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

export default AIProviderManagement;