import React, { useState } from 'react';
import { 
  Book, 
  ChevronRight, 
  Users, 
  Bot, 
  BarChart3, 
  Database, 
  Settings,
  Terminal,
  Search,
  Tags,
  Brain,
  Play,
  Code,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface ManualSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const ApplicationManual: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [copiedText, setCopiedText] = useState<string>('');

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

  const manualSections: ManualSection[] = [
    {
      id: 'overview',
      title: 'Overview & Getting Started',
      icon: <Book className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Welcome to AgentHive
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              AgentHive is a production-ready AI orchestration platform that manages specialized AI agents 
              for development, security, analysis, and automation tasks. Think of it as "Kubernetes for AI agents."
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              🎯 Key Features
            </h3>
            <ul className="space-y-2 text-blue-800 dark:text-blue-200">
              <li>• <strong>88+ Specialized Agents</strong> - Security, development, analysis, DevOps</li>
              <li>• <strong>Real AI Integration</strong> - Powered by Ollama + RTX 5090</li>
              <li>• <strong>Load Balancing</strong> - Intelligent request distribution</li>
              <li>• <strong>Live Analytics</strong> - Real-time performance monitoring</li>
              <li>• <strong>CLI + Web Interface</strong> - Developer-friendly tools</li>
              <li>• <strong>External Integration</strong> - REST API for any application</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              🚀 Quick Start
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">1. Access the Dashboard</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-2">Open your browser and navigate to:</p>
                <CodeBlock language="url">http://localhost:3001</CodeBlock>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Login with: admin@localhost / development-only-password
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">2. Use the CLI</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-2">Install and use the command line interface:</p>
                <CodeBlock>npm install -g @agenthive/cli
hive execute security-auditor "Analyze this system for vulnerabilities"</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">3. Integrate with APIs</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-2">Connect external applications:</p>
                <CodeBlock language="javascript">{`const response = await fetch('http://localhost:4001/api/agents/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'python-pro',
    prompt: 'Optimize this code',
    options: { temperature: 0.3 }
  })
});`}</CodeBlock>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      title: 'Dashboard Navigation',
      icon: <BarChart3 className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Dashboard Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The AgentHive dashboard provides real-time insights into your AI agent ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Analytics</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor agent performance, success rates, response times, and costs. All data is 
                fetched live from the System API.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Bot className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Agent Management</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Browse 88+ specialized agents, view their capabilities, and manage their lifecycle.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Database className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Context Manager</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage conversation contexts and memory across agent sessions.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Terminal className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">GraphiQL Explorer</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Interactive GraphQL playground for testing queries and exploring the API schema.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Live Data</h4>
                <p className="text-amber-800 dark:text-amber-200">
                  All dashboard metrics are pulled from real System API endpoints every 30 seconds. 
                  No mock data is used in production mode.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'agents',
      title: 'Agent Management',
      icon: <Bot className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Managing AI Agents
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              AgentHive comes with 88+ pre-configured specialized agents, each optimized for specific tasks.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🤖 Popular Agents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'security-auditor', desc: 'Security analysis and vulnerability detection' },
                { name: 'code-reviewer', desc: 'Code review and best practices' },
                { name: 'python-pro', desc: 'Python development and optimization' },
                { name: 'javascript-pro', desc: 'JavaScript/Node.js development' },
                { name: 'database-optimizer', desc: 'Database query optimization' },
                { name: 'frontend-developer', desc: 'React/UI development' },
                { name: 'backend-architect', desc: 'API and system design' },
                { name: 'devops-engineer', desc: 'Infrastructure and deployment' },
              ].map((agent) => (
                <div key={agent.name} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-600 dark:text-blue-400 mb-1">
                    {agent.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {agent.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🎯 Agent Execution
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Execute agents through multiple interfaces:
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Web Dashboard</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Navigate to Agent Management → Execute to run agents through the UI.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">CLI Command</h4>
                <CodeBlock>hive execute security-auditor "Check this configuration file"</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Direct API</h4>
                <CodeBlock language="bash">curl -X POST http://localhost:4001/api/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "python-pro",
    "prompt": "Optimize this algorithm",
    "options": {"temperature": 0.3}
  }'</CodeBlock>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              ⚙️ Agent Configuration
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Agents support various configuration options:
            </p>
            <div className="bg-gray-900 rounded-lg p-4">
              <pre className="text-sm text-gray-300">
{`{
  "agentId": "code-reviewer",
  "prompt": "Review this pull request",
  "options": {
    "temperature": 0.7,      // Creativity level (0.0-1.0)
    "complexity": "high",    // Model selection hint
    "maxTokens": 4000,       // Response length limit
    "context": "enterprise"  // Context hint for agent
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'integration',
      title: 'External Integration',
      icon: <Code className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Integrating External Applications
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect any application to AgentHive using our REST API endpoints.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
              🌐 System API Base URL
            </h3>
            <div className="font-mono text-sm bg-green-100 dark:bg-green-900 px-3 py-2 rounded">
              http://localhost:4001
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🔌 Core Integration Endpoints
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Execute AI Agent</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Send tasks to specialized AI agents and receive intelligent responses.
                </p>
                <CodeBlock language="http">POST /api/agents/execute
Content-Type: application/json

{
  "agentId": "security-auditor",
  "prompt": "Analyze this code for security vulnerabilities",
  "options": {
    "temperature": 0.7,
    "complexity": "medium"
  }
}</CodeBlock>
                
                <div className="mt-3">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Response Format:</h5>
                  <CodeBlock language="json">{`{
  "success": true,
  "response": "AI agent response text...",
  "metadata": {
    "agentId": "security-auditor",
    "model": "qwen2.5:14b-instruct",
    "tokens": 150,
    "duration": 2400,
    "cost": 0.00
  }
}`}</CodeBlock>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Load Balancing & Distribution</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Execute multiple agents concurrently with intelligent load distribution.
                </p>
                <CodeBlock language="http">POST /api/orchestration/distribute
Content-Type: application/json

{
  "requests": [
    {"agentId": "python-pro", "prompt": "Debug this function"},
    {"agentId": "security-auditor", "prompt": "Check for vulnerabilities"},
    {"agentId": "code-reviewer", "prompt": "Review code quality"}
  ]
}</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Real-time Metrics</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Monitor agent performance and system health.
                </p>
                <CodeBlock language="http">GET /api/metrics/agents
# Returns live performance data

GET /health  
# System health check</CodeBlock>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              💻 Language Examples
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Python Integration</h4>
                <CodeBlock language="python">{`import requests
import json

class AgentHiveClient:
    def __init__(self, base_url="http://localhost:4001"):
        self.base_url = base_url
    
    def execute_agent(self, agent_id, prompt, options={}):
        response = requests.post(f"{self.base_url}/api/agents/execute", 
            json={
                "agentId": agent_id,
                "prompt": prompt,
                "options": options
            }
        )
        return response.json()
    
    def get_metrics(self):
        response = requests.get(f"{self.base_url}/api/metrics/agents")
        return response.json()

# Usage
hive = AgentHiveClient()
result = hive.execute_agent("python-pro", "Optimize this code")
print(result["response"])`}</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Node.js Integration</h4>
                <CodeBlock language="javascript">{`class AgentHiveClient {
  constructor(baseUrl = 'http://localhost:4001') {
    this.baseUrl = baseUrl;
  }
  
  async executeAgent(agentId, prompt, options = {}) {
    const response = await fetch(\`\${this.baseUrl}/api/agents/execute\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, prompt, options })
    });
    return response.json();
  }
  
  async getMetrics() {
    const response = await fetch(\`\${this.baseUrl}/api/metrics/agents\`);
    return response.json();
  }
}

// Usage
const hive = new AgentHiveClient();
const result = await hive.executeAgent('security-auditor', 'Check this config');
console.log(result.response);`}</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">cURL Examples</h4>
                <CodeBlock language="bash">{`# Execute an agent
curl -X POST http://localhost:4001/api/agents/execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "database-optimizer",
    "prompt": "Optimize this SQL query",
    "options": {"temperature": 0.3}
  }'

# Check system health
curl http://localhost:4001/health

# Get live metrics
curl http://localhost:4001/api/metrics/agents`}</CodeBlock>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'api',
      title: 'API Reference',
      icon: <ExternalLink className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Complete API Reference
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Full documentation of all AgentHive System API endpoints.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                method: 'POST',
                endpoint: '/api/agents/execute',
                description: 'Execute a specific AI agent with a prompt',
                parameters: [
                  { name: 'agentId', type: 'string', required: true, description: 'ID of the agent to execute' },
                  { name: 'prompt', type: 'string', required: true, description: 'Task or question for the agent' },
                  { name: 'options.temperature', type: 'number', required: false, description: 'Creativity level (0.0-1.0)' },
                  { name: 'options.complexity', type: 'string', required: false, description: 'Task complexity hint (low/medium/high)' },
                  { name: 'options.maxTokens', type: 'number', required: false, description: 'Maximum response length' },
                ],
                response: {
                  success: 'boolean',
                  response: 'string - Agent response text',
                  metadata: 'object - Execution metadata (model, tokens, duration, cost)'
                }
              },
              {
                method: 'POST',
                endpoint: '/api/orchestration/distribute',
                description: 'Execute multiple agents concurrently with load balancing',
                parameters: [
                  { name: 'requests', type: 'array', required: true, description: 'Array of agent execution requests' },
                  { name: 'requests[].agentId', type: 'string', required: true, description: 'Agent to execute' },
                  { name: 'requests[].prompt', type: 'string', required: true, description: 'Task for the agent' },
                ],
                response: {
                  success: 'boolean',
                  distribution: 'object - Load balancing results',
                  results: 'array - Individual agent responses'
                }
              },
              {
                method: 'POST',
                endpoint: '/api/orchestration/route',
                description: 'Intelligent routing to select optimal agent for task',
                parameters: [
                  { name: 'prompt', type: 'string', required: true, description: 'Task description' },
                  { name: 'preferences', type: 'array', required: false, description: 'Preferred agent types' },
                ],
                response: {
                  recommendedAgent: 'string - Best agent for the task',
                  confidence: 'number - Routing confidence score',
                  alternatives: 'array - Alternative agent suggestions'
                }
              },
              {
                method: 'GET',
                endpoint: '/api/metrics/agents',
                description: 'Get real-time performance metrics for all agents',
                parameters: [],
                response: {
                  timestamp: 'string - Current timestamp',
                  totalAgents: 'number - Total registered agents',
                  activeAgents: 'number - Currently active agents',
                  metrics: 'array - Individual agent performance data'
                }
              },
              {
                method: 'GET',
                endpoint: '/health',
                description: 'System health check including Ollama status',
                parameters: [],
                response: {
                  status: 'string - Overall system health (healthy/degraded)',
                  service: 'string - Service name',
                  version: 'string - API version',
                  ollama: 'object - Ollama connection status',
                  system: 'object - System resource status'
                }
              },
              {
                method: 'GET',
                endpoint: '/api/status',
                description: 'Detailed system status and configuration',
                parameters: [],
                response: {
                  service: 'string - Service name',
                  features: 'object - Enabled features status',
                  ollama: 'object - Ollama configuration and models',
                  agents: 'array - Current agent metrics'
                }
              }
            ].map((endpoint, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded mr-3 ${
                    endpoint.method === 'GET' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {endpoint.endpoint}
                  </code>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {endpoint.description}
                </p>
                
                {endpoint.parameters.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Parameters:</h4>
                    <div className="space-y-2">
                      {endpoint.parameters.map((param, paramIndex) => (
                        <div key={paramIndex} className="flex flex-wrap gap-2 text-sm">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                            {param.name}
                          </code>
                          <span className="text-gray-500 dark:text-gray-500">
                            {param.type}
                          </span>
                          <span className={param.required ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-500'}>
                            {param.required ? 'required' : 'optional'}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            - {param.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Response:</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                    {Object.entries(endpoint.response).map(([key, value], responseIndex) => (
                      <div key={responseIndex} className="mb-1">
                        <code className="text-purple-600 dark:text-purple-400">{key}</code>
                        <span className="text-gray-600 dark:text-gray-400">: {value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🔄 Rate Limiting
            </h3>
            <p className="text-blue-800 dark:text-blue-200">
              The System API has a rate limit of 1000 requests per 15-minute window. 
              For higher limits or production deployment, contact the AgentHive team.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'cli',
      title: 'CLI Usage',
      icon: <Terminal className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              AgentHive CLI Guide
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The AgentHive CLI provides a powerful command-line interface for interacting with AI agents.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              📦 Installation
            </h3>
            <CodeBlock>npm install -g @agenthive/cli</CodeBlock>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              After installation, use either <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">hive</code> or 
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">memory</code> commands (backward compatibility).
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🚀 Basic Commands
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Execute Agent</h4>
                <CodeBlock>hive execute &lt;agent-id&gt; "&lt;prompt&gt;"

# Examples:
hive execute security-auditor "Analyze this configuration"
hive execute python-pro "Optimize this algorithm"
hive execute code-reviewer "Review this pull request"</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">List Available Agents</h4>
                <CodeBlock>hive list agents

# Filter by category:
hive list agents --category security
hive list agents --category development</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">System Status</h4>
                <CodeBlock>hive status

# Detailed health check:
hive status --detailed</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Configuration</h4>
                <CodeBlock>hive config set api-url http://localhost:4001
hive config set default-temperature 0.7
hive config list</CodeBlock>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              ⚙️ Advanced Options
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Temperature Control</h4>
                <CodeBlock>hive execute python-pro "Debug this function" --temperature 0.3

# Temperature ranges:
# 0.0-0.3: Focused, deterministic responses
# 0.4-0.7: Balanced creativity and accuracy  
# 0.8-1.0: Creative, exploratory responses</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Complexity Hints</h4>
                <CodeBlock>hive execute security-auditor "Full security audit" --complexity high

# Complexity levels:
# low: Simple questions, uses 7B model
# medium: Standard tasks, uses 14B model  
# high: Complex analysis, uses 32B model</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Output Formatting</h4>
                <CodeBlock>hive execute code-reviewer "Review code" --format json
hive execute python-pro "Analyze" --format markdown
hive execute security-auditor "Scan" --output results.txt</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Batch Processing</h4>
                <CodeBlock>hive batch tasks.json

# tasks.json format:
{
  "tasks": [
    {"agent": "security-auditor", "prompt": "Check config"},
    {"agent": "code-reviewer", "prompt": "Review code"},
    {"agent": "python-pro", "prompt": "Optimize function"}
  ]
}</CodeBlock>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              📊 Monitoring Commands
            </h3>
            
            <CodeBlock>hive metrics                    # Real-time agent metrics
hive metrics --agent python-pro    # Specific agent metrics
hive logs                          # System logs
hive health                        # Ollama connection status</CodeBlock>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              💡 Pro Tips
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Use <code>hive --help</code> for full command reference</li>
              <li>• Set default configurations to avoid repeating options</li>
              <li>• Use batch processing for multiple related tasks</li>
              <li>• Monitor metrics to optimize agent performance</li>
              <li>• Complex prompts work better with higher complexity settings</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <Settings className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Troubleshooting Guide
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Common issues and their solutions when using AgentHive.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                issue: 'System API not responding (port 4001)',
                symptoms: ['Dashboard shows "Loading..." indefinitely', 'API calls return connection errors', 'Agent execution fails'],
                solution: (
                  <div className="space-y-3">
                    <p>Check if the System API is running:</p>
                    <CodeBlock>curl http://localhost:4001/health</CodeBlock>
                    <p>If not running, start the System API:</p>
                    <CodeBlock>cd packages/system-api
npm install
npm start</CodeBlock>
                  </div>
                )
              },
              {
                issue: 'Ollama connection failed',
                symptoms: ['Health check shows Ollama as unhealthy', 'Agent execution returns Ollama errors', 'Model routing fails'],
                solution: (
                  <div className="space-y-3">
                    <p>Verify Ollama is running on the RTX 5090 server:</p>
                    <CodeBlock>curl http://172.28.96.1:11434/api/tags</CodeBlock>
                    <p>If Ollama is down, restart it on the GPU server:</p>
                    <CodeBlock>ssh gpu-server
sudo systemctl restart ollama
ollama serve</CodeBlock>
                  </div>
                )
              },
              {
                issue: 'No agents showing in dashboard',
                symptoms: ['Agent Management shows empty list', 'Analytics shows 0 agents', 'Database connection issues'],
                solution: (
                  <div className="space-y-3">
                    <p>Check database connectivity:</p>
                    <CodeBlock>ls -la database.sqlite
sqlite3 database.sqlite "SELECT COUNT(*) FROM agents;"</CodeBlock>
                    <p>If database is missing, reinitialize:</p>
                    <CodeBlock>npm run db:seed</CodeBlock>
                  </div>
                )
              },
              {
                issue: 'High response times',
                symptoms: ['Agents taking >10 seconds to respond', 'Dashboard shows high latency metrics', 'Timeouts on API calls'],
                solution: (
                  <div className="space-y-3">
                    <p>Check GPU utilization on RTX 5090:</p>
                    <CodeBlock>nvidia-smi</CodeBlock>
                    <p>Monitor System API performance:</p>
                    <CodeBlock>curl http://localhost:4001/api/metrics/agents</CodeBlock>
                    <p>Use lower complexity models for faster responses:</p>
                    <CodeBlock>hive execute agent-id "prompt" --complexity low</CodeBlock>
                  </div>
                )
              },
              {
                issue: 'Frontend not loading (port 3001)',
                symptoms: ['Browser shows connection refused', 'Blank white page', 'Console errors'],
                solution: (
                  <div className="space-y-3">
                    <p>Verify the development server is running:</p>
                    <CodeBlock>npm run dev</CodeBlock>
                    <p>Check if port 3001 is available:</p>
                    <CodeBlock>lsof -i :3001</CodeBlock>
                    <p>Clear browser cache and hard refresh (Ctrl+Shift+R)</p>
                  </div>
                )
              },
              {
                issue: 'Authentication errors',
                symptoms: ['Login page redirects loop', 'Invalid credentials error', 'Session expires immediately'],
                solution: (
                  <div className="space-y-3">
                    <p>Use the correct development credentials:</p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border">
                      <strong>Email:</strong> admin@localhost<br/>
                      <strong>Password:</strong> development-only-password
                    </div>
                    <p>Clear browser cookies and local storage</p>
                    <p>Check User API is running on port 4000:</p>
                    <CodeBlock>curl http://localhost:4000/graphql</CodeBlock>
                  </div>
                )
              }
            ].map((item, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  ❌ {item.issue}
                </h3>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Symptoms:</h4>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                    {item.symptoms.map((symptom, symptomIndex) => (
                      <li key={symptomIndex}>{symptom}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Solution:</h4>
                  <div className="text-gray-600 dark:text-gray-400">
                    {item.solution}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              🆘 Still Need Help?
            </h3>
            <div className="text-blue-800 dark:text-blue-200 space-y-2">
              <p>If these solutions don't resolve your issue:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check the browser console for JavaScript errors</li>
                <li>Review server logs in the terminal where you ran <code>npm run dev</code></li>
                <li>Verify all services are running: Frontend (3001), User API (4000), System API (4001)</li>
                <li>Test the production readiness with: <code>node test-production-readiness.js</code></li>
              </ul>
            </div>
          </div>
        </div>
      ),
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Book className="w-5 h-5 mr-2" />
              Application Manual
            </h2>
            <nav className="space-y-1">
              {manualSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {section.icon}
                  <span className="ml-3">{section.title}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${
                    activeSection === section.id ? 'rotate-90' : ''
                  }`} />
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          {manualSections.find(s => s.id === activeSection)?.content}
        </div>
      </div>
    </div>
  );
};

export default ApplicationManual;