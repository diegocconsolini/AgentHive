import React, { useState, useCallback } from 'react';
import { 
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  History,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Lock,
  Key,
  Server,
  FileText,
  Code,
  Database,
  Cloud,
  Workflow,
  Copy,
  ExternalLink
} from 'lucide-react';
import type { ConfigurationEnvironment, ConfigurationItem, ConfigValidation } from '@/types/admin';
import { useConfigManagement } from '@/hooks/useConfigManagement';
import { formatDate } from '@/lib/utils';

export const ConfigManagement: React.FC = () => {
  const {
    environments,
    activeEnvironment,
    configurations,
    loading,
    error,
    isDirty,
    validationErrors,
    setActiveEnvironment,
    updateConfiguration,
    createConfiguration,
    deleteConfiguration,
    saveChanges,
    discardChanges,
    deployConfiguration,
    importConfiguration,
    exportConfiguration,
    validateConfiguration,
    getConfigurationHistory
  } = useConfigManagement();

  const [selectedConfig, setSelectedConfig] = useState<ConfigurationItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('configurations');

  const handleCreateConfig = useCallback(async (configData: any) => {
    try {
      await createConfiguration(configData);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create configuration:', error);
    }
  }, [createConfiguration]);

  const handleUpdateConfig = useCallback(async (key: string, configData: any) => {
    try {
      await updateConfiguration(key, configData);
      setShowEditDialog(false);
      setSelectedConfig(null);
    } catch (error) {
      console.error('Failed to update configuration:', error);
    }
  }, [updateConfiguration]);

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getConfigIcon = (config: ConfigurationItem) => {
    if (config.isSecret) return <Lock className="h-4 w-4" />;
    
    const category = config.key.split('.')[0].toLowerCase();
    switch (category) {
      case 'database':
      case 'db':
        return <Database className="h-4 w-4" />;
      case 'api':
      case 'service':
        return <Server className="h-4 w-4" />;
      case 'auth':
      case 'security':
        return <Key className="h-4 w-4" />;
      case 'feature':
      case 'features':
        return <Workflow className="h-4 w-4" />;
      case 'cloud':
      case 'aws':
      case 'gcp':
      case 'azure':
        return <Cloud className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getConfigValue = (config: ConfigurationItem) => {
    if (config.isSecret && !showSecrets[config.key]) {
      return '••••••••';
    }
    
    if (config.type === 'object' || config.type === 'array') {
      return JSON.stringify(config.value, null, 2);
    }
    
    return String(config.value);
  };

  const filteredConfigurations = configurations.filter(config => {
    const matchesSearch = config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || config.type === filterType;
    const matchesCategory = filterCategory === 'all' || config.key.startsWith(filterCategory + '.');
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const configCategories = [...new Set(configurations.map(config => config.key.split('.')[0]))];

  const renderConfigCard = (config: ConfigurationItem) => {
    const hasError = validationErrors[config.key];
    
    return (
      <div key={config.key} className={`card ${hasError ? 'border-red-200 dark:border-red-800' : ''}`}>
        <div className="card-header pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getConfigIcon(config)}
              <div>
                <h3 className="text-md font-mono font-semibold text-gray-900 dark:text-gray-100">{config.key}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {config.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {config.isRequired && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                  Required
                </span>
              )}
              {config.isSecret && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200">
                  Secret
                </span>
              )}
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                {config.type}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card-content pt-0">
          <div className="space-y-3">
            {hasError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-3">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    {hasError}
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Value</label>
                <div className="flex space-x-1">
                  {config.isSecret && (
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => toggleSecretVisibility(config.key)}
                    >
                      {showSecrets[config.key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => navigator.clipboard.writeText(getConfigValue(config))}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => {
                      setSelectedConfig(config);
                      setShowEditDialog(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                {config.type === 'object' || config.type === 'array' ? (
                  <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                    {getConfigValue(config)}
                  </pre>
                ) : (
                  <div className="text-sm font-mono break-all text-gray-900 dark:text-gray-100">
                    {getConfigValue(config)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Environment: {config.environment}</span>
              <span>Modified: {formatDate(config.lastModified)} by {config.modifiedBy}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEnvironmentSelector = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
          <Globe className="h-5 w-5 mr-2" />
          Environment
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select the configuration environment to manage
        </p>
      </div>
      <div className="card-content">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {environments.map((env) => (
            <div
              key={env.name}
              className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-colors ${
                activeEnvironment?.name === env.name
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setActiveEnvironment(env.name)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{env.name}</h4>
                <div className="flex items-center space-x-2">
                  {env.isActive && (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    {env.configurations.length} configs
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{env.description}</p>
              {env.lastDeployed && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Deployed: {formatDate(env.lastDeployed)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              Failed to load configuration data: {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuration Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage application settings and environment variables</p>
        </div>
        <div className="flex space-x-2">
          {isDirty && (
            <>
              <button className="btn btn-outline" onClick={discardChanges}>
                Discard Changes
              </button>
              <button className="btn btn-primary" onClick={saveChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </>
          )}
          <button className="btn btn-outline" onClick={exportConfiguration}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="btn btn-outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Configuration
          </button>
        </div>
      </div>

      {/* Environment Selector */}
      {renderEnvironmentSelector()}

      {activeEnvironment && (
        <div>
          <div className="flex items-center justify-between">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'configurations'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('configurations')}
              >
                Configurations ({filteredConfigurations.length})
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'secrets'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('secrets')}
              >
                Secrets ({configurations.filter(c => c.isSecret).length})
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'validation'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('validation')}
              >
                Validation Rules
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('history')}
              >
                Change History
              </button>
            </div>
            
            {activeEnvironment.isActive && (
              <button className="btn btn-primary" onClick={() => deployConfiguration(activeEnvironment.name)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Deploy to {activeEnvironment.name}
              </button>
            )}
          </div>

          {activeTab === 'configurations' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
                </div>
                <div className="card-content">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                      <input
                        id="search"
                        type="text"
                        placeholder="Search configurations..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                      <select
                        id="type"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <option value="all">All types</option>
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="object">Object</option>
                        <option value="array">Array</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                      <select
                        id="category"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <option value="all">All categories</option>
                        {configCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        className="btn btn-outline"
                        onClick={() => {
                          setSearchTerm('');
                          setFilterType('all');
                          setFilterCategory('all');
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration Items */}
              <div className="grid gap-6 lg:grid-cols-2">
                {filteredConfigurations.map(renderConfigCard)}
              </div>

              {filteredConfigurations.length === 0 && (
                <div className="card">
                  <div className="card-content py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No configurations found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                        ? 'Try adjusting your filters or search terms.'
                        : 'Get started by creating your first configuration item.'}
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Configuration
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'secrets' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {configurations
                .filter(config => config.isSecret)
                .map(renderConfigCard)}
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Validation Rules</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configure validation rules for configuration items
                </p>
              </div>
              <div className="card-content">
                {/* Validation rules interface would go here */}
                <div className="text-center py-8">
                  <Code className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Validation rules configuration coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change History</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View configuration change history and rollback options
                </p>
              </div>
              <div className="card-content">
                {/* Configuration history would go here */}
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Configuration history coming soon...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Configuration Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCreateDialog(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create Configuration Item</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add a new configuration setting to the current environment
                </p>
              </div>
              <ConfigurationForm
                environment={activeEnvironment?.name || ''}
                onSubmit={handleCreateConfig}
                onCancel={() => setShowCreateDialog(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Configuration Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowEditDialog(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Configuration Item</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Update the configuration setting
                </p>
              </div>
              {selectedConfig && (
                <ConfigurationForm
                  config={selectedConfig}
                  environment={activeEnvironment?.name || ''}
                  onSubmit={(data) => handleUpdateConfig(selectedConfig.key, data)}
                  onCancel={() => {
                    setShowEditDialog(false);
                    setSelectedConfig(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ConfigurationFormProps {
  config?: ConfigurationItem;
  environment: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({ config, environment, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    key: config?.key || '',
    value: config?.value || '',
    type: config?.type || 'string',
    description: config?.description || '',
    isSecret: config?.isSecret || false,
    isRequired: config?.isRequired || false,
    environment: config?.environment || environment,
  });

  const [validationData, setValidationData] = useState<ConfigValidation>(
    config?.validation || {}
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let processedValue = formData.value;
    
    try {
      switch (formData.type) {
        case 'number':
          processedValue = Number(formData.value);
          break;
        case 'boolean':
          processedValue = formData.value === 'true' || formData.value === true;
          break;
        case 'object':
        case 'array':
          processedValue = JSON.parse(String(formData.value));
          break;
      }
    } catch (error) {
      alert('Invalid JSON format for object/array type');
      return;
    }

    onSubmit({
      ...formData,
      value: processedValue,
      validation: validationData,
    });
  };

  const handleValueChange = (newValue: any) => {
    setFormData(prev => ({ ...prev, value: newValue }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Configuration Key</label>
          <input
            id="key"
            type="text"
            required
            placeholder="e.g., database.host"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            disabled={!!config}
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
          <select
            id="type"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
        <textarea
          id="description"
          placeholder="Describe what this configuration controls..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Value</label>
        {formData.type === 'boolean' ? (
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={String(formData.value)}
            onChange={(e) => handleValueChange(e.target.value === 'true')}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        ) : formData.type === 'object' || formData.type === 'array' ? (
          <textarea
            id="value"
            placeholder={`Enter valid JSON ${formData.type}...`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
            value={typeof formData.value === 'object' 
              ? JSON.stringify(formData.value, null, 2) 
              : formData.value}
            onChange={(e) => handleValueChange(e.target.value)}
            rows={6}
          />
        ) : (
          <input
            id="value"
            type={formData.type === 'number' ? 'number' : 'text'}
            placeholder={`Enter ${formData.type} value...`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={formData.value}
            onChange={(e) => handleValueChange(e.target.value)}
          />
        )}
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isSecret"
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            checked={formData.isSecret}
            onChange={(e) => setFormData({ ...formData, isSecret: e.target.checked })}
          />
          <label htmlFor="isSecret" className="text-sm font-medium text-gray-700 dark:text-gray-300">Secret Value</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isRequired"
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            checked={formData.isRequired}
            onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
          />
          <label htmlFor="isRequired" className="text-sm font-medium text-gray-700 dark:text-gray-300">Required</label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {config ? 'Update Configuration' : 'Create Configuration'}
        </button>
      </div>
    </form>
  );
};