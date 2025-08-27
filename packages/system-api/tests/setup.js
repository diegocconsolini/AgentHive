/**
 * Jest Test Setup
 * Common configuration and utilities for all test suites
 */

import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

// Global test configuration
global.testConfig = {
  // Performance thresholds
  performance: {
    memoryUsageLimit: 100 * 1024 * 1024, // 100MB
    compressionRatio: 0.7, // 70% compression
    retrievalSpeed: 100, // 100ms max
    concurrentAgents: 10
  },
  
  // Test data paths
  testData: {
    root: path.join(process.cwd(), 'tests', 'fixtures'),
    temp: path.join(process.cwd(), 'tests', 'temp')
  },
  
  // Database configuration for tests
  testDb: {
    path: ':memory:', // Use in-memory SQLite for tests
    options: {
      verbose: false
    }
  }
};

// Global test utilities
global.testUtils = {
  // Performance measurement helper
  measurePerformance: async (fn, description = 'operation') => {
    const start = performance.now();
    const startMemory = process.memoryUsage();
    
    const result = await fn();
    
    const end = performance.now();
    const endMemory = process.memoryUsage();
    
    return {
      result,
      metrics: {
        duration: end - start,
        memoryDelta: {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal
        }
      }
    };
  },
  
  // Clean up test artifacts
  cleanup: async () => {
    try {
      await fs.rm(global.testConfig.testData.temp, { 
        recursive: true, 
        force: true 
      });
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  },
  
  // Create test directory structure
  setupTestDirs: async () => {
    await fs.mkdir(global.testConfig.testData.temp, { recursive: true });
  },
  
  // Generate test data
  generateTestData: (size = 'small') => {
    const sizes = {
      small: { contexts: 10, agents: 3, memory: '1MB' },
      medium: { contexts: 100, agents: 10, memory: '10MB' },
      large: { contexts: 1000, agents: 50, memory: '100MB' }
    };
    
    return sizes[size] || sizes.small;
  },
  
  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock console methods for cleaner test output
  mockConsole: () => {
    const originalConsole = { ...console };
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    return originalConsole;
  },
  
  // Restore console
  restoreConsole: (originalConsole) => {
    Object.assign(console, originalConsole);
  }
};

// Setup before each test file
beforeAll(async () => {
  await global.testUtils.setupTestDirs();
});

// Cleanup after each test file
afterAll(async () => {
  await global.testUtils.cleanup();
});

// Setup before each individual test
beforeEach(() => {
  // Reset any global state
  jest.clearAllMocks();
});

// Cleanup after each individual test
afterEach(async () => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Custom matchers for performance testing
expect.extend({
  toBeWithinPerformanceThreshold(received, threshold) {
    const pass = received <= threshold;
    return {
      message: () => 
        `expected ${received}ms to be ${pass ? 'greater than' : 'within'} ${threshold}ms`,
      pass
    };
  },
  
  toHaveCompressionRatio(received, expectedRatio) {
    const actualRatio = received.compressed / received.original;
    const pass = actualRatio <= expectedRatio;
    return {
      message: () => 
        `expected compression ratio ${actualRatio} to be ${pass ? 'greater than' : 'at most'} ${expectedRatio}`,
      pass
    };
  },
  
  toBeWithinMemoryLimit(received, limit) {
    const pass = received <= limit;
    return {
      message: () => 
        `expected memory usage ${received} bytes to be ${pass ? 'greater than' : 'within'} ${limit} bytes`,
      pass
    };
  }
});

export default global.testConfig;