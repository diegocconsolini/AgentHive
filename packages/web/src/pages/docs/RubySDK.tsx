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

const RubySDK: React.FC = () => {
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
    language = 'ruby',
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
          <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg flex items-center justify-center mr-4">
            <Code className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Ruby SDK Documentation
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Official Ruby gem for AgentHive AI orchestration platform
        </p>
      </div>

      {/* Installation */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <Package className="w-6 h-6 mr-3" />
          Installation
        </h2>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3">
            Install via Gem
          </h3>
          <CodeBlock language="bash">{`gem install agenthive`}</CodeBlock>
          
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3 mt-6">
            Add to Gemfile
          </h3>
          <CodeBlock language="ruby">{`# Gemfile
gem 'agenthive', '~> 1.0'

# Then run
bundle install`}</CodeBlock>

          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3 mt-6">
            Require in your code
          </h3>
          <CodeBlock language="ruby">{`require 'agenthive'`}</CodeBlock>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Development Version</h4>
              <p className="text-yellow-800 dark:text-yellow-200 mb-3">
                Since this is a local AgentHive instance, install from source:
              </p>
              <CodeBlock language="bash">{`# Clone the AgentHive repository
git clone https://github.com/diegocconsolini/AgentHive.git
cd AgentHive/sdks/ruby

# Build and install the gem
bundle install
rake build
gem install pkg/agenthive-*.gem`}</CodeBlock>
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
        
        <CodeBlock>{`require 'agenthive'

begin
  # Initialize the client
  client = AgentHive::Client.new(
    base_url: 'http://localhost:4001',
    timeout: 30  # seconds
  )
  
  # Execute a security audit
  response = client.execute_agent(
    agent_id: 'security-auditor',
    prompt: 'Analyze this configuration for security vulnerabilities',
    options: {
      temperature: 0.7,
      complexity: 'high'
    }
  )
  
  puts "Agent Response: #{response.text}"
  puts "Duration: #{response.metadata.duration}ms"
  puts "Tokens Used: #{response.metadata.tokens}"
  puts "Cost: $#{response.metadata.cost.round(4)}"
  
rescue AgentHive::Error => e
  puts "Error: #{e.message}"
end`}</CodeBlock>
      </div>

      {/* API Reference */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          API Reference
        </h2>

        <div className="space-y-8">
          {/* AgentHive::Client */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              AgentHive::Client
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Main client class for interacting with the AgentHive System API.
            </p>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Initialization</h4>
              <CodeBlock>{`require 'agenthive'

# Basic configuration
client = AgentHive::Client.new(
  base_url: 'http://localhost:4001',     # AgentHive System API URL
  timeout: 30,                           # Request timeout in seconds
  max_retries: 3,                        # Maximum retry attempts  
  retry_delay: 1,                        # Delay between retries in seconds
  user_agent: 'MyApp/1.0 (Ruby)'        # Custom User-Agent string
)

# Configuration with block
client = AgentHive::Client.new do |config|
  config.base_url = 'http://localhost:4001'
  config.timeout = 30
  config.max_retries = 3
  config.retry_delay = 1
  config.logger = Logger.new(STDOUT)
  config.debug = true
end

# Using environment variables
ENV['AGENTHIVE_BASE_URL'] = 'http://localhost:4001'
ENV['AGENTHIVE_TIMEOUT'] = '30'

client = AgentHive::Client.new  # Uses environment variables

# SSL configuration for production
client = AgentHive::Client.new(
  base_url: 'https://your-agenthive-instance.com',
  ssl_verify: true,
  ssl_ca_file: '/path/to/ca-bundle.crt',
  ssl_cert_store: OpenSSL::X509::Store.new
)`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Configuration Options</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3">Option</th>
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-left py-2 px-3">Default</th>
                      <th className="text-left py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">base_url</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">String</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Required</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">AgentHive System API base URL</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">timeout</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Integer</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">30</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">HTTP request timeout in seconds</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">max_retries</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Integer</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">3</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Maximum number of retry attempts</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">retry_delay</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Numeric</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">1</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Delay between retry attempts in seconds</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* execute_agent method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              execute_agent
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Execute a specific AI agent with a prompt and options.
            </p>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Method Signatures</h4>
              <CodeBlock>{`# Method signature
def execute_agent(agent_id:, prompt:, options: {})
  # Returns AgentHive::Response
end

# Keyword arguments
client.execute_agent(
  agent_id: 'agent-name',     # Required: String
  prompt: 'your prompt',      # Required: String  
  options: {                  # Optional: Hash
    temperature: 0.7,         # Float (0.0-1.0)
    complexity: 'medium',     # String ('low', 'medium', 'high')
    max_tokens: 4000,         # Integer
    context: 'enterprise'     # String
  }
)

# Alternative hash-based syntax
client.execute_agent({
  agent_id: 'security-auditor',
  prompt: 'Analyze this code',
  options: { temperature: 0.3 }
})`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Example Usage</h4>
              <CodeBlock>{`# Basic execution
response = client.execute_agent(
  agent_id: 'python-pro',
  prompt: 'Optimize this Python function for better performance'
)

# With options
response = client.execute_agent(
  agent_id: 'security-auditor',
  prompt: 'Review this code for security vulnerabilities',
  options: {
    temperature: 0.3,        # Lower temperature for focused analysis
    complexity: 'high',      # Use 32B model for complex analysis
    max_tokens: 4000,        # Limit response length
    context: 'enterprise'    # Add context hint
  }
)

# Access response data
puts "Response: #{response.text}"
puts "Success: #{response.success?}"
puts "Agent ID: #{response.metadata.agent_id}"
puts "Model Used: #{response.metadata.model}"
puts "Duration: #{response.metadata.duration}ms"
puts "Tokens: #{response.metadata.tokens}"
puts "Cost: $#{response.metadata.cost.round(4)}"

# Chaining with blocks (Ruby style)
response = client.execute_agent(agent_id: 'code-reviewer', prompt: 'Review code') do |resp|
  puts "Received response with #{resp.metadata.tokens} tokens"
  resp.text.upcase if resp.success?
end

# Pattern matching (Ruby 3.0+)
case client.execute_agent(agent_id: 'security-auditor', prompt: 'Scan code')
in { success?: true, text: }
  puts "Security scan completed: #{text}"
in { success?: false, error: }
  puts "Security scan failed: #{error}"
end`}</CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Response Classes</h4>
              <CodeBlock>{`# AgentHive::Response class
class AgentHive::Response
  attr_reader :success, :text, :metadata
  
  def success?
    @success
  end
  
  def failed?
    !@success
  end
  
  def to_h
    {
      success: @success,
      text: @text,
      metadata: @metadata.to_h
    }
  end
  
  def to_json(*args)
    to_h.to_json(*args)
  end
end

# AgentHive::Metadata class  
class AgentHive::Metadata
  attr_reader :agent_id, :model, :tokens, :duration, :cost, :timestamp
  
  def initialize(data)
    @agent_id = data['agentId'] || data[:agent_id]
    @model = data['model']
    @tokens = data['tokens']
    @duration = data['duration']      # milliseconds
    @cost = data['cost'].to_f
    @timestamp = Time.parse(data['timestamp']) rescue Time.now
  end
  
  def duration_seconds
    @duration / 1000.0
  end
  
  def cost_formatted
    "$#{@cost.round(4)}"
  end
  
  def to_h
    {
      agent_id: @agent_id,
      model: @model,
      tokens: @tokens,
      duration: @duration,
      cost: @cost,
      timestamp: @timestamp.iso8601
    }
  end
end`}</CodeBlock>
            </div>
          </div>

          {/* execute_batch method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              execute_batch
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Execute multiple agents concurrently with load balancing.
            </p>
            
            <CodeBlock>{`# Execute multiple agents in parallel
requests = [
  { agent_id: 'security-auditor', prompt: 'Check for vulnerabilities' },
  { agent_id: 'code-reviewer', prompt: 'Review code quality' },
  { agent_id: 'python-pro', prompt: 'Optimize performance' }
]

batch_response = client.execute_batch(
  requests: requests,
  max_concurrency: 3,
  timeout: 30
)

puts "Completed: #{batch_response.distribution.completed}"
puts "Failed: #{batch_response.distribution.failed}"
puts "Average Time: #{batch_response.distribution.average_time}ms"

# Access individual results
batch_response.results.each do |result|
  truncated_response = result.response[0, 100]
  puts "Agent #{result.agent_id}: #{truncated_response}..."
end

# Using blocks for processing results
client.execute_batch(requests: requests) do |batch_response|
  successful_results = batch_response.results.select(&:success?)
  puts "#{successful_results.size} out of #{batch_response.results.size} succeeded"
  
  successful_results.each do |result|
    yield result if block_given?
  end
end

# Advanced batch execution with different options per request
complex_requests = [
  {
    agent_id: 'security-auditor',
    prompt: 'Deep security analysis',
    options: { complexity: 'high', temperature: 0.3 }
  },
  {
    agent_id: 'code-reviewer', 
    prompt: 'Quick code review',
    options: { complexity: 'low', temperature: 0.5 }
  }
]

batch_response = client.execute_batch(
  requests: complex_requests,
  max_concurrency: 2,
  timeout: 60,
  fail_fast: false  # Continue even if some requests fail
)

# Response class definitions
class AgentHive::BatchResponse
  attr_reader :success, :distribution, :results
  
  def initialize(data)
    @success = data['success'] || data[:success]
    @distribution = BatchDistribution.new(data['distribution'] || data[:distribution])
    @results = (data['results'] || data[:results]).map { |r| BatchResult.new(r) }
  end
  
  def success?
    @success
  end
  
  def successful_results
    @results.select(&:success?)
  end
  
  def failed_results
    @results.reject(&:success?)
  end
end

class AgentHive::BatchDistribution
  attr_reader :total_requests, :completed, :failed, :average_time
  
  def success_rate
    return 0 if total_requests.zero?
    completed.to_f / total_requests
  end
end

class AgentHive::BatchResult
  attr_reader :agent_id, :success, :response, :error, :duration
  
  def success?
    @success
  end
  
  def failed?
    !@success  
  end
end`}</CodeBlock>
          </div>

          {/* get_metrics method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              get_metrics
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Retrieve real-time performance metrics for all agents.
            </p>
            
            <CodeBlock>{`# Get current system metrics
metrics = client.get_metrics

puts "Total Agents: #{metrics.total_agents}"
puts "Active Agents: #{metrics.active_agents}"
puts "System Timestamp: #{metrics.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

# Access individual agent metrics
metrics.agents.each do |agent_metric|
  puts "Agent: #{agent_metric.agent_id}"
  puts "  Requests: #{agent_metric.total_requests}"
  puts "  Errors: #{agent_metric.errors}"
  puts "  Avg Duration: #{agent_metric.avg_duration}ms"
  puts "  Success Rate: #{(agent_metric.success_rate * 100).round(2)}%"
end

# Filter active agents
active_agents = metrics.agents.select(&:active?)
puts "Active agents: #{active_agents.size}"

# Sort agents by performance
top_agents = metrics.agents.sort_by(&:success_rate).reverse.first(5)
puts "Top 5 performing agents:"
top_agents.each_with_index do |agent, index|
  puts "  #{index + 1}. #{agent.agent_id} (#{(agent.success_rate * 100).round(1)}%)"
end

# Using enumerable methods (Ruby style)
high_volume_agents = metrics.agents.select { |agent| agent.total_requests > 100 }
average_response_time = metrics.agents.map(&:avg_duration).sum / metrics.agents.size.to_f

puts "High volume agents: #{high_volume_agents.map(&:agent_id).join(', ')}"
puts "Average response time across all agents: #{average_response_time.round(2)}ms"

# Metrics with time-based analysis
if metrics.respond_to?(:agent_history)
  # Group agents by performance tier
  performance_tiers = metrics.agents.group_by do |agent|
    case agent.success_rate
    when 0.9..1.0 then :excellent
    when 0.7..0.9 then :good  
    when 0.5..0.7 then :fair
    else :poor
    end
  end
  
  performance_tiers.each do |tier, agents|
    puts "#{tier.upcase}: #{agents.size} agents"
  end
end

# Response classes
class AgentHive::SystemMetrics
  attr_reader :timestamp, :total_agents, :active_agents, :agents
  
  def initialize(data)
    @timestamp = Time.parse(data['timestamp']) rescue Time.now
    @total_agents = data['totalAgents'] || data['total_agents']
    @active_agents = data['activeAgents'] || data['active_agents']  
    @agents = (data['agents'] || []).map { |a| AgentMetric.new(a) }
  end
  
  def agent_utilization
    return 0 if total_agents.zero?
    active_agents.to_f / total_agents
  end
  
  def find_agent(agent_id)
    agents.find { |agent| agent.agent_id == agent_id }
  end
end

class AgentHive::AgentMetric
  attr_reader :agent_id, :total_requests, :errors, :total_duration,
              :avg_duration, :last_used, :active, :total_tokens, :success_rate
  
  alias_method :active?, :active
  
  def initialize(data)
    @agent_id = data['agentId'] || data['agent_id']
    @total_requests = data['totalRequests'] || data['total_requests'] || 0
    @errors = data['errors'] || 0
    @avg_duration = data['avgDuration'] || data['avg_duration'] || 0
    @success_rate = data['successRate'] || data['success_rate'] || 0.0
    @active = data['isActive'] || data['active'] || false
    @last_used = data['lastUsed'] ? Time.parse(data['lastUsed']) : nil
    @total_tokens = data['totalTokens'] || data['total_tokens'] || 0
  end
  
  def error_rate
    return 0 if total_requests.zero?
    errors.to_f / total_requests
  end
  
  def requests_per_minute
    return 0 unless last_used && total_requests > 0
    
    minutes_since_last = (Time.now - last_used) / 60.0
    return 0 if minutes_since_last.zero?
    
    total_requests / minutes_since_last
  end
end`}</CodeBlock>
          </div>

          {/* check_health method */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              check_health
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Check the health status of the AgentHive system and Ollama integration.
            </p>
            
            <CodeBlock>{`# Check system health
health = client.check_health

puts "System Status: #{health.status}"
puts "Service: #{health.service}"
puts "Version: #{health.version}"
puts "Ollama Healthy: #{health.ollama.healthy?}"
puts "Available Models: #{health.ollama.models.size}"
puts "Active Agents: #{health.active_agents}"

# Check if system is operational
if health.healthy?
  puts "✅ AgentHive is ready for agent execution"
else
  puts "❌ AgentHive system issues detected"
end

# Detailed health monitoring
def monitor_system_health(client)
  health_data = {}
  
  begin
    health = client.check_health
    health_data[:status] = health.status
    health_data[:healthy] = health.healthy?
    health_data[:timestamp] = health.timestamp
    
    # Check individual components
    health_data[:components] = {
      ollama: {
        healthy: health.ollama.healthy?,
        models_count: health.ollama.models.size,
        models: health.ollama.models
      },
      system: {
        healthy: health.system.healthy?,
        uptime: health.system.uptime
      }
    }
    
    # Performance health indicators
    metrics = client.get_metrics
    health_data[:performance] = {
      active_agents: metrics.active_agents,
      total_agents: metrics.total_agents,
      agent_utilization: metrics.agent_utilization,
      avg_response_time: metrics.agents.map(&:avg_duration).sum / [metrics.agents.size, 1].max
    }
    
  rescue => e
    health_data[:status] = 'error'
    health_data[:healthy] = false
    health_data[:error] = e.message
    health_data[:timestamp] = Time.now
  end
  
  health_data
end

# Usage
health_data = monitor_system_health(client)
puts JSON.pretty_generate(health_data)

# Health status with alerts
class HealthMonitor
  def initialize(client, thresholds: {})
    @client = client
    @thresholds = {
      max_response_time: 5000,      # 5 seconds
      min_success_rate: 0.9,        # 90%
      min_agent_utilization: 0.1    # 10%
    }.merge(thresholds)
  end
  
  def check_health_with_alerts
    alerts = []
    
    begin
      health = @client.check_health
      
      unless health.healthy?
        alerts << { level: :critical, message: "System status: #{health.status}" }
      end
      
      unless health.ollama.healthy?
        alerts << { level: :critical, message: "Ollama service unhealthy" }
      end
      
      # Check performance metrics
      metrics = @client.get_metrics
      
      avg_response_time = metrics.agents.map(&:avg_duration).sum / [metrics.agents.size, 1].max
      if avg_response_time > @thresholds[:max_response_time]
        alerts << { 
          level: :warning, 
          message: "High average response time: #{avg_response_time}ms" 
        }
      end
      
      low_performing_agents = metrics.agents.select do |agent|
        agent.success_rate < @thresholds[:min_success_rate] && agent.total_requests > 10
      end
      
      low_performing_agents.each do |agent|
        alerts << {
          level: :warning,
          message: "Agent #{agent.agent_id} has low success rate: #{(agent.success_rate * 100).round(1)}%"
        }
      end
      
      if metrics.agent_utilization < @thresholds[:min_agent_utilization]
        alerts << {
          level: :info,
          message: "Low agent utilization: #{(metrics.agent_utilization * 100).round(1)}%"
        }
      end
      
    rescue => e
      alerts << { level: :critical, message: "Health check failed: #{e.message}" }
    end
    
    {
      healthy: alerts.none? { |alert| alert[:level] == :critical },
      alerts: alerts,
      timestamp: Time.now
    }
  end
end

# Usage
monitor = HealthMonitor.new(client)
health_report = monitor.check_health_with_alerts

health_report[:alerts].each do |alert|
  icon = case alert[:level]
         when :critical then "🚨"
         when :warning then "⚠️"
         when :info then "ℹ️"
         end
  puts "#{icon} [#{alert[:level].upcase}] #{alert[:message]}"
end

# Response classes
class AgentHive::HealthStatus
  attr_reader :status, :timestamp, :service, :version, :ollama, :system, :active_agents
  
  def initialize(data)
    @status = data['status']
    @timestamp = Time.parse(data['timestamp']) rescue Time.now
    @service = data['service']
    @version = data['version']
    @ollama = OllamaHealth.new(data['ollama'] || {})
    @system = SystemHealth.new(data['system'] || {})
    @active_agents = data['activeAgents'] || data['active_agents'] || 0
  end
  
  def healthy?
    status == 'healthy'
  end
  
  def degraded?
    status == 'degraded'
  end
  
  def down?
    status == 'down'
  end
end

class AgentHive::OllamaHealth
  attr_reader :healthy, :base_url, :models
  
  def initialize(data)
    @healthy = data['healthy'] || false
    @base_url = data['baseUrl'] || data['base_url']
    @models = data['models'] || []
  end
  
  def healthy?
    @healthy
  end
  
  def models_available?
    models.any?
  end
end

class AgentHive::SystemHealth
  attr_reader :healthy, :uptime
  
  def initialize(data)
    @healthy = data['healthy'] || false
    @uptime = data['uptime']
  end
  
  def healthy?
    @healthy
  end
  
  def uptime_formatted
    return 'unknown' unless uptime
    
    days = uptime / 86400
    hours = (uptime % 86400) / 3600
    minutes = (uptime % 3600) / 60
    
    "#{days}d #{hours}h #{minutes}m"
  end
end`}</CodeBlock>
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
client.execute_agent(
  agent_id: 'python-pro',
  prompt: 'Optimize this algorithm'
)

client.execute_agent(
  agent_id: 'javascript-pro',
  prompt: 'Debug this Node.js function'
)

client.execute_agent(
  agent_id: 'code-reviewer',
  prompt: 'Review this pull request'
)

# Security & Analysis  
client.execute_agent(
  agent_id: 'security-auditor',
  prompt: 'Analyze for vulnerabilities'
)

client.execute_agent(
  agent_id: 'database-optimizer',
  prompt: 'Optimize this SQL query'
)

# DevOps & Infrastructure
client.execute_agent(
  agent_id: 'devops-engineer',
  prompt: 'Setup CI/CD pipeline'
)

client.execute_agent(
  agent_id: 'cloud-architect',
  prompt: 'Design AWS infrastructure'
)

# Data & ML
client.execute_agent(
  agent_id: 'data-scientist',
  prompt: 'Analyze this dataset'
)

client.execute_agent(
  agent_id: 'ml-engineer',
  prompt: 'Build ML pipeline'
)

# Ruby-specific agents (if available)
client.execute_agent(
  agent_id: 'ruby-expert',
  prompt: 'Refactor this Rails controller'
)

client.execute_agent(
  agent_id: 'gem-specialist',
  prompt: 'Recommend gems for this use case'
)`}</CodeBlock>
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
            
            <CodeBlock>{`# Exception hierarchy
# AgentHive::Error                    (Base exception class)
# ├── AgentHive::ConnectionError      (Network connectivity issues) 
# ├── AgentHive::AuthenticationError  (Authentication failures)
# ├── AgentHive::AgentNotFoundError   (Invalid agent ID)
# ├── AgentHive::RateLimitError       (Too many requests) 
# ├── AgentHive::ExecutionError       (Agent execution failures)
# └── AgentHive::TimeoutError         (Request timeout)

# Exception handling example
begin
  response = client.execute_agent(
    agent_id: 'security-auditor',
    prompt: 'Analyze this configuration',
    options: { max_tokens: 4000 }
  )
  
  puts "Response: #{response.text}"
  
rescue AgentHive::AgentNotFoundError => e
  puts "Invalid agent ID: #{e.message}"
  
rescue AgentHive::RateLimitError => e
  puts "Rate limit exceeded: #{e.message}"
  puts "Retry after: #{e.retry_after} seconds"
  
rescue AgentHive::ExecutionError => e
  puts "Agent execution failed: #{e.message}"
  puts "Error code: #{e.error_code}" if e.respond_to?(:error_code)
  
rescue AgentHive::TimeoutError => e
  puts "Request timed out after #{e.timeout} seconds"
  
rescue AgentHive::ConnectionError => e
  puts "Cannot connect to AgentHive: #{e.message}"
  
rescue AgentHive::Error => e
  puts "General AgentHive error: #{e.message}"
  
rescue StandardError => e
  puts "Unexpected error: #{e.message}"
  puts e.backtrace if $DEBUG
end

# Custom exception classes with additional data
class AgentHive::RateLimitError < AgentHive::Error
  attr_reader :retry_after
  
  def initialize(message, retry_after: nil)
    super(message)
    @retry_after = retry_after
  end
end

class AgentHive::ExecutionError < AgentHive::Error
  attr_reader :error_code, :agent_id
  
  def initialize(message, error_code: nil, agent_id: nil)
    super(message)
    @error_code = error_code
    @agent_id = agent_id
  end
end

class AgentHive::TimeoutError < AgentHive::Error
  attr_reader :timeout
  
  def initialize(message, timeout: nil)
    super(message)
    @timeout = timeout
  end
end`}</CodeBlock>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Robust Error Handling & Retry Logic
            </h3>
            
            <CodeBlock>{`# Robust execution with retry logic
class RobustAgentExecutor
  def initialize(client, max_retries: 3, base_delay: 1)
    @client = client
    @max_retries = max_retries
    @base_delay = base_delay
  end
  
  def execute_with_retry(agent_id:, prompt:, options: {})
    last_error = nil
    
    (1..@max_retries).each do |attempt|
      begin
        return @client.execute_agent(
          agent_id: agent_id,
          prompt: prompt,
          options: options
        )
        
      rescue AgentHive::Error => e
        last_error = e
        puts "Attempt #{attempt} failed: #{e.message}" if $DEBUG
        
        # Don't retry certain errors
        case e
        when AgentHive::AgentNotFoundError, AgentHive::AuthenticationError
          raise e
        end
        
        # Exponential backoff
        if attempt < @max_retries
          delay = @base_delay * (2 ** (attempt - 1))
          sleep(delay)
        end
      end
    end
    
    raise last_error || AgentHive::Error.new("Failed after #{@max_retries} attempts")
  end
  
  def execute_with_fallback(agent_id:, prompt:, fallback: "Unable to process request", **options)
    begin
      response = execute_with_retry(agent_id: agent_id, prompt: prompt, options: options)
      response.text
    rescue AgentHive::Error => e
      puts "Agent execution failed, using fallback: #{e.message}" if $DEBUG
      fallback
    end
  end
  
  # Execute with timeout using Ruby's Timeout module
  def execute_with_timeout(timeout_seconds, agent_id:, prompt:, **options)
    require 'timeout'
    
    Timeout::timeout(timeout_seconds) do
      @client.execute_agent(agent_id: agent_id, prompt: prompt, options: options)
    end
  rescue Timeout::Error
    raise AgentHive::TimeoutError.new("Operation timed out after #{timeout_seconds} seconds")
  end
end

# Circuit breaker pattern for failure management
class CircuitBreaker
  STATES = %i[closed open half_open].freeze
  
  def initialize(failure_threshold: 5, timeout: 60)
    @failure_threshold = failure_threshold
    @timeout = timeout
    @failure_count = 0
    @last_failure_time = nil
    @state = :closed
  end
  
  def call
    raise AgentHive::Error.new('Circuit breaker is OPEN') if open? && !timeout_expired?
    
    @state = :half_open if open? && timeout_expired?
    
    begin
      result = yield
      on_success
      result
    rescue => e
      on_failure
      raise
    end
  end
  
  def closed?
    @state == :closed
  end
  
  def open?
    @state == :open
  end
  
  def half_open?
    @state == :half_open
  end
  
  private
  
  def on_success
    @failure_count = 0
    @state = :closed
  end
  
  def on_failure
    @failure_count += 1
    @last_failure_time = Time.now
    @state = :open if @failure_count >= @failure_threshold
  end
  
  def timeout_expired?
    @last_failure_time && (Time.now - @last_failure_time) >= @timeout
  end
end

# Usage examples
client = AgentHive::Client.new(base_url: 'http://localhost:4001')
robust_executor = RobustAgentExecutor.new(client)

# Execute with retry logic
begin
  response = robust_executor.execute_with_retry(
    agent_id: 'python-pro',
    prompt: 'Optimize this function'
  )
  puts "Response: #{response.text}"
rescue AgentHive::Error => e
  puts "All retry attempts failed: #{e.message}"
end

# Execute with fallback
result = robust_executor.execute_with_fallback(
  agent_id: 'code-reviewer',
  prompt: 'Review this code',
  fallback: 'Code review unavailable'
)
puts "Result: #{result}"

# Circuit breaker example
circuit_breaker = CircuitBreaker.new(failure_threshold: 3, timeout: 30)

begin
  response = circuit_breaker.call do
    client.execute_agent(
      agent_id: 'security-auditor',
      prompt: 'Security analysis'
    )
  end
  puts "Protected execution succeeded"
rescue => e
  puts "Protected execution failed: #{e.message}"
  puts "Circuit breaker state: #{circuit_breaker.open? ? 'OPEN' : 'CLOSED'}"
end

# Async execution using Ruby threads (for I/O bound operations)
def execute_agents_concurrently(client, requests)
  threads = requests.map do |request|
    Thread.new do
      begin
        response = client.execute_agent(**request)
        { success: true, response: response, error: nil }
      rescue => e
        { success: false, response: nil, error: e.message }
      end
    end
  end
  
  threads.map(&:value)
end

# Usage
concurrent_requests = [
  { agent_id: 'security-auditor', prompt: 'Security check' },
  { agent_id: 'code-reviewer', prompt: 'Code review' },
  { agent_id: 'python-pro', prompt: 'Optimization' }
]

results = execute_agents_concurrently(client, concurrent_requests)
results.each_with_index do |result, index|
  if result[:success]
    puts "Request #{index + 1} succeeded"
  else
    puts "Request #{index + 1} failed: #{result[:error]}"
  end
end`}</CodeBlock>
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
              Rails Integration
            </h3>
            
            <CodeBlock>{`# config/initializers/agenthive.rb
Rails.application.configure do
  config.agenthive = ActiveSupport::OrderedOptions.new
  config.agenthive.base_url = ENV['AGENTHIVE_BASE_URL'] || 'http://localhost:4001'
  config.agenthive.timeout = ENV['AGENTHIVE_TIMEOUT']&.to_i || 30
  config.agenthive.max_retries = ENV['AGENTHIVE_MAX_RETRIES']&.to_i || 3
  config.agenthive.cache_enabled = ENV['AGENTHIVE_CACHE_ENABLED'] != 'false'
  config.agenthive.cache_ttl = ENV['AGENTHIVE_CACHE_TTL']&.to_i || 3600
end

# lib/agenthive_service.rb
class AgenthiveService
  include Singleton
  
  attr_reader :client
  
  def initialize
    @client = AgentHive::Client.new(
      base_url: Rails.application.config.agenthive.base_url,
      timeout: Rails.application.config.agenthive.timeout,
      max_retries: Rails.application.config.agenthive.max_retries
    )
  end
  
  def execute_agent(agent_id:, prompt:, options: {}, cache: nil)
    cache_key = generate_cache_key(agent_id, prompt, options) if cache
    
    # Check cache first
    if cache && Rails.application.config.agenthive.cache_enabled
      cached_result = Rails.cache.read(cache_key)
      return cached_result if cached_result
    end
    
    Rails.logger.info "Executing AgentHive agent: #{agent_id}"
    
    start_time = Time.current
    response = @client.execute_agent(agent_id: agent_id, prompt: prompt, options: options)
    duration = ((Time.current - start_time) * 1000).round(2)
    
    Rails.logger.info "AgentHive execution completed", {
      agent: agent_id,
      duration: duration,
      tokens: response.metadata.tokens,
      cost: response.metadata.cost
    }
    
    result = response.text
    
    # Cache successful responses
    if cache && response.success? && Rails.application.config.agenthive.cache_enabled
      Rails.cache.write(cache_key, result, expires_in: cache.to_i.seconds)
    end
    
    result
    
  rescue AgentHive::Error => e
    Rails.logger.error "AgentHive execution failed", {
      agent: agent_id,
      error: e.message,
      prompt: prompt.truncate(100)
    }
    
    raise
  end
  
  def system_metrics
    Rails.cache.fetch('agenthive:metrics', expires_in: 5.minutes) do
      begin
        @client.get_metrics.to_h
      rescue AgentHive::Error => e
        Rails.logger.error "Failed to get AgentHive metrics: #{e.message}"
        nil
      end
    end
  end
  
  def healthy?
    Rails.cache.fetch('agenthive:health', expires_in: 1.minute) do
      begin
        @client.check_health.healthy?
      rescue AgentHive::Error => e
        Rails.logger.error "AgentHive health check failed: #{e.message}"
        false
      end
    end
  end
  
  private
  
  def generate_cache_key(agent_id, prompt, options)
    content = [agent_id, prompt, options.to_s].join(':')
    "agenthive:#{Digest::MD5.hexdigest(content)}"
  end
end

# app/controllers/agenthive_controller.rb
class AgenthiveController < ApplicationController
  before_action :authenticate_user!, only: [:execute]
  
  def execute
    validate_params!
    
    result = AgenthiveService.instance.execute_agent(
      agent_id: params[:agent_id],
      prompt: params[:prompt],
      options: execution_options,
      cache: params[:cache_ttl]
    )
    
    render json: {
      success: true,
      response: result,
      timestamp: Time.current.iso8601
    }
    
  rescue AgentHive::Error => e
    render json: {
      success: false,
      error: e.message,
      error_type: e.class.name
    }, status: :service_unavailable
    
  rescue ActionController::ParameterMissing => e
    render json: { error: "Missing parameter: #{e.param}" }, status: :bad_request
  end
  
  def metrics
    metrics = AgenthiveService.instance.system_metrics
    
    if metrics
      render json: metrics
    else
      render json: { error: 'Metrics unavailable' }, status: :service_unavailable
    end
  end
  
  def health
    healthy = AgenthiveService.instance.healthy?
    
    render json: {
      healthy: healthy,
      status: healthy ? 'ok' : 'error',
      timestamp: Time.current.iso8601
    }, status: healthy ? :ok : :service_unavailable
  end
  
  private
  
  def validate_params!
    params.require(:agent_id)
    params.require(:prompt)
    
    if params[:options].present?
      options = params[:options].permit(:temperature, :complexity, :max_tokens, :context)
      
      if options[:temperature].present?
        temp = options[:temperature].to_f
        unless (0.0..1.0).cover?(temp)
          raise ActionController::BadRequest, 'Temperature must be between 0.0 and 1.0'
        end
      end
      
      if options[:complexity].present?
        unless %w[low medium high].include?(options[:complexity])
          raise ActionController::BadRequest, 'Complexity must be low, medium, or high'
        end
      end
    end
  end
  
  def execution_options
    return {} unless params[:options].present?
    
    params[:options].permit(:temperature, :complexity, :max_tokens, :context).to_h.symbolize_keys
  end
end

# config/routes.rb
Rails.application.routes.draw do
  scope :api do
    scope :agenthive do
      post :execute, to: 'agenthive#execute'
      get :metrics, to: 'agenthive#metrics'
      get :health, to: 'agenthive#health'
    end
  end
end

# app/models/concerns/agenthive_integration.rb
module AgenthiveIntegration
  extend ActiveSupport::Concern
  
  included do
    # Add AgentHive functionality to any model
  end
  
  def analyze_with_agent(agent_id, content_method = :to_s, options: {})
    content = public_send(content_method)
    
    AgenthiveService.instance.execute_agent(
      agent_id: agent_id,
      prompt: "Analyze this #{self.class.name.downcase}: #{content}",
      options: options,
      cache: 1.hour
    )
  rescue AgentHive::Error => e
    Rails.logger.error "Failed to analyze #{self.class.name} with AgentHive: #{e.message}"
    nil
  end
end

# Usage in models
class CodeReview < ApplicationRecord
  include AgenthiveIntegration
  
  after_create :schedule_ai_analysis
  
  def ai_security_analysis
    analyze_with_agent('security-auditor', :code_content, options: { complexity: 'high' })
  end
  
  def ai_quality_review
    analyze_with_agent('code-reviewer', :code_content, options: { temperature: 0.3 })
  end
  
  private
  
  def schedule_ai_analysis
    PerformAiAnalysisJob.perform_later(self)
  end
end

# app/jobs/perform_ai_analysis_job.rb
class PerformAiAnalysisJob < ApplicationJob
  queue_as :default
  
  def perform(code_review)
    security_analysis = code_review.ai_security_analysis
    quality_analysis = code_review.ai_quality_review
    
    code_review.update!(
      ai_security_notes: security_analysis,
      ai_quality_notes: quality_analysis,
      ai_analyzed_at: Time.current
    )
    
    # Notify relevant parties
    if security_analysis&.include?('vulnerability')
      SecurityAlertMailer.potential_vulnerability(code_review).deliver_now
    end
  rescue AgentHive::Error => e
    Rails.logger.error "AI analysis job failed: #{e.message}"
    # Optionally retry or handle gracefully
  end
end

# lib/tasks/agenthive.rake
namespace :agenthive do
  desc "Check AgentHive system health"
  task health: :environment do
    if AgenthiveService.instance.healthy?
      puts "✅ AgentHive is healthy"
      exit 0
    else
      puts "❌ AgentHive system issues detected"
      exit 1
    end
  end
  
  desc "Display AgentHive system metrics"
  task metrics: :environment do
    metrics = AgenthiveService.instance.system_metrics
    
    if metrics
      puts "📊 AgentHive System Metrics"
      puts "Total Agents: #{metrics['total_agents']}"
      puts "Active Agents: #{metrics['active_agents']}"
      puts "Agent Utilization: #{((metrics['active_agents'].to_f / [metrics['total_agents'], 1].max) * 100).round(1)}%"
    else
      puts "❌ Unable to fetch metrics"
      exit 1
    end
  end
end

# .env
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
              Command Line Interface
            </h3>
            
            <CodeBlock>{`#!/usr/bin/env ruby
# agenthive-cli.rb - AgentHive command line interface

require 'bundler/setup'
require 'agenthive'
require 'optparse'
require 'json'
require 'fileutils'

class AgenthiveCLI
  def initialize
    @options = {
      base_url: ENV['AGENTHIVE_BASE_URL'] || 'http://localhost:4001',
      verbose: false,
      json_output: false,
      output_file: nil
    }
    
    @client = nil
  end
  
  def run(args)
    parse_global_options!(args)
    
    if args.empty?
      show_help
      return 1
    end
    
    command = args.shift
    
    begin
      initialize_client
      
      case command
      when 'execute'
        execute_command(args)
      when 'list'
        list_command(args)
      when 'health'
        health_command
      when 'batch'
        batch_command(args)
      when 'interactive'
        interactive_command
      else
        puts "Unknown command: #{command}"
        show_help
        1
      end
    rescue AgentHive::Error => e
      puts "❌ AgentHive Error: #{e.message}"
      puts e.backtrace if @options[:verbose]
      1
    rescue => e
      puts "❌ Error: #{e.message}"
      puts e.backtrace if @options[:verbose]
      1
    end
  end
  
  private
  
  def initialize_client
    @client = AgentHive::Client.new(
      base_url: @options[:base_url],
      timeout: 30,
      debug: @options[:verbose]
    )
  end
  
  def execute_command(args)
    options = {
      temperature: 0.7,
      complexity: 'medium',
      max_tokens: nil
    }
    
    # Parse execute-specific options
    parser = OptionParser.new do |opts|
      opts.on('--temp TEMP', Float, 'Temperature (0.0-1.0)') { |t| options[:temperature] = t }
      opts.on('--complexity LEVEL', String, 'Complexity (low/medium/high)') { |c| options[:complexity] = c }
      opts.on('--max-tokens TOKENS', Integer, 'Maximum tokens') { |mt| options[:max_tokens] = mt }
    end
    
    parser.parse!(args)
    
    if args.length < 2
      puts "Usage: execute <agent-id> <prompt> [options]"
      return 1
    end
    
    agent_id = args[0]
    prompt = args[1]
    
    puts "🤖 Executing agent '#{agent_id}'..." if @options[:verbose]
    
    execution_options = options.compact
    
    start_time = Time.now
    response = @client.execute_agent(
      agent_id: agent_id,
      prompt: prompt,
      options: execution_options
    )
    client_duration = ((Time.now - start_time) * 1000).round(2)
    
    if @options[:json_output]
      output_json(response, client_duration)
    else
      output_text(response, client_duration)
    end
    
    if @options[:output_file]
      File.write(@options[:output_file], response.text)
      puts "✅ Response saved to #{@options[:output_file]}"
    end
    
    0
  end
  
  def list_command(args)
    active_only = args.include?('--active-only')
    
    puts "📋 Fetching agent list..."
    metrics = @client.get_metrics
    
    puts "\\n📋 Available Agents (#{metrics.total_agents} total, #{metrics.active_agents} active)"
    puts '─' * 80
    
    agents_to_show = active_only ? metrics.agents.select(&:active?) : metrics.agents
    
    agents_to_show.each do |agent|
      status = agent.active? ? '🟢' : '⚪'
      success_rate = (agent.success_rate * 100).round(1)
      
      printf "%s %-30s %8d requests  %6.1f%% success\\n",
             status, agent.agent_id, agent.total_requests, success_rate
    end
    
    0
  end
  
  def health_command
    puts "🏥 Checking system health..."
    health = @client.check_health
    
    puts "\\n🏥 System Health Status"
    puts '─' * 40
    
    status_icon = health.healthy? ? '✅' : '❌'
    puts "Status: #{status_icon} #{health.status}"
    puts "Service: #{health.service}"
    puts "Version: #{health.version}"
    
    ollama_icon = health.ollama.healthy? ? '✅' : '❌'
    ollama_status = health.ollama.healthy? ? 'healthy' : 'unhealthy'
    puts "Ollama: #{ollama_icon} #{ollama_status}"
    
    puts "Active Agents: #{health.active_agents}"
    
    unless health.ollama.models.empty?
      puts "Available Models: #{health.ollama.models.size}"
    end
    
    health.healthy? ? 0 : 1
  end
  
  def batch_command(args)
    if args.empty?
      puts "Usage: batch <requests-file>"
      puts "Requests file should be JSON array of {agent_id, prompt, options}"
      return 1
    end
    
    requests_file = args[0]
    unless File.exist?(requests_file)
      puts "Requests file not found: #{requests_file}"
      return 1
    end
    
    begin
      requests_data = JSON.parse(File.read(requests_file))
    rescue JSON::ParserError => e
      puts "Invalid JSON in requests file: #{e.message}"
      return 1
    end
    
    unless requests_data.is_a?(Array)
      puts "Requests file must contain a JSON array"
      return 1
    end
    
    requests = requests_data.map do |data|
      {
        agent_id: data['agent_id'],
        prompt: data['prompt'],
        options: data['options'] || {}
      }
    end
    
    puts "🚀 Executing batch of #{requests.size} requests..."
    
    batch_response = @client.execute_batch(
      requests: requests,
      max_concurrency: 3
    )
    
    puts "\\n📊 Batch Results:"
    puts "Completed: #{batch_response.distribution.completed}"
    puts "Failed: #{batch_response.distribution.failed}"
    puts "Average Time: #{batch_response.distribution.average_time}ms"
    
    batch_response.results.each_with_index do |result, i|
      truncated = result.response[0, 100] if result.response
      puts "\\n[#{i}] #{result.agent_id}: #{truncated}..."
    end
    
    0
  end
  
  def interactive_command
    puts "🤖 AgentHive Interactive Mode"
    puts "Type 'help' for commands, 'quit' to exit"
    
    current_agent = 'python-pro'
    
    loop do
      print "\\n[#{current_agent}] > "
      input = gets.chomp.strip
      
      next if input.empty?
      
      case input
      when 'quit', 'exit'
        puts "Goodbye!"
        break
      when 'help'
        show_interactive_help
      when /^agent\\s+(\\S+)$/
        current_agent = $1
        puts "Switched to agent: #{current_agent}"
      when 'list'
        list_command([])
      when 'health'
        health_command
      else
        execute_interactive_prompt(current_agent, input)
      end
    end
    
    0
  end
  
  def execute_interactive_prompt(agent_id, prompt)
    puts "🤖 #{agent_id} is thinking..."
    
    begin
      response = @client.execute_agent(agent_id: agent_id, prompt: prompt)
      puts "\\n#{agent_id}: #{response.text}"
      puts "(#{response.metadata.duration}ms, #{response.metadata.tokens} tokens, $#{response.metadata.cost.round(4)})"
    rescue AgentHive::Error => e
      puts "Error: #{e.message}"
    end
  end
  
  def show_interactive_help
    puts "Available commands:"
    puts "  help                 - Show this help"
    puts "  agent <agent-id>     - Switch to different agent"
    puts "  list                 - List available agents"
    puts "  health               - Check system health"
    puts "  quit/exit            - Exit interactive mode"
    puts "  <any text>           - Send prompt to current agent"
  end
  
  def output_json(response, client_duration)
    data = {
      success: response.success?,
      response: response.text,
      metadata: response.metadata.to_h,
      client_duration: client_duration
    }
    
    puts JSON.pretty_generate(data)
  end
  
  def output_text(response, client_duration)
    puts "\\n🤖 Agent Response:"
    puts '─' * 50
    puts response.text
    
    if @options[:verbose]
      puts "\\n📊 Execution Details:"
      puts "Model: #{response.metadata.model}"
      puts "Server Duration: #{response.metadata.duration}ms"
      puts "Client Duration: #{client_duration}ms"
      puts "Tokens: #{response.metadata.tokens}"
      puts "Cost: $#{response.metadata.cost.round(4)}"
    end
  end
  
  def parse_global_options!(args)
    OptionParser.new do |opts|
      opts.on('--url URL', 'AgentHive base URL') { |url| @options[:base_url] = url }
      opts.on('--verbose', 'Enable verbose output') { @options[:verbose] = true }
      opts.on('--json', 'Output in JSON format') { @options[:json_output] = true }
      opts.on('-o', '--output FILE', 'Save response to file') { |f| @options[:output_file] = f }
      opts.on('-h', '--help', 'Show help') do
        show_help
        exit 0
      end
    end.parse!(args)
  end
  
  def show_help
    puts <<~HELP
      AgentHive CLI Tool
      
      Usage: #{$0} [global-options] <command> [command-options] [arguments]
      
      Commands:
        execute <agent-id> <prompt>     Execute an AI agent
          --temp <0.0-1.0>                Temperature setting
          --complexity <low|med|high>     Complexity level
          --max-tokens <number>           Maximum response tokens
      
        list [--active-only]            List available agents
      
        health                          Check system health
      
        batch <requests-file>           Execute batch requests from JSON file
      
        interactive                     Start interactive mode
      
      Global Options:
        --url <url>                     AgentHive base URL
        --verbose                       Enable verbose output
        --json                          Output in JSON format
        -o, --output <file>             Save response to file
        -h, --help                      Show this help
      
      Examples:
        #{$0} execute security-auditor "Check this config" --complexity high
        #{$0} list --active-only
        #{$0} health
        #{$0} batch requests.json
        #{$0} interactive
      
      Environment Variables:
        AGENTHIVE_BASE_URL             Default base URL
    HELP
  end
end

# Run the CLI
if __FILE__ == $0
  cli = AgenthiveCLI.new
  exit cli.run(ARGV)
end

# Example requests.json:
# [
#   {
#     "agent_id": "security-auditor",
#     "prompt": "Security check",
#     "options": { "complexity": "high" }
#   },
#   {
#     "agent_id": "code-reviewer",
#     "prompt": "Review code",
#     "options": { "temperature": 0.5 }
#   }
# ]

# Usage:
# chmod +x agenthive-cli.rb
# ./agenthive-cli.rb execute security-auditor "Check this config" --temp 0.3
# ./agenthive-cli.rb list --active-only
# ./agenthive-cli.rb health
# ./agenthive-cli.rb interactive`}</CodeBlock>
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
            Check out the complete Integration Guide for more advanced Ruby patterns and Rails examples.
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

export default RubySDK;