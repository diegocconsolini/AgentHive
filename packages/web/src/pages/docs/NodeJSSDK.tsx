import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  CheckCircle,
  ExternalLink,
  Play,
  AlertCircle,
  Package,
  Terminal,
  FileText,
} from 'lucide-react';

const NodeJSSDK: React.FC = () => {
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
    language = 'javascript',
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-yellow-600 rounded-lg flex items-center justify-center mr-4">
            <Code className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Node.js SDK Documentation
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Official Node.js client library for AgentHive AI orchestration platform
        </p>
      </div>

      {/* Installation */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <Package className="w-6 h-6 mr-3" />
          Installation
        </h2>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
            Install via npm
          </h3>
          <CodeBlock language="bash">{`npm install @agenthive/client`}</CodeBlock>
          
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3 mt-4">
            Or via yarn
          </h3>
          <CodeBlock language="bash">{`yarn add @agenthive/client`}</CodeBlock>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Development Version</h4>
              <p className="text-yellow-800 dark:text-yellow-200 mb-3">
                Since this is a local AgentHive instance, install directly from the project source:
              </p>
              <CodeBlock language="bash">{`# Clone the AgentHive repository
git clone https://github.com/diegocconsolini/AgentHive.git
cd AgentHive/sdks/nodejs
npm install
npm run build
npm link`}</CodeBlock>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <Play className="w-6 h-6 mr-3" />
          Quick Start
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">ES6/TypeScript</h3>
            <CodeBlock>{`import { AgentHiveClient } from '@agenthive/client';

// Initialize the client
const client = new AgentHiveClient({
  baseUrl: 'http://localhost:4001',
  timeout: 30000
});

// Execute a security audit
const response = await client.executeAgent({
  agentId: 'security-auditor',
  prompt: 'Analyze this configuration for security vulnerabilities',
  options: {
    temperature: 0.7,
    complexity: 'high'
  }
});

console.log('Agent Response:', response.text);
console.log('Duration:', response.metadata.duration, 'ms');
console.log('Tokens Used:', response.metadata.tokens);
console.log('Cost: $', response.metadata.cost.toFixed(4));
`}</CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">CommonJS</h3>
            <CodeBlock>{`const { AgentHiveClient } = require('@agenthive/client');

// Initialize the client
const client = new AgentHiveClient({
  baseUrl: 'http://localhost:4001'
});

// Execute agent with callback
client.executeAgent({
  agentId: 'python-pro',
  prompt: 'Optimize this algorithm for better performance'
}).then(response => {
  console.log('Response:', response.text);
}).catch(error => {
  console.error('Error:', error.message);
});
`}</CodeBlock>
          </div>
        </div>
      </div>

      {/* API Reference */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          API Reference
        </h2>

        <div className="space-y-8">
          {/* AgentHiveClient */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              AgentHiveClient
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Main client class for interacting with the AgentHive System API.
            </p>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Constructor</h4>
              <CodeBlock>{`import { AgentHiveClient, ClientConfig } from '@agenthive/client';

const config: ClientConfig = {
  baseUrl: 'http://localhost:4001',  // AgentHive System API URL
  timeout: 30000,                    // Request timeout in milliseconds
  maxRetries: 3,                     // Maximum retry attempts
  retryDelay: 1000,                  // Delay between retries in milliseconds
  userAgent: 'MyApp/1.0'             // Custom User-Agent string
};

const client = new AgentHiveClient(config);
`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Configuration Options</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3">Property</th>
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-left py-2 px-3">Default</th>
                      <th className="text-left py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">baseUrl</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">string</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Required</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">AgentHive System API base URL</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">timeout</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">number</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">30000</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">HTTP request timeout in milliseconds</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">maxRetries</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">number</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">3</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Maximum number of retry attempts</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">retryDelay</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">number</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">1000</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Delay between retry attempts in ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* executeAgent method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              executeAgent()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Execute a specific AI agent with a prompt and options.
            </p>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Method Signature</h4>
              <CodeBlock language="typescript">{`async executeAgent(request: AgentExecutionRequest): Promise<AgentResponse>

interface AgentExecutionRequest {
  agentId: string;
  prompt: string;
  options?: {
    temperature?: number;
    complexity?: 'low' | 'medium' | 'high';
    maxTokens?: number;
    context?: string;
  };
}
`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Example Usage</h4>
              <CodeBlock>{`// Basic execution
const response = await client.executeAgent({
  agentId: 'python-pro',
  prompt: 'Optimize this Python function for better performance'
});

// With options
const response = await client.executeAgent({
  agentId: 'security-auditor',
  prompt: 'Review this code for security vulnerabilities',
  options: {
    temperature: 0.3,      // Lower temperature for focused analysis
    complexity: 'high',    // Use 32B model for complex analysis
    maxTokens: 4000,       // Limit response length
    context: 'enterprise'  // Add context hint
  }
});

// Access response data
console.log('Response:', response.text);
console.log('Success:', response.success);
console.log('Agent ID:', response.metadata.agentId);
console.log('Model Used:', response.metadata.model);
console.log('Duration:', response.metadata.duration, 'ms');
console.log('Tokens:', response.metadata.tokens);
console.log('Cost: $', response.metadata.cost.toFixed(4));

// TypeScript users get full type safety
const metadata: AgentExecutionMetadata = response.metadata;
const duration: number = metadata.duration;
const model: string = metadata.model;
`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Response Interface</h4>
              <CodeBlock language="typescript">{`interface AgentResponse {
  success: boolean;
  text: string;
  metadata: AgentExecutionMetadata;
}

interface AgentExecutionMetadata {
  agentId: string;
  model: string;
  tokens: number;
  duration: number;
  cost: number;
  timestamp: string;
}
`}</CodeBlock>
            </div>
          </div>

          {/* executeBatch method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              executeBatch()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Execute multiple agents concurrently with load balancing.
            </p>
            
            <CodeBlock>{`// Execute multiple agents in parallel
const requests = [
  { agentId: 'security-auditor', prompt: 'Check for vulnerabilities' },
  { agentId: 'code-reviewer', prompt: 'Review code quality' },
  { agentId: 'python-pro', prompt: 'Optimize performance' }
];

const batchResponse = await client.executeBatch({
  requests: requests,
  options: {
    maxConcurrency: 3,
    timeout: 30000
  }
});

console.log('Completed:', batchResponse.distribution.completed);
console.log('Failed:', batchResponse.distribution.failed);
console.log('Average Time:', batchResponse.distribution.averageTime, 'ms');

// Access individual results with full typing
batchResponse.results.forEach((result, index) => {
  console.log(\`Agent \${result.agentId}: \${result.response?.substring(0, 100)}...\`);
});

// TypeScript interface
interface BatchExecutionResponse {
  success: boolean;
  distribution: {
    totalRequests: number;
    completed: number;
    failed: number;
    averageTime: number;
  };
  results: Array<{
    agentId: string;
    success: boolean;
    response?: string;
    error?: string;
    duration: number;
  }>;
}
`}</CodeBlock>
            </div>
          </div>

          {/* getMetrics method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              getMetrics()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Retrieve real-time performance metrics for all agents.
            </p>
            
            <CodeBlock>{`// Get current system metrics
const metrics = await client.getMetrics();

console.log('Total Agents:', metrics.totalAgents);
console.log('Active Agents:', metrics.activeAgents);
console.log('System Timestamp:', metrics.timestamp);

// Access individual agent metrics with type safety
metrics.agents.forEach(agentMetric => {
  console.log(\`Agent: \${agentMetric.agentId}\`);
  console.log(\`  Requests: \${agentMetric.totalRequests}\`);
  console.log(\`  Errors: \${agentMetric.errors}\`);
  console.log(\`  Avg Duration: \${agentMetric.avgDuration}ms\`);
  console.log(\`  Success Rate: \${(agentMetric.successRate * 100).toFixed(1)}%\`);
});

// TypeScript interface
interface SystemMetrics {
  timestamp: string;
  totalAgents: number;
  activeAgents: number;
  agents: AgentMetric[];
}

interface AgentMetric {
  agentId: string;
  totalRequests: number;
  errors: number;
  totalDuration: number;
  avgDuration: number;
  lastUsed: string;
  isActive: boolean;
  totalTokens: number;
  successRate: number;
}
`}</CodeBlock>
            </div>
          </div>

          {/* checkHealth method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              checkHealth()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Check the health status of the AgentHive system and Ollama integration.
            </p>
            
            <CodeBlock>{`// Check system health
const health = await client.checkHealth();

console.log('System Status:', health.status);
console.log('Service:', health.service);
console.log('Version:', health.version);
console.log('Ollama Healthy:', health.ollama.healthy);
console.log('Available Models:', health.ollama.models?.length || 0);
console.log('Active Agents:', health.activeAgents);

// Check if system is operational
if (health.isHealthy()) {
  console.log('✅ AgentHive is ready for agent execution');
} else {
  console.log('❌ AgentHive system issues detected');
}

// TypeScript interface
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  service: string;
  version: string;
  ollama: {
    healthy: boolean;
    baseUrl: string;
    models?: string[];
  };
  system: {
    healthy: boolean;
    uptime?: number;
  };
  activeAgents: number;
  isHealthy(): boolean;
}`}</CodeBlock>
            </div>
          </div>
        </div>
      </div>

      {/* Available Agents */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Available Agents
        </h2>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            AgentHive includes 88+ specialized agents. Here are some popular ones:
          </p>
          
          <CodeBlock>{`// Development & Code Review
await client.executeAgent({
  agentId: 'python-pro',
  prompt: 'Optimize this algorithm'
});

await client.executeAgent({
  agentId: 'javascript-pro', 
  prompt: 'Debug this Node.js function'
});

await client.executeAgent({
  agentId: 'code-reviewer',
  prompt: 'Review this pull request'
});

// Security & Analysis  
await client.executeAgent({
  agentId: 'security-auditor',
  prompt: 'Analyze for vulnerabilities'
});

await client.executeAgent({
  agentId: 'database-optimizer',
  prompt: 'Optimize this SQL query'
});

// DevOps & Infrastructure
await client.executeAgent({
  agentId: 'devops-engineer',
  prompt: 'Setup CI/CD pipeline'
});

await client.executeAgent({
  agentId: 'cloud-architect',
  prompt: 'Design AWS infrastructure'
});

// Data & ML
await client.executeAgent({
  agentId: 'data-scientist',
  prompt: 'Analyze this dataset'
});

await client.executeAgent({
  agentId: 'ml-engineer',
  prompt: 'Build ML pipeline'
});
`}</CodeBlock>
        </div>
      </div>

      {/* Error Handling */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Error Handling
        </h2>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Error Types
            </h3>
            
            <CodeBlock language="typescript">{`import {
  AgentHiveError,        // Base error class
  ConnectionError,       // Network connectivity issues
  AuthenticationError,   // Authentication failures  
  AgentNotFoundError,   // Invalid agent ID
  RateLimitError,       // Too many requests
  ExecutionError,       // Agent execution failures
  TimeoutError          // Request timeout
} from '@agenthive/client';

try {
  const response = await client.executeAgent({
    agentId: 'security-auditor',
    prompt: 'Analyze this configuration',
    options: { timeout: 10000 }
  });
  
} catch (error) {
  if (error instanceof AgentNotFoundError) {
    console.error('Invalid agent ID:', error.message);
    
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded:', error.message);
    console.log('Retry after:', error.retryAfter, 'seconds');
    
  } else if (error instanceof ExecutionError) {
    console.error('Agent execution failed:', error.message);
    console.log('Error code:', error.code);
    
  } else if (error instanceof TimeoutError) {
    console.error(\`Request timed out after \${error.timeout} seconds\`);
    
  } else if (error instanceof ConnectionError) {
    console.error('Cannot connect to AgentHive:', error.message);
    
  } else if (error instanceof AgentHiveError) {
    console.error('General AgentHive error:', error.message);
    
  } else {
    console.error('Unexpected error:', error);
  }
}
`}</CodeBlock>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Robust Error Handling Example
              </h3>
              
              <CodeBlock>{`class RobustAgentExecutor {
  constructor(client) {
    this.client = client;
    this.maxRetries = 3;
  }
  
  async executeWithRetry(agentId, prompt, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.client.executeAgent({
          agentId,
          prompt,
          options
        });
        
      } catch (error) {
        lastError = error;
        console.warn(\`Attempt \${attempt} failed:\`, error.message);
        
        // Don't retry on certain errors
        if (error instanceof AgentNotFoundError || 
            error instanceof AuthenticationError) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = 1000 * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(\`Failed after \${this.maxRetries} attempts. Last error: \${lastError.message}\`);
  }
  
  async executeWithFallback(agentId, prompt, fallbackResponse = "I'm unable to process your request right now.") {
    try {
      const response = await this.executeWithRetry(agentId, prompt);
      return response.text;
    } catch (error) {
      console.error('Agent execution failed:', error);
      return fallbackResponse;
    }
  }
}

// Usage
const client = new AgentHiveClient({ baseUrl: 'http://localhost:4001' });
const robustExecutor = new RobustAgentExecutor(client);

const result = await robustExecutor.executeWithRetry(
  'python-pro', 
  'Optimize this function'
);
`}</CodeBlock>
            </div>
        </div>
      </div>

      {/* Advanced Usage */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Advanced Usage
        </h2>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Event-Driven Architecture
            </h3>
            
            <CodeBlock>{`import { AgentHiveClient, EventEmitter } from '@agenthive/client';

class EventDrivenAgentClient extends EventEmitter {
  constructor(config) {
    super();
    this.client = new AgentHiveClient(config);
  }
  
  async executeAgent(request) {
    this.emit('executionStarted', { agentId: request.agentId });
    
    try {
      const response = await this.client.executeAgent(request);
      
      this.emit('executionCompleted', {
        agentId: request.agentId,
        duration: response.metadata.duration,
        tokens: response.metadata.tokens
      });
      
      return response;
      
    } catch (error) {
      this.emit('executionFailed', {
        agentId: request.agentId,
        error: error.message
      });
      throw error;
    }
  }
}

// Usage
const eventClient = new EventDrivenAgentClient({ 
  baseUrl: 'http://localhost:4001' 
});

eventClient.on('executionStarted', (data) => {
  console.log(\`🚀 Started executing agent: \${data.agentId}\`);
});

eventClient.on('executionCompleted', (data) => {
  console.log(\`✅ Agent \${data.agentId} completed in \${data.duration}ms\`);
});

eventClient.on('executionFailed', (data) => {
  console.log(\`❌ Agent \${data.agentId} failed: \${data.error}\`);
});

const response = await eventClient.executeAgent({
  agentId: 'security-auditor',
  prompt: 'Analyze security posture'
});
`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Streaming Responses (Future Feature)
            </h3>
            
            <CodeBlock>{`// Streaming API (planned feature)
const stream = client.executeAgentStream({
  agentId: 'python-pro',
  prompt: 'Generate a comprehensive code review'
});

stream.on('data', (chunk) => {
  process.stdout.write(chunk.text);
});

stream.on('metadata', (metadata) => {
  console.log('\\nExecution metadata:', metadata);
});

stream.on('complete', (response) => {
  console.log('\\nExecution completed');
  console.log('Total tokens:', response.metadata.tokens);
});

stream.on('error', (error) => {
  console.error('Stream error:', error);
});
`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Custom HTTP Headers & Middleware
            </h3>
            
            <CodeBlock>{`import { AgentHiveClient } from '@agenthive/client';

// Custom middleware for request/response logging
const loggingMiddleware = {
  beforeRequest: (config) => {
    console.log(\`Making request to: \${config.url}\`);
    console.log('Request body:', JSON.stringify(config.data, null, 2));
    return config;
  },
  
  afterResponse: (response) => {
    console.log(\`Response status: \${response.status}\`);
    console.log('Response time:', response.headers['x-response-time']);
    return response;
  },
  
  onError: (error) => {
    console.error('Request failed:', error.message);
    throw error;
  }
};

const client = new AgentHiveClient({
  baseUrl: 'http://localhost:4001',
  headers: {
    'User-Agent': 'MyApp/2.0 (Node.js)',
    'X-Client-Version': '1.0.0'
  },
  middleware: [loggingMiddleware]
});

// Custom authentication middleware
const authMiddleware = {
  beforeRequest: (config) => {
    // Add custom authentication if needed in the future
    const apiKey = process.env.AGENTHIVE_API_KEY;
    if (apiKey) {
      config.headers['Authorization'] = \`Bearer \${apiKey}\`;
    }
    return config;
  }
};
`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Connection Pooling & Performance
            </h3>
            
            <CodeBlock>{`import { AgentHiveClient } from '@agenthive/client';
import { Agent as HTTPSAgent } from 'https';

// Custom HTTPS agent for connection pooling
const httpsAgent = new HTTPSAgent({
  keepAlive: true,
  maxSockets: 10,
  maxFreeSockets: 5,
  timeout: 60000,
  freeSocketTimeout: 30000
});

const client = new AgentHiveClient({
  baseUrl: 'http://localhost:4001',
  httpsAgent: httpsAgent,
  
  // Performance optimizations
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  
  // Request compression
  compress: true,
  
  // Connection keepalive
  keepAlive: true
});

// Bulk operations with connection reuse
async function processManyRequests() {
  const requests = [
    { agentId: 'security-auditor', prompt: 'Security check 1' },
    { agentId: 'code-reviewer', prompt: 'Code review 1' },
    { agentId: 'python-pro', prompt: 'Optimization 1' },
    // ... many more requests
  ];
  
  // Process in batches to avoid overwhelming the server
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    
    const batchPromises = batch.map(req => 
      client.executeAgent(req).catch(error => ({
        error: error.message,
        agentId: req.agentId
      }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}
`}</CodeBlock>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <FileText className="w-6 h-6 mr-3" />
          Complete Examples
        </h2>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Express.js API Integration
            </h3>
            
            <CodeBlock>{`// server.js - Express.js integration with AgentHive
const express = require('express');
const { AgentHiveClient } = require('@agenthive/client');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// Initialize AgentHive client
const agentClient = new AgentHiveClient({
  baseUrl: 'http://localhost:4001',
  timeout: 30000
});

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/agents', limiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const health = await agentClient.checkHealth();
    res.json({
      status: 'ok',
      agenthive: health.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'AgentHive unavailable',
      error: error.message
    });
  }
});

// Execute agent endpoint
app.post('/api/agents/execute', async (req, res) => {
  try {
    const { agentId, prompt, options } = req.body;
    
    // Validate required fields
    if (!agentId || !prompt) {
      return res.status(400).json({
        error: 'Missing required fields: agentId and prompt'
      });
    }
    
    // Execute agent
    const response = await agentClient.executeAgent({
      agentId,
      prompt,
      options
    });
    
    // Return response
    res.json({
      success: true,
      response: response.text,
      metadata: {
        agentId: response.metadata.agentId,
        model: response.metadata.model,
        duration: response.metadata.duration,
        tokens: response.metadata.tokens,
        cost: response.metadata.cost
      }
    });
    
  } catch (error) {
    console.error('Agent execution error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code || 'EXECUTION_ERROR'
    });
  }
});

// Batch execution endpoint
app.post('/api/agents/batch', async (req, res) => {
  try {
    const { requests, options } = req.body;
    
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        error: 'Requests must be a non-empty array'
      });
    }
    
    // Limit batch size
    if (requests.length > 10) {
      return res.status(400).json({
        error: 'Batch size limited to 10 requests'
      });
    }
    
    const batchResponse = await agentClient.executeBatch({
      requests,
      options
    });
    
    res.json(batchResponse);
    
  } catch (error) {
    console.error('Batch execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get system metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await agentClient.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
  console.log('AgentHive integration ready');
});

module.exports = app;
`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              CLI Tool with AgentHive
            </h3>
            
            <CodeBlock>{`#!/usr/bin/env node
// agenthive-cli.js - Command line tool using AgentHive

const { Command } = require('commander');
const { AgentHiveClient } = require('@agenthive/client');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs').promises;

const program = new Command();

// Initialize client
const client = new AgentHiveClient({
  baseUrl: process.env.AGENTHIVE_URL || 'http://localhost:4001'
});

program
  .name('agenthive-cli')
  .description('Command line interface for AgentHive')
  .version('1.0.0');

// Execute agent command
program
  .command('execute <agent> <prompt>')
  .description('Execute an AI agent with a prompt')
  .option('-t, --temperature <number>', 'Set temperature (0.0-1.0)', '0.7')
  .option('-c, --complexity <level>', 'Set complexity (low/medium/high)', 'medium')
  .option('-o, --output <file>', 'Save response to file')
  .option('--json', 'Output in JSON format')
  .action(async (agent, prompt, options) => {
    const spinner = ora(\`Executing \${agent} agent...\`).start();
    
    try {
      const response = await client.executeAgent({
        agentId: agent,
        prompt: prompt,
        options: {
          temperature: parseFloat(options.temperature),
          complexity: options.complexity
        }
      });
      
      spinner.succeed(chalk.green('Agent execution completed'));
      
      if (options.json) {
        const output = {
          success: response.success,
          response: response.text,
          metadata: response.metadata
        };
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(chalk.cyan('\\n--- Agent Response ---'));
        console.log(response.text);
        console.log(chalk.gray(\`\\nModel: \${response.metadata.model}\`));
        console.log(chalk.gray(\`Duration: \${response.metadata.duration}ms\`));
        console.log(chalk.gray(\`Tokens: \${response.metadata.tokens}\`));
        console.log(chalk.gray(\`Cost: $\${response.metadata.cost.toFixed(4)}\`));
      }
      
      // Save to file if requested
      if (options.output) {
        await fs.writeFile(options.output, response.text, 'utf8');
        console.log(chalk.green(\`Response saved to \${options.output}\`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red('Agent execution failed'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// List agents command
program
  .command('list')
  .description('List available agents')
  .action(async () => {
    const spinner = ora('Fetching agent list...').start();
    
    try {
      const metrics = await client.getMetrics();
      spinner.succeed(chalk.green('Agents retrieved'));
      
      console.log(chalk.cyan(\`\\nAvailable Agents (\${metrics.totalAgents} total, \${metrics.activeAgents} active):\`));
      console.log('─'.repeat(60));
      
      metrics.agents.forEach(agent => {
        const status = agent.isActive ? 
          chalk.green('●') : chalk.gray('○');
        const requests = agent.totalRequests || 0;
        const successRate = ((1 - (agent.errors || 0) / Math.max(requests, 1)) * 100).toFixed(1);
        
        console.log(\`\${status} \${chalk.cyan(agent.agentId.padEnd(25))} \${requests.toString().padStart(8)} requests  \${successRate}% success\`);
      });
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch agents'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Health check command
program
  .command('health')
  .description('Check AgentHive system health')
  .action(async () => {
    const spinner = ora('Checking system health...').start();
    
    try {
      const health = await client.checkHealth();
      
      if (health.status === 'healthy') {
        spinner.succeed(chalk.green('System is healthy'));
      } else {
        spinner.warn(chalk.yellow('System is degraded'));
      }
      
      console.log(chalk.cyan('\\n--- System Status ---'));
      console.log(\`Status: \${health.status === 'healthy' ? chalk.green(health.status) : chalk.yellow(health.status)}\`);
      console.log(\`Service: \${health.service}\`);
      console.log(\`Version: \${health.version}\`);
      console.log(\`Ollama: \${health.ollama.healthy ? chalk.green('healthy') : chalk.red('unhealthy')}\`);
      console.log(\`Active Agents: \${health.activeAgents}\`);
      
      if (health.ollama.models) {
        console.log(\`Available Models: \${health.ollama.models.length}\`);
      }
      
    } catch (error) {
      spinner.fail(chalk.red('Health check failed'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// File processing command
program
  .command('process-file <file> <agent>')
  .description('Process a file with an AI agent')
  .option('-o, --output <file>', 'Save response to file')
  .action(async (file, agent, options) => {
    const spinner = ora(\`Processing \${file} with \${agent}...\`).start();
    
    try {
      // Read file content
      const content = await fs.readFile(file, 'utf8');
      
      // Execute agent with file content
      const response = await client.executeAgent({
        agentId: agent,
        prompt: \`Please analyze this file content:\\n\\n\${content}\`
      });
      
      spinner.succeed(chalk.green('File processing completed'));
      
      console.log(chalk.cyan('\\n--- Analysis Results ---'));
      console.log(response.text);
      
      // Save results if requested
      if (options.output) {
        await fs.writeFile(options.output, response.text, 'utf8');
        console.log(chalk.green(\`Results saved to \${options.output}\`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red('File processing failed'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Usage examples:
// node agenthive-cli.js execute security-auditor "Check this config"
// node agenthive-cli.js list
// node agenthive-cli.js health
// node agenthive-cli.js process-file config.json security-auditor
`}</CodeBlock>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Need More Examples?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Check out the complete Integration Guide for more advanced usage patterns and examples.
          </p>
          <a
            href="/integration"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Terminal className="w-4 h-4 mr-2" />
            View Integration Guide
          </a>
        </div>
      </div>
    </div>
  );
};

export default NodeJSSDK;