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

const PythonSDK: React.FC = () => {
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
    language = 'python',
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
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center mr-4">
            <Code className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Python SDK Documentation
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Official Python client library for AgentHive AI orchestration platform
        </p>
      </div>

      {/* Installation */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <Package className="w-6 h-6 mr-3" />
          Installation
        </h2>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Install via pip
          </h3>
          <CodeBlock language="bash">{`pip install agenthive`}</CodeBlock>
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
cd AgentHive/sdks/python
pip install -e .`}</CodeBlock>
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
        
        <CodeBlock>{`from agenthive import AgentHiveClient

# Initialize the client
client = AgentHiveClient(base_url="http://localhost:4001")

# Execute a security audit
response = client.execute_agent(
    agent_id="security-auditor",
    prompt="Analyze this configuration for security vulnerabilities",
    options={"temperature": 0.7, "complexity": "high"}
)

print(f"Agent Response: {response.text}")
print(f"Duration: {response.metadata.duration}ms")
print(f"Tokens Used: {response.metadata.tokens}")
print(f"Cost: \\${response.metadata.cost:.4f}")
`}</CodeBlock>
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
              <CodeBlock>{`from agenthive import AgentHiveClient

client = AgentHiveClient(
    base_url="http://localhost:4001",    # AgentHive System API URL
    timeout=30,                          # Request timeout in seconds
    max_retries=3,                       # Maximum retry attempts
    retry_delay=1.0                      # Delay between retries in seconds
)`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Parameters</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3">Parameter</th>
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-left py-2 px-3">Default</th>
                      <th className="text-left py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">base_url</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">str</td>
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
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">max_retries</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">int</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">3</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Maximum number of retry attempts</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">retry_delay</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">float</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">1.0</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Delay between retry attempts</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* execute_agent method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              execute_agent()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Execute a specific AI agent with a prompt and options.
            </p>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Method Signature</h4>
              <CodeBlock>{`def execute_agent(
    self,
    agent_id: str,
    prompt: str,
    options: Optional[Dict[str, Any]] = None
) -> AgentResponse:`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Example Usage</h4>
              <CodeBlock>{`# Basic execution
response = client.execute_agent(
    agent_id="python-pro",
    prompt="Optimize this Python function for better performance"
)

# With options
response = client.execute_agent(
    agent_id="security-auditor",
    prompt="Review this code for security vulnerabilities",
    options={
        "temperature": 0.3,      # Lower temperature for focused analysis
        "complexity": "high",    # Use 32B model for complex analysis
        "max_tokens": 4000       # Limit response length
    }
)

# Access response data
print(f"Response: {response.text}")
print(f"Success: {response.success}")
print(f"Agent ID: {response.metadata.agent_id}")
print(f"Model Used: {response.metadata.model}")
print(f"Duration: {response.metadata.duration}ms")
print(f"Tokens: {response.metadata.tokens}")
print(f"Cost: \\${response.metadata.cost:.4f}")
`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Available Options</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3">Option</th>
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-left py-2 px-3">Range</th>
                      <th className="text-left py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">temperature</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">float</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">0.0-1.0</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Creativity vs focus (0.3=focused, 0.7=balanced, 0.9=creative)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">complexity</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">str</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">low/medium/high</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Model selection hint (low=7B, medium=14B, high=32B)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">max_tokens</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">int</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">1-8192</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Maximum response length in tokens</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* execute_batch method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              execute_batch()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Execute multiple agents concurrently with load balancing.
            </p>
            
            <CodeBlock>{`# Execute multiple agents in parallel
requests = [
    {"agent_id": "security-auditor", "prompt": "Check for vulnerabilities"},
    {"agent_id": "code-reviewer", "prompt": "Review code quality"},
    {"agent_id": "python-pro", "prompt": "Optimize performance"}
]

batch_response = client.execute_batch(
    requests=requests,
    max_concurrency=3,
    timeout=30
)

print(f"Completed: {batch_response.completed}")
print(f"Failed: {batch_response.failed}")
print(f"Average Time: {batch_response.average_time}ms")

# Access individual results
for result in batch_response.results:
    print(f"Agent {result.agent_id}: {result.response[:100]}...")
`}</CodeBlock>
          </div>

          {/* get_metrics method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              get_metrics()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Retrieve real-time performance metrics for all agents.
            </p>
            
            <CodeBlock>{`# Get current system metrics
metrics = client.get_metrics()

print(f"Total Agents: {metrics.total_agents}")
print(f"Active Agents: {metrics.active_agents}")
print(f"System Timestamp: {metrics.timestamp}")

# Access individual agent metrics
for agent_metric in metrics.agents:
    print(f"Agent: {agent_metric.agent_id}")
    print(f"  Requests: {agent_metric.total_requests}")
    print(f"  Errors: {agent_metric.errors}")
    print(f"  Avg Duration: {agent_metric.avg_duration}ms")
    print(f"  Success Rate: {agent_metric.success_rate:.2%}")
`}</CodeBlock>
          </div>

          {/* check_health method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              check_health()
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Check the health status of the AgentHive system and Ollama integration.
            </p>
            
            <CodeBlock>{`# Check system health
health = client.check_health()

print(f"System Status: {health.status}")
print(f"Service: {health.service}")
print(f"Version: {health.version}")
print(f"Ollama Healthy: {health.ollama.healthy}")
print(f"Available Models: {len(health.ollama.models)}")
print(f"Active Agents: {health.active_agents}")

# Check if system is operational
if health.is_healthy():
    print("✅ AgentHive is ready for agent execution")
else:
    print("❌ AgentHive system issues detected")
`}</CodeBlock>
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
          
          <CodeBlock>{`# Development & Code Review
client.execute_agent("python-pro", "Optimize this algorithm")
client.execute_agent("javascript-pro", "Debug this Node.js function")
client.execute_agent("code-reviewer", "Review this pull request")

# Security & Analysis  
client.execute_agent("security-auditor", "Analyze for vulnerabilities")
client.execute_agent("database-optimizer", "Optimize this SQL query")
client.execute_agent("performance-engineer", "Profile system performance")

# DevOps & Infrastructure
client.execute_agent("devops-engineer", "Setup CI/CD pipeline")
client.execute_agent("cloud-architect", "Design AWS infrastructure")
client.execute_agent("terraform-specialist", "Create Terraform modules")

# Data & ML
client.execute_agent("data-scientist", "Analyze this dataset")
client.execute_agent("ml-engineer", "Build ML pipeline")
client.execute_agent("ai-engineer", "Implement RAG system")
`}</CodeBlock>
        </div>
      </div>

      {/* Error Handling */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibent text-gray-900 dark:text-gray-100 mb-6">
          Error Handling
        </h2>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Exception Types
            </h3>
            
            <CodeBlock>{`from agenthive.exceptions import (
    AgentHiveError,           # Base exception class
    ConnectionError,          # Network connectivity issues
    AuthenticationError,      # Authentication failures  
    AgentNotFoundError,      # Invalid agent ID
    RateLimitError,          # Too many requests
    ExecutionError,          # Agent execution failures
    TimeoutError             # Request timeout
)

try:
    response = client.execute_agent(
        agent_id="security-auditor",
        prompt="Analyze this configuration",
        options={"timeout": 10}
    )
    
except AgentNotFoundError as e:
    print(f"Invalid agent ID: {e}")
    
except RateLimitError as e:
    print(f"Rate limit exceeded: {e}")
    print(f"Retry after: {e.retry_after} seconds")
    
except ExecutionError as e:
    print(f"Agent execution failed: {e}")
    print(f"Error code: {e.code}")
    
except TimeoutError as e:
    print(f"Request timed out after {e.timeout} seconds")
    
except ConnectionError as e:
    print(f"Cannot connect to AgentHive: {e}")
    
except AgentHiveError as e:
    print(f"General AgentHive error: {e}")
`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Robust Error Handling Example
            </h3>
            
            <CodeBlock>{`import time
from agenthive import AgentHiveClient
from agenthive.exceptions import RateLimitError, TimeoutError

def robust_agent_execution(client, agent_id, prompt, max_retries=3):
    """Execute agent with automatic retry logic."""
    
    for attempt in range(max_retries):
        try:
            response = client.execute_agent(agent_id, prompt)
            return response
            
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            print(f"Rate limited, waiting {e.retry_after} seconds...")
            time.sleep(e.retry_after)
            
        except TimeoutError as e:
            if attempt == max_retries - 1:
                raise
            print(f"Timeout on attempt {attempt + 1}, retrying...")
            time.sleep(2 ** attempt)  # Exponential backoff
            
        except Exception as e:
            print(f"Unexpected error: {e}")
            raise

# Usage
client = AgentHiveClient(base_url="http://localhost:4001")
response = robust_agent_execution(
    client, 
    "python-pro", 
    "Optimize this function"
)
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
              Custom Configuration
            </h3>
            
            <CodeBlock>{`from agenthive import AgentHiveClient
from agenthive.config import ClientConfig
import logging

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

# Custom configuration
config = ClientConfig(
    base_url="http://localhost:4001",
    timeout=60,
    max_retries=5,
    retry_delay=2.0,
    backoff_factor=2,  # Exponential backoff
    user_agent="MyApp/1.0 (Python AgentHive Client)",
    default_options={
        "temperature": 0.7,
        "complexity": "medium"
    }
)

client = AgentHiveClient(config=config)
`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Async Client Support
            </h3>
            
            <CodeBlock>{`import asyncio
from agenthive import AsyncAgentHiveClient

async def async_agent_example():
    async with AsyncAgentHiveClient(base_url="http://localhost:4001") as client:
        # Single execution
        response = await client.execute_agent(
            "security-auditor",
            "Analyze security posture"
        )
        print(f"Response: {response.text}")
        
        # Concurrent executions
        tasks = [
            client.execute_agent("python-pro", "Optimize code"),
            client.execute_agent("code-reviewer", "Review PR"),
            client.execute_agent("security-auditor", "Security scan")
        ]
        
        responses = await asyncio.gather(*tasks)
        
        for i, response in enumerate(responses):
            print(f"Task {i+1}: {response.text[:100]}...")

# Run async example
asyncio.run(async_agent_example())
`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Context Management
            </h3>
            
            <CodeBlock>{`# Context manager for automatic resource cleanup
with AgentHiveClient(base_url="http://localhost:4001") as client:
    response = client.execute_agent(
        "python-pro",
        "Review this Python code for optimization opportunities"
    )
    print(response.text)
# Connection automatically closed

# Manual resource management
client = AgentHiveClient(base_url="http://localhost:4001")
try:
    response = client.execute_agent("security-auditor", "Security analysis")
    print(response.text)
finally:
    client.close()  # Properly close connections
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
              Code Review Automation
            </h3>
            
            <CodeBlock>{`#!/usr/bin/env python3
"""
Automated code review using AgentHive
"""
import os
import sys
from pathlib import Path
from agenthive import AgentHiveClient

def review_python_files(directory_path):
    """Review all Python files in a directory."""
    
    client = AgentHiveClient(base_url="http://localhost:4001")
    results = []
    
    # Find all Python files
    python_files = list(Path(directory_path).rglob("*.py"))
    
    for file_path in python_files:
        print(f"Reviewing {file_path}...")
        
        # Read file content
        with open(file_path, 'r', encoding='utf-8') as f:
            code_content = f.read()
        
        # Review with multiple agents
        reviews = {}
        
        # Code quality review
        reviews['quality'] = client.execute_agent(
            "code-reviewer",
            f"Review this Python code for quality, style, and best practices:\\n\\n{code_content}",
            options={"temperature": 0.3}
        )
        
        # Security analysis
        reviews['security'] = client.execute_agent(
            "security-auditor", 
            f"Analyze this Python code for security vulnerabilities:\\n\\n{code_content}",
            options={"complexity": "high"}
        )
        
        # Performance optimization
        reviews['performance'] = client.execute_agent(
            "python-pro",
            f"Suggest performance optimizations for this Python code:\\n\\n{code_content}",
            options={"temperature": 0.4}
        )
        
        results.append({
            'file': str(file_path),
            'reviews': reviews
        })
    
    return results

def generate_report(results):
    """Generate a comprehensive review report."""
    
    report = "# AgentHive Code Review Report\\n\\n"
    
    for result in results:
        report += f"## File: {result['file']}\\n\\n"
        
        for review_type, response in result['reviews'].items():
            report += f"### {review_type.title()} Review\\n"
            report += f"**Duration:** {response.metadata.duration}ms\\n"
            report += f"**Model:** {response.metadata.model}\\n\\n"
            report += f"{response.text}\\n\\n"
            report += "---\\n\\n"
    
    return report

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python review_code.py <directory_path>")
        sys.exit(1)
    
    directory = sys.argv[1]
    if not os.path.isdir(directory):
        print(f"Error: {directory} is not a valid directory")
        sys.exit(1)
    
    print(f"Starting code review for {directory}...")
    results = review_python_files(directory)
    
    # Generate report
    report = generate_report(results)
    
    # Save report
    with open("agenthive_review_report.md", "w") as f:
        f.write(report)
    
    print(f"Review complete! Report saved to agenthive_review_report.md")
    print(f"Reviewed {len(results)} files")
`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Monitoring & Alerting
            </h3>
            
            <CodeBlock>{`#!/usr/bin/env python3
"""
AgentHive system monitoring and alerting
"""
import time
import json
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from agenthive import AgentHiveClient

class AgentHiveMonitor:
    def __init__(self, base_url="http://localhost:4001"):
        self.client = AgentHiveClient(base_url=base_url)
        self.alert_thresholds = {
            'avg_response_time': 5000,  # 5 seconds
            'error_rate': 0.1,          # 10%
            'success_rate': 0.9         # 90%
        }
    
    def check_system_health(self):
        """Check overall system health."""
        try:
            health = self.client.check_health()
            return {
                'healthy': health.is_healthy(),
                'status': health.status,
                'ollama_healthy': health.ollama.healthy,
                'active_agents': health.active_agents,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'healthy': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def check_agent_performance(self):
        """Monitor agent performance metrics."""
        try:
            metrics = self.client.get_metrics()
            
            # Calculate aggregate metrics
            total_requests = sum(agent.total_requests for agent in metrics.agents)
            total_errors = sum(agent.errors for agent in metrics.agents)
            
            if total_requests > 0:
                overall_error_rate = total_errors / total_requests
                avg_response_time = sum(
                    agent.avg_duration * agent.total_requests 
                    for agent in metrics.agents
                ) / total_requests if total_requests > 0 else 0
                
                success_rate = 1 - overall_error_rate
            else:
                overall_error_rate = 0
                avg_response_time = 0
                success_rate = 1.0
            
            return {
                'total_agents': metrics.total_agents,
                'active_agents': metrics.active_agents,
                'total_requests': total_requests,
                'error_rate': overall_error_rate,
                'success_rate': success_rate,
                'avg_response_time': avg_response_time,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def check_alerts(self, performance_data):
        """Check if any metrics exceed alert thresholds."""
        alerts = []
        
        if 'error' in performance_data:
            alerts.append({
                'level': 'critical',
                'message': f"Failed to get performance data: {performance_data['error']}"
            })
            return alerts
        
        # Check response time
        if performance_data['avg_response_time'] > self.alert_thresholds['avg_response_time']:
            alerts.append({
                'level': 'warning',
                'message': f"High average response time: {performance_data['avg_response_time']:.0f}ms"
            })
        
        # Check error rate
        if performance_data['error_rate'] > self.alert_thresholds['error_rate']:
            alerts.append({
                'level': 'critical',
                'message': f"High error rate: {performance_data['error_rate']:.2%}"
            })
        
        # Check success rate
        if performance_data['success_rate'] < self.alert_thresholds['success_rate']:
            alerts.append({
                'level': 'warning',
                'message': f"Low success rate: {performance_data['success_rate']:.2%}"
            })
        
        return alerts
    
    def send_alert_email(self, alerts, smtp_config):
        """Send alert notifications via email."""
        if not alerts:
            return
        
        subject = f"AgentHive Alert - {len(alerts)} issues detected"
        body = "AgentHive Monitoring Alert\\n\\n"
        
        for alert in alerts:
            body += f"[{alert['level'].upper()}] {alert['message']}\\n"
        
        body += f"\\nTimestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = smtp_config['from']
        msg['To'] = smtp_config['to']
        
        try:
            with smtplib.SMTP(smtp_config['host'], smtp_config['port']) as server:
                if smtp_config.get('username'):
                    server.starttls()
                    server.login(smtp_config['username'], smtp_config['password'])
                server.send_message(msg)
            print(f"Alert email sent: {subject}")
        except Exception as e:
            print(f"Failed to send alert email: {e}")
    
    def run_monitoring_loop(self, check_interval=60, smtp_config=None):
        """Run continuous monitoring loop."""
        print("Starting AgentHive monitoring...")
        
        while True:
            try:
                # Check system health
                health_data = self.check_system_health()
                print(f"System Health: {'✅' if health_data.get('healthy') else '❌'} "
                      f"{health_data.get('status', 'unknown')}")
                
                # Check performance
                perf_data = self.check_agent_performance()
                if 'error' not in perf_data:
                    print(f"Performance: {perf_data['active_agents']}/{perf_data['total_agents']} agents active, "
                          f"{perf_data['success_rate']:.2%} success rate, "
                          f"{perf_data['avg_response_time']:.0f}ms avg response")
                
                # Check for alerts
                alerts = []
                if not health_data.get('healthy'):
                    alerts.append({
                        'level': 'critical',
                        'message': f"System unhealthy: {health_data.get('error', 'Unknown issue')}"
                    })
                
                alerts.extend(self.check_alerts(perf_data))
                
                if alerts:
                    print(f"🚨 {len(alerts)} alerts triggered")
                    for alert in alerts:
                        print(f"  [{alert['level']}] {alert['message']}")
                    
                    if smtp_config:
                        self.send_alert_email(alerts, smtp_config)
                
            except KeyboardInterrupt:
                print("\\nMonitoring stopped by user")
                break
            except Exception as e:
                print(f"Monitoring error: {e}")
            
            time.sleep(check_interval)

if __name__ == "__main__":
    # Configure email alerts (optional)
    smtp_config = {
        'host': 'smtp.gmail.com',
        'port': 587,
        'from': 'alerts@yourcompany.com',
        'to': 'admin@yourcompany.com',
        'username': 'your_username',
        'password': 'your_password'
    }
    
    monitor = AgentHiveMonitor()
    
    # Run monitoring (check every 60 seconds)
    monitor.run_monitoring_loop(
        check_interval=60,
        smtp_config=smtp_config  # Set to None to disable email alerts
    )
`}</CodeBlock>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Need Help?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            For more examples and advanced usage, check out the complete Integration Guide.
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

export default PythonSDK;