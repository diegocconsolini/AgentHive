const AgentState = require('../src/models/AgentState');

console.log('=== Agent State Model Usage Examples ===\n');

// Example 1: Creating different types of agents
console.log('1. Creating Different Agent Types:');
const backendArchitect = new AgentState({
  type: AgentState.TYPE.BACKEND_ARCHITECT,
  status: AgentState.STATUS.ACTIVE
});

const codeAnalyzer = new AgentState({
  type: AgentState.TYPE.CODE_ANALYZER,
  status: AgentState.STATUS.IDLE
});

console.log(`Backend Architect: ${backendArchitect.getSummary()}`);
console.log(`Code Analyzer: ${codeAnalyzer.getSummary()}`);
console.log();

// Example 2: Task management workflow
console.log('2. Task Management Workflow:');
const developer = new AgentState({
  type: AgentState.TYPE.BACKEND_DEVELOPER
});

console.log(`Initial State: ${developer.getSummary()}`);

// Start a task
developer.startTask({
  task_id: 'implement-auth',
  issue_number: 123,
  stream: 'stream-A',
  estimated_duration: 45 // 45 minutes
});

console.log(`After Starting Task: ${developer.getSummary()}`);
console.log(`Workload: ${developer.getWorkloadPercentage()}%`);

// Update memory usage during task execution
developer.updateMemoryUsage({
  contexts_active: 15,
  memory_size: 32.5
});

console.log(`After Memory Update: Context efficiency = ${developer.performance_metrics.context_efficiency.toFixed(3)}`);

// Complete the task successfully
developer.completeTask(true, {
  execution_time: 2700000, // 45 minutes in ms
  memory_peak: 38.2
});

console.log(`After Task Completion: ${developer.getSummary()}`);
console.log(`Performance Summary:`, developer.getPerformanceSummary());
console.log();

// Example 3: Multiple task simulation with performance tracking
console.log('3. Performance Tracking Over Multiple Tasks:');

const agent = new AgentState({
  type: AgentState.TYPE.PARALLEL_WORKER
});

// Simulate 5 tasks with varying success rates and timing
const tasks = [
  { id: 'task-1', duration: 600000, success: true },   // 10 min, success
  { id: 'task-2', duration: 1800000, success: true },  // 30 min, success  
  { id: 'task-3', duration: 300000, success: false },  // 5 min, failed
  { id: 'task-4', duration: 900000, success: true },   // 15 min, success
  { id: 'task-5', duration: 1200000, success: true }   // 20 min, success
];

tasks.forEach((task, index) => {
  console.log(`\nExecuting ${task.id}:`);
  
  agent.startTask({
    task_id: task.id,
    issue_number: 100 + index,
    stream: `stream-${String.fromCharCode(65 + index)}` // A, B, C, etc.
  });
  
  // Simulate memory usage during task
  agent.updateMemoryUsage({
    contexts_active: 8 + index * 2,
    memory_size: 20 + index * 5
  });
  
  agent.completeTask(task.success, {
    execution_time: task.duration,
    memory_peak: 25 + index * 3
  });
  
  console.log(`  Result: ${task.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`  Status: ${agent.status}`);
  console.log(`  Success Rate: ${(agent.performance_metrics.success_rate * 100).toFixed(1)}%`);
  console.log(`  Avg Completion: ${(agent.performance_metrics.avg_completion_time / 60000).toFixed(1)}m`);
});

console.log(`\nFinal Performance Summary:`, agent.getPerformanceSummary());
console.log();

// Example 4: Memory management and cleanup
console.log('4. Memory Management and Cleanup:');

const memoryAgent = new AgentState({
  type: AgentState.TYPE.FILE_ANALYZER
});

// Simulate high memory usage
memoryAgent.updateMemoryUsage({
  contexts_active: 50,
  memory_size: 128.5
});

console.log(`Before cleanup: ${memoryAgent.memory_usage.contexts_active} contexts, ${memoryAgent.memory_usage.memory_size}MB`);
console.log(`Peak memory: ${memoryAgent.memory_usage.peak_memory_size}MB`);
console.log(`Context efficiency: ${memoryAgent.performance_metrics.context_efficiency.toFixed(3)}`);
console.log(`Needs cleanup: ${memoryAgent.needsCleanup()}`);

// Force cleanup by setting old last_cleanup time
memoryAgent.memory_usage.last_cleanup = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago
console.log(`After aging memory - Needs cleanup: ${memoryAgent.needsCleanup()}`);

// Perform cleanup
memoryAgent.performCleanup({
  contexts_freed: 20,
  memory_freed: 45.5
});

console.log(`After cleanup: ${memoryAgent.memory_usage.contexts_active} contexts, ${memoryAgent.memory_usage.memory_size}MB`);
console.log(`New context efficiency: ${memoryAgent.performance_metrics.context_efficiency.toFixed(3)}`);
console.log();

// Example 5: Capability management
console.log('5. Capability Management:');

const flexibleAgent = new AgentState({
  type: AgentState.TYPE.BACKEND_DEVELOPER
});

console.log(`Initial capabilities: ${flexibleAgent.capabilities.join(', ')}`);

// Add specialized capabilities
flexibleAgent.addCapability('machine-learning');
flexibleAgent.addCapability('devops-automation');

console.log(`After adding ML and DevOps: ${flexibleAgent.capabilities.join(', ')}`);

// Check capabilities
console.log(`Has ML capability: ${flexibleAgent.hasCapability('machine-learning')}`);
console.log(`Has blockchain capability: ${flexibleAgent.hasCapability('blockchain')}`);

// Remove a capability
flexibleAgent.removeCapability('documentation');
console.log(`After removing documentation: ${flexibleAgent.capabilities.join(', ')}`);
console.log();

// Example 6: Serialization and cloning
console.log('6. Serialization and Cloning:');

const originalAgent = new AgentState({
  type: AgentState.TYPE.DATABASE_OPTIMIZER,
  status: AgentState.STATUS.BUSY
});

// Add some performance data
originalAgent.performance_metrics.success_rate = 0.85;
originalAgent.performance_metrics.avg_completion_time = 1200000; // 20 minutes

// Serialize to JSON
const jsonData = originalAgent.serialize();
console.log(`Serialized length: ${jsonData.length} characters`);

// Deserialize
const deserializedAgent = AgentState.deserialize(jsonData);
console.log(`Deserialized: ${deserializedAgent.getSummary()}`);
console.log(`Success rate preserved: ${(deserializedAgent.performance_metrics.success_rate * 100).toFixed(1)}%`);

// Clone with modifications
const clonedAgent = originalAgent.clone({
  type: AgentState.TYPE.TEST_RUNNER,
  status: AgentState.STATUS.IDLE
});

console.log(`Original: ${originalAgent.getSummary()}`);
console.log(`Clone: ${clonedAgent.getSummary()}`);
console.log(`Different IDs: ${originalAgent.agent_id !== clonedAgent.agent_id}`);
console.log();

// Example 7: Validation scenarios
console.log('7. Validation Examples:');

// Valid agent
const validAgent = new AgentState();
console.log(`Valid agent validation:`, validAgent.validate());

// Invalid agent scenarios
const invalidAgent = new AgentState({
  type: 'invalid-type',
  status: 'unknown-status'
});
invalidAgent.performance_metrics.success_rate = 1.5; // Invalid: > 1
invalidAgent.memory_usage.memory_size = -10; // Invalid: negative

console.log(`Invalid agent validation:`, invalidAgent.validate());

console.log('\n=== Agent State Model Examples Complete ===');