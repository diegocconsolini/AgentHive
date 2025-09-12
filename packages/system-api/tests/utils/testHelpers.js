/**
 * Test Helper Utilities
 * Common testing utilities and mocks
 */

const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs/promises');

class MockStorageManager extends EventEmitter {
  constructor() {
    super();
    this.storage = new Map();
    this.operations = [];
    this.failureMode = null;
  }
  
  async save(context) {
    if (this.failureMode === 'save') {
      throw new Error('Simulated save failure');
    }
    
    this.operations.push({ type: 'save', context: context.id });
    this.storage.set(context.id, { ...context, saved: true });
    this.emit('contextSaved', context);
    return context.id;
  }
  
  async load(contextId) {
    if (this.failureMode === 'load') {
      throw new Error('Simulated load failure');
    }
    
    this.operations.push({ type: 'load', contextId });
    const context = this.storage.get(contextId);
    if (context) {
      this.emit('contextLoaded', context);
    }
    return context || null;
  }
  
  async delete(contextId) {
    if (this.failureMode === 'delete') {
      throw new Error('Simulated delete failure');
    }
    
    this.operations.push({ type: 'delete', contextId });
    const existed = this.storage.has(contextId);
    this.storage.delete(contextId);
    if (existed) {
      this.emit('contextDeleted', { id: contextId });
    }
    return existed;
  }
  
  async list(filters = {}) {
    this.operations.push({ type: 'list', filters });
    return Array.from(this.storage.values()).filter(context => {
      if (filters.agentId && context.agentId !== filters.agentId) return false;
      if (filters.projectPath && context.projectPath !== filters.projectPath) return false;
      return true;
    });
  }
  
  async cleanup(criteria = {}) {
    this.operations.push({ type: 'cleanup', criteria });
    const toDelete = [];
    
    for (const [id, context] of this.storage.entries()) {
      if (criteria.olderThan && new Date(context.timestamp) < criteria.olderThan) {
        toDelete.push(id);
      }
    }
    
    toDelete.forEach(id => this.storage.delete(id));
    return toDelete.length;
  }
  
  // Test helpers
  setFailureMode(mode) {
    this.failureMode = mode;
  }
  
  clearFailureMode() {
    this.failureMode = null;
  }
  
  getOperations() {
    return [...this.operations];
  }
  
  clearOperations() {
    this.operations = [];
  }
  
  getStorageSize() {
    return this.storage.size;
  }
  
  clear() {
    this.storage.clear();
    this.operations = [];
  }
}

class MockAgentRegistry extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.capabilities = new Map();
    this.assignments = new Map();
  }
  
  async registerAgent(agentState) {
    this.agents.set(agentState.agentId, { ...agentState });
    
    // Register capabilities
    agentState.capabilities.forEach(capability => {
      if (!this.capabilities.has(capability)) {
        this.capabilities.set(capability, new Set());
      }
      this.capabilities.get(capability).add(agentState.agentId);
    });
    
    this.emit('agentRegistered', agentState);
    return agentState.agentId;
  }
  
  async unregisterAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      
      // Remove from capabilities
      agent.capabilities.forEach(capability => {
        const capabilitySet = this.capabilities.get(capability);
        if (capabilitySet) {
          capabilitySet.delete(agentId);
          if (capabilitySet.size === 0) {
            this.capabilities.delete(capability);
          }
        }
      });
      
      this.emit('agentUnregistered', { agentId });
      return true;
    }
    return false;
  }
  
  async getAgent(agentId) {
    return this.agents.get(agentId) || null;
  }
  
  async getAllAgents() {
    return Array.from(this.agents.values());
  }
  
  async findAgentsByCapability(capability) {
    const capabilitySet = this.capabilities.get(capability);
    if (!capabilitySet) return [];
    
    return Array.from(capabilitySet).map(agentId => this.agents.get(agentId));
  }
  
  async assignWork(agentId, workItem) {
    if (!this.assignments.has(agentId)) {
      this.assignments.set(agentId, []);
    }
    this.assignments.get(agentId).push(workItem);
    this.emit('workAssigned', { agentId, workItem });
  }
  
  getAssignments(agentId) {
    return this.assignments.get(agentId) || [];
  }
  
  clear() {
    this.agents.clear();
    this.capabilities.clear();
    this.assignments.clear();
  }
}

class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }
  
  async runTest(testFn, description) {
    const start = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await testFn();
      const end = performance.now();
      const endMemory = process.memoryUsage();
      
      const testResult = {
        description,
        success: true,
        result,
        duration: end - start,
        memoryUsage: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          rss: endMemory.rss - startMemory.rss
        }
      };
      
      this.results.push(testResult);
      return testResult;
    } catch (error) {
      const end = performance.now();
      
      const testResult = {
        description,
        success: false,
        error: error.message,
        duration: end - start,
        memoryUsage: null
      };
      
      this.results.push(testResult);
      return testResult;
    }
  }
  
  async runConcurrentTests(tests) {
    this.startTime = performance.now();
    const promises = tests.map(({ fn, description }) => 
      this.runTest(fn, description)
    );
    
    const results = await Promise.allSettled(promises);
    this.endTime = performance.now();
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        success: false,
        error: result.reason.message
      }
    );
  }
  
  getResults() {
    return {
      tests: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        totalDuration: this.endTime - this.startTime,
        avgDuration: this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length
      }
    };
  }
  
  clear() {
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }
}

class MemoryProfiler {
  constructor() {
    this.snapshots = [];
  }
  
  takeSnapshot(label = 'default') {
    const snapshot = {
      label,
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      heap: process.memoryUsage.rss ? process.memoryUsage() : null
    };
    
    this.snapshots.push(snapshot);
    return snapshot;
  }
  
  compareSnapshots(label1, label2) {
    const snapshot1 = this.snapshots.find(s => s.label === label1);
    const snapshot2 = this.snapshots.find(s => s.label === label2);
    
    if (!snapshot1 || !snapshot2) {
      throw new Error('Snapshots not found for comparison');
    }
    
    return {
      duration: snapshot2.timestamp - snapshot1.timestamp,
      memoryDelta: {
        rss: snapshot2.memory.rss - snapshot1.memory.rss,
        heapUsed: snapshot2.memory.heapUsed - snapshot1.memory.heapUsed,
        heapTotal: snapshot2.memory.heapTotal - snapshot1.memory.heapTotal
      }
    };
  }
  
  getSnapshots() {
    return [...this.snapshots];
  }
  
  clear() {
    this.snapshots = [];
  }
}

async function createTempFile(content = '', extension = '.tmp') {
  const tempPath = path.join(global.testConfig.testData.temp, 
    `test-${Date.now()}-${Math.random().toString(36)}${extension}`);
  await fs.writeFile(tempPath, content);
  return tempPath;
}

async function createTempDir() {
  const tempPath = path.join(global.testConfig.testData.temp, 
    `test-dir-${Date.now()}-${Math.random().toString(36)}`);
  await fs.mkdir(tempPath, { recursive: true });
  return tempPath;
}

function waitForEvent(emitter, eventName, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Event '${eventName}' not emitted within ${timeout}ms`));
    }, timeout);
    
    emitter.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function simulateLoad(operations, concurrency = 10) {
  const chunks = [];
  for (let i = 0; i < operations.length; i += concurrency) {
    chunks.push(operations.slice(i, i + concurrency));
  }
  
  return chunks.reduce(async (promise, chunk) => {
    await promise;
    return Promise.all(chunk.map(op => op()));
  }, Promise.resolve());
}

module.exports = {
  MockStorageManager,
  MockAgentRegistry,
  TestRunner,
  MemoryProfiler,
  createTempFile,
  createTempDir,
  waitForEvent,
  simulateLoad
};