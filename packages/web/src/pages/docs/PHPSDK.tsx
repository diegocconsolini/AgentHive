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

const PHPSDK: React.FC = () => {
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
    language = 'php',
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
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mr-4">
            <Code className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            PHP SDK Documentation
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Official PHP client library for AgentHive AI orchestration platform
        </p>
      </div>

      {/* Installation */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <Package className="w-6 h-6 mr-3" />
          Installation
        </h2>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
            Install via Composer
          </h3>
          <CodeBlock language="bash">{`composer require agenthive/php-client`}</CodeBlock>
          
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3 mt-6">
            Autoload (if not using framework)
          </h3>
          <CodeBlock language="php">{`<?php
require_once 'vendor/autoload.php';

use AgentHive\\Client\\AgentHiveClient;
use AgentHive\\Client\\AgentExecutionRequest;`}</CodeBlock>
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
cd AgentHive/sdks/php

# Install dependencies
composer install

# Add to your composer.json
{
    "require": {
        "agenthive/php-client": "@dev"
    },
    "repositories": [
        {
            "type": "path",
            "url": "./path/to/AgentHive/sdks/php"
        }
    ]
}`}</CodeBlock>
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
        
        <CodeBlock>{`<?php
require_once 'vendor/autoload.php';

use AgentHive\\Client\\AgentHiveClient;
use AgentHive\\Client\\AgentExecutionRequest;
use AgentHive\\Client\\ExecutionOptions;
use AgentHive\\Client\\ClientConfig;

try {
    // Initialize the client
    $config = new ClientConfig([
        'baseUrl' => 'http://localhost:4001',
        'timeout' => 30, // seconds
    ]);
    
    $client = new AgentHiveClient($config);
    
    // Execute a security audit
    $options = new ExecutionOptions([
        'temperature' => 0.7,
        'complexity' => 'high'
    ]);
    
    $request = new AgentExecutionRequest([
        'agentId' => 'security-auditor',
        'prompt' => 'Analyze this configuration for security vulnerabilities',
        'options' => $options
    ]);
    
    $response = $client->executeAgent($request);
    
    echo "Agent Response: " . $response->getText() . "\\n";
    echo "Duration: " . $response->getMetadata()->getDuration() . "ms\\n";
    echo "Tokens Used: " . $response->getMetadata()->getTokens() . "\\n";
    echo "Cost: $" . number_format($response->getMetadata()->getCost(), 4) . "\\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}`}</CodeBlock>
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
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Constructor & Configuration</h4>
              <CodeBlock>{`<?php
use AgentHive\\Client\\AgentHiveClient;
use AgentHive\\Client\\ClientConfig;

// Basic configuration
$config = new ClientConfig([
    'baseUrl' => 'http://localhost:4001',     // AgentHive System API URL
    'timeout' => 30,                          // Request timeout in seconds
    'maxRetries' => 3,                        // Maximum retry attempts
    'retryDelay' => 1000,                     // Delay between retries in milliseconds
    'userAgent' => 'MyApp/1.0 (PHP)',        // Custom User-Agent string
]);

$client = new AgentHiveClient($config);

// Alternative array-based construction
$client = new AgentHiveClient([
    'baseUrl' => 'http://localhost:4001',
    'timeout' => 30,
    'maxRetries' => 3,
    'retryDelay' => 1000,
    'headers' => [
        'X-Custom-Header' => 'MyValue'
    ]
]);

// With SSL options for production
$client = new AgentHiveClient([
    'baseUrl' => 'https://your-agenthive-instance.com',
    'timeout' => 30,
    'sslOptions' => [
        'verify_peer' => true,
        'verify_host' => true,
        'cafile' => '/path/to/ca-bundle.crt'
    ]
]);`}</CodeBlock>
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
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">int</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">30</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">HTTP request timeout in seconds</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">maxRetries</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">int</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">3</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Maximum number of retry attempts</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">retryDelay</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">int</td>
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
              <CodeBlock>{`<?php
/**
 * Execute an AI agent with a prompt and options
 * 
 * @param AgentExecutionRequest $request The execution request
 * @return AgentResponse The response from the agent
 * @throws AgentHiveException On execution errors
 */
public function executeAgent(AgentExecutionRequest $request): AgentResponse

// Request class constructor
class AgentExecutionRequest {
    public function __construct(array $data = []) {
        $this->agentId = $data['agentId'] ?? '';
        $this->prompt = $data['prompt'] ?? '';
        $this->options = $data['options'] ?? null;
    }
}

// Execution options
class ExecutionOptions {
    public function __construct(array $options = []) {
        $this->temperature = $options['temperature'] ?? null;  // 0.0-1.0
        $this->complexity = $options['complexity'] ?? null;    // 'low', 'medium', 'high'
        $this->maxTokens = $options['maxTokens'] ?? null;      // integer
        $this->context = $options['context'] ?? null;          // string
    }
}`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Example Usage</h4>
              <CodeBlock>{`<?php
// Basic execution
$request = new AgentExecutionRequest([
    'agentId' => 'python-pro',
    'prompt' => 'Optimize this Python function for better performance'
]);

$response = $client->executeAgent($request);

// With options
$options = new ExecutionOptions([
    'temperature' => 0.3,        // Lower temperature for focused analysis
    'complexity' => 'high',      // Use 32B model for complex analysis
    'maxTokens' => 4000,         // Limit response length
    'context' => 'enterprise'    // Add context hint
]);

$requestWithOptions = new AgentExecutionRequest([
    'agentId' => 'security-auditor',
    'prompt' => 'Review this code for security vulnerabilities',
    'options' => $options
]);

$response = $client->executeAgent($requestWithOptions);

// Access response data
echo "Response: " . $response->getText() . "\\n";
echo "Success: " . ($response->isSuccess() ? 'true' : 'false') . "\\n";
echo "Agent ID: " . $response->getMetadata()->getAgentId() . "\\n";
echo "Model Used: " . $response->getMetadata()->getModel() . "\\n";
echo "Duration: " . $response->getMetadata()->getDuration() . "ms\\n";
echo "Tokens: " . $response->getMetadata()->getTokens() . "\\n";
echo "Cost: $" . number_format($response->getMetadata()->getCost(), 4) . "\\n";

// Fluent interface style (alternative)
$response = $client->executeAgent(
    AgentExecutionRequest::create()
        ->setAgentId('security-auditor')
        ->setPrompt('Analyze this configuration')
        ->setOptions(
            ExecutionOptions::create()
                ->setTemperature(0.7)
                ->setComplexity('high')
        )
);`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Response Classes</h4>
              <CodeBlock>{`<?php
class AgentResponse {
    private bool $success;
    private string $text;
    private AgentExecutionMetadata $metadata;
    
    public function isSuccess(): bool { return $this->success; }
    public function getText(): string { return $this->text; }
    public function getMetadata(): AgentExecutionMetadata { return $this->metadata; }
    
    // Convert to array for JSON serialization
    public function toArray(): array {
        return [
            'success' => $this->success,
            'text' => $this->text,
            'metadata' => $this->metadata->toArray()
        ];
    }
}

class AgentExecutionMetadata {
    private string $agentId;
    private string $model;
    private int $tokens;
    private int $duration;      // milliseconds
    private float $cost;
    private DateTime $timestamp;
    
    public function getAgentId(): string { return $this->agentId; }
    public function getModel(): string { return $this->model; }
    public function getTokens(): int { return $this->tokens; }
    public function getDuration(): int { return $this->duration; }
    public function getCost(): float { return $this->cost; }
    public function getTimestamp(): DateTime { return $this->timestamp; }
    
    public function toArray(): array {
        return [
            'agentId' => $this->agentId,
            'model' => $this->model,
            'tokens' => $this->tokens,
            'duration' => $this->duration,
            'cost' => $this->cost,
            'timestamp' => $this->timestamp->format('c')
        ];
    }
}`}</CodeBlock>
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
            
            <CodeBlock>{`<?php
// Execute multiple agents in parallel
$requests = [
    new AgentExecutionRequest([
        'agentId' => 'security-auditor',
        'prompt' => 'Check for vulnerabilities'
    ]),
    new AgentExecutionRequest([
        'agentId' => 'code-reviewer',
        'prompt' => 'Review code quality'
    ]),
    new AgentExecutionRequest([
        'agentId' => 'python-pro',
        'prompt' => 'Optimize performance'
    ])
];

$batchOptions = new BatchExecutionOptions([
    'maxConcurrency' => 3,
    'timeout' => 30  // seconds
]);

$batchResponse = $client->executeBatch($requests, $batchOptions);

echo "Completed: " . $batchResponse->getDistribution()->getCompleted() . "\\n";
echo "Failed: " . $batchResponse->getDistribution()->getFailed() . "\\n";
echo "Average Time: " . $batchResponse->getDistribution()->getAverageTime() . "ms\\n";

// Access individual results
foreach ($batchResponse->getResults() as $result) {
    $truncatedResponse = substr($result->getResponse(), 0, 100);
    echo "Agent {$result->getAgentId()}: {$truncatedResponse}...\\n";
}

// Batch with different execution options per request
$complexRequests = [
    new AgentExecutionRequest([
        'agentId' => 'security-auditor',
        'prompt' => 'Deep security analysis',
        'options' => new ExecutionOptions(['complexity' => 'high', 'temperature' => 0.3])
    ]),
    new AgentExecutionRequest([
        'agentId' => 'code-reviewer',
        'prompt' => 'Quick code review',
        'options' => new ExecutionOptions(['complexity' => 'low', 'temperature' => 0.5])
    ])
];

// Class definitions
class BatchExecutionResponse {
    private bool $success;
    private BatchDistribution $distribution;
    private array $results;
    
    public function isSuccess(): bool { return $this->success; }
    public function getDistribution(): BatchDistribution { return $this->distribution; }
    public function getResults(): array { return $this->results; }
}

class BatchDistribution {
    private int $totalRequests;
    private int $completed;
    private int $failed;
    private int $averageTime;  // milliseconds
    
    public function getTotalRequests(): int { return $this->totalRequests; }
    public function getCompleted(): int { return $this->completed; }
    public function getFailed(): int { return $this->failed; }
    public function getAverageTime(): int { return $this->averageTime; }
}

class BatchExecutionResult {
    private string $agentId;
    private bool $success;
    private ?string $response;
    private ?string $error;
    private int $duration;
    
    // Getters...
}`}</CodeBlock>
          </div>

          {/* getMetrics method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              getMetrics()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Retrieve real-time performance metrics for all agents.
            </p>
            
            <CodeBlock>{`<?php
// Get current system metrics
$metrics = $client->getMetrics();

echo "Total Agents: " . $metrics->getTotalAgents() . "\\n";
echo "Active Agents: " . $metrics->getActiveAgents() . "\\n";
echo "System Timestamp: " . $metrics->getTimestamp()->format('Y-m-d H:i:s') . "\\n";

// Access individual agent metrics
foreach ($metrics->getAgents() as $agentMetric) {
    echo "Agent: " . $agentMetric->getAgentId() . "\\n";
    echo "  Requests: " . $agentMetric->getTotalRequests() . "\\n";
    echo "  Errors: " . $agentMetric->getErrors() . "\\n";
    echo "  Avg Duration: " . $agentMetric->getAvgDuration() . "ms\\n";
    echo "  Success Rate: " . number_format($agentMetric->getSuccessRate() * 100, 2) . "%\\n";
}

// Filter active agents only
$activeAgents = array_filter($metrics->getAgents(), function($agent) {
    return $agent->isActive();
});

echo "Active agents: " . count($activeAgents) . "\\n";

// Sort agents by performance
$sortedAgents = $metrics->getAgents();
usort($sortedAgents, function($a, $b) {
    return $b->getSuccessRate() <=> $a->getSuccessRate();
});

echo "Top performing agent: " . $sortedAgents[0]->getAgentId() . "\\n";

// Class definitions
class SystemMetrics {
    private DateTime $timestamp;
    private int $totalAgents;
    private int $activeAgents;
    private array $agents;  // Array of AgentMetric objects
    
    public function getTimestamp(): DateTime { return $this->timestamp; }
    public function getTotalAgents(): int { return $this->totalAgents; }
    public function getActiveAgents(): int { return $this->activeAgents; }
    public function getAgents(): array { return $this->agents; }
    
    public function toArray(): array {
        return [
            'timestamp' => $this->timestamp->format('c'),
            'totalAgents' => $this->totalAgents,
            'activeAgents' => $this->activeAgents,
            'agents' => array_map(fn($agent) => $agent->toArray(), $this->agents)
        ];
    }
}

class AgentMetric {
    private string $agentId;
    private int $totalRequests;
    private int $errors;
    private int $totalDuration;
    private int $avgDuration;
    private DateTime $lastUsed;
    private bool $isActive;
    private int $totalTokens;
    private float $successRate;
    
    // Getters and toArray() method...
}`}</CodeBlock>
          </div>

          {/* checkHealth method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              checkHealth()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Check the health status of the AgentHive system and Ollama integration.
            </p>
            
            <CodeBlock>{`<?php
// Check system health
$health = $client->checkHealth();

echo "System Status: " . $health->getStatus() . "\\n";
echo "Service: " . $health->getService() . "\\n";
echo "Version: " . $health->getVersion() . "\\n";
echo "Ollama Healthy: " . ($health->getOllama()->isHealthy() ? 'true' : 'false') . "\\n";
echo "Available Models: " . count($health->getOllama()->getModels()) . "\\n";
echo "Active Agents: " . $health->getActiveAgents() . "\\n";

// Check if system is operational
if ($health->isHealthy()) {
    echo "✅ AgentHive is ready for agent execution\\n";
} else {
    echo "❌ AgentHive system issues detected\\n";
}

// Advanced health monitoring
function monitorSystemHealth(AgentHiveClient $client): array {
    $healthData = [];
    
    try {
        $health = $client->checkHealth();
        $healthData['status'] = $health->getStatus();
        $healthData['healthy'] = $health->isHealthy();
        $healthData['timestamp'] = $health->getTimestamp()->format('c');
        
        // Check individual components
        $healthData['components'] = [
            'ollama' => [
                'healthy' => $health->getOllama()->isHealthy(),
                'models_count' => count($health->getOllama()->getModels())
            ],
            'system' => [
                'healthy' => $health->getSystem()->isHealthy(),
                'uptime' => $health->getSystem()->getUptime()
            ]
        ];
        
        // Get performance metrics for health assessment
        $metrics = $client->getMetrics();
        $healthData['performance'] = [
            'active_agents' => $metrics->getActiveAgents(),
            'total_agents' => $metrics->getTotalAgents(),
            'agent_utilization' => $metrics->getActiveAgents() / max($metrics->getTotalAgents(), 1)
        ];
        
    } catch (Exception $e) {
        $healthData['status'] = 'error';
        $healthData['healthy'] = false;
        $healthData['error'] = $e->getMessage();
        $healthData['timestamp'] = (new DateTime())->format('c');
    }
    
    return $healthData;
}

// Usage
$healthData = monitorSystemHealth($client);
echo json_encode($healthData, JSON_PRETTY_PRINT) . "\\n";

// Class definitions
class HealthStatus {
    private string $status;        // 'healthy', 'degraded', 'down'
    private DateTime $timestamp;
    private string $service;
    private string $version;
    private OllamaHealth $ollama;
    private SystemHealth $system;
    private int $activeAgents;
    
    public function isHealthy(): bool {
        return $this->status === 'healthy';
    }
    
    // Getters...
}

class OllamaHealth {
    private bool $healthy;
    private string $baseUrl;
    private array $models;
    
    public function isHealthy(): bool { return $this->healthy; }
    public function getBaseUrl(): string { return $this->baseUrl; }
    public function getModels(): array { return $this->models; }
}

class SystemHealth {
    private bool $healthy;
    private ?int $uptime;  // seconds
    
    public function isHealthy(): bool { return $this->healthy; }
    public function getUptime(): ?int { return $this->uptime; }
}`}</CodeBlock>
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
            AgentHive includes 88+ specialized agents. Here are some popular ones you can use:
          </p>
          
          <CodeBlock>{`<?php
// Development & Code Review
$client->executeAgent(new AgentExecutionRequest([
    'agentId' => 'python-pro',
    'prompt' => 'Optimize this algorithm'
]));

$client->executeAgent(new AgentExecutionRequest([
    'agentId' => 'javascript-pro',
    'prompt' => 'Debug this Node.js function'
]));

$client->executeAgent(new AgentExecutionRequest([
    'agentId' => 'code-reviewer',
    'prompt' => 'Review this pull request'
]));

// Security & Analysis  
$client->executeAgent(new AgentExecutionRequest([
    'agentId' => 'security-auditor',
    'prompt' => 'Analyze for vulnerabilities'
]));

$client->executeAgent(new AgentExecutionRequest([
    'agentId' => 'database-optimizer',
    'prompt' => 'Optimize this SQL query'
]));

// DevOps & Infrastructure
$client->executeAgent(new AgentExecutionRequest([
    'agentId' => 'devops-engineer',
    'prompt' => 'Setup CI/CD pipeline'
]));

$client->executeAgent(new AgentExecutionRequest([
    'agentId' => 'cloud-architect',
    'prompt' => 'Design AWS infrastructure'
]));

// Data & ML
$client->executeAgent(new AgentExecutionRequest([
    'agentId' => 'data-scientist',
    'prompt' => 'Analyze this dataset'
]));

$client->executeAgent(new AgentExecutionRequest([
    'agentId' => 'ml-engineer',
    'prompt' => 'Build ML pipeline'
]));`}</CodeBlock>
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
              Exception Hierarchy
            </h3>
            
            <CodeBlock>{`<?php
use AgentHive\\Client\\Exceptions\\AgentHiveException;
use AgentHive\\Client\\Exceptions\\ConnectionException;
use AgentHive\\Client\\Exceptions\\AuthenticationException;
use AgentHive\\Client\\Exceptions\\AgentNotFoundException;
use AgentHive\\Client\\Exceptions\\RateLimitException;
use AgentHive\\Client\\Exceptions\\ExecutionException;
use AgentHive\\Client\\Exceptions\\TimeoutException;

/*
Exception hierarchy:
AgentHiveException                    // Base exception class
├── ConnectionException               // Network connectivity issues
├── AuthenticationException           // Authentication failures  
├── AgentNotFoundException           // Invalid agent ID
├── RateLimitException               // Too many requests
├── ExecutionException               // Agent execution failures
└── TimeoutException                 // Request timeout
*/

// Exception handling example
try {
    $options = new ExecutionOptions([
        'maxTokens' => 4000
    ]);
    
    $request = new AgentExecutionRequest([
        'agentId' => 'security-auditor',
        'prompt' => 'Analyze this configuration',
        'options' => $options
    ]);
    
    $response = $client->executeAgent($request);
    echo "Response: " . $response->getText() . "\\n";
    
} catch (AgentNotFoundException $e) {
    echo "Invalid agent ID: " . $e->getMessage() . "\\n";
    
} catch (RateLimitException $e) {
    echo "Rate limit exceeded: " . $e->getMessage() . "\\n";
    echo "Retry after: " . $e->getRetryAfter() . " seconds\\n";
    
} catch (ExecutionException $e) {
    echo "Agent execution failed: " . $e->getMessage() . "\\n";
    echo "Error code: " . $e->getErrorCode() . "\\n";
    
} catch (TimeoutException $e) {
    echo "Request timed out after " . $e->getTimeout() . " seconds\\n";
    
} catch (ConnectionException $e) {
    echo "Cannot connect to AgentHive: " . $e->getMessage() . "\\n";
    
} catch (AgentHiveException $e) {
    echo "General AgentHive error: " . $e->getMessage() . "\\n";
    
} catch (Exception $e) {
    echo "Unexpected error: " . $e->getMessage() . "\\n";
}

// Custom exception properties
class RateLimitException extends AgentHiveException {
    private int $retryAfter;
    
    public function getRetryAfter(): int {
        return $this->retryAfter;
    }
}

class ExecutionException extends AgentHiveException {
    private ?string $errorCode;
    
    public function getErrorCode(): ?string {
        return $this->errorCode;
    }
}

class TimeoutException extends AgentHiveException {
    private int $timeout;
    
    public function getTimeout(): int {
        return $this->timeout;
    }
}`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Robust Error Handling & Retry Logic
            </h3>
            
            <CodeBlock>{`<?php
class RobustAgentExecutor {
    private AgentHiveClient $client;
    private int $maxRetries;
    private int $baseDelay;  // milliseconds
    
    public function __construct(AgentHiveClient $client, int $maxRetries = 3, int $baseDelay = 1000) {
        $this->client = $client;
        $this->maxRetries = $maxRetries;
        $this->baseDelay = $baseDelay;
    }
    
    /**
     * Execute agent with automatic retry logic
     */
    public function executeWithRetry(AgentExecutionRequest $request): AgentResponse {
        $lastException = null;
        
        for ($attempt = 1; $attempt <= $this->maxRetries; $attempt++) {
            try {
                return $this->client->executeAgent($request);
                
            } catch (Exception $e) {
                $lastException = $e;
                error_log("Attempt {$attempt} failed: " . $e->getMessage());
                
                // Don't retry on certain errors
                if ($e instanceof AgentNotFoundException || $e instanceof AuthenticationException) {
                    throw $e;
                }
                
                // Exponential backoff
                if ($attempt < $this->maxRetries) {
                    $delay = $this->baseDelay * pow(2, $attempt - 1);
                    usleep($delay * 1000); // Convert to microseconds
                }
            }
        }
        
        throw new Exception("Failed after {$this->maxRetries} attempts", 0, $lastException);
    }
    
    /**
     * Execute agent with fallback response
     */
    public function executeWithFallback(AgentExecutionRequest $request, string $fallbackResponse): string {
        try {
            $response = $this->executeWithRetry($request);
            return $response->getText();
        } catch (Exception $e) {
            error_log("Agent execution failed, using fallback: " . $e->getMessage());
            return $fallbackResponse;
        }
    }
    
    /**
     * Execute multiple agents with individual retry logic
     */
    public function executeBatchWithRetry(array $requests): array {
        $results = [];
        
        foreach ($requests as $index => $request) {
            try {
                $results[$index] = [
                    'success' => true,
                    'response' => $this->executeWithRetry($request),
                    'error' => null
                ];
            } catch (Exception $e) {
                $results[$index] = [
                    'success' => false,
                    'response' => null,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return $results;
    }
}

// Circuit breaker pattern for handling failures
class CircuitBreaker {
    private int $failureThreshold;
    private int $timeout;
    private int $failureCount = 0;
    private ?int $lastFailureTime = null;
    private string $state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    
    public function __construct(int $failureThreshold = 5, int $timeout = 60) {
        $this->failureThreshold = $failureThreshold;
        $this->timeout = $timeout;
    }
    
    public function call(callable $callable, ...$args) {
        if ($this->state === 'OPEN') {
            if (time() - $this->lastFailureTime < $this->timeout) {
                throw new Exception('Circuit breaker is OPEN');
            }
            $this->state = 'HALF_OPEN';
        }
        
        try {
            $result = $callable(...$args);
            $this->onSuccess();
            return $result;
        } catch (Exception $e) {
            $this->onFailure();
            throw $e;
        }
    }
    
    private function onSuccess(): void {
        $this->failureCount = 0;
        $this->state = 'CLOSED';
    }
    
    private function onFailure(): void {
        $this->failureCount++;
        $this->lastFailureTime = time();
        
        if ($this->failureCount >= $this->failureThreshold) {
            $this->state = 'OPEN';
        }
    }
    
    public function getState(): string {
        return $this->state;
    }
}

// Usage example
try {
    $config = new ClientConfig(['baseUrl' => 'http://localhost:4001']);
    $client = new AgentHiveClient($config);
    
    // Basic retry executor
    $executor = new RobustAgentExecutor($client);
    
    $request = new AgentExecutionRequest([
        'agentId' => 'python-pro',
        'prompt' => 'Optimize this function'
    ]);
    
    // Execute with retry logic
    $response = $executor->executeWithRetry($request);
    echo "Response: " . $response->getText() . "\\n";
    
    // Execute with fallback
    $result = $executor->executeWithFallback($request, "Unable to process request");
    echo "Result: " . $result . "\\n";
    
    // Circuit breaker example
    $circuitBreaker = new CircuitBreaker(3, 30); // 3 failures, 30 second timeout
    
    $protectedCall = function() use ($client, $request) {
        return $client->executeAgent($request);
    };
    
    try {
        $response = $circuitBreaker->call($protectedCall);
        echo "Protected call succeeded\\n";
    } catch (Exception $e) {
        echo "Protected call failed: " . $e->getMessage() . "\\n";
        echo "Circuit breaker state: " . $circuitBreaker->getState() . "\\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}`}</CodeBlock>
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
              Laravel Integration
            </h3>
            
            <CodeBlock>{`<?php
// app/Services/AgentHiveService.php
namespace App\\Services;

use AgentHive\\Client\\AgentHiveClient;
use AgentHive\\Client\\ClientConfig;
use AgentHive\\Client\\AgentExecutionRequest;
use AgentHive\\Client\\ExecutionOptions;
use Illuminate\\Support\\Facades\\Cache;
use Illuminate\\Support\\Facades\\Log;
use Exception;

class AgentHiveService {
    private AgentHiveClient $client;
    
    public function __construct() {
        $config = new ClientConfig([
            'baseUrl' => config('agenthive.base_url', 'http://localhost:4001'),
            'timeout' => config('agenthive.timeout', 30),
            'maxRetries' => config('agenthive.max_retries', 3),
        ]);
        
        $this->client = new AgentHiveClient($config);
    }
    
    /**
     * Execute agent with caching and logging
     */
    public function executeAgent(string $agentId, string $prompt, array $options = []): ?string {
        $cacheKey = "agenthive:{$agentId}:" . md5($prompt . serialize($options));
        
        // Check cache first (optional)
        if (config('agenthive.cache_enabled', false)) {
            $cached = Cache::get($cacheKey);
            if ($cached) {
                Log::info("AgentHive cache hit for agent: {$agentId}");
                return $cached;
            }
        }
        
        try {
            Log::info("Executing AgentHive agent: {$agentId}", ['prompt' => substr($prompt, 0, 100)]);
            
            $request = new AgentExecutionRequest([
                'agentId' => $agentId,
                'prompt' => $prompt,
                'options' => new ExecutionOptions($options)
            ]);
            
            $startTime = microtime(true);
            $response = $this->client->executeAgent($request);
            $duration = (microtime(true) - $startTime) * 1000;
            
            Log::info("AgentHive execution completed", [
                'agent' => $agentId,
                'duration' => $duration,
                'tokens' => $response->getMetadata()->getTokens(),
                'cost' => $response->getMetadata()->getCost()
            ]);
            
            // Cache successful responses
            if (config('agenthive.cache_enabled', false) && $response->isSuccess()) {
                $ttl = config('agenthive.cache_ttl', 3600);
                Cache::put($cacheKey, $response->getText(), $ttl);
            }
            
            return $response->getText();
            
        } catch (Exception $e) {
            Log::error("AgentHive execution failed", [
                'agent' => $agentId,
                'error' => $e->getMessage(),
                'prompt' => substr($prompt, 0, 100)
            ]);
            
            return null;
        }
    }
    
    /**
     * Get cached metrics with fallback
     */
    public function getSystemMetrics(): ?array {
        return Cache::remember('agenthive:metrics', 300, function () {
            try {
                $metrics = $this->client->getMetrics();
                return $metrics->toArray();
            } catch (Exception $e) {
                Log::error('Failed to get AgentHive metrics: ' . $e->getMessage());
                return null;
            }
        });
    }
    
    /**
     * Health check with caching
     */
    public function isHealthy(): bool {
        return Cache::remember('agenthive:health', 60, function () {
            try {
                $health = $this->client->checkHealth();
                return $health->isHealthy();
            } catch (Exception $e) {
                Log::error('AgentHive health check failed: ' . $e->getMessage());
                return false;
            }
        });
    }
}

// app/Http/Controllers/AgentHiveController.php
namespace App\\Http\\Controllers;

use App\\Services\\AgentHiveService;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Validation\\Rule;

class AgentHiveController extends Controller {
    private AgentHiveService $agentHiveService;
    
    public function __construct(AgentHiveService $agentHiveService) {
        $this->agentHiveService = $agentHiveService;
    }
    
    public function execute(Request $request): JsonResponse {
        $validated = $request->validate([
            'agent_id' => 'required|string',
            'prompt' => 'required|string|max:10000',
            'options.temperature' => 'nullable|numeric|min:0|max:1',
            'options.complexity' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'options.max_tokens' => 'nullable|integer|min:1|max:8192',
        ]);
        
        $result = $this->agentHiveService->executeAgent(
            $validated['agent_id'],
            $validated['prompt'],
            $validated['options'] ?? []
        );
        
        if ($result === null) {
            return response()->json([
                'success' => false,
                'error' => 'Agent execution failed'
            ], 500);
        }
        
        return response()->json([
            'success' => true,
            'response' => $result,
            'timestamp' => now()->toISOString()
        ]);
    }
    
    public function metrics(): JsonResponse {
        $metrics = $this->agentHiveService->getSystemMetrics();
        
        if ($metrics === null) {
            return response()->json(['error' => 'Metrics unavailable'], 503);
        }
        
        return response()->json($metrics);
    }
    
    public function health(): JsonResponse {
        $healthy = $this->agentHiveService->isHealthy();
        
        return response()->json([
            'healthy' => $healthy,
            'status' => $healthy ? 'ok' : 'error',
            'timestamp' => now()->toISOString()
        ], $healthy ? 200 : 503);
    }
}

// config/agenthive.php
return [
    'base_url' => env('AGENTHIVE_BASE_URL', 'http://localhost:4001'),
    'timeout' => env('AGENTHIVE_TIMEOUT', 30),
    'max_retries' => env('AGENTHIVE_MAX_RETRIES', 3),
    'cache_enabled' => env('AGENTHIVE_CACHE_ENABLED', true),
    'cache_ttl' => env('AGENTHIVE_CACHE_TTL', 3600), // 1 hour
];

// routes/api.php
use App\\Http\\Controllers\\AgentHiveController;

Route::prefix('agenthive')->group(function () {
    Route::post('execute', [AgentHiveController::class, 'execute']);
    Route::get('metrics', [AgentHiveController::class, 'metrics']);
    Route::get('health', [AgentHiveController::class, 'health']);
});

// app/Console/Commands/AgentHiveHealthCheck.php
namespace App\\Console\\Commands;

use App\\Services\\AgentHiveService;
use Illuminate\\Console\\Command;

class AgentHiveHealthCheck extends Command {
    protected $signature = 'agenthive:health';
    protected $description = 'Check AgentHive system health';
    
    public function handle(AgentHiveService $service): int {
        $this->info('Checking AgentHive system health...');
        
        if ($service->isHealthy()) {
            $this->info('✅ AgentHive is healthy');
            return Command::SUCCESS;
        } else {
            $this->error('❌ AgentHive system issues detected');
            return Command::FAILURE;
        }
    }
}

// .env
AGENTHIVE_BASE_URL=http://localhost:4001
AGENTHIVE_TIMEOUT=30
AGENTHIVE_MAX_RETRIES=3
AGENTHIVE_CACHE_ENABLED=true
AGENTHIVE_CACHE_TTL=3600`}</CodeBlock>
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
              CLI Tool Implementation
            </h3>
            
            <CodeBlock>{`#!/usr/bin/env php
<?php
// agenthive-cli.php - AgentHive command line interface

require_once 'vendor/autoload.php';

use AgentHive\\Client\\AgentHiveClient;
use AgentHive\\Client\\ClientConfig;
use AgentHive\\Client\\AgentExecutionRequest;
use AgentHive\\Client\\ExecutionOptions;

class AgentHiveCLI {
    private AgentHiveClient $client;
    private bool $verbose;
    
    public function __construct(string $baseUrl = 'http://localhost:4001', bool $verbose = false) {
        $config = new ClientConfig(['baseUrl' => $baseUrl, 'timeout' => 30]);
        $this->client = new AgentHiveClient($config);
        $this->verbose = $verbose;
    }
    
    public function run(array $args): int {
        if (count($args) < 2) {
            $this->showHelp();
            return 1;
        }
        
        $command = $args[1];
        
        try {
            switch ($command) {
                case 'execute':
                    return $this->executeCommand(array_slice($args, 2));
                case 'list':
                    return $this->listCommand(array_slice($args, 2));
                case 'health':
                    return $this->healthCommand();
                case 'batch':
                    return $this->batchCommand(array_slice($args, 2));
                default:
                    echo "Unknown command: {$command}\\n";
                    $this->showHelp();
                    return 1;
            }
        } catch (Exception $e) {
            echo "❌ Error: " . $e->getMessage() . "\\n";
            if ($this->verbose) {
                echo $e->getTraceAsString() . "\\n";
            }
            return 1;
        }
    }
    
    private function executeCommand(array $args): int {
        $options = $this->parseOptions($args, [
            'temp' => 0.7,
            'complexity' => 'medium',
            'output' => null,
            'json' => false
        ]);
        
        if (count($args) < 2) {
            echo "Usage: execute <agent-id> <prompt> [options]\\n";
            return 1;
        }
        
        $agentId = $args[0];
        $prompt = $args[1];
        
        if ($this->verbose) {
            echo "🤖 Executing agent '{$agentId}' with prompt: {$prompt}\\n";
        }
        
        $executionOptions = new ExecutionOptions([
            'temperature' => (float) $options['temp'],
            'complexity' => $options['complexity']
        ]);
        
        $request = new AgentExecutionRequest([
            'agentId' => $agentId,
            'prompt' => $prompt,
            'options' => $executionOptions
        ]);
        
        $startTime = microtime(true);
        $response = $this->client->executeAgent($request);
        $clientDuration = (microtime(true) - $startTime) * 1000;
        
        if ($options['json']) {
            $this->outputAsJson($response, $clientDuration);
        } else {
            $this->outputAsText($response, $clientDuration);
        }
        
        if ($options['output']) {
            file_put_contents($options['output'], $response->getText());
            echo "✅ Response saved to {$options['output']}\\n";
        }
        
        return 0;
    }
    
    private function listCommand(array $args): int {
        $options = $this->parseOptions($args, ['active-only' => false]);
        
        echo "📋 Fetching agent list...\\n";
        $metrics = $this->client->getMetrics();
        
        echo "\\n📋 Available Agents ({$metrics->getTotalAgents()} total, {$metrics->getActiveAgents()} active)\\n";
        echo str_repeat('─', 80) . "\\n";
        
        foreach ($metrics->getAgents() as $agent) {
            if ($options['active-only'] && !$agent->isActive()) {
                continue;
            }
            
            $status = $agent->isActive() ? '🟢' : '⚪';
            $successRate = $agent->getSuccessRate() * 100;
            
            printf("%s %-30s %8d requests  %6.1f%% success\\n",
                $status, $agent->getAgentId(), $agent->getTotalRequests(), $successRate);
        }
        
        return 0;
    }
    
    private function healthCommand(): int {
        echo "🏥 Checking system health...\\n";
        $health = $this->client->checkHealth();
        
        echo "\\n🏥 System Health Status\\n";
        echo str_repeat('─', 40) . "\\n";
        
        $statusIcon = $health->isHealthy() ? '✅' : '❌';
        echo "Status: {$statusIcon} {$health->getStatus()}\\n";
        echo "Service: {$health->getService()}\\n";
        echo "Version: {$health->getVersion()}\\n";
        
        $ollamaIcon = $health->getOllama()->isHealthy() ? '✅' : '❌';
        $ollamaStatus = $health->getOllama()->isHealthy() ? 'healthy' : 'unhealthy';
        echo "Ollama: {$ollamaIcon} {$ollamaStatus}\\n";
        
        echo "Active Agents: {$health->getActiveAgents()}\\n";
        
        if (!empty($health->getOllama()->getModels())) {
            echo "Available Models: " . count($health->getOllama()->getModels()) . "\\n";
        }
        
        return $health->isHealthy() ? 0 : 1;
    }
    
    private function batchCommand(array $args): int {
        if (count($args) < 1) {
            echo "Usage: batch <requests-file>\\n";
            echo "Requests file should be JSON array of {agentId, prompt, options}\\n";
            return 1;
        }
        
        $requestsFile = $args[0];
        if (!file_exists($requestsFile)) {
            echo "Requests file not found: {$requestsFile}\\n";
            return 1;
        }
        
        $requestsData = json_decode(file_get_contents($requestsFile), true);
        if (!is_array($requestsData)) {
            echo "Invalid requests file format\\n";
            return 1;
        }
        
        $requests = [];
        foreach ($requestsData as $data) {
            $options = isset($data['options']) ? new ExecutionOptions($data['options']) : null;
            $requests[] = new AgentExecutionRequest([
                'agentId' => $data['agentId'],
                'prompt' => $data['prompt'],
                'options' => $options
            ]);
        }
        
        echo "🚀 Executing batch of " . count($requests) . " requests...\\n";
        
        $batchResponse = $this->client->executeBatch($requests);
        
        echo "\\n📊 Batch Results:\\n";
        echo "Completed: {$batchResponse->getDistribution()->getCompleted()}\\n";
        echo "Failed: {$batchResponse->getDistribution()->getFailed()}\\n";
        echo "Average Time: {$batchResponse->getDistribution()->getAverageTime()}ms\\n";
        
        foreach ($batchResponse->getResults() as $i => $result) {
            $truncated = substr($result->getResponse(), 0, 100);
            echo "\\n[{$i}] {$result->getAgentId()}: {$truncated}...\\n";
        }
        
        return 0;
    }
    
    private function outputAsJson($response, float $clientDuration): void {
        $data = [
            'success' => $response->isSuccess(),
            'response' => $response->getText(),
            'metadata' => $response->getMetadata()->toArray(),
            'clientDuration' => round($clientDuration, 2)
        ];
        
        echo json_encode($data, JSON_PRETTY_PRINT) . "\\n";
    }
    
    private function outputAsText($response, float $clientDuration): void {
        echo "\\n🤖 Agent Response:\\n";
        echo str_repeat('─', 50) . "\\n";
        echo $response->getText() . "\\n";
        
        if ($this->verbose) {
            echo "\\n📊 Execution Details:\\n";
            echo "Model: {$response->getMetadata()->getModel()}\\n";
            echo "Server Duration: {$response->getMetadata()->getDuration()}ms\\n";
            echo "Client Duration: " . round($clientDuration, 2) . "ms\\n";
            echo "Tokens: {$response->getMetadata()->getTokens()}\\n";
            printf("Cost: $%.4f\\n", $response->getMetadata()->getCost());
        }
    }
    
    private function parseOptions(array $args, array $defaults): array {
        $options = $defaults;
        
        for ($i = 0; $i < count($args); $i++) {
            if (strpos($args[$i], '--') === 0) {
                $key = substr($args[$i], 2);
                if (isset($defaults[$key])) {
                    if (is_bool($defaults[$key])) {
                        $options[$key] = true;
                    } elseif (isset($args[$i + 1])) {
                        $options[$key] = $args[$i + 1];
                        $i++; // Skip next argument
                    }
                }
            }
        }
        
        return $options;
    }
    
    private function showHelp(): void {
        echo "AgentHive CLI Tool\\n\\n";
        echo "Commands:\\n";
        echo "  execute <agent-id> <prompt>     Execute an AI agent\\n";
        echo "    --temp <0.0-1.0>             Temperature setting\\n";
        echo "    --complexity <low|med|high>   Complexity level\\n";
        echo "    --output <file>              Save response to file\\n";
        echo "    --json                       Output in JSON format\\n";
        echo "\\n";
        echo "  list                            List available agents\\n";
        echo "    --active-only                Show only active agents\\n";
        echo "\\n";
        echo "  health                          Check system health\\n";
        echo "\\n";
        echo "  batch <requests-file>           Execute batch requests\\n";
        echo "\\n";
        echo "Options:\\n";
        echo "  --url <url>                     AgentHive base URL\\n";
        echo "  --verbose                       Enable verbose output\\n";
        echo "  --help                          Show this help\\n";
    }
}

// Parse global options
$baseUrl = 'http://localhost:4001';
$verbose = false;

foreach ($argv as $i => $arg) {
    if ($arg === '--url' && isset($argv[$i + 1])) {
        $baseUrl = $argv[$i + 1];
    } elseif ($arg === '--verbose') {
        $verbose = true;
    } elseif ($arg === '--help') {
        (new AgentHiveCLI())->showHelp();
        exit(0);
    }
}

// Run CLI
$cli = new AgentHiveCLI($baseUrl, $verbose);
exit($cli->run($argv));

/*
Usage examples:
php agenthive-cli.php execute security-auditor "Check this config" --temp 0.3 --complexity high
php agenthive-cli.php list --active-only
php agenthive-cli.php health
php agenthive-cli.php batch requests.json --verbose

requests.json example:
[
    {"agentId": "security-auditor", "prompt": "Security check", "options": {"complexity": "high"}},
    {"agentId": "code-reviewer", "prompt": "Review code", "options": {"temperature": 0.5}}
]
*/`}</CodeBlock>
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
            Check out the complete Integration Guide for more advanced PHP patterns and Laravel examples.
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

export default PHPSDK;