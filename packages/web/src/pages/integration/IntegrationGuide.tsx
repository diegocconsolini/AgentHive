import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  CheckCircle,
  ExternalLink,
  Play,
  Zap,
  Database,
  Globe,
  Terminal,
  Layers,
  Shield,
  Monitor,
  Settings,
  Book,
} from 'lucide-react';

const IntegrationGuide: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('quickstart');

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

  const tabs = [
    { id: 'quickstart', label: 'Quick Start', icon: <Play className="w-4 h-4" /> },
    { id: 'rest-api', label: 'REST API', icon: <Globe className="w-4 h-4" /> },
    { id: 'sdk', label: 'SDKs', icon: <Code className="w-4 h-4" /> },
    { id: 'webhooks', label: 'Webhooks', icon: <Zap className="w-4 h-4" /> },
    { id: 'examples', label: 'Examples', icon: <Layers className="w-4 h-4" /> },
    { id: 'monitoring', label: 'Monitoring', icon: <Monitor className="w-4 h-4" /> },
  ];

  const renderQuickStart = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Quick Start Integration
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Get up and running with AgentHive in under 5 minutes.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            System API Endpoint
          </h3>
        </div>
        <div className="font-mono text-lg bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border">
          http://localhost:4001
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🚀 1-Minute Test
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Test the API with a simple cURL command:
          </p>
          <CodeBlock language="bash">{`curl -X POST http://localhost:4001/api/agents/execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "security-auditor",
    "prompt": "Hello, are you working?",
    "options": {"temperature": 0.7}
  }'`}</CodeBlock>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📊 Check System Status
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Verify all services are running:
          </p>
          <CodeBlock language="bash">{`# Health check
curl http://localhost:4001/health

# Live metrics
curl http://localhost:4001/api/metrics/agents`}</CodeBlock>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          🔧 Integration Steps
        </h3>
        <div className="space-y-6">
          {[
            {
              step: 1,
              title: 'Choose Your Agent',
              description: 'Select from 88+ specialized agents based on your task',
              agents: ['security-auditor', 'python-pro', 'code-reviewer', 'database-optimizer']
            },
            {
              step: 2,
              title: 'Craft Your Prompt',
              description: 'Write clear, specific instructions for the AI agent',
              example: 'Instead of "fix this", use "optimize this Python function for better memory usage"'
            },
            {
              step: 3,
              title: 'Set Options',
              description: 'Configure temperature, complexity, and other parameters',
              options: ['temperature: 0.3 (focused) to 0.9 (creative)', 'complexity: low/medium/high for model selection']
            },
            {
              step: 4,
              title: 'Make the Request',
              description: 'Send HTTP POST to the execution endpoint',
              endpoint: 'POST /api/agents/execute'
            }
          ].map((step) => (
            <div key={step.step} className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                {step.step}
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {step.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {step.description}
                </p>
                {step.agents && (
                  <div className="flex flex-wrap gap-2">
                    {step.agents.map((agent) => (
                      <span key={agent} className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm font-mono">
                        {agent}
                      </span>
                    ))}
                  </div>
                )}
                {step.example && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                    <span className="text-green-800 dark:text-green-200 text-sm">
                      💡 {step.example}
                    </span>
                  </div>
                )}
                {step.options && (
                  <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                    {step.options.map((option, idx) => (
                      <li key={idx}>• {option}</li>
                    ))}
                  </ul>
                )}
                {step.endpoint && (
                  <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm">
                    {step.endpoint}
                  </code>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRestAPI = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          REST API Reference
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Complete HTTP API documentation for integrating with AgentHive.
        </p>
      </div>

      {/* Authentication */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Authentication
        </h3>
        <p className="text-yellow-800 dark:text-yellow-200">
          Currently, the System API does not require authentication for development. 
          In production, you'll need to implement API keys or OAuth tokens.
        </p>
      </div>

      {/* Core Endpoints */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Core Endpoints
        </h3>
        
        <div className="space-y-8">
          {/* Agent Execution */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-semibold mr-3">
                POST
              </span>
              <code className="text-lg font-mono">/api/agents/execute</code>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Execute a specific AI agent with a prompt and receive the response.
            </p>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Request Body:</h4>
              <CodeBlock language="json">{`{
  "agentId": "security-auditor",
  "prompt": "Analyze this configuration for security issues",
  "options": {
    "temperature": 0.7,
    "complexity": "medium",
    "maxTokens": 4000,
    "context": "enterprise"
  }
}`}</CodeBlock>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Success Response (200):</h4>
              <CodeBlock language="json">{`{
  "success": true,
  "response": "I've analyzed the configuration and found several security concerns...",
  "metadata": {
    "agentId": "security-auditor",
    "model": "qwen2.5:14b-instruct",
    "tokens": 256,
    "duration": 2400,
    "cost": 0.00,
    "timestamp": "2025-08-30T00:00:00Z"
  }
}`}</CodeBlock>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Error Response (400/500):</h4>
              <CodeBlock language="json">{`{
  "success": false,
  "error": "INVALID_AGENT",
  "message": "Agent 'unknown-agent' not found",
  "code": 404
}`}</CodeBlock>
            </div>
          </div>

          {/* Load Balancing */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-semibold mr-3">
                POST
              </span>
              <code className="text-lg font-mono">/api/orchestration/distribute</code>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Execute multiple agents concurrently with intelligent load balancing.
            </p>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Request Body:</h4>
              <CodeBlock language="json">{`{
  "requests": [
    {
      "agentId": "security-auditor",
      "prompt": "Check for vulnerabilities"
    },
    {
      "agentId": "code-reviewer", 
      "prompt": "Review code quality"
    },
    {
      "agentId": "python-pro",
      "prompt": "Optimize performance"
    }
  ],
  "options": {
    "maxConcurrency": 3,
    "timeout": 30000
  }
}`}</CodeBlock>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Response:</h4>
              <CodeBlock language="json">{`{
  "success": true,
  "distribution": {
    "totalRequests": 3,
    "completed": 3,
    "failed": 0,
    "averageTime": 2800
  },
  "results": [
    {
      "agentId": "security-auditor",
      "success": true,
      "response": "Security analysis complete...",
      "duration": 2400
    }
  ]
}`}</CodeBlock>
            </div>
          </div>

          {/* Health & Status */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold mr-3">
                  GET
                </span>
                <code className="text-base font-mono">/health</code>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">System health check</p>
              <CodeBlock language="json">{`{
  "status": "healthy",
  "service": "AgentHive System API",
  "ollama": {
    "healthy": true,
    "models": 3
  },
  "activeAgents": 12
}`}</CodeBlock>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold mr-3">
                  GET
                </span>
                <code className="text-base font-mono">/api/metrics/agents</code>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Live performance metrics</p>
              <CodeBlock language="json">{`{
  "timestamp": "2025-08-30T00:00:00Z",
  "totalAgents": 88,
  "activeAgents": 12,
  "metrics": [
    {
      "agentId": "security-auditor",
      "requests": 150,
      "errors": 2,
      "avgDuration": 2400
    }
  ]
}`}</CodeBlock>
            </div>
          </div>
        </div>
      </div>

      {/* HTTP Status Codes */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          HTTP Status Codes
        </h3>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {[
                { code: '200', status: 'OK', desc: 'Request successful, agent executed' },
                { code: '400', status: 'Bad Request', desc: 'Invalid request format or missing parameters' },
                { code: '404', status: 'Not Found', desc: 'Agent ID not found or endpoint does not exist' },
                { code: '429', status: 'Too Many Requests', desc: 'Rate limit exceeded (1000 requests/15min)' },
                { code: '500', status: 'Internal Server Error', desc: 'AI execution failed or system error' },
                { code: '503', status: 'Service Unavailable', desc: 'Ollama connection down or overloaded' },
              ].map((row) => (
                <tr key={row.code}>
                  <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                    {row.code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {row.status}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {row.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSDKs = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Official SDKs & Libraries
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Use these libraries to integrate AgentHive into your applications with ease.
        </p>
      </div>

      {/* Language SDKs */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            language: 'Python',
            status: 'Official',
            install: 'pip install agenthive-python',
            docs: 'https://docs.agenthive.ai/python'
          },
          {
            language: 'Node.js',
            status: 'Official', 
            install: 'npm install @agenthive/client',
            docs: 'https://docs.agenthive.ai/nodejs'
          },
          {
            language: 'Go',
            status: 'Community',
            install: 'go get github.com/agenthive/go-client',
            docs: 'https://pkg.go.dev/github.com/agenthive/go-client'
          },
          {
            language: 'Java',
            status: 'Community',
            install: 'Maven/Gradle dependency',
            docs: 'https://docs.agenthive.ai/java'
          },
          {
            language: 'PHP',
            status: 'Community',
            install: 'composer require agenthive/php-client',
            docs: 'https://docs.agenthive.ai/php'
          },
          {
            language: 'Ruby',
            status: 'Community',
            install: 'gem install agenthive',
            docs: 'https://docs.agenthive.ai/ruby'
          }
        ].map((sdk) => (
          <div key={sdk.language} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {sdk.language}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                sdk.status === 'Official' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
              }`}>
                {sdk.status}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Install:</div>
                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {sdk.install}
                </code>
              </div>
              <a 
                href={sdk.docs}
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Python SDK Example */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          🐍 Python SDK Example
        </h3>
        <CodeBlock language="python">{`from agenthive import AgentHiveClient

# Initialize client
client = AgentHiveClient(
    base_url="http://localhost:4001",
    timeout=30
)

# Execute single agent
response = client.execute_agent(
    agent_id="security-auditor",
    prompt="Analyze this configuration file for security issues",
    options={
        "temperature": 0.7,
        "complexity": "high"
    }
)

print(f"Response: {response.text}")
print(f"Tokens used: {response.metadata.tokens}")
print(f"Cost: ${response.metadata.cost}")

# Batch execution with load balancing
results = client.execute_batch([
    {"agent_id": "python-pro", "prompt": "Optimize this code"},
    {"agent_id": "code-reviewer", "prompt": "Review this PR"},
    {"agent_id": "security-auditor", "prompt": "Security audit"}
])

for result in results:
    print(f"{result.agent_id}: {result.response[:100]}...")

# Monitor performance
metrics = client.get_metrics()
print(f"Active agents: {metrics.active_agents}")
print(f"Success rate: {metrics.success_rate:.2%}")
`}</CodeBlock>
      </div>

      {/* Node.js SDK Example */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          🟢 Node.js SDK Example
        </h3>
        <CodeBlock language="javascript">{`const { AgentHiveClient } = require('@agenthive/client');

// Initialize client
const client = new AgentHiveClient({
  baseUrl: 'http://localhost:4001',
  timeout: 30000
});

// Execute agent with async/await
async function analyzeCode() {
  try {
    const response = await client.executeAgent({
      agentId: 'code-reviewer',
      prompt: 'Review this JavaScript code for best practices',
      options: {
        temperature: 0.3,
        complexity: 'medium'
      }
    });
    
    console.log('Response:', response.text);
    console.log('Duration:', response.metadata.duration, 'ms');
    
  } catch (error) {
    console.error('Agent execution failed:', error.message);
  }
}

// Stream responses for long-running tasks
client.executeAgentStream({
  agentId: 'python-pro',
  prompt: 'Refactor this entire Python module'
}).on('data', (chunk) => {
  console.log('Partial response:', chunk);
}).on('complete', (fullResponse) => {
  console.log('Complete response received');
}).on('error', (error) => {
  console.error('Stream error:', error);
});

// Health monitoring
setInterval(async () => {
  const health = await client.getHealth();
  console.log(\`System status: \${health.status}\`);
}, 30000);
`}</CodeBlock>
      </div>

      {/* Custom HTTP Client */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          🛠️ Build Your Own Client
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          If there's no SDK for your language, you can easily build a client using HTTP requests:
        </p>
        <CodeBlock language="javascript">{`class CustomAgentHiveClient {
  constructor(baseUrl = 'http://localhost:4001') {
    this.baseUrl = baseUrl;
  }
  
  async executeAgent(agentId, prompt, options = {}) {
    const response = await fetch(\\\`\\\${this.baseUrl}/api/agents/execute\\\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MyApp/1.0'
      },
      body: JSON.stringify({
        agentId,
        prompt,
        options
      })
    });
    
    if (!response.ok) {
      throw new Error(\\\`HTTP \\\${response.status}: \\\${response.statusText}\\\`);
    }
    
    return response.json();
  }
  
  async getMetrics() {
    const response = await fetch(\\\`\\\${this.baseUrl}/api/metrics/agents\\\`);
    return response.json();
  }
  
  async checkHealth() {
    const response = await fetch(\\\`\\\${this.baseUrl}/health\\\`);
    return response.json();
  }
}
`}</CodeBlock>
      </div>
    </div>
  );

  const renderWebhooks = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Webhooks & Real-time Integration
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Set up webhooks to receive real-time notifications about agent executions and system events.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
        <div className="flex items-start">
          <Settings className="w-6 h-6 text-amber-600 dark:text-amber-400 mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Development Mode
            </h3>
            <p className="text-amber-800 dark:text-amber-200">
              Webhook functionality is currently in development. For real-time updates, 
              use polling with the metrics endpoints every 30 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Planned Webhook Events */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📡 Planned Webhook Events
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              event: 'agent.execution.started',
              description: 'Triggered when an agent begins processing a request',
              payload: {
                agentId: 'security-auditor',
                executionId: 'exec_123',
                timestamp: '2025-08-30T00:00:00Z',
                prompt: 'Analyze configuration...'
              }
            },
            {
              event: 'agent.execution.completed',
              description: 'Triggered when an agent successfully completes a task',
              payload: {
                agentId: 'security-auditor',
                executionId: 'exec_123',
                duration: 2400,
                tokens: 256,
                success: true
              }
            },
            {
              event: 'agent.execution.failed',
              description: 'Triggered when an agent execution encounters an error',
              payload: {
                agentId: 'python-pro',
                executionId: 'exec_124',
                error: 'TIMEOUT',
                message: 'Agent execution timed out after 30s'
              }
            },
            {
              event: 'system.health.degraded',
              description: 'Triggered when system health status changes to degraded',
              payload: {
                status: 'degraded',
                reason: 'ollama_connection_failed',
                timestamp: '2025-08-30T00:00:00Z'
              }
            }
          ].map((webhook) => (
            <div key={webhook.event} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="mb-3">
                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded font-mono">
                  {webhook.event}
                </code>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {webhook.description}
              </p>
              <div>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Sample Payload:
                </h5>
                <CodeBlock language="json">{JSON.stringify(webhook.payload, null, 2)}</CodeBlock>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Polling Alternative */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          🔄 Current Alternative: Polling
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Until webhooks are available, use polling to get real-time updates:
        </p>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Monitor Agent Metrics (Every 30s)
            </h4>
            <CodeBlock language="javascript">{`// Poll for metrics updates
setInterval(async () => {
  try {
    const metrics = await fetch('http://localhost:4001/api/metrics/agents');
    const data = await metrics.json();
    
    // Process metrics update
    console.log(\\\`Active agents: \\\${data.activeAgents}\\\`);
    data.metrics.forEach(agent => {
      console.log(\\\`\\\${agent.agentId}: \\\${agent.requests} requests\\\`);
    });
    
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
  }
}, 30000); // Every 30 seconds`}</CodeBlock>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Health Status Monitoring
            </h4>
            <CodeBlock language="python">{`import time
import requests
import json

def monitor_system_health():
    previous_status = None
    
    while True:
        try:
            response = requests.get('http://localhost:4001/health')
            health = response.json()
            
            current_status = health['status']
            
            # Detect status changes
            if previous_status and previous_status != current_status:
                print(f"Status changed: {previous_status} -> {current_status}")
                # Trigger your event handling here
                
            previous_status = current_status
            time.sleep(30)  # Check every 30 seconds
            
        except Exception as e:
            print(f"Health check failed: {e}")
            time.sleep(10)  # Retry sooner on failure

# Run monitoring
monitor_system_health()`}</CodeBlock>
          </div>
        </div>
      </div>

      {/* Server-Sent Events (Future) */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          🚀 Coming Soon: Server-Sent Events
        </h3>
        <p className="text-blue-800 dark:text-blue-200 mb-4">
          We're planning to add Server-Sent Events (SSE) for real-time streaming:
        </p>
        <CodeBlock language="javascript">{`// Future SSE implementation
const eventSource = new EventSource('http://localhost:4001/api/events');

eventSource.addEventListener('agent.execution.completed', (event) => {
  const data = JSON.parse(event.data);
  console.log(\\\`Agent \\\${data.agentId} completed in \\\${data.duration}ms\\\`);
});

eventSource.addEventListener('system.health.changed', (event) => {
  const data = JSON.parse(event.data);
  console.log(\\\`System status: \\\${data.status}\\\`);
});`}</CodeBlock>
      </div>
    </div>
  );

  const renderExamples = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Integration Examples
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Real-world examples of integrating AgentHive into different types of applications.
        </p>
      </div>

      {/* Use Case Examples */}
      <div className="space-y-8">
        {[
          {
            title: 'CI/CD Pipeline Integration',
            description: 'Automatically review code, run security audits, and optimize performance in your deployment pipeline.',
            tech: 'GitHub Actions, Jenkins, GitLab CI',
            code: {
              language: 'yaml',
              content: `# .github/workflows/ai-review.yml
name: AI Code Review
on: [pull_request]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Security Audit
        run: |
          curl -X POST http://localhost:4001/api/agents/execute \\
            -H "Content-Type: application/json" \\
            -d '{
              "agentId": "security-auditor",
              "prompt": "Review this PR for security vulnerabilities",
              "options": {"complexity": "high"}
            }' > security-report.json
      
      - name: Code Quality Review
        run: |
          curl -X POST http://localhost:4001/api/agents/execute \\
            -H "Content-Type: application/json" \\
            -d '{
              "agentId": "code-reviewer",
              "prompt": "Analyze code quality and suggest improvements",
              "options": {"temperature": 0.3}
            }' > quality-report.json
            
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const security = JSON.parse(fs.readFileSync('security-report.json'));
            const quality = JSON.parse(fs.readFileSync('quality-report.json'));
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: \`## AI Review Results
              
**Security Analysis:**
\${security.response}

**Code Quality:**
\${quality.response}
              \`
            });`
            }
          },
          {
            title: 'Slack Bot Integration',
            description: 'Create a Slack bot that allows team members to interact with AI agents directly from Slack.',
            tech: 'Slack Bolt, Node.js, Express',
            code: {
              language: 'javascript',
              content: `const { App } = require('@slack/bolt');
const fetch = require('node-fetch');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Listen for /hive command
app.command('/hive', async ({ command, ack, respond }) => {
  await ack();
  
  // Parse command: /hive security-auditor check this config
  const [agentId, ...promptParts] = command.text.split(' ');
  const prompt = promptParts.join(' ');
  
  if (!agentId || !prompt) {
    return await respond('Usage: /hive <agent-id> <prompt>');
  }
  
  try {
    // Show thinking message
    await respond('🤖 Agent working on your request...');
    
    // Execute agent
    const response = await fetch('http://localhost:4001/api/agents/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        prompt,
        options: { temperature: 0.7 }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      await respond({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: \\\`*Agent:* \\\${agentId}\\\\n*Response:*\\\\n\\\${result.response}\\\`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: \\\`Duration: \\\${result.metadata.duration}ms | Tokens: \\\${result.metadata.tokens} | Cost: $\\\${result.metadata.cost}\\\`
              }
            ]
          }
        ]
      });
    } else {
      await respond(\\\`❌ Error: \\\${result.message}\\\`);
    }
    
  } catch (error) {
    await respond(\\\`❌ Failed to execute agent: \\\${error.message}\\\`);
  }
});

// Listen for mentions and questions
app.event('app_mention', async ({ event, say }) => {
  const text = event.text.toLowerCase();
  
  // Auto-route to appropriate agent
  let agentId = 'general-agent';
  if (text.includes('security') || text.includes('vulnerability')) {
    agentId = 'security-auditor';
  } else if (text.includes('code') || text.includes('review')) {
    agentId = 'code-reviewer';
  } else if (text.includes('python')) {
    agentId = 'python-pro';
  }
  
  try {
    const response = await fetch('http://localhost:4001/api/agents/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        prompt: event.text,
        options: { temperature: 0.8 }
      })
    });
    
    const result = await response.json();
    
    await say(\\\`🤖 \\\${result.response}\\\`);
    
  } catch (error) {
    await say(\\\`Sorry, I'm having trouble connecting to the AI agents right now.\\\`);
  }
});

app.start(3000);
console.log('⚡️ AgentHive Slack bot is running!');`
            }
          },
          {
            title: 'Web Application Dashboard',
            description: 'Build a custom dashboard that integrates AgentHive into your existing web application.',
            tech: 'React, Express, WebSocket',
            code: {
              language: 'javascript',
              content: `// Frontend React Component
import React, { useState } from 'react';

const AgentExecutor = () => {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  
  const executeAgent = async (agentId, prompt) => {
    setLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('/api/hive/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, prompt })
      });
      
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      setResponse(\\\`Error: \\\${error.message}\\\`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="agent-executor">
      <div className="agent-grid">
        {[
          { id: 'security-auditor', name: 'Security Auditor' },
          { id: 'code-reviewer', name: 'Code Reviewer' },
          { id: 'python-pro', name: 'Python Pro' }
        ].map(agent => (
          <button 
            key={agent.id}
            onClick={() => executeAgent(agent.id, 'Help me with my task')}
            disabled={loading}
          >
            {agent.name}
          </button>
        ))}
      </div>
      
      {loading && <div>AI is thinking...</div>}
      {response && (
        <div className="response">
          <h3>Agent Response:</h3>
          <pre>{response}</pre>
        </div>
      )}
    </div>
  );
};

// Backend Express Route
app.post('/api/hive/execute', async (req, res) => {
  const { agentId, prompt, options = {} } = req.body;
  
  // Log request for analytics
  console.log(\\\`User executed \\\${agentId}: \\\${prompt}\\\`);
  
  try {
    const response = await fetch('http://localhost:4001/api/agents/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, prompt, options })
    });
    
    const result = await response.json();
    
    // Store result in database for history
    await db.query('INSERT INTO agent_history (agent_id, prompt, response, duration) VALUES (?, ?, ?, ?)',
      [agentId, prompt, result.response, result.metadata.duration]);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`
            }
          },
          {
            title: 'Automated Testing Integration',
            description: 'Use AI agents to generate tests, review test coverage, and identify edge cases.',
            tech: 'Jest, Pytest, Selenium',
            code: {
              language: 'python',
              content: `import requests
import json
import subprocess
import sys

class AITestingAssistant:
    def __init__(self, hive_url="http://localhost:4001"):
        self.hive_url = hive_url
    
    def execute_agent(self, agent_id, prompt, complexity="medium"):
        response = requests.post(f"{self.hive_url}/api/agents/execute", 
            json={
                "agentId": agent_id,
                "prompt": prompt,
                "options": {"complexity": complexity}
            }
        )
        return response.json()
    
    def generate_tests(self, code_file):
        """Generate unit tests for a code file"""
        with open(code_file, 'r') as f:
            code = f.read()
        
        result = self.execute_agent(
            "python-pro",
            f"Generate comprehensive unit tests for this Python code:\\n\\n{code}",
            "high"
        )
        
        if result['success']:
            # Write tests to file
            test_file = f"test_{code_file}"
            with open(test_file, 'w') as f:
                f.write(result['response'])
            print(f"Generated tests: {test_file}")
            return test_file
        else:
            print(f"Failed to generate tests: {result['message']}")
            return None
    
    def review_test_coverage(self, coverage_report):
        """Analyze test coverage and suggest improvements"""
        with open(coverage_report, 'r') as f:
            coverage = f.read()
        
        result = self.execute_agent(
            "code-reviewer",
            f"Review this test coverage report and suggest areas for improvement:\\n\\n{coverage}",
            "medium"
        )
        
        return result['response']
    
    def security_test_suggestions(self, app_code):
        """Get security testing suggestions"""
        result = self.execute_agent(
            "security-auditor",
            f"Suggest security test cases for this application code:\\n\\n{app_code}",
            "high"
        )
        
        return result['response']

# Usage in pytest
def test_with_ai_assistance():
    ai = AITestingAssistant()
    
    # Generate additional test cases
    suggestions = ai.execute_agent(
        "python-pro", 
        "Suggest edge cases for testing a user authentication function"
    )
    
    print(f"AI Test Suggestions: {suggestions['response']}")
    
    # Your existing tests here
    assert user_login("valid_user", "valid_pass") == True
    assert user_login("invalid_user", "wrong_pass") == False
    
    # AI-suggested edge cases (parse and implement)
    # This would be expanded based on AI suggestions

if __name__ == "__main__":
    ai = AITestingAssistant()
    
    # Generate tests for all Python files
    for py_file in ["user.py", "database.py", "api.py"]:
        ai.generate_tests(py_file)
    
    # Run tests and get coverage
    subprocess.run(["python", "-m", "pytest", "--cov=.", "--cov-report=term-missing"])
    
    # AI review of coverage
    coverage_suggestions = ai.review_test_coverage("coverage.txt")
    print("AI Coverage Review:", coverage_suggestions)`
            }
          }
        ].map((example, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {example.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {example.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {example.tech.split(', ').map((tech) => (
                  <span key={tech} className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            <CodeBlock language={example.code.language} label={`Copy ${example.title} code`}>
              {example.code.content}
            </CodeBlock>
          </div>
        ))}
      </div>

      {/* More Examples */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          💡 More Integration Ideas
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: 'Discord Bot',
              description: 'AI agents for Discord communities to help with coding questions and code reviews.'
            },
            {
              title: 'VS Code Extension',
              description: 'Integrate agents directly into your IDE for real-time code assistance.'
            },
            {
              title: 'Email Processing',
              description: 'Automatically categorize and respond to support emails using AI agents.'
            },
            {
              title: 'API Gateway',
              description: 'Use agents as middleware to analyze and transform API requests/responses.'
            },
            {
              title: 'Documentation Generator',
              description: 'Automatically generate and maintain project documentation.'
            },
            {
              title: 'Monitoring Alerts',
              description: 'AI agents to analyze system logs and provide intelligent alerts.'
            }
          ].map((idea) => (
            <div key={idea.title} className="bg-white dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {idea.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {idea.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMonitoring = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Monitoring & Analytics
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Monitor your AgentHive integration performance and optimize agent usage.
        </p>
      </div>

      {/* Key Metrics */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📊 Key Metrics to Monitor
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              metric: 'Response Time',
              description: 'Average time for agents to complete tasks',
              target: '< 5 seconds',
              endpoint: 'GET /api/metrics/agents'
            },
            {
              metric: 'Success Rate',
              description: 'Percentage of successful agent executions',
              target: '> 95%',
              endpoint: 'GET /api/metrics/agents'
            },
            {
              metric: 'Cost per Request',
              description: 'AI inference cost (should be $0 with Ollama)',
              target: '$0.00',
              endpoint: 'GET /api/metrics/agents'
            },
            {
              metric: 'Concurrent Agents',
              description: 'Number of agents running simultaneously',
              target: 'Monitor for limits',
              endpoint: 'GET /health'
            }
          ].map((item) => (
            <div key={item.metric} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {item.metric}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {item.description}
              </p>
              <div className="text-sm">
                <div className="text-green-600 dark:text-green-400 font-medium mb-1">
                  Target: {item.target}
                </div>
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {item.endpoint}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitoring Dashboard */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📈 Build a Monitoring Dashboard
        </h3>
        <CodeBlock language="javascript">{`// Simple monitoring dashboard
class AgentHiveMonitor {
  constructor(baseUrl = 'http://localhost:4001') {
    this.baseUrl = baseUrl;
    this.metrics = {
      responseTime: [],
      successRate: [],
      activeAgents: [],
      errorRate: []
    };
  }
  
  async collectMetrics() {
    try {
      // Get agent metrics
      const metricsRes = await fetch(\\\`\\\${this.baseUrl}/api/metrics/agents\\\`);
      const metrics = await metricsRes.json();
      
      // Get health status
      const healthRes = await fetch(\\\`\\\${this.baseUrl}/health\\\`);
      const health = await healthRes.json();
      
      // Calculate aggregated metrics
      const avgResponseTime = metrics.metrics.reduce((acc, agent) => 
        acc + (agent.totalDuration / agent.requests || 0), 0) / metrics.metrics.length;
      
      const overallSuccessRate = metrics.metrics.reduce((acc, agent) => 
        acc + (1 - (agent.errors || 0) / (agent.requests || 1)), 0) / metrics.metrics.length;
      
      // Store metrics with timestamp
      const timestamp = new Date();
      this.metrics.responseTime.push({ timestamp, value: avgResponseTime });
      this.metrics.successRate.push({ timestamp, value: overallSuccessRate });
      this.metrics.activeAgents.push({ timestamp, value: metrics.activeAgents });
      
      // Keep only last 100 data points
      Object.keys(this.metrics).forEach(key => {
        if (this.metrics[key].length > 100) {
          this.metrics[key] = this.metrics[key].slice(-100);
        }
      });
      
      return {
        responseTime: avgResponseTime,
        successRate: overallSuccessRate,
        activeAgents: metrics.activeAgents,
        systemHealth: health.status,
        timestamp
      };
      
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      return null;
    }
  }
  
  // Alert system
  checkAlerts(currentMetrics) {
    const alerts = [];
    
    if (currentMetrics.responseTime > 10000) {
      alerts.push({
        level: 'critical',
        message: \\\`High response time: \\\${currentMetrics.responseTime}ms\\\`
      });
    }
    
    if (currentMetrics.successRate < 0.9) {
      alerts.push({
        level: 'warning',
        message: \\\`Low success rate: \\\${(currentMetrics.successRate * 100).toFixed(1)}%\\\`
      });
    }
    
    if (currentMetrics.systemHealth !== 'healthy') {
      alerts.push({
        level: 'critical',
        message: \\\`System health degraded: \\\${currentMetrics.systemHealth}\\\`
      });
    }
    
    return alerts;
  }
  
  // Start monitoring loop
  start(interval = 30000) {
    setInterval(async () => {
      const metrics = await this.collectMetrics();
      if (metrics) {
        const alerts = this.checkAlerts(metrics);
        
        console.log('📊 Metrics:', {
          responseTime: \\\`\\\${metrics.responseTime}ms\\\`,
          successRate: \\\`\\\${(metrics.successRate * 100).toFixed(1)}%\\\`,
          activeAgents: metrics.activeAgents,
          systemHealth: metrics.systemHealth
        });
        
        if (alerts.length > 0) {
          console.log('🚨 Alerts:', alerts);
          // Send to your alerting system (Slack, email, etc.)
          this.sendAlerts(alerts);
        }
      }
    }, interval);
  }
  
  async sendAlerts(alerts) {
    // Example: Send to Slack webhook
    const criticalAlerts = alerts.filter(a => a.level === 'critical');
    if (criticalAlerts.length > 0) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: \\\`🚨 AgentHive Critical Alerts:\\\\n\\\${criticalAlerts.map(a => a.message).join('\\\\n')}\\\`
          })
        });
      } catch (error) {
        console.error('Failed to send alerts:', error);
      }
    }
  }
}

// Usage
const monitor = new AgentHiveMonitor();
monitor.start(30000); // Check every 30 seconds`}</CodeBlock>
      </div>

      {/* Performance Optimization */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          ⚡ Performance Optimization Tips
        </h3>
        <div className="space-y-6">
          {[
            {
              title: 'Model Selection Strategy',
              description: 'Use complexity hints to route requests to appropriate models',
              code: `// Route simple tasks to faster 7B model
const executeWithOptimalModel = (prompt) => {
  const complexity = prompt.length < 100 ? 'low' : 
                    prompt.length < 500 ? 'medium' : 'high';
  
  return fetch('/api/agents/execute', {
    method: 'POST',
    body: JSON.stringify({
      agentId: 'python-pro',
      prompt,
      options: { complexity }
    })
  });
};`
            },
            {
              title: 'Request Batching',
              description: 'Batch multiple requests to reduce overhead',
              code: `// Instead of multiple individual requests
const results = await Promise.all([
  executeAgent('security-auditor', 'Check config'),
  executeAgent('code-reviewer', 'Review code'),
  executeAgent('python-pro', 'Optimize function')
]);

// Use the batch endpoint
const batchResult = await fetch('/api/orchestration/distribute', {
  method: 'POST',
  body: JSON.stringify({
    requests: [
      { agentId: 'security-auditor', prompt: 'Check config' },
      { agentId: 'code-reviewer', prompt: 'Review code' },
      { agentId: 'python-pro', prompt: 'Optimize function' }
    ]
  })
});`
            },
            {
              title: 'Caching Strategy',
              description: 'Cache responses for frequently asked questions',
              code: `class AgentCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 3600000; // 1 hour
  }
  
  getCacheKey(agentId, prompt) {
    return \\\`\\\${agentId}:\\\${prompt.toLowerCase().trim()}\\\`;
  }
  
  async executeWithCache(agentId, prompt, options = {}) {
    const key = this.getCacheKey(agentId, prompt);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return { ...cached.response, cached: true };
    }
    
    const response = await fetch('/api/agents/execute', {
      method: 'POST',
      body: JSON.stringify({ agentId, prompt, options })
    });
    
    const result = await response.json();
    
    this.cache.set(key, {
      response: result,
      timestamp: Date.now()
    });
    
    return result;
  }
}`
            }
          ].map((tip, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {tip.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {tip.description}
              </p>
              <CodeBlock language="javascript">{tip.code}</CodeBlock>
            </div>
          ))}
        </div>
      </div>

      {/* Error Handling */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          🛡️ Error Handling Best Practices
        </h3>
        <CodeBlock language="javascript">{`class RobustAgentClient {
  constructor(baseUrl = 'http://localhost:4001') {
    this.baseUrl = baseUrl;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }
  
  async executeAgentWithRetry(agentId, prompt, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(\\\`\\\${this.baseUrl}/api/agents/execute\\\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId, prompt, options }),
          timeout: 30000 // 30 second timeout
        });
        
        if (!response.ok) {
          throw new Error(\\\`HTTP \\\${response.status}: \\\${response.statusText}\\\`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Agent execution failed');
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        console.warn(\\\`Attempt \\\${attempt} failed:\\\`, error.message);
        
        // Don't retry on certain errors
        if (error.message.includes('404') || error.message.includes('INVALID_AGENT')) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw new Error(\\\`Failed after \\\${this.maxRetries} attempts. Last error: \\\${lastError.message}\\\`);
  }
  
  // Graceful degradation
  async executeWithFallback(agentId, prompt, fallbackResponse = "I'm sorry, I'm unable to process your request right now.") {
    try {
      const result = await this.executeAgentWithRetry(agentId, prompt);
      return result.response;
    } catch (error) {
      console.error('Agent execution failed:', error);
      
      // Log error for monitoring
      this.logError(agentId, prompt, error);
      
      // Return fallback response
      return fallbackResponse;
    }
  }
  
  logError(agentId, prompt, error) {
    // Send to your logging service
    console.error('Agent Error Log:', {
      agentId,
      prompt: prompt.substring(0, 100) + '...', // Truncate for privacy
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
  }
}`}</CodeBlock>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-4">
            <Code className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Integration Guide
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Complete guide to integrating AgentHive's AI orchestration platform into your applications
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        {activeTab === 'quickstart' && renderQuickStart()}
        {activeTab === 'rest-api' && renderRestAPI()}
        {activeTab === 'sdk' && renderSDKs()}
        {activeTab === 'webhooks' && renderWebhooks()}
        {activeTab === 'examples' && renderExamples()}
        {activeTab === 'monitoring' && renderMonitoring()}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Need Help?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Check the Application Manual or test your integration with our endpoints.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/manual"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Book className="w-4 h-4 mr-2" />
              Application Manual
            </a>
            <button
              onClick={() => copyToClipboard('curl http://localhost:4001/health', 'health check')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <Terminal className="w-4 h-4 mr-2" />
              Test Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationGuide;