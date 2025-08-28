/**
 * Unit Tests for StorageManager
 * Tests core storage operations, caching, and error handling
 */

import { StorageManager } from '../../../src/storage/StorageManager.js';
import { TestDataFactory } from '../../fixtures/testData.js';
import { MockStorageManager, MemoryProfiler } from '../../utils/testHelpers.js';

describe('StorageManager', () => {
  let storageManager;
  let memoryProfiler;
  
  beforeEach(() => {
    storageManager = new StorageManager({
      storage: {
        type: 'memory',
        options: {}
      },
      cache: {
        maxSize: 100,
        ttl: 300000 // 5 minutes
      }
    });
    memoryProfiler = new MemoryProfiler();
  });
  
  afterEach(async () => {
    await storageManager.close();
    memoryProfiler.clear();
  });

  describe('Basic Operations', () => {
    test('should save and retrieve context', async () => {
      const context = TestDataFactory.createContext();
      
      const savedId = await storageManager.save(context);
      expect(savedId).toBe(context.id);
      
      const retrieved = await storageManager.load(context.id);
      expect(retrieved).toEqual(expect.objectContaining({
        id: context.id,
        content: context.content,
        agentId: context.agentId
      }));
    });
    
    test('should handle non-existent context gracefully', async () => {
      const result = await storageManager.load('non-existent-id');
      expect(result).toBeNull();
    });
    
    test('should delete context successfully', async () => {
      const context = TestDataFactory.createContext();
      await storageManager.save(context);
      
      const deleted = await storageManager.delete(context.id);
      expect(deleted).toBe(true);
      
      const retrieved = await storageManager.load(context.id);
      expect(retrieved).toBeNull();
    });
    
    test('should list contexts with filters', async () => {
      const contexts = TestDataFactory.createMultipleContexts(5, {
        agentId: 'test-agent-1'
      });
      
      for (const context of contexts) {
        await storageManager.save(context);
      }
      
      const results = await storageManager.list({ agentId: 'test-agent-1' });
      expect(results).toHaveLength(5);
      expect(results.every(c => c.agentId === 'test-agent-1')).toBe(true);
    });
  });

  describe('Caching Behavior', () => {
    test('should cache frequently accessed contexts', async () => {
      const context = TestDataFactory.createContext();
      await storageManager.save(context);
      
      // First load - should hit storage
      memoryProfiler.takeSnapshot('before-first-load');
      const first = await storageManager.load(context.id);
      memoryProfiler.takeSnapshot('after-first-load');
      
      // Second load - should hit cache
      memoryProfiler.takeSnapshot('before-second-load');
      const second = await storageManager.load(context.id);
      memoryProfiler.takeSnapshot('after-second-load');
      
      expect(first).toEqual(second);
      
      // Cache hit should be faster
      const firstLoadTime = memoryProfiler.compareSnapshots('before-first-load', 'after-first-load');
      const secondLoadTime = memoryProfiler.compareSnapshots('before-second-load', 'after-second-load');
      
      expect(secondLoadTime.duration).toBeLessThan(firstLoadTime.duration);
    });
    
    test('should evict cache when limit reached', async () => {
      const contexts = TestDataFactory.createMultipleContexts(150); // Exceed cache limit
      
      for (const context of contexts) {
        await storageManager.save(context);
        await storageManager.load(context.id); // Load to cache
      }
      
      // Cache should not exceed max size
      const cacheSize = storageManager.getCacheSize();
      expect(cacheSize).toBeLessThanOrEqual(100);
    });
    
    test('should invalidate cache on context update', async () => {
      const context = TestDataFactory.createContext();
      await storageManager.save(context);
      await storageManager.load(context.id); // Cache it
      
      // Update context
      const updated = { ...context, content: 'Updated content' };
      await storageManager.save(updated);
      
      // Should return updated content, not cached version
      const retrieved = await storageManager.load(context.id);
      expect(retrieved.content).toBe('Updated content');
    });
  });

  describe('Compression and Optimization', () => {
    test('should compress large contexts automatically', async () => {
      const largeContext = TestDataFactory.createLargeContext(2); // 2MB
      
      memoryProfiler.takeSnapshot('before-save');
      await storageManager.save(largeContext);
      memoryProfiler.takeSnapshot('after-save');
      
      const retrieved = await storageManager.load(largeContext.id);
      expect(retrieved.content).toBe(largeContext.content);
      
      // Check compression occurred
      expect(retrieved.compressed).toBe(true);
      
      const compressionRatio = retrieved.compressedSize / retrieved.originalSize;
      expect(compressionRatio).toBeWithinPerformanceThreshold(0.7);
    });
    
    test('should maintain semantic integrity after compression', async () => {
      const context = TestDataFactory.createContext({
        content: JSON.stringify({
          code: 'function test() { return "hello world"; }',
          analysis: 'This function returns a greeting string',
          metadata: { lang: 'javascript', complexity: 'low' }
        })
      });
      
      await storageManager.save(context);
      const retrieved = await storageManager.load(context.id);
      
      const originalData = JSON.parse(context.content);
      const retrievedData = JSON.parse(retrieved.content);
      
      expect(retrievedData).toEqual(originalData);
    });
    
    test('should optimize storage periodically', async () => {
      const contexts = TestDataFactory.createMultipleContexts(50);
      
      for (const context of contexts) {
        await storageManager.save(context);
      }
      
      memoryProfiler.takeSnapshot('before-optimization');
      await storageManager.optimize();
      memoryProfiler.takeSnapshot('after-optimization');
      
      const optimization = memoryProfiler.compareSnapshots('before-optimization', 'after-optimization');
      
      // Optimization should not significantly increase memory
      expect(optimization.memoryDelta.heapUsed).toBeLessThan(10 * 1024 * 1024); // 10MB
    });
  });

  describe('Error Handling', () => {
    test('should handle storage failures gracefully', async () => {
      const mockStorage = new MockStorageManager();
      mockStorage.setFailureMode('save');
      
      storageManager.storage = mockStorage;
      
      const context = TestDataFactory.createContext();
      
      await expect(storageManager.save(context)).rejects.toThrow('Simulated save failure');
    });
    
    test('should retry operations on transient failures', async () => {
      const mockStorage = new MockStorageManager();
      let attemptCount = 0;
      
      const originalSave = mockStorage.save.bind(mockStorage);
      mockStorage.save = async (context) => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Transient failure');
        }
        return originalSave(context);
      };
      
      storageManager.storage = mockStorage;
      storageManager.retryAttempts = 3;
      
      const context = TestDataFactory.createContext();
      const result = await storageManager.save(context);
      
      expect(result).toBe(context.id);
      expect(attemptCount).toBe(3);
    });
    
    test('should validate context data before saving', async () => {
      const invalidContext = TestDataFactory.createCorruptedData().invalidContext;
      
      await expect(storageManager.save(invalidContext)).rejects.toThrow();
    });
    
    test('should handle corrupted data during load', async () => {
      const mockStorage = new MockStorageManager();
      mockStorage.storage.set('corrupt-id', { corrupted: 'data' });
      
      storageManager.storage = mockStorage;
      
      const result = await storageManager.load('corrupt-id');
      expect(result).toBeNull(); // Should return null for corrupted data
    });
  });

  describe('Cleanup Operations', () => {
    test('should clean up old contexts based on criteria', async () => {
      const oldDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const recentDate = new Date();
      
      const oldContexts = TestDataFactory.createMultipleContexts(5, {
        timestamp: oldDate.toISOString()
      });
      const recentContexts = TestDataFactory.createMultipleContexts(5, {
        timestamp: recentDate.toISOString()
      });
      
      for (const context of [...oldContexts, ...recentContexts]) {
        await storageManager.save(context);
      }
      
      const cleanedCount = await storageManager.cleanup({
        olderThan: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      });
      
      expect(cleanedCount).toBe(5); // Should clean up old contexts
      
      const remainingContexts = await storageManager.list();
      expect(remainingContexts).toHaveLength(5); // Recent contexts should remain
    });
    
    test('should clean up by size when storage limit reached', async () => {
      storageManager.maxStorageSize = 1024 * 1024; // 1MB limit
      
      const contexts = TestDataFactory.createMultipleContexts(100, {
        content: 'x'.repeat(50000) // 50KB each
      });
      
      for (const context of contexts) {
        await storageManager.save(context);
      }
      
      const finalContexts = await storageManager.list();
      const totalSize = finalContexts.reduce((sum, ctx) => sum + (ctx.size || 0), 0);
      
      expect(totalSize).toBeLessThanOrEqual(storageManager.maxStorageSize);
    });
  });

  describe('Performance Requirements', () => {
    test('should maintain retrieval speed under load', async () => {
      const contexts = TestDataFactory.createMultipleContexts(1000);
      
      for (const context of contexts) {
        await storageManager.save(context);
      }
      
      const testRetrievals = contexts.slice(0, 100).map(ctx => ctx.id);
      const startTime = performance.now();
      
      await Promise.all(testRetrievals.map(id => storageManager.load(id)));
      
      const endTime = performance.now();
      const avgRetrievalTime = (endTime - startTime) / testRetrievals.length;
      
      expect(avgRetrievalTime).toBeWithinPerformanceThreshold(100); // 100ms
    });
    
    test('should handle concurrent operations efficiently', async () => {
      const contexts = TestDataFactory.createMultipleContexts(50);
      
      memoryProfiler.takeSnapshot('before-concurrent');
      
      await Promise.all([
        // Concurrent saves
        ...contexts.slice(0, 25).map(ctx => storageManager.save(ctx)),
        // Concurrent loads
        ...contexts.slice(25).map(ctx => 
          storageManager.save(ctx).then(() => storageManager.load(ctx.id))
        )
      ]);
      
      memoryProfiler.takeSnapshot('after-concurrent');
      
      const performance = memoryProfiler.compareSnapshots('before-concurrent', 'after-concurrent');
      
      // Memory usage should remain reasonable
      expect(performance.memoryDelta.heapUsed).toBeWithinMemoryLimit(50 * 1024 * 1024); // 50MB
    });
  });

  describe('Transaction Support', () => {
    test('should support atomic operations', async () => {
      const contexts = TestDataFactory.createMultipleContexts(3);
      
      const transaction = await storageManager.beginTransaction();
      
      try {
        for (const context of contexts) {
          await transaction.save(context);
        }
        
        // Before commit, contexts should not be visible
        const beforeCommit = await storageManager.list();
        expect(beforeCommit).toHaveLength(0);
        
        await transaction.commit();
        
        // After commit, all contexts should be visible
        const afterCommit = await storageManager.list();
        expect(afterCommit).toHaveLength(3);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
    
    test('should rollback failed transactions', async () => {
      const contexts = TestDataFactory.createMultipleContexts(3);
      const invalidContext = TestDataFactory.createCorruptedData().invalidContext;
      
      const transaction = await storageManager.beginTransaction();
      
      try {
        await transaction.save(contexts[0]);
        await transaction.save(contexts[1]);
        await transaction.save(invalidContext); // This should fail
        await transaction.commit();
        
        fail('Transaction should have failed');
      } catch (error) {
        await transaction.rollback();
        
        // No contexts should be saved after rollback
        const afterRollback = await storageManager.list();
        expect(afterRollback).toHaveLength(0);
      }
    });
  });
});