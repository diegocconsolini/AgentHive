import React, { useState } from 'react';
import { 
  Zap,
  Key,
  Globe,
  Webhook,
  Shield,
  Users,
  Settings,
  Plus,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Building,
  Database,
  Cloud,
  Mail,
  Slack,
  Github,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: 'sso' | 'webhook' | 'api' | 'notification';
  provider: string;
  status: 'active' | 'inactive' | 'error';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  configuredAt: string;
  lastSync?: string;
}

const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Single Sign-On',
    type: 'sso',
    provider: 'Azure AD',
    status: 'active',
    description: 'SAML-based SSO for enterprise authentication',
    icon: Shield,
    configuredAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    lastSync: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    name: 'Slack Notifications',
    type: 'notification',
    provider: 'Slack',
    status: 'active',
    description: 'Send alerts and notifications to Slack channels',
    icon: Slack,
    configuredAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    lastSync: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: '3',
    name: 'GitHub Webhooks',
    type: 'webhook',
    provider: 'GitHub',
    status: 'inactive',
    description: 'Receive deployment notifications from GitHub Actions',
    icon: Github,
    configuredAt: new Date(Date.now() - 86400000 * 21).toISOString()
  },
  {
    id: '4',
    name: 'External API',
    type: 'api',
    provider: 'Custom REST API',
    status: 'error',
    description: 'Integration with legacy customer management system',
    icon: Database,
    configuredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastSync: new Date(Date.now() - 7200000).toISOString()
  }
];

export const EnterpriseIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState(mockIntegrations);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sso': return Shield;
      case 'webhook': return Webhook;
      case 'api': return Database;
      case 'notification': return Mail;
      default: return Zap;
    }
  };

  const renderIntegrationCard = (integration: Integration) => {
    const Icon = integration.icon;
    const TypeIcon = getTypeIcon(integration.type);
    
    return (
      <div key={integration.id} className="card hover:shadow-md transition-shadow">
        <div className="card-header pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Icon className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{integration.name}</h3>
                <p className="flex items-center space-x-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <TypeIcon className="h-4 w-4" />
                  <span>{integration.provider}</span>
                </p>
              </div>
            </div>
            <span className={getStatusColor(integration.status)}>
              {integration.status}
            </span>
          </div>
        </div>
        
        <div className="card-content pt-0">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{integration.description}</p>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Configured:</span>
              <span className="text-gray-900 dark:text-gray-100">{new Date(integration.configuredAt).toLocaleDateString()}</span>
            </div>
            {integration.lastSync && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Last Sync:</span>
                <span className="text-gray-900 dark:text-gray-100">{new Date(integration.lastSync).toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex space-x-2">
              <button className="btn-outline btn-sm">
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </button>
              <button className="btn-outline btn-sm">
                <RefreshCw className="h-3 w-3 mr-1" />
                Test
              </button>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={integration.status === 'active'}
                readOnly
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderSSOConfiguration = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Single Sign-On Configuration
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure SAML, OAuth2, or OIDC providers for enterprise authentication
          </p>
        </div>
        <div className="card-content">
          <div className="grid gap-6 md:grid-cols-2">
            {['Azure AD', 'Google Workspace', 'Okta', 'Auth0'].map((provider) => (
              <div key={provider} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Cloud className="h-6 w-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{provider}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">SAML 2.0 / OAuth 2.0</p>
                    </div>
                  </div>
                  {provider === 'Azure AD' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <button className="btn-outline btn-sm">Configure</button>
                  )}
                </div>
                {provider === 'Azure AD' && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p>Status: Active • Last sync: 2 hours ago</p>
                    <p>Users: 156 • Groups: 12</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWebhookConfiguration = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Webhook className="h-5 w-5 mr-2" />
            Webhook Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure webhooks for real-time event notifications
          </p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <button className="btn btn-primary mb-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </button>
            
            {[
              { url: 'https://api.example.com/webhooks/alerts', events: ['user.created', 'alert.triggered'], status: 'active' },
              { url: 'https://hooks.slack.com/services/...', events: ['system.error', 'backup.completed'], status: 'active' },
              { url: 'https://discord.com/api/webhooks/...', events: ['deployment.finished'], status: 'inactive' }
            ].map((webhook, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-mono text-sm break-all text-gray-900 dark:text-gray-100">{webhook.url}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Events: {webhook.events.join(', ')}
                    </div>
                  </div>
                  <span className={getStatusColor(webhook.status)}>
                    {webhook.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button className="btn-outline btn-sm">Edit</button>
                  <button className="btn-outline btn-sm">Test</button>
                  <button className="btn-outline btn-sm text-red-600 hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMultiTenancy = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Multi-Tenant Architecture
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage tenant isolation and resource allocation
          </p>
        </div>
        <div className="card-content">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: 'Acme Corp', users: 45, storage: '12.3 GB', status: 'active' },
              { name: 'TechStart Inc', users: 23, storage: '8.7 GB', status: 'active' },
              { name: 'Global Solutions', users: 67, storage: '21.4 GB', status: 'active' },
              { name: 'Innovation Labs', users: 12, storage: '3.2 GB', status: 'suspended' }
            ].map((tenant, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{tenant.name}</h4>
                  <span className={getStatusColor(tenant.status)}>
                    {tenant.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Users:</span>
                    <span>{tenant.users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage:</span>
                    <span>{tenant.storage}</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <button className="btn-outline btn-sm">Manage</button>
                  <button className="btn-outline btn-sm">Settings</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAPIGateway = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            API Gateway Configuration
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure rate limiting, authentication, and API routing
          </p>
        </div>
        <div className="card-content">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="card">
                <div className="card-content p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Key className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">API Keys</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">24</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Active keys</div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-content p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">Requests/min</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">1,247</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Current rate</div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-content p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">Rate Limits</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">12</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Active rules</div>
                </div>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-600" />

            <div>
              <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Rate Limiting Rules</h4>
              <div className="space-y-3">
                {[
                  { endpoint: '/api/v1/users', limit: '100/min', tier: 'Standard' },
                  { endpoint: '/api/v1/analytics', limit: '10/min', tier: 'Premium' },
                  { endpoint: '/api/v1/admin/*', limit: '1000/min', tier: 'Admin' }
                ].map((rule, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
                    <div>
                      <div className="font-mono text-sm text-gray-900 dark:text-gray-100">{rule.endpoint}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{rule.tier} tier</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{rule.limit}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">requests per minute</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Enterprise Integrations</h1>
          <p className="text-gray-600 dark:text-gray-300">Configure SSO, webhooks, multi-tenancy, and API gateway settings</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline">
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </button>
          <button className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'sso', label: 'Single Sign-On' },
            { key: 'webhooks', label: 'Webhooks' },
            { key: 'tenancy', label: 'Multi-Tenancy' },
            { key: 'gateway', label: 'API Gateway' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {integrations.map(renderIntegrationCard)}
          </div>
        </div>
      )}

      {activeTab === 'sso' && (
        <div className="space-y-6">
          {renderSSOConfiguration()}
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          {renderWebhookConfiguration()}
        </div>
      )}

      {activeTab === 'tenancy' && (
        <div className="space-y-6">
          {renderMultiTenancy()}
        </div>
      )}

      {activeTab === 'gateway' && (
        <div className="space-y-6">
          {renderAPIGateway()}
        </div>
      )}
    </div>
  );
};