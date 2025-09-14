/**
 * Unit Tests for Context Model
 * Tests context creation, validation, and transformation
 */

const Context = require('../../../src/models/Context.js');
const { TestDataFactory } = require('../../fixtures/testData.js');

describe('Context Model', () => {
  describe('Creation and Validation', () => {
    test('should create valid context from data', () => {
      const contextData = TestDataFactory.createContext();
      const context = new Context(contextData);
      
      expect(context.id).toBe(contextData.id);
      expect(context.content).toBe(contextData.content);
      expect(context.agentId).toBe(contextData.agentId);
      expect(context.projectPath).toBe(contextData.projectPath);
      expect(context.timestamp).toBe(contextData.timestamp);
    });
    
    test('should generate ID if not provided', () => {
      const contextData = { ...TestDataFactory.createContext() };
      delete contextData.id;
      
      const context = new Context(contextData);
      
      expect(context.id).toBeDefined();
      expect(typeof context.id).toBe('string');
      expect(context.id.length).toBeGreaterThan(0);
    });
    
    test('should set timestamp if not provided', () => {
      const contextData = { ...TestDataFactory.createContext() };
      delete contextData.timestamp;
      
      const context = new Context(contextData);
      
      expect(context.timestamp).toBeDefined();
      expect(new Date(context.timestamp)).toBeInstanceOf(Date);
    });
    
    test('should validate required fields', () => {
      expect(() => new Context({})).toThrow('Content is required');
      expect(() => new Context({ content: '' })).toThrow('Content cannot be empty');
      expect(() => new Context({ content: 'test' })).toThrow('Agent ID is required');
      expect(() => new Context({ content: 'test', agentId: '' })).toThrow('Agent ID cannot be empty');
    });
    
    test('should validate field types', () => {
      const invalidData = {
        content: 123, // Should be string
        agentId: 'test-agent'
      };
      
      expect(() => new Context(invalidData)).toThrow('Content must be a string');
    });
    
    test('should validate metadata structure', () => {
      const invalidMetadata = {
        content: 'test content',
        agentId: 'test-agent',
        metadata: 'invalid' // Should be object
      };
      
      expect(() => new Context(invalidMetadata)).toThrow('Metadata must be an object');
    });
  });

  describe('Content Operations', () => {
    test('should compress content when size exceeds threshold', () => {
      const largeContent = 'x'.repeat(10000); // 10KB content
      const contextData = TestDataFactory.createContext({
        content: largeContent
      });
      
      const context = new Context(contextData);
      context.compress();
      
      expect(context.compressed).toBe(true);
      expect(context.compressedSize).toBeLessThan(context.originalSize);
      expect(context.compressedSize / context.originalSize).toBeLessThan(0.8);
    });
    
    test('should decompress content correctly', () => {
      const originalContent = JSON.stringify({
        code: 'function test() { return "hello"; }',
        analysis: 'Simple test function',
        metadata: { lang: 'js' }
      });
      
      const context = new Context({
        content: originalContent,
        agentId: 'test-agent'
      });
      
      context.compress();
      expect(context.compressed).toBe(true);
      
      context.decompress();
      expect(context.compressed).toBe(false);
      expect(context.content).toBe(originalContent);
    });
    
    test('should maintain content integrity through compression cycle', () => {
      const complexContent = {
        codeBlocks: [
          { lang: 'javascript', code: 'const x = { a: 1, b: [1,2,3] };' },
          { lang: 'python', code: 'def test():\n    return {"key": "value"}' }
        ],
        analysis: 'Complex nested structure with special characters: àáâãäå',
        unicode: '🚀 Unicode test 中文 العربية',
        binary: Buffer.from('binary data').toString('base64')
      };
      
      const context = new Context({
        content: JSON.stringify(complexContent),
        agentId: 'test-agent'
      });
      
      const originalHash = context.getContentHash();
      
      context.compress();
      context.decompress();
      
      const finalHash = context.getContentHash();
      expect(finalHash).toBe(originalHash);
      
      const finalContent = JSON.parse(context.content);
      expect(finalContent).toEqual(complexContent);
    });
  });

  describe('Semantic Operations', () => {
    test('should extract semantic keywords', () => {
      const context = new Context({
        content: 'This function implements a binary search algorithm for sorted arrays',
        agentId: 'test-agent'
      });
      
      const keywords = context.extractKeywords();
      
      expect(keywords).toContain('function');
      expect(keywords).toContain('binary');
      expect(keywords).toContain('search');
      expect(keywords).toContain('algorithm');
      expect(keywords).toContain('sorted');
      expect(keywords).toContain('arrays');
    });
    
    test('should calculate semantic similarity', () => {
      const context1 = new Context({
        content: 'Binary search algorithm implementation',
        agentId: 'agent-1'
      });
      
      const context2 = new Context({
        content: 'Binary search function for sorted data',
        agentId: 'agent-2'
      });
      
      const context3 = new Context({
        content: 'Weather forecast for tomorrow',
        agentId: 'agent-3'
      });
      
      const similarity1vs2 = context1.calculateSimilarity(context2);
      const similarity1vs3 = context1.calculateSimilarity(context3);
      
      expect(similarity1vs2).toBeGreaterThan(similarity1vs3);
      expect(similarity1vs2).toBeGreaterThan(0.5);
      expect(similarity1vs3).toBeLessThan(0.3);
    });
    
    test('should generate semantic embedding', () => {
      const context = new Context({
        content: 'Machine learning model training with neural networks',
        agentId: 'test-agent'
      });
      
      const embedding = context.generateEmbedding();
      
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
    });
  });

  describe('Metadata Operations', () => {
    test('should enrich metadata automatically', () => {
      const context = new Context({
        content: 'function bubbleSort(arr) { /* sorting logic */ }',
        agentId: 'test-agent'
      });
      
      context.enrichMetadata();
      
      expect(context.metadata.contentType).toBeDefined();
      expect(context.metadata.language).toBeDefined();
      expect(context.metadata.complexity).toBeDefined();
      expect(context.metadata.topics).toBeDefined();
      expect(Array.isArray(context.metadata.topics)).toBe(true);
    });
    
    test('should detect programming language', () => {
      const jsContext = new Context({
        content: 'const express = require("express"); app.get("/", handler);',
        agentId: 'test-agent'
      });
      
      const pyContext = new Context({
        content: 'import numpy as np\ndef calculate_mean(data): return np.mean(data)',
        agentId: 'test-agent'
      });
      
      jsContext.enrichMetadata();
      pyContext.enrichMetadata();
      
      expect(jsContext.metadata.language).toBe('javascript');
      expect(pyContext.metadata.language).toBe('python');
    });
    
    test('should calculate content complexity', () => {
      const simpleContext = new Context({
        content: 'Hello world',
        agentId: 'test-agent'
      });
      
      const complexContext = new Context({
        content: `
          class ComplexAlgorithm {
            constructor(config) {
              this.config = config;
              this.cache = new Map();
            }
            
            async process(data) {
              const result = await this.transformData(data);
              return this.optimizeResult(result);
            }
            
            private transformData(data) {
              // Complex transformation logic
            }
          }
        `,
        agentId: 'test-agent'
      });
      
      simpleContext.enrichMetadata();
      complexContext.enrichMetadata();
      
      expect(complexContext.metadata.complexity).toBeGreaterThan(simpleContext.metadata.complexity);
    });
  });

  describe('Version Control', () => {
    test('should track context versions', () => {
      const context = new Context({
        content: 'Initial content',
        agentId: 'test-agent'
      });
      
      expect(context.version).toBe(1);
      
      context.updateContent('Modified content');
      expect(context.version).toBe(2);
      
      context.updateContent('Final content');
      expect(context.version).toBe(3);
    });
    
    test('should maintain version history', () => {
      const context = new Context({
        content: 'Initial content',
        agentId: 'test-agent'
      });
      
      context.updateContent('Version 2 content');
      context.updateContent('Version 3 content');
      
      const history = context.getVersionHistory();
      
      expect(history).toHaveLength(3);
      expect(history[0].content).toBe('Initial content');
      expect(history[1].content).toBe('Version 2 content');
      expect(history[2].content).toBe('Version 3 content');
    });
    
    test('should revert to previous version', () => {
      const context = new Context({
        content: 'Initial content',
        agentId: 'test-agent'
      });
      
      context.updateContent('Modified content');
      context.updateContent('Final content');
      
      context.revertToVersion(2);
      
      expect(context.content).toBe('Modified content');
      expect(context.version).toBe(2);
    });
  });

  describe('Serialization', () => {
    test('should serialize to JSON correctly', () => {
      const contextData = TestDataFactory.createContext();
      const context = new Context(contextData);
      
      const json = context.toJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.id).toBe(context.id);
      expect(parsed.content).toBe(context.content);
      expect(parsed.agentId).toBe(context.agentId);
      expect(parsed.metadata).toEqual(context.metadata);
    });
    
    test('should deserialize from JSON correctly', () => {
      const originalContext = new Context(TestDataFactory.createContext());
      const json = originalContext.toJSON();
      
      const deserializedContext = Context.fromJSON(json);
      
      expect(deserializedContext.id).toBe(originalContext.id);
      expect(deserializedContext.content).toBe(originalContext.content);
      expect(deserializedContext.agentId).toBe(originalContext.agentId);
    });
    
    test('should handle compressed context serialization', () => {
      const largeContent = 'x'.repeat(10000);
      const context = new Context({
        content: largeContent,
        agentId: 'test-agent'
      });
      
      context.compress();
      const json = context.toJSON();
      const deserialized = Context.fromJSON(json);
      
      expect(deserialized.compressed).toBe(true);
      expect(deserialized.compressedSize).toBe(context.compressedSize);
      
      deserialized.decompress();
      expect(deserialized.content).toBe(largeContent);
    });
  });

  describe('Performance', () => {
    test('should handle large content efficiently', async () => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      
      const { result, metrics } = await global.testUtils.measurePerformance(
        async () => {
          const context = new Context({
            content: largeContent,
            agentId: 'test-agent'
          });
          context.compress();
          return context;
        },
        'large context creation and compression'
      );
      
      expect(metrics.duration).toBeLessThan(1000); // Less than 1 second
      expect(result.compressedSize).toBeLessThan(result.originalSize * 0.5);
    });
    
    test('should maintain performance with many contexts', async () => {
      const contexts = [];
      
      const { metrics } = await global.testUtils.measurePerformance(
        async () => {
          for (let i = 0; i < 1000; i++) {
            const context = new Context({
              content: `Test content ${i}`,
              agentId: `agent-${i % 10}`
            });
            contexts.push(context);
          }
          return contexts;
        },
        'creating 1000 contexts'
      );
      
      expect(metrics.duration).toBeLessThan(5000); // Less than 5 seconds
      expect(contexts).toHaveLength(1000);
    });
  });
});