import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Copy, 
  CheckCircle,
  Globe,
  Database,
  Zap,
  Monitor,
  Shield,
  Code,
  Play,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

const ApiDocs: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string>('');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const CodeBlock: React.FC<{ children: string; language?: string; label?: string }> = ({ 
    children, 
    language = 'bash',
    label = 'Copy code'
  }) => (
    <div className="relative bg-gray-900 rounded-lg p-4 mb-4">
      <button
        onClick={() => copyToClipboard(children, label)}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
        title="Copy to clipboard"
      >
        {copiedText === label ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
      <pre className="text-sm text-gray-300 overflow-x-auto pr-12">
        <code className={`language-${language}`}>{children}</code>
      </pre>
    </div>
  );

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'healthy': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case 'degraded': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case 'down': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        <div className={`w-2 h-2 rounded-full mr-1 ${
          status === 'healthy' ? 'bg-green-400' : 
          status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
        }`}></div>
        {status}
      </span>
    );
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/health',
      description: 'System health check with Ollama status',
      category: 'System',
      response: {
        status: 'healthy',
        timestamp: '2025-08-30T00:00:00Z',
        service: 'AgentHive System API',
        version: '2.0.0',
        ollama: {
          healthy: true,
          baseUrl: 'http://172.28.96.1:11434',
          models: 3
        },
        system: {
          healthy: true,
          uptime: 3600
        },
        activeAgents: 12
      }
    },
    {
      method: 'GET',
      path: '/api/status',
      description: 'Detailed system status and configuration',
      category: 'System',
      response: {
        service: 'AgentHive System API',
        status: 'running',
        timestamp: '2025-08-30T00:00:00Z',
        features: {
          agentOrchestration: 'production',
          loadBalancing: 'active',
          aiProviders: 'ollama-primary',
          performanceMonitoring: 'real-time'
        },
        ollama: {
          baseUrl: 'http://172.28.96.1:11434',
          availableModels: ['mistral:7b-instruct', 'qwen2.5:14b-instruct'],
          status: 'connected'
        }
      }
    },
    {
      method: 'POST',
      path: '/api/agents/execute',
      description: 'Execute a specific AI agent with a prompt',
      category: 'Agent Execution',
      parameters: {
        agentId: { type: 'string', required: true, description: 'ID of the agent to execute' },
        prompt: { type: 'string', required: true, description: 'Task or question for the agent' },
        'options.temperature': { type: 'number', required: false, description: 'Creativity level (0.0-1.0)' },
        'options.complexity': { type: 'string', required: false, description: 'Task complexity (low/medium/high)' },
        'options.maxTokens': { type: 'number', required: false, description: 'Maximum response length' }
      },
      requestExample: {
        agentId: 'security-auditor',
        prompt: 'Analyze this configuration for security vulnerabilities',
        options: {
          temperature: 0.7,
          complexity: 'medium'
        }
      },
      response: {
        success: true,
        response: 'I\'ve analyzed the configuration and identified several security concerns...',
        metadata: {
          agentId: 'security-auditor',
          model: 'qwen2.5:14b-instruct',
          tokens: 256,
          duration: 2400,
          cost: 0.00,
          timestamp: '2025-08-30T00:00:00Z'
        }
      }
    },
    {
      method: 'POST',
      path: '/api/orchestration/distribute',
      description: 'Execute multiple agents concurrently with load balancing',
      category: 'Load Balancing',
      parameters: {
        requests: { type: 'array', required: true, description: 'Array of agent execution requests' },
        'options.maxConcurrency': { type: 'number', required: false, description: 'Maximum concurrent executions' },
        'options.timeout': { type: 'number', required: false, description: 'Timeout in milliseconds' }
      },
      requestExample: {
        requests: [
          { agentId: 'security-auditor', prompt: 'Check for vulnerabilities' },
          { agentId: 'code-reviewer', prompt: 'Review code quality' }
        ],
        options: {
          maxConcurrency: 3,
          timeout: 30000
        }
      },
      response: {
        success: true,
        distribution: {
          totalRequests: 2,
          completed: 2,
          failed: 0,
          averageTime: 2800
        },
        results: [
          {
            agentId: 'security-auditor',
            success: true,
            response: 'Security analysis complete...',
            duration: 2400
          }
        ]
      }
    },
    {
      method: 'POST',
      path: '/api/orchestration/route',
      description: 'Intelligent routing to select optimal agent for task',
      category: 'Intelligent Routing',
      parameters: {
        prompt: { type: 'string', required: true, description: 'Task description' },
        preferences: { type: 'array', required: false, description: 'Preferred agent types' }
      },
      requestExample: {
        prompt: 'I need to optimize a Python function for better performance',
        preferences: ['python-pro', 'performance-engineer']
      },
      response: {
        recommendedAgent: 'python-pro',
        confidence: 0.92,
        reasoning: 'Task involves Python optimization, python-pro agent is most suitable',
        alternatives: [
          { agentId: 'performance-engineer', confidence: 0.75 }
        ]
      }
    },
    {
      method: 'GET',
      path: '/api/metrics/agents',
      description: 'Real-time performance metrics for all agents',
      category: 'Monitoring',
      response: {
        timestamp: '2025-08-30T00:00:00Z',
        totalAgents: 88,
        activeAgents: 12,
        metrics: [
          {
            agentId: 'security-auditor',
            requests: 150,
            errors: 2,
            totalDuration: 360000,
            avgDuration: 2400,
            lastUsed: '2025-08-30T00:00:00Z',
            isActive: true,
            totalTokens: 38400
          }
        ]
      }
    }
  ];

  const agentList = [
    'security-auditor', 'code-reviewer', 'python-pro', 'javascript-pro', 'database-optimizer',
    'frontend-developer', 'backend-architect', 'devops-engineer', 'performance-engineer', 
    'data-scientist', 'ml-engineer', 'ai-engineer', 'test-automator', 'debugger',
    'golang-pro', 'rust-pro', 'java-pro', 'csharp-pro', 'php-pro', 'ruby-pro',
    'mobile-developer', 'ios-developer', 'android-developer', 'flutter-expert',
    'unity-developer', 'blockchain-developer', 'cloud-architect', 'terraform-specialist'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center mr-4">
            <ExternalLink className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            API Documentation
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Complete reference for the AgentHive System API
        </p>
      </div>

      {/* System Status */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              Live System Status
            </h2>
            <button
              onClick={fetchSystemStatus}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {systemStatus ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {systemStatus.service || 'AgentHive System API'}
                </div>
                <StatusBadge status={systemStatus.status === 'running' ? 'healthy' : 'degraded'} />
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {systemStatus.ollama?.availableModels?.length || 0}
                </div>
                <div className="text-gray-600 dark:text-gray-400">AI Models</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  http://localhost:4001
                </div>
                <div className="text-gray-600 dark:text-gray-400">Base URL</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  v2.0.0
                </div>
                <div className="text-gray-600 dark:text-gray-400">API Version</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
                loading 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
              }`}>
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading system status...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Unable to connect to System API
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Test */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <Play className="w-5 h-5 mr-2" />
            Quick API Test
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            Test the API directly from your terminal:
          </p>
          <CodeBlock language="bash" label="Copy test command">{`curl -X GET http://localhost:4001/health | jq`}</CodeBlock>
        </div>
      </div>

      {/* Endpoints by Category */}
      <div className="space-y-8">
        {['System', 'Agent Execution', 'Load Balancing', 'Intelligent Routing', 'Monitoring'].map((category) => (
          <div key={category}>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              {category === 'System' && <Globe className="w-6 h-6 mr-3" />}
              {category === 'Agent Execution' && <Zap className="w-6 h-6 mr-3" />}
              {category === 'Load Balancing' && <Database className="w-6 h-6 mr-3" />}
              {category === 'Intelligent Routing' && <Code className="w-6 h-6 mr-3" />}
              {category === 'Monitoring' && <Monitor className="w-6 h-6 mr-3" />}
              {category}
            </h2>
            
            <div className="space-y-6">
              {endpoints.filter(endpoint => endpoint.category === category).map((endpoint, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  {/* Endpoint Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold mr-3 ${
                        endpoint.method === 'GET' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-lg font-mono text-gray-900 dark:text-gray-100">
                        {endpoint.path}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`curl -X ${endpoint.method} http://localhost:4001${endpoint.path}`, `${endpoint.method} ${endpoint.path}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {endpoint.description}
                  </p>
                  
                  {/* Parameters */}
                  {endpoint.parameters && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Parameters:</h4>
                      <div className="space-y-3">
                        {Object.entries(endpoint.parameters).map(([param, details]) => (
                          <div key={param} className="flex flex-wrap gap-2 text-sm">
                            <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded font-mono text-blue-600 dark:text-blue-400">
                              {param}
                            </code>
                            <span className="text-gray-500 dark:text-gray-500">
                              {details.type}
                            </span>
                            <span className={details.required ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-500'}>
                              {details.required ? 'required' : 'optional'}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              - {details.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Request Example */}
                  {endpoint.requestExample && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Request Example:</h4>
                      <CodeBlock language="bash" label={`Copy ${endpoint.method} request`}>
{`curl -X ${endpoint.method} http://localhost:4001${endpoint.path} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(endpoint.requestExample, null, 2)}'`}
                      </CodeBlock>
                    </div>
                  )}
                  
                  {/* Response Example */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Response Example:</h4>
                    <CodeBlock language="json" label="Copy response format">
                      {JSON.stringify(endpoint.response, null, 2)}
                    </CodeBlock>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Available Agents */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <Zap className="w-6 h-6 mr-3" />
          Available Agents
        </h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            AgentHive includes 88+ specialized AI agents. Here are some popular ones:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {agentList.slice(0, 20).map((agent) => (
              <div key={agent} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                <code className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                  {agent}
                </code>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="text-gray-600 dark:text-gray-400">
              ... and {agentList.length - 20} more agents available
            </span>
          </div>
        </div>
      </div>

      {/* Error Codes */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <Shield className="w-6 h-6 mr-3" />
          HTTP Status Codes
        </h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Common Causes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {[
                { 
                  code: '200', 
                  status: 'OK', 
                  desc: 'Request successful', 
                  causes: 'Agent executed successfully'
                },
                { 
                  code: '400', 
                  status: 'Bad Request', 
                  desc: 'Invalid request format', 
                  causes: 'Missing required parameters, invalid JSON'
                },
                { 
                  code: '404', 
                  status: 'Not Found', 
                  desc: 'Endpoint or agent not found', 
                  causes: 'Invalid agent ID, wrong URL path'
                },
                { 
                  code: '429', 
                  status: 'Too Many Requests', 
                  desc: 'Rate limit exceeded', 
                  causes: 'More than 1000 requests in 15 minutes'
                },
                { 
                  code: '500', 
                  status: 'Internal Server Error', 
                  desc: 'Server-side error', 
                  causes: 'AI execution failed, system error'
                },
                { 
                  code: '503', 
                  status: 'Service Unavailable', 
                  desc: 'Service temporarily down', 
                  causes: 'Ollama connection failed, system overloaded'
                }
              ].map((row) => (
                <tr key={row.code}>
                  <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                    {row.code}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {row.status}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {row.desc}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {row.causes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Need Integration Help?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Check out our comprehensive integration guide with code examples and best practices.
          </p>
          <a
            href="/integration"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Code className="w-4 h-4 mr-2" />
            View Integration Guide
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;