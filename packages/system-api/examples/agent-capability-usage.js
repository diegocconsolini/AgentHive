/**
 * Agent Capability Management System - Usage Examples
 * 
 * This file demonstrates the complete capabilities of the Agent Capability Management System,
 * including agent creation, task assignment, load balancing, and performance optimization.
 */

const AgentCapabilityManager = require('../src/agents/AgentCapabilityManager');

// Example 1: Basic Agent Management
async function basicAgentManagement() {
  console.log('\n=== Example 1: Basic Agent Management ===\n');
  
  const manager = new AgentCapabilityManager({
    enableAutoOptimization: true,
    optimizationInterval: 60000, // 1 minute
    performanceThreshold: 0.8
  });

  // Create various types of agents
  const frontendDev = manager.createAgent('frontend-developer', {
    memory_usage: { memory_size: 256 }
  });
  console.log('Created Frontend Developer:', frontendDev);

  const backendArch = manager.createAgent('backend-architect');
  console.log('Created Backend Architect:', backendArch);

  const mlEngineer = manager.createAgent('ml-engineer');
  console.log('Created ML Engineer:', mlEngineer);

  // Get all agents
  const allAgents = manager.getAllAgents();
  console.log(`\nTotal agents created: ${allAgents.length}`);

  // Filter agents by type
  const frontendAgents = manager.getAllAgents({ type: 'frontend-developer' });
  console.log(`Frontend developers: ${frontendAgents.length}`);

  // Get system statistics
  const stats = manager.getSystemStatistics();
  console.log('\nSystem Statistics:', JSON.stringify(stats, null, 2));

  manager.shutdown();
}

// Example 2: Intelligent Agent Selection
async function intelligentAgentSelection() {
  console.log('\n=== Example 2: Intelligent Agent Selection ===\n');
  
  const manager = new AgentCapabilityManager();

  // Create a diverse pool of agents
  manager.createAgent('backend-developer');
  manager.createAgent('api-developer');
  manager.createAgent('database-optimizer');
  manager.createAgent('frontend-developer');
  manager.createAgent('test-runner');

  // Define task requirements
  const apiTask = {
    requiredCapabilities: ['rest-api', 'api-documentation'],
    preferredCapabilities: ['graphql', 'websockets'],
    complexity: 'medium',
    estimatedDuration: 120
  };

  // Find best agent using balanced strategy
  const balancedMatch = manager.findBestAgent(apiTask, { strategy: 'balanced' });
  console.log('Balanced Strategy Match:', {
    agent: balancedMatch.bestMatch,
    score: balancedMatch.score,
    confidence: balancedMatch.confidence,
    reasoning: balancedMatch.reasoning
  });

  // Find best agent using performance strategy
  const performanceMatch = manager.findBestAgent(apiTask, { strategy: 'performance' });
  console.log('\nPerformance Strategy Match:', {
    agent: performanceMatch.bestMatch,
    score: performanceMatch.score,
    confidence: performanceMatch.confidence
  });

  // Find best agent using speed strategy
  const speedMatch = manager.findBestAgent(apiTask, { strategy: 'speed' });
  console.log('\nSpeed Strategy Match:', {
    agent: speedMatch.bestMatch,
    score: speedMatch.score,
    confidence: speedMatch.confidence
  });

  manager.shutdown();
}

// Example 3: Task Assignment and Load Balancing
async function taskAssignmentAndLoadBalancing() {
  console.log('\n=== Example 3: Task Assignment and Load Balancing ===\n');
  
  const manager = new AgentCapabilityManager({
    enableLoadBalancing: true
  });

  // Create multiple agents of the same type for load balancing
  const agents = [];
  for (let i = 0; i < 3; i++) {
    agents.push(manager.createAgent('backend-developer'));
  }
  console.log(`Created ${agents.length} backend developers`);

  // Create a batch of tasks
  const tasks = [
    {
      id: 'task-001',
      issueNumber: 101,
      requirements: { requiredCapabilities: ['code-implementation'] },
      priority: 'high',
      estimatedDuration: 60
    },
    {
      id: 'task-002',
      issueNumber: 102,
      requirements: { requiredCapabilities: ['unit-testing'] },
      priority: 'normal',
      estimatedDuration: 45
    },
    {
      id: 'task-003',
      issueNumber: 103,
      requirements: { requiredCapabilities: ['debugging'] },
      priority: 'critical',
      estimatedDuration: 90
    },
    {
      id: 'task-004',
      issueNumber: 104,
      requirements: { requiredCapabilities: ['refactoring'] },
      priority: 'low',
      estimatedDuration: 120
    }
  ];

  // Assign tasks with auto-selection
  console.log('\nAssigning tasks...');
  for (const task of tasks) {
    const result = await manager.assignTask(task, { 
      autoSelect: true,
      strategy: 'adaptive' 
    });
    console.log(`Task ${task.id} (${task.priority}):`, 
      result.success ? `Assigned to ${result.agentType}` : result.error);
  }

  // Check load statistics
  const loadStats = manager.getLoadStatistics();
  console.log('\nLoad Statistics:', {
    activeAgents: loadStats.activeAgents,
    busyAgents: loadStats.busyAgents,
    idleAgents: loadStats.idleAgents,
    queueDepth: loadStats.queueDepth,
    averageUtilization: `${(loadStats.averageUtilization * 100).toFixed(1)}%`
  });

  // Complete some tasks
  console.log('\nCompleting tasks...');
  manager.completeTask('task-001', { success: true, memoryUsage: 45 });
  manager.completeTask('task-002', { success: true, memoryUsage: 30 });
  manager.completeTask('task-003', { success: false, error: 'Bug found' });

  // Check updated load statistics
  const updatedStats = manager.getLoadStatistics();
  console.log('\nUpdated Load Statistics:', {
    activeAgents: updatedStats.activeAgents,
    busyAgents: updatedStats.busyAgents,
    averageUtilization: `${(updatedStats.averageUtilization * 100).toFixed(1)}%`
  });

  manager.shutdown();
}

// Example 4: Performance Optimization
async function performanceOptimization() {
  console.log('\n=== Example 4: Performance Optimization ===\n');
  
  const manager = new AgentCapabilityManager({
    enablePerformanceTracking: true,
    enableAutoOptimization: false // Manual optimization for demo
  });

  // Create an agent
  const agent = manager.createAgent('code-analyzer');
  console.log('Created Code Analyzer:', agent.id);

  // Simulate multiple task completions with varying performance
  const taskResults = [
    { success: true, memoryUsage: 50, cpuUsage: 0.6 },
    { success: true, memoryUsage: 55, cpuUsage: 0.65 },
    { success: false, memoryUsage: 60, cpuUsage: 0.7 },
    { success: true, memoryUsage: 65, cpuUsage: 0.75 },
    { success: false, memoryUsage: 70, cpuUsage: 0.8 },
    { success: false, memoryUsage: 80, cpuUsage: 0.9 },
    { success: true, memoryUsage: 85, cpuUsage: 0.95 }
  ];

  console.log('\nSimulating task completions...');
  for (let i = 0; i < taskResults.length; i++) {
    const task = { id: `perf-task-${i}`, requirements: {} };
    await manager.assignTask(task, { agentId: agent.id });
    manager.completeTask(task.id, taskResults[i]);
  }

  // Get performance report
  const report = manager.getPerformanceReport(agent.id, {
    period: 3600000, // 1 hour
    includeRecommendations: true
  });

  console.log('\nPerformance Report:');
  console.log('Summary:', report.summary);
  console.log('Trends:', report.trends);

  // Get optimization recommendations
  const recommendations = manager.getOptimizationRecommendations(agent.id);
  console.log('\nOptimization Recommendations:');
  recommendations.forEach(rec => {
    console.log(`- [${rec.severity}] ${rec.recommendation}`);
    console.log(`  Actions: ${rec.actions.join(', ')}`);
  });

  // Apply an optimization
  if (recommendations.length > 0 && recommendations[0].actions.length > 0) {
    const action = recommendations[0].actions[0];
    console.log(`\nApplying optimization: ${action}`);
    const result = manager.applyOptimization(agent.id, action, {
      amount: 256,
      automatic: false
    });
    console.log('Result:', result);
  }

  manager.shutdown();
}

// Example 5: Working with 50+ Agent Types
async function workingWithAllAgentTypes() {
  console.log('\n=== Example 5: Working with 50+ Agent Types ===\n');
  
  const manager = new AgentCapabilityManager();

  // Get registry statistics
  const registryStats = manager.registry.getStatistics();
  console.log('Registry Statistics:', {
    totalAgents: registryStats.totalAgents,
    totalCapabilities: registryStats.totalCapabilities,
    categories: registryStats.categories,
    averageCapabilitiesPerAgent: registryStats.averageCapabilitiesPerAgent.toFixed(1)
  });

  // List all categories
  const categories = manager.registry.getCategories();
  console.log('\nAgent Categories:', categories);

  // Show sample agents from each category
  console.log('\nSample Agents by Category:');
  categories.forEach(category => {
    const agents = manager.registry.getAgentsByCategory(category);
    const sampleAgents = agents.slice(0, 3).map(a => a.type);
    console.log(`  ${category}: ${sampleAgents.join(', ')}`);
  });

  // Find agents with specific capabilities
  console.log('\nAgents with Specific Capabilities:');
  const capabilities = [
    'machine-learning',
    'kubernetes',
    'react-development',
    'security-analysis',
    'prompt-design'
  ];

  capabilities.forEach(cap => {
    const agents = manager.registry.getAgentsByCapability(cap);
    if (agents.length > 0) {
      console.log(`  ${cap}: ${agents.join(', ')}`);
    }
  });

  // Create one agent from each category
  console.log('\nCreating diverse agent team:');
  const team = [
    manager.createAgent('frontend-developer'),
    manager.createAgent('backend-architect'),
    manager.createAgent('ml-engineer'),
    manager.createAgent('devops-troubleshooter'),
    manager.createAgent('qa-engineer'),
    manager.createAgent('prompt-engineer'),
    manager.createAgent('business-analyst')
  ];

  team.forEach(agent => {
    const metadata = manager.registry.getAgent(agent.type);
    console.log(`  ${agent.type}: ${metadata.category} (${metadata.capabilities.length} capabilities)`);
  });

  manager.shutdown();
}

// Example 6: Benchmarking and Testing
async function benchmarkingAndTesting() {
  console.log('\n=== Example 6: Benchmarking and Testing ===\n');
  
  const manager = new AgentCapabilityManager();

  // Define a test suite
  const testSuite = {
    name: 'Python Development Benchmark',
    tests: [
      { name: 'Code Implementation', type: 'implementation', complexity: 'medium' },
      { name: 'Unit Testing', type: 'testing', complexity: 'low' },
      { name: 'Performance Optimization', type: 'optimization', complexity: 'high' },
      { name: 'Documentation', type: 'documentation', complexity: 'low' },
      { name: 'Debugging', type: 'debugging', complexity: 'medium' }
    ]
  };

  // Run benchmark for Python Pro agent
  console.log('Running benchmark for python-pro...');
  const pythonResults = await manager.runBenchmark('python-pro', testSuite);
  
  console.log('\nBenchmark Results:');
  console.log('Agent Type:', pythonResults.agentType);
  console.log('Summary:', {
    totalTests: pythonResults.summary.totalTests,
    successRate: `${(pythonResults.summary.successRate * 100).toFixed(1)}%`,
    averageDuration: `${pythonResults.summary.averageDuration.toFixed(0)}ms`
  });

  console.log('\nIndividual Test Results:');
  pythonResults.tests.forEach(test => {
    console.log(`  ${test.name}: ${test.success ? 'PASS' : 'FAIL'} (${test.duration}ms)`);
  });

  // Run benchmark for JavaScript Pro agent
  console.log('\nRunning benchmark for javascript-pro...');
  const jsResults = await manager.runBenchmark('javascript-pro', testSuite);
  
  console.log('JavaScript Pro Success Rate:', 
    `${(jsResults.summary.successRate * 100).toFixed(1)}%`);

  // Compare performance
  console.log('\nPerformance Comparison:');
  console.log('Python Pro:', {
    successRate: `${(pythonResults.summary.successRate * 100).toFixed(1)}%`,
    avgDuration: `${pythonResults.summary.averageDuration.toFixed(0)}ms`
  });
  console.log('JavaScript Pro:', {
    successRate: `${(jsResults.summary.successRate * 100).toFixed(1)}%`,
    avgDuration: `${jsResults.summary.averageDuration.toFixed(0)}ms`
  });

  manager.shutdown();
}

// Example 7: Configuration Import/Export
async function configurationManagement() {
  console.log('\n=== Example 7: Configuration Import/Export ===\n');
  
  // Create and configure first manager
  const manager1 = new AgentCapabilityManager({
    performanceThreshold: 0.85,
    maxAgentsPerType: 5
  });

  // Create some agents
  manager1.createAgent('frontend-developer', { status: 'active' });
  manager1.createAgent('backend-developer', { status: 'idle' });
  manager1.createAgent('test-runner', { status: 'active' });

  // Export configuration
  const config = manager1.exportConfiguration();
  console.log('Exported Configuration:', {
    agentCount: config.agents.length,
    options: config.options,
    registryTypes: config.registry.types.length
  });

  // Create new manager and import configuration
  const manager2 = new AgentCapabilityManager();
  const importResult = manager2.importConfiguration(config);
  
  console.log('\nImport Result:', {
    agentsCreated: importResult.agentsCreated,
    errors: importResult.errors
  });

  // Verify import
  const manager2Agents = manager2.getAllAgents();
  console.log('\nImported Agents:');
  manager2Agents.forEach(agent => {
    console.log(`  ${agent.type}: ${agent.status}`);
  });

  manager1.shutdown();
  manager2.shutdown();
}

// Main execution
async function main() {
  console.log('=====================================');
  console.log('Agent Capability Management System');
  console.log('Complete Usage Examples');
  console.log('=====================================');

  try {
    await basicAgentManagement();
    await intelligentAgentSelection();
    await taskAssignmentAndLoadBalancing();
    await performanceOptimization();
    await workingWithAllAgentTypes();
    await benchmarkingAndTesting();
    await configurationManagement();
    
    console.log('\n=====================================');
    console.log('All examples completed successfully!');
    console.log('=====================================');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run examples if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  basicAgentManagement,
  intelligentAgentSelection,
  taskAssignmentAndLoadBalancing,
  performanceOptimization,
  workingWithAllAgentTypes,
  benchmarkingAndTesting,
  configurationManagement
};