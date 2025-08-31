import React, { useState, useEffect } from 'react';
import {
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Edit,
  Eye,
  EyeOff,
  Activity,
  Zap,
  DollarSign,
  Clock,
  Server
} from 'lucide-react';

// Types
interface AIProvider {
  name: string;
  type: 'local' | 'api' | 'openai-compatible';
  endpoint: string;
  apiKey?: string;
  models: string[];
  costPerToken?: number;
  maxTokens: number;
  timeout: number;
  enabled: boolean;
  priority: number;
  headers?: Record<string, string>;
  metrics: {
    providerId: string;
    model: string;
    requestCount: number;
    totalTokens: number;
    averageResponseTime: number;
    totalCost: number;
    successRate: number;
    lastUsed: string;
  };
}

interface ProviderHealth {
  healthy: boolean;
  latency?: number;
  error?: string;
}

// REST API functions
const SYSTEM_API_BASE = 'http://localhost:4001/api';

const fetchProviders = async () => {
  const response = await fetch(`${SYSTEM_API_BASE}/providers`);
  if (!response.ok) throw new Error('Failed to fetch providers');
  return response.json();
};

const testProviders = async () => {
  const response = await fetch(`${SYSTEM_API_BASE}/providers/test`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to test providers');
  return response.json();
};

const updateProvider = async (providerId: string, updates: any) => {
  const response = await fetch(`${SYSTEM_API_BASE}/providers/${providerId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Failed to update provider');
  return response.json();
};

const AIProviderManagement: React.FC = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, ProviderHealth>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AIProvider>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  // Load providers on component mount
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProviders();
      setProviders(data.providers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);
      const results = await testProviders();
      setTestResults(results.results || {});
      
      // Count healthy vs unhealthy providers
      const healthyCount = Object.values(results.results || {}).filter(r => r.healthy).length;
      const totalCount = Object.keys(results.results || {}).length;
      
      if (healthyCount === totalCount) {
        setSuccess(`All ${totalCount} provider(s) are healthy and responding!`);
      } else {
        setSuccess(`${healthyCount}/${totalCount} providers are healthy. Check details below.`);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test providers');
    } finally {
      setTesting(false);
    }
  };

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider.name);
    setEditForm(provider);
  };

  const handleSave = async () => {
    if (!editingProvider) return;

    try {
      await updateProvider(editingProvider, editForm);
      setEditingProvider(null);
      setEditForm({});
      loadProviders(); // Reload providers
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update provider');
    }
  };

  const toggleApiKeyVisibility = (providerName: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerName]: !prev[providerName]
    }));
  };

  const getHealthIcon = (providerName: string) => {
    const health = testResults[providerName];
    if (!health) return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    
    return health.healthy 
      ? <CheckCircle className="w-4 h-4 text-green-500" />
      : <XCircle className="w-4 h-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading AI providers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Provider Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure and monitor your AI service providers</p>
        </div>
        
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Testing...' : 'Test All'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700 dark:text-green-400">{success}</span>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {providers.map((provider) => (
          <div key={provider.name} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Server className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {provider.name} ({provider.type})
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    {getHealthIcon(provider.name)}
                    <span className="text-sm text-gray-500">
                      Priority: {provider.priority} | 
                      Enabled: {provider.enabled ? 'Yes' : 'No'} |
                      Models: {provider.models.length}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleEdit(provider)}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
            </div>

            {editingProvider === provider.name ? (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Endpoint
                  </label>
                  <input
                    type="url"
                    value={editForm.endpoint || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, endpoint: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={editForm.priority || 0}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.enabled || false}
                    onChange={(e) => setEditForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enabled
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingProvider(null);
                      setEditForm({});
                    }}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Endpoint
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded">
                    {provider.endpoint}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showApiKeys[provider.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {provider.metrics.requestCount} requests
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {provider.metrics.averageResponseTime}ms avg
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {provider.metrics.totalTokens} tokens
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ${provider.metrics.totalCost.toFixed(4)}
                    </span>
                  </div>
                </div>

                {testResults[provider.name] && !testResults[provider.name].healthy && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mt-3">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      <strong>Health Check Failed:</strong> {testResults[provider.name].error}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {providers.length === 0 && !loading && (
        <div className="text-center py-8">
          <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No AI providers configured</h3>
          <p className="text-gray-600 dark:text-gray-400">Configure your AI providers through environment variables or API calls.</p>
        </div>
      )}
    </div>
  );
};

export default AIProviderManagement;