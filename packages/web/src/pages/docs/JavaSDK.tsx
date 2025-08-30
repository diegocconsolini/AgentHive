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

const JavaSDK: React.FC = () => {
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
    language = 'java',
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
          <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center mr-4">
            <Code className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Java SDK Documentation
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Official Java client library for AgentHive AI orchestration platform
        </p>
      </div>

      {/* Installation */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <Package className="w-6 h-6 mr-3" />
          Installation
        </h2>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-3">
            Maven Dependency
          </h3>
          <CodeBlock language="xml">{`<dependency>
    <groupId>io.agenthive</groupId>
    <artifactId>agenthive-java-client</artifactId>
    <version>1.0.0</version>
</dependency>`}</CodeBlock>
          
          <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-3 mt-6">
            Gradle Dependency
          </h3>
          <CodeBlock language="gradle">{`implementation 'io.agenthive:agenthive-java-client:1.0.0'`}</CodeBlock>

          <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-3 mt-6">
            SBT Dependency
          </h3>
          <CodeBlock language="scala">{`libraryDependencies += "io.agenthive" % "agenthive-java-client" % "1.0.0"`}</CodeBlock>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Development Version</h4>
              <p className="text-yellow-800 dark:text-yellow-200 mb-3">
                Since this is a local AgentHive instance, build from source:
              </p>
              <CodeBlock language="bash">{`# Clone the AgentHive repository
git clone https://github.com/diegocconsolini/AgentHive.git
cd AgentHive/sdks/java

# Build with Maven
mvn clean install

# Or build with Gradle
./gradlew build publishToMavenLocal`}</CodeBlock>
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
        
        <CodeBlock>{`import io.agenthive.client.AgentHiveClient;
import io.agenthive.client.AgentExecutionRequest;
import io.agenthive.client.AgentResponse;
import io.agenthive.client.ExecutionOptions;
import io.agenthive.client.ClientConfig;

public class AgentHiveExample {
    public static void main(String[] args) {
        try {
            // Initialize the client
            ClientConfig config = ClientConfig.builder()
                .baseUrl("http://localhost:4001")
                .timeout(30) // seconds
                .build();
            
            AgentHiveClient client = new AgentHiveClient(config);
            
            // Execute a security audit
            ExecutionOptions options = ExecutionOptions.builder()
                .temperature(0.7)
                .complexity("high")
                .build();
            
            AgentExecutionRequest request = AgentExecutionRequest.builder()
                .agentId("security-auditor")
                .prompt("Analyze this configuration for security vulnerabilities")
                .options(options)
                .build();
            
            AgentResponse response = client.executeAgent(request);
            
            System.out.println("Agent Response: " + response.getText());
            System.out.println("Duration: " + response.getMetadata().getDuration() + "ms");
            System.out.println("Tokens Used: " + response.getMetadata().getTokens());
            System.out.printf("Cost: $%.4f%n", response.getMetadata().getCost());
            
            // Always close the client
            client.close();
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
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
              <CodeBlock>{`import io.agenthive.client.*;

// Basic configuration
ClientConfig config = ClientConfig.builder()
    .baseUrl("http://localhost:4001")     // AgentHive System API URL
    .timeout(30)                          // Request timeout in seconds
    .maxRetries(3)                        // Maximum retry attempts
    .retryDelay(1000)                     // Delay between retries in milliseconds
    .userAgent("MyApp/1.0 (Java)")        // Custom User-Agent string
    .build();

AgentHiveClient client = new AgentHiveClient(config);

// Alternative fluent configuration
AgentHiveClient client = AgentHiveClient.builder()
    .baseUrl("http://localhost:4001")
    .timeout(Duration.ofSeconds(30))
    .maxRetries(3)
    .retryDelay(Duration.ofMillis(1000))
    .build();

// Try-with-resources for automatic resource management
try (AgentHiveClient client = new AgentHiveClient(config)) {
    // Use client
} catch (Exception e) {
    // Handle errors
}`}</CodeBlock>
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
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">String</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Required</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">AgentHive System API base URL</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">timeout</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">int/Duration</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">30s</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">HTTP request timeout</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">maxRetries</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">int</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">3</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Maximum number of retry attempts</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">retryDelay</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">long/Duration</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">1000ms</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Delay between retry attempts</td>
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
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Method Signatures</h4>
              <CodeBlock>{`// Synchronous execution
public AgentResponse executeAgent(AgentExecutionRequest request) throws AgentHiveException

// Asynchronous execution
public CompletableFuture<AgentResponse> executeAgentAsync(AgentExecutionRequest request)

// Request builder pattern
AgentExecutionRequest request = AgentExecutionRequest.builder()
    .agentId(String agentId)
    .prompt(String prompt)
    .options(ExecutionOptions options)  // Optional
    .build();

// Execution options
ExecutionOptions options = ExecutionOptions.builder()
    .temperature(Double temperature)     // 0.0-1.0, optional
    .complexity(String complexity)       // "low", "medium", "high", optional
    .maxTokens(Integer maxTokens)        // Optional
    .context(String context)             // Optional
    .build();`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Example Usage</h4>
              <CodeBlock>{`// Basic execution
AgentExecutionRequest request = AgentExecutionRequest.builder()
    .agentId("python-pro")
    .prompt("Optimize this Python function for better performance")
    .build();

AgentResponse response = client.executeAgent(request);

// With options
ExecutionOptions options = ExecutionOptions.builder()
    .temperature(0.3)          // Lower temperature for focused analysis
    .complexity("high")        // Use 32B model for complex analysis
    .maxTokens(4000)          // Limit response length
    .context("enterprise")     // Add context hint
    .build();

AgentExecutionRequest requestWithOptions = AgentExecutionRequest.builder()
    .agentId("security-auditor")
    .prompt("Review this code for security vulnerabilities")
    .options(options)
    .build();

AgentResponse response = client.executeAgent(requestWithOptions);

// Access response data
System.out.println("Response: " + response.getText());
System.out.println("Success: " + response.isSuccess());
System.out.println("Agent ID: " + response.getMetadata().getAgentId());
System.out.println("Model Used: " + response.getMetadata().getModel());
System.out.println("Duration: " + response.getMetadata().getDuration() + "ms");
System.out.println("Tokens: " + response.getMetadata().getTokens());
System.out.printf("Cost: $%.4f%n", response.getMetadata().getCost());

// Asynchronous execution
CompletableFuture<AgentResponse> future = client.executeAgentAsync(request);
future.thenAccept(resp -> {
    System.out.println("Async response: " + resp.getText());
}).exceptionally(throwable -> {
    System.err.println("Async execution failed: " + throwable.getMessage());
    return null;
});`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Response Classes</h4>
              <CodeBlock>{`public class AgentResponse {
    private boolean success;
    private String text;
    private AgentExecutionMetadata metadata;
    
    // Getters
    public boolean isSuccess() { return success; }
    public String getText() { return text; }
    public AgentExecutionMetadata getMetadata() { return metadata; }
}

public class AgentExecutionMetadata {
    private String agentId;
    private String model;
    private int tokens;
    private long duration;      // milliseconds
    private double cost;
    private Instant timestamp;
    
    // Getters
    public String getAgentId() { return agentId; }
    public String getModel() { return model; }
    public int getTokens() { return tokens; }
    public long getDuration() { return duration; }
    public double getCost() { return cost; }
    public Instant getTimestamp() { return timestamp; }
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
            
            <CodeBlock>{`import java.util.List;
import java.util.Arrays;
import java.util.concurrent.CompletableFuture;

// Execute multiple agents in parallel
List<AgentExecutionRequest> requests = Arrays.asList(
    AgentExecutionRequest.builder()
        .agentId("security-auditor")
        .prompt("Check for vulnerabilities")
        .build(),
    AgentExecutionRequest.builder()
        .agentId("code-reviewer")
        .prompt("Review code quality")
        .build(),
    AgentExecutionRequest.builder()
        .agentId("python-pro")
        .prompt("Optimize performance")
        .build()
);

BatchExecutionOptions batchOptions = BatchExecutionOptions.builder()
    .maxConcurrency(3)
    .timeout(Duration.ofSeconds(30))
    .build();

// Synchronous batch execution
BatchExecutionResponse batchResponse = client.executeBatch(requests, batchOptions);

System.out.println("Completed: " + batchResponse.getDistribution().getCompleted());
System.out.println("Failed: " + batchResponse.getDistribution().getFailed());
System.out.println("Average Time: " + batchResponse.getDistribution().getAverageTime() + "ms");

// Access individual results
for (BatchExecutionResult result : batchResponse.getResults()) {
    System.out.printf("Agent %s: %s%n", 
        result.getAgentId(), 
        result.getResponse().substring(0, Math.min(100, result.getResponse().length())) + "...");
}

// Asynchronous batch execution
CompletableFuture<BatchExecutionResponse> futureBatch = client.executeBatchAsync(requests, batchOptions);
futureBatch.thenAccept(response -> {
    System.out.println("Batch completed: " + response.getDistribution().getCompleted() + " requests");
});

// Response classes
public class BatchExecutionResponse {
    private boolean success;
    private BatchDistribution distribution;
    private List<BatchExecutionResult> results;
    
    // Getters...
}

public class BatchDistribution {
    private int totalRequests;
    private int completed;
    private int failed;
    private long averageTime;  // milliseconds
    
    // Getters...
}

public class BatchExecutionResult {
    private String agentId;
    private boolean success;
    private String response;
    private String error;
    private long duration;
    
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
            
            <CodeBlock>{`// Get current system metrics
SystemMetrics metrics = client.getMetrics();

System.out.println("Total Agents: " + metrics.getTotalAgents());
System.out.println("Active Agents: " + metrics.getActiveAgents());
System.out.println("System Timestamp: " + metrics.getTimestamp());

// Access individual agent metrics
for (AgentMetric agentMetric : metrics.getAgents()) {
    System.out.println("Agent: " + agentMetric.getAgentId());
    System.out.println("  Requests: " + agentMetric.getTotalRequests());
    System.out.println("  Errors: " + agentMetric.getErrors());
    System.out.println("  Avg Duration: " + agentMetric.getAvgDuration() + "ms");
    System.out.printf("  Success Rate: %.2f%%%n", agentMetric.getSuccessRate() * 100);
}

// Async metrics
CompletableFuture<SystemMetrics> futureMetrics = client.getMetricsAsync();
futureMetrics.thenAccept(m -> {
    System.out.println("System has " + m.getTotalAgents() + " agents");
});

// Response classes
public class SystemMetrics {
    private Instant timestamp;
    private int totalAgents;
    private int activeAgents;
    private List<AgentMetric> agents;
    
    // Getters...
}

public class AgentMetric {
    private String agentId;
    private int totalRequests;
    private int errors;
    private long totalDuration;
    private long avgDuration;
    private Instant lastUsed;
    private boolean isActive;
    private int totalTokens;
    private double successRate;
    
    // Getters...
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
            
            <CodeBlock>{`// Check system health
HealthStatus health = client.checkHealth();

System.out.println("System Status: " + health.getStatus());
System.out.println("Service: " + health.getService());
System.out.println("Version: " + health.getVersion());
System.out.println("Ollama Healthy: " + health.getOllama().isHealthy());
System.out.println("Available Models: " + health.getOllama().getModels().size());
System.out.println("Active Agents: " + health.getActiveAgents());

// Check if system is operational
if (health.isHealthy()) {
    System.out.println("✅ AgentHive is ready for agent execution");
} else {
    System.out.println("❌ AgentHive system issues detected");
}

// Async health check
CompletableFuture<HealthStatus> futureHealth = client.checkHealthAsync();
futureHealth.thenAccept(h -> {
    if (h.isHealthy()) {
        System.out.println("System is healthy!");
    }
});

// Response classes
public class HealthStatus {
    private String status;        // "healthy", "degraded", "down"
    private Instant timestamp;
    private String service;
    private String version;
    private OllamaHealth ollama;
    private SystemHealth system;
    private int activeAgents;
    
    public boolean isHealthy() {
        return "healthy".equals(status);
    }
    
    // Getters...
}

public class OllamaHealth {
    private boolean healthy;
    private String baseUrl;
    private List<String> models;
    
    // Getters...
}

public class SystemHealth {
    private boolean healthy;
    private Long uptime;  // seconds
    
    // Getters...
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
client.executeAgent(AgentExecutionRequest.builder()
    .agentId("python-pro")
    .prompt("Optimize this algorithm")
    .build());

client.executeAgent(AgentExecutionRequest.builder()
    .agentId("javascript-pro")
    .prompt("Debug this Node.js function")
    .build());

client.executeAgent(AgentExecutionRequest.builder()
    .agentId("code-reviewer")
    .prompt("Review this pull request")
    .build());

// Security & Analysis  
client.executeAgent(AgentExecutionRequest.builder()
    .agentId("security-auditor")
    .prompt("Analyze for vulnerabilities")
    .build());

client.executeAgent(AgentExecutionRequest.builder()
    .agentId("database-optimizer")
    .prompt("Optimize this SQL query")
    .build());

// DevOps & Infrastructure
client.executeAgent(AgentExecutionRequest.builder()
    .agentId("devops-engineer")
    .prompt("Setup CI/CD pipeline")
    .build());

client.executeAgent(AgentExecutionRequest.builder()
    .agentId("cloud-architect")
    .prompt("Design AWS infrastructure")
    .build());

// Data & ML
client.executeAgent(AgentExecutionRequest.builder()
    .agentId("data-scientist")
    .prompt("Analyze this dataset")
    .build());

client.executeAgent(AgentExecutionRequest.builder()
    .agentId("ml-engineer")
    .prompt("Build ML pipeline")
    .build());`}</CodeBlock>
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
            
            <CodeBlock>{`import io.agenthive.client.exceptions.*;

// Exception hierarchy
AgentHiveException                    // Base exception class
├── ConnectionException               // Network connectivity issues
├── AuthenticationException           // Authentication failures  
├── AgentNotFoundException           // Invalid agent ID
├── RateLimitException               // Too many requests
├── ExecutionException               // Agent execution failures
└── TimeoutException                 // Request timeout

// Exception handling example
try {
    ExecutionOptions options = ExecutionOptions.builder()
        .maxTokens(4000)
        .build();
    
    AgentExecutionRequest request = AgentExecutionRequest.builder()
        .agentId("security-auditor")
        .prompt("Analyze this configuration")
        .options(options)
        .build();
    
    AgentResponse response = client.executeAgent(request);
    System.out.println("Response: " + response.getText());
    
} catch (AgentNotFoundException e) {
    System.err.println("Invalid agent ID: " + e.getMessage());
    
} catch (RateLimitException e) {
    System.err.println("Rate limit exceeded: " + e.getMessage());
    System.out.println("Retry after: " + e.getRetryAfter() + " seconds");
    
} catch (ExecutionException e) {
    System.err.println("Agent execution failed: " + e.getMessage());
    System.out.println("Error code: " + e.getErrorCode());
    
} catch (TimeoutException e) {
    System.err.println("Request timed out after " + e.getTimeout() + " seconds");
    
} catch (ConnectionException e) {
    System.err.println("Cannot connect to AgentHive: " + e.getMessage());
    
} catch (AgentHiveException e) {
    System.err.println("General AgentHive error: " + e.getMessage());
    
} catch (Exception e) {
    System.err.println("Unexpected error: " + e.getMessage());
}`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Robust Error Handling & Retry Logic
            </h3>
            
            <CodeBlock>{`import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.time.Duration;

public class RobustAgentExecutor {
    private final AgentHiveClient client;
    private final int maxRetries;
    private final Duration baseDelay;
    
    public RobustAgentExecutor(AgentHiveClient client) {
        this.client = client;
        this.maxRetries = 3;
        this.baseDelay = Duration.ofSeconds(1);
    }
    
    public AgentResponse executeWithRetry(AgentExecutionRequest request) throws AgentHiveException {
        Exception lastException = null;
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return client.executeAgent(request);
                
            } catch (Exception e) {
                lastException = e;
                System.err.println("Attempt " + attempt + " failed: " + e.getMessage());
                
                // Don't retry on certain errors
                if (e instanceof AgentNotFoundException || e instanceof AuthenticationException) {
                    throw e;
                }
                
                // Exponential backoff
                if (attempt < maxRetries) {
                    try {
                        long delay = baseDelay.toMillis() * (long) Math.pow(2, attempt - 1);
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted during retry delay", ie);
                    }
                }
            }
        }
        
        throw new RuntimeException("Failed after " + maxRetries + " attempts", lastException);
    }
    
    public String executeWithFallback(AgentExecutionRequest request, String fallbackResponse) {
        try {
            AgentResponse response = executeWithRetry(request);
            return response.getText();
        } catch (Exception e) {
            System.err.println("Agent execution failed, using fallback: " + e.getMessage());
            return fallbackResponse;
        }
    }
    
    // Async version with retry
    public CompletableFuture<AgentResponse> executeWithRetryAsync(AgentExecutionRequest request) {
        return executeWithRetryAsync(request, 1);
    }
    
    private CompletableFuture<AgentResponse> executeWithRetryAsync(AgentExecutionRequest request, int attempt) {
        return client.executeAgentAsync(request)
            .exceptionallyCompose(throwable -> {
                System.err.println("Attempt " + attempt + " failed: " + throwable.getMessage());
                
                // Don't retry on certain errors
                if (throwable instanceof AgentNotFoundException || 
                    throwable instanceof AuthenticationException ||
                    attempt >= maxRetries) {
                    return CompletableFuture.failedFuture(throwable);
                }
                
                // Retry with exponential backoff
                long delay = baseDelay.toMillis() * (long) Math.pow(2, attempt - 1);
                return CompletableFuture.delayedExecutor(delay, TimeUnit.MILLISECONDS)
                    .thenCompose(v -> executeWithRetryAsync(request, attempt + 1));
            });
    }
}

// Usage example
public class Example {
    public static void main(String[] args) {
        try (AgentHiveClient client = new AgentHiveClient(
            ClientConfig.builder()
                .baseUrl("http://localhost:4001")
                .build()
        )) {
            RobustAgentExecutor executor = new RobustAgentExecutor(client);
            
            AgentExecutionRequest request = AgentExecutionRequest.builder()
                .agentId("python-pro")
                .prompt("Optimize this function")
                .build();
            
            // Execute with retry logic
            AgentResponse response = executor.executeWithRetry(request);
            System.out.println("Response: " + response.getText());
            
            // Execute with fallback
            String result = executor.executeWithFallback(request, "Unable to process request");
            System.out.println("Result: " + result);
            
            // Async execution with retry
            CompletableFuture<AgentResponse> future = executor.executeWithRetryAsync(request);
            future.thenAccept(resp -> System.out.println("Async response: " + resp.getText()))
                  .exceptionally(throwable -> {
                      System.err.println("All retry attempts failed: " + throwable.getMessage());
                      return null;
                  });
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
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
              Spring Boot Integration
            </h3>
            
            <CodeBlock>{`// AgentHiveConfiguration.java
@Configuration
@ConfigurationProperties(prefix = "agenthive")
public class AgentHiveConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public AgentHiveClient agentHiveClient(
            @Value("\${agenthive.base-url:http://localhost:4001}") String baseUrl,
            @Value("\${agenthive.timeout:30}") int timeout,
            @Value("\${agenthive.max-retries:3}") int maxRetries) {
        
        ClientConfig config = ClientConfig.builder()
            .baseUrl(baseUrl)
            .timeout(timeout)
            .maxRetries(maxRetries)
            .build();
            
        return new AgentHiveClient(config);
    }
    
    @Bean
    public RobustAgentExecutor robustAgentExecutor(AgentHiveClient client) {
        return new RobustAgentExecutor(client);
    }
    
    @PreDestroy
    public void cleanup() {
        // Spring will handle bean destruction
    }
}

// AgentHiveService.java
@Service
@Slf4j
public class AgentHiveService {
    
    private final AgentHiveClient client;
    private final RobustAgentExecutor executor;
    
    public AgentHiveService(AgentHiveClient client, RobustAgentExecutor executor) {
        this.client = client;
        this.executor = executor;
    }
    
    @Async
    public CompletableFuture<String> analyzeCodeAsync(String code, String agentId) {
        log.info("Starting code analysis with agent: {}", agentId);
        
        AgentExecutionRequest request = AgentExecutionRequest.builder()
            .agentId(agentId)
            .prompt("Analyze this code: \\n\\n" + code)
            .options(ExecutionOptions.builder()
                .temperature(0.3)
                .complexity("high")
                .build())
            .build();
        
        return executor.executeWithRetryAsync(request)
            .thenApply(response -> {
                log.info("Code analysis completed successfully");
                return response.getText();
            })
            .exceptionally(throwable -> {
                log.error("Code analysis failed", throwable);
                return "Analysis failed: " + throwable.getMessage();
            });
    }
    
    @Cacheable(value = "agent-metrics", unless = "#result == null")
    public SystemMetrics getCachedMetrics() {
        try {
            return client.getMetrics();
        } catch (Exception e) {
            log.error("Failed to get metrics", e);
            return null;
        }
    }
    
    @EventListener
    @Async
    public void handleApplicationEvent(ApplicationReadyEvent event) {
        // Warm up the client
        try {
            HealthStatus health = client.checkHealth();
            log.info("AgentHive health check: {}", health.getStatus());
        } catch (Exception e) {
            log.warn("Initial health check failed", e);
        }
    }
}

// AgentHiveController.java
@RestController
@RequestMapping("/api/agents")
@Slf4j
public class AgentHiveController {
    
    private final AgentHiveService agentHiveService;
    
    public AgentHiveController(AgentHiveService agentHiveService) {
        this.agentHiveService = agentHiveService;
    }
    
    @PostMapping("/execute")
    public ResponseEntity<Map<String, Object>> executeAgent(
            @RequestBody ExecuteAgentRequest request) {
        
        try {
            AgentExecutionRequest agentRequest = AgentExecutionRequest.builder()
                .agentId(request.getAgentId())
                .prompt(request.getPrompt())
                .options(request.getOptions())
                .build();
            
            CompletableFuture<String> result = agentHiveService.analyzeCodeAsync(
                request.getPrompt(), request.getAgentId());
            
            // For demo - in real app, you might want to return the future or store it
            String response = result.get(30, TimeUnit.SECONDS);
            
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("success", true);
            responseMap.put("response", response);
            responseMap.put("timestamp", Instant.now());
            
            return ResponseEntity.ok(responseMap);
            
        } catch (Exception e) {
            log.error("Agent execution failed", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }
    
    @GetMapping("/metrics")
    public ResponseEntity<SystemMetrics> getMetrics() {
        try {
            SystemMetrics metrics = agentHiveService.getCachedMetrics();
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
    }
}

// application.yml
agenthive:
  base-url: http://localhost:4001
  timeout: 30
  max-retries: 3

spring:
  task:
    execution:
      pool:
        core-size: 5
        max-size: 10
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=100,expireAfterWrite=5m`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Reactive Programming with RxJava
            </h3>
            
            <CodeBlock>{`import io.reactivex.rxjava3.core.*;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.util.concurrent.TimeUnit;

public class ReactiveAgentClient {
    private final AgentHiveClient client;
    
    public ReactiveAgentClient(AgentHiveClient client) {
        this.client = client;
    }
    
    // Convert CompletableFuture to Observable
    public Observable<AgentResponse> executeAgentRx(AgentExecutionRequest request) {
        return Observable.fromFuture(client.executeAgentAsync(request))
            .subscribeOn(Schedulers.io())
            .timeout(30, TimeUnit.SECONDS)
            .retry(3);
    }
    
    // Stream multiple agent executions
    public Observable<AgentResponse> executeAgentsRx(List<AgentExecutionRequest> requests) {
        return Observable.fromIterable(requests)
            .flatMap(request -> executeAgentRx(request), 3) // Max 3 concurrent
            .observeOn(Schedulers.computation());
    }
    
    // Pipeline with transformations
    public Observable<String> processCodeWithPipeline(String code) {
        List<String> agentIds = Arrays.asList("security-auditor", "code-reviewer", "python-pro");
        
        return Observable.fromIterable(agentIds)
            .flatMap(agentId -> {
                AgentExecutionRequest request = AgentExecutionRequest.builder()
                    .agentId(agentId)
                    .prompt("Analyze this code: " + code)
                    .build();
                return executeAgentRx(request);
            })
            .map(response -> response.getMetadata().getAgentId() + ": " + response.getText())
            .reduce((acc, item) -> acc + "\\n\\n" + item)
            .toObservable();
    }
    
    // Real-time monitoring stream
    public Observable<SystemMetrics> monitorSystemHealth(Duration interval) {
        return Observable.interval(interval.getSeconds(), TimeUnit.SECONDS)
            .startWith(0L) // Emit immediately
            .flatMap(tick -> Observable.fromFuture(client.getMetricsAsync()))
            .distinctUntilChanged(metrics -> metrics.getTotalAgents())
            .observeOn(Schedulers.computation());
    }
}

// Usage example
public class ReactiveExample {
    public static void main(String[] args) throws InterruptedException {
        try (AgentHiveClient client = new AgentHiveClient(
            ClientConfig.builder()
                .baseUrl("http://localhost:4001")
                .build()
        )) {
            ReactiveAgentClient reactiveClient = new ReactiveAgentClient(client);
            
            // Single execution with RxJava
            AgentExecutionRequest request = AgentExecutionRequest.builder()
                .agentId("python-pro")
                .prompt("Optimize this function")
                .build();
            
            reactiveClient.executeAgentRx(request)
                .subscribe(
                    response -> System.out.println("Response: " + response.getText()),
                    error -> System.err.println("Error: " + error.getMessage()),
                    () -> System.out.println("Execution completed")
                );
            
            // Process multiple agents
            String codeToAnalyze = "def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)";
            
            reactiveClient.processCodeWithPipeline(codeToAnalyze)
                .subscribe(
                    combinedResults -> System.out.println("Combined analysis:\\n" + combinedResults),
                    error -> System.err.println("Pipeline error: " + error.getMessage())
                );
            
            // Real-time monitoring
            reactiveClient.monitorSystemHealth(Duration.ofSeconds(10))
                .take(5) // Take only 5 emissions for demo
                .subscribe(
                    metrics -> System.out.printf("System health: %d/%d agents active%n", 
                        metrics.getActiveAgents(), metrics.getTotalAgents()),
                    error -> System.err.println("Monitoring error: " + error.getMessage()),
                    () -> System.out.println("Monitoring completed")
                );
            
            // Keep main thread alive for demo
            Thread.sleep(60000);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
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
              Command Line Interface
            </h3>
            
            <CodeBlock>{`// AgentHiveCLI.java - Command line interface using picocli
import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;

@Command(name = "agenthive", mixinStandardHelpOptions = true, version = "1.0",
         description = "AgentHive command line interface")
public class AgentHiveCLI implements Runnable {
    
    @Option(names = {"-u", "--url"}, defaultValue = "http://localhost:4001",
            description = "AgentHive base URL (default: \${DEFAULT-VALUE})")
    private String baseUrl;
    
    @Option(names = {"-t", "--timeout"}, defaultValue = "30",
            description = "Timeout in seconds (default: \${DEFAULT-VALUE})")
    private int timeout;
    
    @Option(names = {"-v", "--verbose"}, description = "Enable verbose output")
    private boolean verbose;
    
    public static void main(String[] args) {
        CommandLine cmd = new CommandLine(new AgentHiveCLI());
        cmd.addSubcommand("execute", new ExecuteCommand());
        cmd.addSubcommand("list", new ListCommand());
        cmd.addSubcommand("health", new HealthCommand());
        cmd.addSubcommand("batch", new BatchCommand());
        
        int exitCode = cmd.execute(args);
        System.exit(exitCode);
    }
    
    @Override
    public void run() {
        System.out.println("AgentHive CLI - Use --help for available commands");
    }
    
    @Command(name = "execute", description = "Execute an AI agent")
    static class ExecuteCommand implements Runnable {
        
        @CommandLine.ParentCommand
        private AgentHiveCLI parent;
        
        @Parameters(index = "0", description = "Agent ID")
        private String agentId;
        
        @Parameters(index = "1", description = "Prompt text")
        private String prompt;
        
        @Option(names = {"--temp"}, defaultValue = "0.7",
                description = "Temperature (0.0-1.0)")
        private double temperature;
        
        @Option(names = {"--complexity"}, defaultValue = "medium",
                description = "Complexity level (low/medium/high)")
        private String complexity;
        
        @Option(names = {"-o", "--output"}, description = "Output file")
        private String outputFile;
        
        @Option(names = {"--json"}, description = "Output in JSON format")
        private boolean jsonOutput;
        
        @Override
        public void run() {
            try {
                if (parent.verbose) {
                    System.out.printf("🤖 Executing agent '%s' with prompt: %s%n", agentId, prompt);
                }
                
                ClientConfig config = ClientConfig.builder()
                    .baseUrl(parent.baseUrl)
                    .timeout(parent.timeout)
                    .build();
                
                try (AgentHiveClient client = new AgentHiveClient(config)) {
                    ExecutionOptions options = ExecutionOptions.builder()
                        .temperature(temperature)
                        .complexity(complexity)
                        .build();
                    
                    AgentExecutionRequest request = AgentExecutionRequest.builder()
                        .agentId(agentId)
                        .prompt(prompt)
                        .options(options)
                        .build();
                    
                    long startTime = System.currentTimeMillis();
                    AgentResponse response = client.executeAgent(request);
                    long duration = System.currentTimeMillis() - startTime;
                    
                    if (jsonOutput) {
                        outputAsJson(response, duration);
                    } else {
                        outputAsText(response, duration);
                    }
                    
                    if (outputFile != null) {
                        Files.write(Paths.get(outputFile), response.getText().getBytes());
                        System.out.printf("✅ Response saved to %s%n", outputFile);
                    }
                }
                
            } catch (Exception e) {
                System.err.printf("❌ Error: %s%n", e.getMessage());
                if (parent.verbose) {
                    e.printStackTrace();
                }
                System.exit(1);
            }
        }
        
        private void outputAsJson(AgentResponse response, long duration) {
            ObjectMapper mapper = new ObjectMapper();
            try {
                Map<String, Object> output = new HashMap<>();
                output.put("success", response.isSuccess());
                output.put("response", response.getText());
                output.put("metadata", response.getMetadata());
                output.put("clientDuration", duration);
                
                System.out.println(mapper.writerWithDefaultPrettyPrinter().writeValueAsString(output));
            } catch (Exception e) {
                System.err.println("Failed to format JSON output: " + e.getMessage());
            }
        }
        
        private void outputAsText(AgentResponse response, long duration) {
            System.out.println("\\n🤖 Agent Response:");
            System.out.println("─".repeat(50));
            System.out.println(response.getText());
            
            if (parent.verbose) {
                System.out.println("\\n📊 Execution Details:");
                System.out.printf("Model: %s%n", response.getMetadata().getModel());
                System.out.printf("Server Duration: %dms%n", response.getMetadata().getDuration());
                System.out.printf("Client Duration: %dms%n", duration);
                System.out.printf("Tokens: %d%n", response.getMetadata().getTokens());
                System.out.printf("Cost: $%.4f%n", response.getMetadata().getCost());
            }
        }
    }
    
    @Command(name = "list", description = "List available agents")
    static class ListCommand implements Runnable {
        
        @CommandLine.ParentCommand
        private AgentHiveCLI parent;
        
        @Option(names = {"--active-only"}, description = "Show only active agents")
        private boolean activeOnly;
        
        @Override
        public void run() {
            try {
                ClientConfig config = ClientConfig.builder()
                    .baseUrl(parent.baseUrl)
                    .timeout(parent.timeout)
                    .build();
                
                try (AgentHiveClient client = new AgentHiveClient(config)) {
                    SystemMetrics metrics = client.getMetrics();
                    
                    System.out.printf("\\n📋 Available Agents (%d total, %d active)%n",
                        metrics.getTotalAgents(), metrics.getActiveAgents());
                    System.out.println("─".repeat(80));
                    
                    for (AgentMetric agent : metrics.getAgents()) {
                        if (activeOnly && !agent.isActive()) {
                            continue;
                        }
                        
                        String status = agent.isActive() ? "🟢" : "⚪";
                        double successRate = agent.getSuccessRate() * 100;
                        
                        System.out.printf("%s %-30s %8d requests  %6.1f%% success%n",
                            status, agent.getAgentId(), agent.getTotalRequests(), successRate);
                    }
                }
                
            } catch (Exception e) {
                System.err.printf("❌ Error: %s%n", e.getMessage());
                System.exit(1);
            }
        }
    }
    
    @Command(name = "health", description = "Check system health")
    static class HealthCommand implements Runnable {
        
        @CommandLine.ParentCommand
        private AgentHiveCLI parent;
        
        @Override
        public void run() {
            try {
                ClientConfig config = ClientConfig.builder()
                    .baseUrl(parent.baseUrl)
                    .timeout(parent.timeout)
                    .build();
                
                try (AgentHiveClient client = new AgentHiveClient(config)) {
                    HealthStatus health = client.checkHealth();
                    
                    System.out.println("\\n🏥 System Health Status");
                    System.out.println("─".repeat(40));
                    
                    String statusIcon = health.isHealthy() ? "✅" : "❌";
                    System.out.printf("Status: %s %s%n", statusIcon, health.getStatus());
                    System.out.printf("Service: %s%n", health.getService());
                    System.out.printf("Version: %s%n", health.getVersion());
                    
                    String ollamaIcon = health.getOllama().isHealthy() ? "✅" : "❌";
                    System.out.printf("Ollama: %s %s%n", ollamaIcon, 
                        health.getOllama().isHealthy() ? "healthy" : "unhealthy");
                    
                    System.out.printf("Active Agents: %d%n", health.getActiveAgents());
                    
                    if (!health.getOllama().getModels().isEmpty()) {
                        System.out.printf("Available Models: %d%n", 
                            health.getOllama().getModels().size());
                    }
                }
                
            } catch (Exception e) {
                System.err.printf("❌ Health check failed: %s%n", e.getMessage());
                System.exit(1);
            }
        }
    }
}

// Build with Maven:
// mvn compile exec:java -Dexec.mainClass="AgentHiveCLI" -Dexec.args="execute python-pro 'Optimize code'"
//
// Or package as JAR:
// mvn package
// java -jar target/agenthive-cli.jar execute python-pro "Optimize this code"
// java -jar target/agenthive-cli.jar list --active-only
// java -jar target/agenthive-cli.jar health`}</CodeBlock>
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
            Check out the complete Integration Guide for more advanced Java patterns and Spring Boot examples.
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

export default JavaSDK;