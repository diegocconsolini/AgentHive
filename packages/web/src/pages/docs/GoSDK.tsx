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

const GoSDK: React.FC = () => {
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
    language = 'go',
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
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center mr-4">
            <Code className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Go SDK Documentation
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Official Go client library for AgentHive AI orchestration platform
        </p>
      </div>

      {/* Installation */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <Package className="w-6 h-6 mr-3" />
          Installation
        </h2>
        
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-cyan-900 dark:text-cyan-100 mb-3">
            Install via Go modules
          </h3>
          <CodeBlock language="bash">{`go get github.com/diegocconsolini/agenthive-go`}</CodeBlock>
          
          <h3 className="text-lg font-semibold text-cyan-900 dark:text-cyan-100 mb-3 mt-4">
            Initialize module (if needed)
          </h3>
          <CodeBlock language="bash">{`go mod init your-project
go get github.com/diegocconsolini/agenthive-go`}</CodeBlock>
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
cd AgentHive/sdks/go

# Build and install locally
go build .
go install .`}</CodeBlock>
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
        
        <CodeBlock>{`package main

import (
    "fmt"
    "log"
    
    "github.com/diegocconsolini/agenthive-go/client"
)

func main() {
    // Initialize the client
    config := client.Config{
        BaseURL: "http://localhost:4001",
        Timeout: 30, // seconds
    }
    
    agentClient, err := client.NewClient(config)
    if err != nil {
        log.Fatal(err)
    }
    defer agentClient.Close()
    
    // Execute a security audit
    request := client.AgentExecutionRequest{
        AgentID: "security-auditor",
        Prompt:  "Analyze this configuration for security vulnerabilities",
        Options: &client.ExecutionOptions{
            Temperature: 0.7,
            Complexity:  "high",
        },
    }
    
    response, err := agentClient.ExecuteAgent(request)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Agent Response: %s\\n", response.Text)
    fmt.Printf("Duration: %dms\\n", response.Metadata.Duration)
    fmt.Printf("Tokens Used: %d\\n", response.Metadata.Tokens)
    fmt.Printf("Cost: $%.4f\\n", response.Metadata.Cost)
}`}</CodeBlock>
      </div>

      {/* API Reference */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          API Reference
        </h2>

        <div className="space-y-8">
          {/* Client */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              AgentHive Client
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Main client for interacting with the AgentHive System API.
            </p>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Configuration</h4>
              <CodeBlock>{`package main

import "github.com/diegocconsolini/agenthive-go/client"

// Create client configuration
config := client.Config{
    BaseURL:     "http://localhost:4001",  // AgentHive System API URL
    Timeout:     30,                       // Request timeout in seconds
    MaxRetries:  3,                        // Maximum retry attempts
    RetryDelay:  1,                        // Delay between retries in seconds
    UserAgent:   "MyApp/1.0 (Go)",        // Custom User-Agent
}

// Initialize client
agentClient, err := client.NewClient(config)
if err != nil {
    log.Fatal(err)
}

// Always close the client when done
defer agentClient.Close()`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Configuration Options</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3">Field</th>
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-left py-2 px-3">Default</th>
                      <th className="text-left py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">BaseURL</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">string</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Required</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">AgentHive System API base URL</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">Timeout</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">int</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">30</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">HTTP request timeout in seconds</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">MaxRetries</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">int</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">3</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Maximum number of retry attempts</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">RetryDelay</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">int</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">1</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Delay between retry attempts in seconds</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ExecuteAgent method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              ExecuteAgent()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Execute a specific AI agent with a prompt and options.
            </p>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Method Signature</h4>
              <CodeBlock>{`func (c *Client) ExecuteAgent(req AgentExecutionRequest) (*AgentResponse, error)

type AgentExecutionRequest struct {
    AgentID string             \`json:"agentId"\`
    Prompt  string             \`json:"prompt"\`
    Options *ExecutionOptions  \`json:"options,omitempty"\`
}

type ExecutionOptions struct {
    Temperature *float64 \`json:"temperature,omitempty"\`
    Complexity  string   \`json:"complexity,omitempty"\`   // "low", "medium", "high"
    MaxTokens   *int     \`json:"maxTokens,omitempty"\`
    Context     string   \`json:"context,omitempty"\`
}`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Example Usage</h4>
              <CodeBlock>{`// Basic execution
request := client.AgentExecutionRequest{
    AgentID: "python-pro",
    Prompt:  "Optimize this Python function for better performance",
}

response, err := agentClient.ExecuteAgent(request)
if err != nil {
    log.Fatal(err)
}

// With options
temp := 0.3
maxTokens := 4000
requestWithOptions := client.AgentExecutionRequest{
    AgentID: "security-auditor",
    Prompt:  "Review this code for security vulnerabilities",
    Options: &client.ExecutionOptions{
        Temperature: &temp,        // Lower temperature for focused analysis
        Complexity:  "high",       // Use 32B model for complex analysis
        MaxTokens:   &maxTokens,   // Limit response length
        Context:     "enterprise", // Add context hint
    },
}

response, err = agentClient.ExecuteAgent(requestWithOptions)
if err != nil {
    log.Fatal(err)
}

// Access response data
fmt.Printf("Response: %s\\n", response.Text)
fmt.Printf("Success: %t\\n", response.Success)
fmt.Printf("Agent ID: %s\\n", response.Metadata.AgentID)
fmt.Printf("Model Used: %s\\n", response.Metadata.Model)
fmt.Printf("Duration: %dms\\n", response.Metadata.Duration)
fmt.Printf("Tokens: %d\\n", response.Metadata.Tokens)
fmt.Printf("Cost: $%.4f\\n", response.Metadata.Cost)`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Response Structure</h4>
              <CodeBlock>{`type AgentResponse struct {
    Success  bool                     \`json:"success"\`
    Text     string                   \`json:"text"\`
    Metadata AgentExecutionMetadata   \`json:"metadata"\`
}

type AgentExecutionMetadata struct {
    AgentID   string    \`json:"agentId"\`
    Model     string    \`json:"model"\`
    Tokens    int       \`json:"tokens"\`
    Duration  int       \`json:"duration"\`  // milliseconds
    Cost      float64   \`json:"cost"\`
    Timestamp time.Time \`json:"timestamp"\`
}`}</CodeBlock>
            </div>
          </div>

          {/* ExecuteBatch method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              ExecuteBatch()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Execute multiple agents concurrently with load balancing.
            </p>
            
            <CodeBlock>{`// Execute multiple agents in parallel
requests := []client.AgentExecutionRequest{
    {AgentID: "security-auditor", Prompt: "Check for vulnerabilities"},
    {AgentID: "code-reviewer", Prompt: "Review code quality"},
    {AgentID: "python-pro", Prompt: "Optimize performance"},
}

batchOptions := client.BatchExecutionOptions{
    MaxConcurrency: 3,
    Timeout:        30, // seconds
}

batchResponse, err := agentClient.ExecuteBatch(requests, batchOptions)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Completed: %d\\n", batchResponse.Distribution.Completed)
fmt.Printf("Failed: %d\\n", batchResponse.Distribution.Failed)
fmt.Printf("Average Time: %dms\\n", batchResponse.Distribution.AverageTime)

// Access individual results
for _, result := range batchResponse.Results {
    fmt.Printf("Agent %s: %s\\n", result.AgentID, 
        result.Response[:min(100, len(result.Response))] + "...")
}

// Type definitions
type BatchExecutionResponse struct {
    Success      bool                    \`json:"success"\`
    Distribution BatchDistribution       \`json:"distribution"\`
    Results      []BatchExecutionResult  \`json:"results"\`
}

type BatchDistribution struct {
    TotalRequests int \`json:"totalRequests"\`
    Completed     int \`json:"completed"\`
    Failed        int \`json:"failed"\`
    AverageTime   int \`json:"averageTime"\` // milliseconds
}

type BatchExecutionResult struct {
    AgentID  string \`json:"agentId"\`
    Success  bool   \`json:"success"\`
    Response string \`json:"response,omitempty"\`
    Error    string \`json:"error,omitempty"\`
    Duration int    \`json:"duration"\`
}`}</CodeBlock>
          </div>

          {/* GetMetrics method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              GetMetrics()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Retrieve real-time performance metrics for all agents.
            </p>
            
            <CodeBlock>{`// Get current system metrics
metrics, err := agentClient.GetMetrics()
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Total Agents: %d\\n", metrics.TotalAgents)
fmt.Printf("Active Agents: %d\\n", metrics.ActiveAgents)
fmt.Printf("System Timestamp: %s\\n", metrics.Timestamp.Format(time.RFC3339))

// Access individual agent metrics
for _, agentMetric := range metrics.Agents {
    fmt.Printf("Agent: %s\\n", agentMetric.AgentID)
    fmt.Printf("  Requests: %d\\n", agentMetric.TotalRequests)
    fmt.Printf("  Errors: %d\\n", agentMetric.Errors)
    fmt.Printf("  Avg Duration: %dms\\n", agentMetric.AvgDuration)
    fmt.Printf("  Success Rate: %.2f%%\\n", agentMetric.SuccessRate*100)
}

// Type definitions
type SystemMetrics struct {
    Timestamp    time.Time     \`json:"timestamp"\`
    TotalAgents  int           \`json:"totalAgents"\`
    ActiveAgents int           \`json:"activeAgents"\`
    Agents       []AgentMetric \`json:"agents"\`
}

type AgentMetric struct {
    AgentID       string    \`json:"agentId"\`
    TotalRequests int       \`json:"totalRequests"\`
    Errors        int       \`json:"errors"\`
    TotalDuration int       \`json:"totalDuration"\`
    AvgDuration   int       \`json:"avgDuration"\`
    LastUsed      time.Time \`json:"lastUsed"\`
    IsActive      bool      \`json:"isActive"\`
    TotalTokens   int       \`json:"totalTokens"\`
    SuccessRate   float64   \`json:"successRate"\`
}`}</CodeBlock>
          </div>

          {/* CheckHealth method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              CheckHealth()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Check the health status of the AgentHive system and Ollama integration.
            </p>
            
            <CodeBlock>{`// Check system health
health, err := agentClient.CheckHealth()
if err != nil {
    log.Fatal(err)
}

fmt.Printf("System Status: %s\\n", health.Status)
fmt.Printf("Service: %s\\n", health.Service)
fmt.Printf("Version: %s\\n", health.Version)
fmt.Printf("Ollama Healthy: %t\\n", health.Ollama.Healthy)
fmt.Printf("Available Models: %d\\n", len(health.Ollama.Models))
fmt.Printf("Active Agents: %d\\n", health.ActiveAgents)

// Check if system is operational
if health.IsHealthy() {
    fmt.Println("✅ AgentHive is ready for agent execution")
} else {
    fmt.Println("❌ AgentHive system issues detected")
}

// Type definitions
type HealthStatus struct {
    Status       string       \`json:"status"\`      // "healthy", "degraded", "down"
    Timestamp    time.Time    \`json:"timestamp"\`
    Service      string       \`json:"service"\`
    Version      string       \`json:"version"\`
    Ollama       OllamaHealth \`json:"ollama"\`
    System       SystemHealth \`json:"system"\`
    ActiveAgents int          \`json:"activeAgents"\`
}

type OllamaHealth struct {
    Healthy bool     \`json:"healthy"\`
    BaseURL string   \`json:"baseUrl"\`
    Models  []string \`json:"models,omitempty"\`
}

type SystemHealth struct {
    Healthy bool \`json:"healthy"\`
    Uptime  *int \`json:"uptime,omitempty"\` // seconds
}

func (h *HealthStatus) IsHealthy() bool {
    return h.Status == "healthy"
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
          
          <CodeBlock>{`// Development & Code Review
_, err = agentClient.ExecuteAgent(client.AgentExecutionRequest{
    AgentID: "python-pro",
    Prompt:  "Optimize this algorithm",
})

_, err = agentClient.ExecuteAgent(client.AgentExecutionRequest{
    AgentID: "javascript-pro", 
    Prompt:  "Debug this Node.js function",
})

_, err = agentClient.ExecuteAgent(client.AgentExecutionRequest{
    AgentID: "code-reviewer",
    Prompt:  "Review this pull request",
})

// Security & Analysis  
_, err = agentClient.ExecuteAgent(client.AgentExecutionRequest{
    AgentID: "security-auditor",
    Prompt:  "Analyze for vulnerabilities",
})

_, err = agentClient.ExecuteAgent(client.AgentExecutionRequest{
    AgentID: "database-optimizer",
    Prompt:  "Optimize this SQL query",
})

// DevOps & Infrastructure
_, err = agentClient.ExecuteAgent(client.AgentExecutionRequest{
    AgentID: "devops-engineer",
    Prompt:  "Setup CI/CD pipeline",
})

_, err = agentClient.ExecuteAgent(client.AgentExecutionRequest{
    AgentID: "cloud-architect",
    Prompt:  "Design AWS infrastructure",
})

// Data & ML
_, err = agentClient.ExecuteAgent(client.AgentExecutionRequest{
    AgentID: "data-scientist",
    Prompt:  "Analyze this dataset",
})

_, err = agentClient.ExecuteAgent(client.AgentExecutionRequest{
    AgentID: "ml-engineer",
    Prompt:  "Build ML pipeline",
})`}</CodeBlock>
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
            
            <CodeBlock>{`import (
    "errors"
    "fmt"
    
    "github.com/diegocconsolini/agenthive-go/client"
)

// Custom error types
var (
    ErrConnectionFailed    = errors.New("connection failed")
    ErrAgentNotFound      = errors.New("agent not found")
    ErrRateLimitExceeded  = errors.New("rate limit exceeded")
    ErrExecutionTimeout   = errors.New("execution timeout")
    ErrExecutionFailed    = errors.New("execution failed")
)

// Error handling example
request := client.AgentExecutionRequest{
    AgentID: "security-auditor",
    Prompt:  "Analyze this configuration",
    Options: &client.ExecutionOptions{
        MaxTokens: intPtr(4000),
    },
}

response, err := agentClient.ExecuteAgent(request)
if err != nil {
    switch {
    case errors.Is(err, client.ErrAgentNotFound):
        fmt.Printf("Invalid agent ID: %v\\n", err)
        
    case errors.Is(err, client.ErrRateLimitExceeded):
        fmt.Printf("Rate limit exceeded: %v\\n", err)
        // Could implement backoff strategy here
        
    case errors.Is(err, client.ErrExecutionTimeout):
        fmt.Printf("Request timed out: %v\\n", err)
        
    case errors.Is(err, client.ErrConnectionFailed):
        fmt.Printf("Cannot connect to AgentHive: %v\\n", err)
        
    default:
        fmt.Printf("Unexpected error: %v\\n", err)
    }
    return
}

// Helper function
func intPtr(i int) *int {
    return &i
}`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Robust Error Handling Example
            </h3>
            
            <CodeBlock>{`package main

import (
    "fmt"
    "log"
    "time"
    
    "github.com/diegocconsolini/agenthive-go/client"
)

// RobustExecutor provides retry logic and error handling
type RobustExecutor struct {
    client     *client.Client
    maxRetries int
    baseDelay  time.Duration
}

func NewRobustExecutor(c *client.Client) *RobustExecutor {
    return &RobustExecutor{
        client:     c,
        maxRetries: 3,
        baseDelay:  time.Second,
    }
}

func (r *RobustExecutor) ExecuteWithRetry(req client.AgentExecutionRequest) (*client.AgentResponse, error) {
    var lastErr error
    
    for attempt := 1; attempt <= r.maxRetries; attempt++ {
        response, err := r.client.ExecuteAgent(req)
        if err == nil {
            return response, nil
        }
        
        lastErr = err
        log.Printf("Attempt %d failed: %v", attempt, err)
        
        // Don't retry on certain errors
        if errors.Is(err, client.ErrAgentNotFound) {
            return nil, err
        }
        
        // Exponential backoff
        if attempt < r.maxRetries {
            delay := time.Duration(attempt) * r.baseDelay
            time.Sleep(delay)
        }
    }
    
    return nil, fmt.Errorf("failed after %d attempts: %w", r.maxRetries, lastErr)
}

func (r *RobustExecutor) ExecuteWithFallback(req client.AgentExecutionRequest, fallback string) string {
    response, err := r.ExecuteWithRetry(req)
    if err != nil {
        log.Printf("Agent execution failed: %v", err)
        return fallback
    }
    return response.Text
}

// Usage example
func main() {
    config := client.Config{
        BaseURL: "http://localhost:4001",
        Timeout: 30,
    }
    
    agentClient, err := client.NewClient(config)
    if err != nil {
        log.Fatal(err)
    }
    defer agentClient.Close()
    
    executor := NewRobustExecutor(agentClient)
    
    request := client.AgentExecutionRequest{
        AgentID: "python-pro",
        Prompt:  "Optimize this function",
    }
    
    // Execute with retry logic
    response, err := executor.ExecuteWithRetry(request)
    if err != nil {
        log.Printf("Final error: %v", err)
        return
    }
    
    fmt.Printf("Response: %s\\n", response.Text)
    
    // Execute with fallback
    result := executor.ExecuteWithFallback(request, "Unable to process request")
    fmt.Printf("Result: %s\\n", result)
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
              Concurrent Agent Execution
            </h3>
            
            <CodeBlock>{`package main

import (
    "context"
    "fmt"
    "log"
    "sync"
    "time"
    
    "github.com/diegocconsolini/agenthive-go/client"
)

// ConcurrentExecutor manages concurrent agent executions
type ConcurrentExecutor struct {
    client    *client.Client
    semaphore chan struct{}
}

func NewConcurrentExecutor(c *client.Client, maxConcurrency int) *ConcurrentExecutor {
    return &ConcurrentExecutor{
        client:    c,
        semaphore: make(chan struct{}, maxConcurrency),
    }
}

type ExecutionTask struct {
    ID      string
    Request client.AgentExecutionRequest
}

type ExecutionResult struct {
    ID       string
    Response *client.AgentResponse
    Error    error
    Duration time.Duration
}

func (ce *ConcurrentExecutor) ExecuteConcurrently(ctx context.Context, tasks []ExecutionTask) []ExecutionResult {
    var wg sync.WaitGroup
    results := make([]ExecutionResult, len(tasks))
    
    for i, task := range tasks {
        wg.Add(1)
        go func(index int, t ExecutionTask) {
            defer wg.Done()
            
            // Acquire semaphore
            select {
            case ce.semaphore <- struct{}{}:
                defer func() { <-ce.semaphore }()
            case <-ctx.Done():
                results[index] = ExecutionResult{
                    ID:    t.ID,
                    Error: ctx.Err(),
                }
                return
            }
            
            start := time.Now()
            response, err := ce.client.ExecuteAgent(t.Request)
            duration := time.Since(start)
            
            results[index] = ExecutionResult{
                ID:       t.ID,
                Response: response,
                Error:    err,
                Duration: duration,
            }
        }(i, task)
    }
    
    wg.Wait()
    return results
}

// Usage example
func main() {
    config := client.Config{
        BaseURL: "http://localhost:4001",
        Timeout: 30,
    }
    
    agentClient, err := client.NewClient(config)
    if err != nil {
        log.Fatal(err)
    }
    defer agentClient.Close()
    
    executor := NewConcurrentExecutor(agentClient, 3) // Max 3 concurrent executions
    
    // Create tasks
    tasks := []ExecutionTask{
        {
            ID: "security-check",
            Request: client.AgentExecutionRequest{
                AgentID: "security-auditor",
                Prompt:  "Check for vulnerabilities",
            },
        },
        {
            ID: "code-review",
            Request: client.AgentExecutionRequest{
                AgentID: "code-reviewer",
                Prompt:  "Review code quality",
            },
        },
        {
            ID: "performance-analysis",
            Request: client.AgentExecutionRequest{
                AgentID: "python-pro",
                Prompt:  "Optimize performance",
            },
        },
    }
    
    // Execute with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
    defer cancel()
    
    results := executor.ExecuteConcurrently(ctx, tasks)
    
    // Process results
    for _, result := range results {
        if result.Error != nil {
            log.Printf("Task %s failed: %v", result.ID, result.Error)
            continue
        }
        
        fmt.Printf("Task %s completed in %v\\n", result.ID, result.Duration)
        fmt.Printf("Response: %s\\n\\n", result.Response.Text[:min(100, len(result.Response.Text))])
    }
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Custom HTTP Transport
            </h3>
            
            <CodeBlock>{`package main

import (
    "crypto/tls"
    "net"
    "net/http"
    "time"
    
    "github.com/diegocconsolini/agenthive-go/client"
)

// CustomTransportConfig for advanced HTTP configuration
type CustomTransportConfig struct {
    MaxIdleConns        int
    MaxIdleConnsPerHost int
    MaxConnsPerHost     int
    IdleConnTimeout     time.Duration
    TLSHandshakeTimeout time.Duration
    DisableKeepAlives   bool
    DisableCompression  bool
}

func CreateCustomTransport(config CustomTransportConfig) *http.Transport {
    return &http.Transport{
        DialContext: (&net.Dialer{
            Timeout:   30 * time.Second,
            KeepAlive: 30 * time.Second,
        }).DialContext,
        
        MaxIdleConns:        config.MaxIdleConns,
        MaxIdleConnsPerHost: config.MaxIdleConnsPerHost,
        MaxConnsPerHost:     config.MaxConnsPerHost,
        IdleConnTimeout:     config.IdleConnTimeout,
        TLSHandshakeTimeout: config.TLSHandshakeTimeout,
        DisableKeepAlives:   config.DisableKeepAlives,
        DisableCompression:  config.DisableCompression,
        
        TLSClientConfig: &tls.Config{
            InsecureSkipVerify: false, // Set to true only for development
        },
    }
}

// Usage example
func main() {
    // Create custom transport for connection pooling
    transportConfig := CustomTransportConfig{
        MaxIdleConns:        10,
        MaxIdleConnsPerHost: 5,
        MaxConnsPerHost:     10,
        IdleConnTimeout:     90 * time.Second,
        TLSHandshakeTimeout: 10 * time.Second,
        DisableKeepAlives:   false,
        DisableCompression:  false,
    }
    
    transport := CreateCustomTransport(transportConfig)
    
    // Create HTTP client with custom transport
    httpClient := &http.Client{
        Transport: transport,
        Timeout:   30 * time.Second,
    }
    
    // Create AgentHive client with custom HTTP client
    config := client.Config{
        BaseURL:    "http://localhost:4001",
        HTTPClient: httpClient,
        UserAgent:  "MyApp/1.0 (Go; Custom Transport)",
    }
    
    agentClient, err := client.NewClientWithHTTP(config)
    if err != nil {
        log.Fatal(err)
    }
    defer agentClient.Close()
    
    // Use the client as normal
    response, err := agentClient.ExecuteAgent(client.AgentExecutionRequest{
        AgentID: "security-auditor",
        Prompt:  "Analyze security posture",
    })
    
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Response: %s\\n", response.Text)
}`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Monitoring & Instrumentation
            </h3>
            
            <CodeBlock>{`package main

import (
    "context"
    "fmt"
    "log"
    "time"
    
    "github.com/diegocconsolini/agenthive-go/client"
)

// Instrumented wrapper for metrics collection
type InstrumentedClient struct {
    client        *client.Client
    requestCount  int64
    totalDuration time.Duration
    errorCount    int64
}

func NewInstrumentedClient(c *client.Client) *InstrumentedClient {
    return &InstrumentedClient{
        client: c,
    }
}

func (ic *InstrumentedClient) ExecuteAgent(req client.AgentExecutionRequest) (*client.AgentResponse, error) {
    start := time.Now()
    ic.requestCount++
    
    response, err := ic.client.ExecuteAgent(req)
    
    duration := time.Since(start)
    ic.totalDuration += duration
    
    if err != nil {
        ic.errorCount++
    }
    
    // Log execution metrics
    log.Printf("Agent execution: agent=%s, duration=%v, success=%t", 
        req.AgentID, duration, err == nil)
    
    return response, err
}

func (ic *InstrumentedClient) GetStats() (int64, time.Duration, int64, float64) {
    if ic.requestCount == 0 {
        return 0, 0, 0, 0
    }
    
    avgDuration := ic.totalDuration / time.Duration(ic.requestCount)
    successRate := float64(ic.requestCount-ic.errorCount) / float64(ic.requestCount) * 100
    
    return ic.requestCount, avgDuration, ic.errorCount, successRate
}

// Health monitoring service
type HealthMonitor struct {
    client   *client.Client
    interval time.Duration
    alerts   chan string
}

func NewHealthMonitor(c *client.Client, interval time.Duration) *HealthMonitor {
    return &HealthMonitor{
        client:   c,
        interval: interval,
        alerts:   make(chan string, 10),
    }
}

func (hm *HealthMonitor) Start(ctx context.Context) {
    ticker := time.NewTicker(hm.interval)
    defer ticker.Stop()
    
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            hm.checkHealth()
        }
    }
}

func (hm *HealthMonitor) checkHealth() {
    health, err := hm.client.CheckHealth()
    if err != nil {
        hm.alerts <- fmt.Sprintf("Health check failed: %v", err)
        return
    }
    
    if !health.IsHealthy() {
        hm.alerts <- fmt.Sprintf("System unhealthy: status=%s", health.Status)
    }
    
    // Check metrics
    metrics, err := hm.client.GetMetrics()
    if err != nil {
        hm.alerts <- fmt.Sprintf("Metrics check failed: %v", err)
        return
    }
    
    // Check for performance issues
    for _, agent := range metrics.Agents {
        if agent.SuccessRate < 0.9 && agent.TotalRequests > 10 {
            hm.alerts <- fmt.Sprintf("Agent %s has low success rate: %.2f%%", 
                agent.AgentID, agent.SuccessRate*100)
        }
        
        if agent.AvgDuration > 10000 { // 10 seconds
            hm.alerts <- fmt.Sprintf("Agent %s has high average duration: %dms", 
                agent.AgentID, agent.AvgDuration)
        }
    }
}

func (hm *HealthMonitor) GetAlerts() <-chan string {
    return hm.alerts
}

// Usage example
func main() {
    config := client.Config{
        BaseURL: "http://localhost:4001",
        Timeout: 30,
    }
    
    agentClient, err := client.NewClient(config)
    if err != nil {
        log.Fatal(err)
    }
    defer agentClient.Close()
    
    // Wrap with instrumentation
    instrumentedClient := NewInstrumentedClient(agentClient)
    
    // Start health monitoring
    monitor := NewHealthMonitor(agentClient, 60*time.Second)
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    
    go monitor.Start(ctx)
    
    // Process alerts in background
    go func() {
        for alert := range monitor.GetAlerts() {
            log.Printf("ALERT: %s", alert)
        }
    }()
    
    // Execute some agents
    for i := 0; i < 5; i++ {
        _, err := instrumentedClient.ExecuteAgent(client.AgentExecutionRequest{
            AgentID: "python-pro",
            Prompt:  fmt.Sprintf("Task %d: Optimize code", i+1),
        })
        if err != nil {
            log.Printf("Execution failed: %v", err)
        }
        
        time.Sleep(time.Second)
    }
    
    // Print statistics
    requests, avgDuration, errors, successRate := instrumentedClient.GetStats()
    fmt.Printf("\\nExecution Statistics:\\n")
    fmt.Printf("Total Requests: %d\\n", requests)
    fmt.Printf("Average Duration: %v\\n", avgDuration)
    fmt.Printf("Errors: %d\\n", errors)
    fmt.Printf("Success Rate: %.2f%%\\n", successRate)
}`}</CodeBlock>
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
            
            <CodeBlock>{`// main.go - AgentHive CLI tool in Go
package main

import (
    "bufio"
    "flag"
    "fmt"
    "log"
    "os"
    "strings"
    "time"
    
    "github.com/diegocconsolini/agenthive-go/client"
    "github.com/fatih/color"
)

var (
    baseURL     = flag.String("url", "http://localhost:4001", "AgentHive base URL")
    agentID     = flag.String("agent", "", "Agent ID to execute")
    prompt      = flag.String("prompt", "", "Prompt to send to agent")
    temperature = flag.Float64("temp", 0.7, "Temperature (0.0-1.0)")
    complexity  = flag.String("complexity", "medium", "Complexity (low/medium/high)")
    outputFile  = flag.String("output", "", "Save response to file")
    interactive = flag.Bool("interactive", false, "Interactive mode")
    listAgents  = flag.Bool("list", false, "List available agents")
    checkHealth = flag.Bool("health", false, "Check system health")
)

func main() {
    flag.Parse()
    
    // Initialize client
    config := client.Config{
        BaseURL: *baseURL,
        Timeout: 30,
    }
    
    agentClient, err := client.NewClient(config)
    if err != nil {
        log.Fatal(color.RedString("Failed to initialize client: %v", err))
    }
    defer agentClient.Close()
    
    switch {
    case *checkHealth:
        handleHealthCheck(agentClient)
    case *listAgents:
        handleListAgents(agentClient)
    case *interactive:
        handleInteractiveMode(agentClient)
    case *agentID != "" && *prompt != "":
        handleSingleExecution(agentClient)
    default:
        flag.Usage()
        os.Exit(1)
    }
}

func handleSingleExecution(agentClient *client.Client) {
    fmt.Printf("🤖 Executing %s agent...\\n", color.CyanString(*agentID))
    
    request := client.AgentExecutionRequest{
        AgentID: *agentID,
        Prompt:  *prompt,
        Options: &client.ExecutionOptions{
            Temperature: temperature,
            Complexity:  *complexity,
        },
    }
    
    start := time.Now()
    response, err := agentClient.ExecuteAgent(request)
    if err != nil {
        log.Fatal(color.RedString("Execution failed: %v", err))
    }
    
    duration := time.Since(start)
    
    fmt.Printf("\\n%s\\n", color.GreenString("--- Agent Response ---"))
    fmt.Println(response.Text)
    
    fmt.Printf("\\n%s\\n", color.GrayString("--- Execution Details ---"))
    fmt.Printf("Model: %s\\n", response.Metadata.Model)
    fmt.Printf("Duration: %v (%dms)\\n", duration, response.Metadata.Duration)
    fmt.Printf("Tokens: %d\\n", response.Metadata.Tokens)
    fmt.Printf("Cost: $%.4f\\n", response.Metadata.Cost)
    
    // Save to file if requested
    if *outputFile != "" {
        err := os.WriteFile(*outputFile, []byte(response.Text), 0644)
        if err != nil {
            log.Printf(color.RedString("Failed to save to file: %v"), err)
        } else {
            fmt.Printf(color.GreenString("Response saved to %s\\n"), *outputFile)
        }
    }
}

func handleInteractiveMode(agentClient *client.Client) {
    fmt.Println(color.CyanString("🤖 AgentHive Interactive Mode"))
    fmt.Println("Type 'help' for commands, 'quit' to exit")
    
    scanner := bufio.NewScanner(os.Stdin)
    currentAgent := "python-pro" // default agent
    
    for {
        fmt.Printf("\\n[%s] > ", color.YellowString(currentAgent))
        
        if !scanner.Scan() {
            break
        }
        
        input := strings.TrimSpace(scanner.Text())
        if input == "" {
            continue
        }
        
        parts := strings.Fields(input)
        command := parts[0]
        
        switch command {
        case "quit", "exit":
            fmt.Println("Goodbye!")
            return
            
        case "help":
            printHelp()
            
        case "agent":
            if len(parts) < 2 {
                fmt.Println(color.RedString("Usage: agent <agent-id>"))
                continue
            }
            currentAgent = parts[1]
            fmt.Printf("Switched to agent: %s\\n", color.CyanString(currentAgent))
            
        case "list":
            handleListAgents(agentClient)
            
        case "health":
            handleHealthCheck(agentClient)
            
        default:
            // Treat as prompt
            executeInteractivePrompt(agentClient, currentAgent, input)
        }
    }
}

func executeInteractivePrompt(agentClient *client.Client, agentID, prompt string) {
    fmt.Printf("🤖 %s is thinking...\\n", agentID)
    
    request := client.AgentExecutionRequest{
        AgentID: agentID,
        Prompt:  prompt,
        Options: &client.ExecutionOptions{
            Temperature: temperature,
            Complexity:  "medium",
        },
    }
    
    response, err := agentClient.ExecuteAgent(request)
    if err != nil {
        fmt.Printf(color.RedString("Error: %v\\n"), err)
        return
    }
    
    fmt.Printf("\\n%s:\\n%s\\n", color.GreenString(agentID), response.Text)
    fmt.Printf(color.GrayString("(%dms, %d tokens, $%.4f)\\n"), 
        response.Metadata.Duration, response.Metadata.Tokens, response.Metadata.Cost)
}

func handleListAgents(agentClient *client.Client) {
    fmt.Println("📊 Fetching agent list...")
    
    metrics, err := agentClient.GetMetrics()
    if err != nil {
        log.Printf(color.RedString("Failed to fetch agents: %v"), err)
        return
    }
    
    fmt.Printf("\\n%s (%d total, %d active)\\n", 
        color.CyanString("Available Agents"), metrics.TotalAgents, metrics.ActiveAgents)
    fmt.Println(strings.Repeat("─", 80))
    
    for _, agent := range metrics.Agents {
        status := "○"
        statusColor := color.New(color.FgHiBlack)
        
        if agent.IsActive {
            status = "●"
            statusColor = color.New(color.FgGreen)
        }
        
        successRate := agent.SuccessRate * 100
        fmt.Printf("%s %-30s %8d requests  %6.1f%% success\\n",
            statusColor.Sprint(status),
            color.CyanString(agent.AgentID),
            agent.TotalRequests,
            successRate)
    }
}

func handleHealthCheck(agentClient *client.Client) {
    fmt.Println("🏥 Checking system health...")
    
    health, err := agentClient.CheckHealth()
    if err != nil {
        log.Printf(color.RedString("Health check failed: %v"), err)
        return
    }
    
    fmt.Printf("\\n%s\\n", color.CyanString("--- System Health ---"))
    
    statusColor := color.GreenString
    if health.Status != "healthy" {
        statusColor = color.YellowString
    }
    
    fmt.Printf("Status: %s\\n", statusColor(health.Status))
    fmt.Printf("Service: %s\\n", health.Service)
    fmt.Printf("Version: %s\\n", health.Version)
    
    ollamaColor := color.GreenString
    if !health.Ollama.Healthy {
        ollamaColor = color.RedString
    }
    fmt.Printf("Ollama: %s\\n", ollamaColor(fmt.Sprintf("%t", health.Ollama.Healthy)))
    
    fmt.Printf("Active Agents: %d\\n", health.ActiveAgents)
    
    if len(health.Ollama.Models) > 0 {
        fmt.Printf("Available Models: %d\\n", len(health.Ollama.Models))
    }
}

func printHelp() {
    fmt.Printf("%s\\n", color.CyanString("Available Commands:"))
    fmt.Println("  help                 - Show this help")
    fmt.Println("  agent <agent-id>     - Switch to different agent")
    fmt.Println("  list                 - List available agents")
    fmt.Println("  health               - Check system health")
    fmt.Println("  quit/exit            - Exit interactive mode")
    fmt.Println("  <any text>           - Send prompt to current agent")
}

// Build and usage:
// go build -o agenthive-cli main.go
//
// Examples:
// ./agenthive-cli -agent security-auditor -prompt "Check this config"
// ./agenthive-cli -list
// ./agenthive-cli -health
// ./agenthive-cli -interactive`}</CodeBlock>
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
            Check out the complete Integration Guide for more advanced Go patterns and examples.
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

export default GoSDK;