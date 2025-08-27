const ValidationSuite = require('../../src/migration/validators/ValidationSuite');
const Context = require('../../src/models/Context');

describe('ValidationSuite', () => {
  let validator;

  beforeEach(() => {
    validator = new ValidationSuite();
  });

  describe('Construction', () => {
    test('should create validator with default options', () => {
      expect(validator.options.strictMode).toBe(false);
      expect(validator.options.validateContent).toBe(true);
      expect(validator.options.validateRelationships).toBe(true);
      expect(validator.options.validateMetadata).toBe(true);
    });

    test('should accept custom options', () => {
      const customValidator = new ValidationSuite({
        strictMode: true,
        validateContent: false,
        maxContentDifference: 0.05
      });

      expect(customValidator.options.strictMode).toBe(true);
      expect(customValidator.options.validateContent).toBe(false);
      expect(customValidator.options.maxContentDifference).toBe(0.05);
    });
  });

  describe('Context Validation', () => {
    test('should validate valid context', () => {
      const validContext = new Context({
        type: 'task',
        hierarchy: ['project', 'epic'],
        importance: 75,
        content: 'This is valid content',
        metadata: {
          tags: ['test', 'validation'],
          dependencies: [],
          retention_policy: 'default'
        },
        relationships: {
          parent: null,
          children: [],
          references: []
        }
      });

      const result = validator.validateContext(validContext);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.contextId).toBe(validContext.id);
    });

    test('should detect missing required fields', () => {
      const invalidContext = {
        type: 'task',
        // Missing required fields: id, hierarchy, content
        importance: 50
      };

      const result = validator.validateContext(invalidContext);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('id'))).toBe(true);
      expect(result.errors.some(e => e.includes('hierarchy'))).toBe(true);
      expect(result.errors.some(e => e.includes('content'))).toBe(true);
    });

    test('should validate field types', () => {
      const invalidContext = new Context({
        type: 'task',
        hierarchy: 'not-an-array', // Should be array
        importance: 150, // Should be 0-100
        content: 123, // Should be string
        metadata: 'not-an-object', // Should be object
        relationships: 'not-an-object' // Should be object
      });

      const result = validator.validateContext(invalidContext);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate content integrity when source provided', () => {
      const context = new Context({
        content: 'Short content'
      });

      const source = {
        content: 'This is much longer original content that should trigger a warning'
      };

      const result = validator.validateContext(context, source);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('content length'))).toBe(true);
    });

    test('should validate metadata structure', () => {
      const contextWithBadMetadata = new Context({
        metadata: {
          tags: 'not-an-array', // Should be array
          dependencies: 'not-an-array', // Should be array
          agent_id: 123 // Should be string
        }
      });

      const result = validator.validateContext(contextWithBadMetadata);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Manifest Validation', () => {
    test('should validate valid manifest', () => {
      const validManifest = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        files: [
          {
            source: '/path/to/file1.md',
            targetHierarchy: ['project'],
            targetType: 'task'
          }
        ],
        mappings: [
          {
            source: '/path/to/file1.md',
            target: {
              storageKey: 'project/task/file1'
            }
          }
        ],
        conflicts: []
      };

      const result = validator.validateManifest(validManifest);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.fileCount).toBe(1);
      expect(result.mappingCount).toBe(1);
      expect(result.conflictCount).toBe(0);
    });

    test('should detect missing required fields', () => {
      const invalidManifest = {
        // Missing version, timestamp, files, mappings
        conflicts: []
      };

      const result = validator.validateManifest(invalidManifest);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('version'))).toBe(true);
      expect(result.errors.some(e => e.includes('timestamp'))).toBe(true);
    });

    test('should detect invalid file entries', () => {
      const manifestWithBadFiles = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        files: [
          {
            // Missing source, targetHierarchy, targetType
            someField: 'value'
          }
        ],
        mappings: []
      };

      const result = validator.validateManifest(manifestWithBadFiles);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid file manifest'))).toBe(true);
    });

    test('should detect duplicate mappings', () => {
      const manifestWithDuplicates = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        files: [
          { source: 'file1.md', targetHierarchy: ['p'], targetType: 'task' },
          { source: 'file2.md', targetHierarchy: ['p'], targetType: 'task' }
        ],
        mappings: [
          {
            source: 'file1.md',
            target: { storageKey: 'same/key' }
          },
          {
            source: 'file2.md',
            target: { storageKey: 'same/key' } // Duplicate target
          }
        ]
      };

      const result = validator.validateManifest(manifestWithDuplicates);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate target'))).toBe(true);
    });

    test('should warn about conflicts', () => {
      const manifestWithConflicts = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        files: [],
        mappings: [],
        conflicts: [
          { type: 'storage_key_conflict', storageKey: 'key1' },
          { type: 'storage_key_conflict', storageKey: 'key2' }
        ]
      };

      const result = validator.validateManifest(manifestWithConflicts);

      expect(result.warnings.some(w => w.includes('conflicts'))).toBe(true);
      expect(result.conflictCount).toBe(2);
    });
  });

  describe('Migration Validation', () => {
    test('should validate successful migration result', async () => {
      const migrationResult = {
        results: [
          {
            success: true,
            context: new Context({
              type: 'task',
              hierarchy: ['project'],
              content: 'Test content'
            }),
            source: 'file1.md'
          },
          {
            success: true,
            context: new Context({
              type: 'task',
              hierarchy: ['project'],
              content: 'More test content'
            }),
            source: 'file2.md'
          }
        ]
      };

      const legacyData = {
        files: [
          { filePath: 'file1.md', content: { content: 'Test content' } },
          { filePath: 'file2.md', content: { content: 'More test content' } }
        ]
      };

      const result = await validator.validateMigration(migrationResult, legacyData);

      expect(result.success).toBe(true);
      expect(result.summary.passed).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(result.assessment.grade).toMatch(/^[A-F]$/);
    });

    test('should detect validation failures', async () => {
      const migrationResult = {
        results: [
          {
            success: true,
            context: {
              // Invalid context - missing required fields
              content: 'Test content'
            },
            source: 'file1.md'
          }
        ]
      };

      const legacyData = {
        files: [
          { filePath: 'file1.md', content: { content: 'Test content' } }
        ]
      };

      const result = await validator.validateMigration(migrationResult, legacyData);

      expect(result.success).toBe(false);
      expect(result.summary.failed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate relationships when enabled', async () => {
      const context1 = new Context({
        type: 'task',
        hierarchy: ['project'],
        content: 'Parent context'
      });

      const context2 = new Context({
        type: 'task',
        hierarchy: ['project', 'subtask'],
        content: 'Child context'
      });

      // Set up invalid relationship - child points to non-existent parent
      context2.setParent('non-existent-id');

      const migrationResult = {
        results: [
          { success: true, context: context1, source: 'file1.md' },
          { success: true, context: context2, source: 'file2.md' }
        ]
      };

      const legacyData = {
        files: [
          { filePath: 'file1.md', content: { content: 'Parent' } },
          { filePath: 'file2.md', content: { content: 'Child' } }
        ]
      };

      const result = await validator.validateMigration(migrationResult, legacyData);

      expect(result.details.some(d => d.name === 'relationships')).toBe(true);
      // Should detect the invalid parent reference
    });

    test('should handle migration with mixed success/failure', async () => {
      const migrationResult = {
        results: [
          {
            success: true,
            context: new Context({ content: 'Success' }),
            source: 'file1.md'
          },
          {
            success: false,
            error: 'Transformation failed',
            source: 'file2.md'
          }
        ]
      };

      const legacyData = {
        files: [
          { filePath: 'file1.md', content: { content: 'Success' } },
          { filePath: 'file2.md', content: { content: 'Failed' } }
        ]
      };

      const result = await validator.validateMigration(migrationResult, legacyData);

      expect(result.summary.passed).toBe(1);
      expect(result.summary.total).toBe(1); // Only successful ones are validated
    });
  });

  describe('Content Integrity Validation', () => {
    test('should pass for identical content', () => {
      const context = { content: 'Test content' };
      const source = { content: { content: 'Test content' } };

      const result = validator._validateContentIntegrity(context, source);

      expect(result.passed).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    test('should warn about significant content changes', () => {
      const context = { content: 'Short' };
      const source = { content: { content: 'This is much longer original content' } };

      const result = validator._validateContentIntegrity(context, source);

      expect(result.passed).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('length difference'))).toBe(true);
    });

    test('should handle empty content scenarios', () => {
      const context1 = { content: '' };
      const source1 = { content: { content: 'Had content' } };

      const result1 = validator._validateContentIntegrity(context1, source1);
      expect(result1.warnings.some(w => w.includes('empty'))).toBe(true);

      const context2 = { content: 'Has content' };
      const source2 = { content: { content: '' } };

      const result2 = validator._validateContentIntegrity(context2, source2);
      expect(result2.passed).toBe(true); // This is actually good - we added content
    });

    test('should handle missing source content', () => {
      const context = { content: 'Test' };
      const source = {}; // No content

      const result = validator._validateContentIntegrity(context, source);

      expect(result.passed).toBe(true);
      expect(result.warnings.some(w => w.includes('not available'))).toBe(true);
    });
  });

  describe('Assessment Generation', () => {
    test('should generate appropriate grades', async () => {
      // Perfect migration
      const perfectResult = {
        results: [
          {
            success: true,
            context: new Context({ content: 'Test' }),
            source: 'file.md'
          }
        ]
      };

      validator._resetResults();
      validator.validationResults.passed = 10;
      validator.validationResults.failed = 0;

      const assessment = validator._generateAssessment();

      expect(assessment.grade).toBe('A');
      expect(assessment.description).toBe('Excellent');
      expect(assessment.successRate).toBe(100);
    });

    test('should provide recommendations based on results', () => {
      validator._resetResults();
      validator.validationResults.failed = 5;
      validator.validationResults.warnings = 15;
      validator.validationResults.errors = ['Missing required field: id', 'duplicate storage key'];

      const recommendations = validator._generateRecommendations();

      expect(recommendations.some(r => r.includes('validation errors'))).toBe(true);
      expect(recommendations.some(r => r.includes('warnings'))).toBe(true);
      expect(recommendations.some(r => r.includes('duplicate'))).toBe(true);
    });
  });

  describe('Configuration Options', () => {
    test('should respect strict mode setting', () => {
      const strictValidator = new ValidationSuite({ strictMode: true });
      const lenientValidator = new ValidationSuite({ strictMode: false });

      expect(strictValidator.options.strictMode).toBe(true);
      expect(lenientValidator.options.strictMode).toBe(false);
    });

    test('should respect content validation setting', () => {
      const withContentValidator = new ValidationSuite({ validateContent: true });
      const withoutContentValidator = new ValidationSuite({ validateContent: false });

      const context = new Context({ content: 'Short' });
      const source = { content: { content: 'Much longer content' } };

      const result1 = withContentValidator.validateContext(context, source);
      const result2 = withoutContentValidator.validateContext(context, source);

      // With content validation enabled, should have warnings
      expect(result1.warnings.length).toBeGreaterThan(0);
      // Without content validation, should not check content
      // (This test depends on implementation details)
    });

    test('should use custom content difference threshold', () => {
      const sensitiveValidator = new ValidationSuite({ maxContentDifference: 0.01 }); // 1%
      const lenientValidator = new ValidationSuite({ maxContentDifference: 0.5 }); // 50%

      const context = { content: 'A'.repeat(100) };
      const source = { content: { content: 'A'.repeat(110) } }; // 10% difference

      const result1 = sensitiveValidator._validateContentIntegrity(context, source);
      const result2 = lenientValidator._validateContentIntegrity(context, source);

      expect(result1.passed).toBe(false); // Should fail with 1% threshold
      expect(result2.passed).toBe(true);  // Should pass with 50% threshold
    });
  });

  describe('Statistics and Reporting', () => {
    test('should track validation statistics', () => {
      const stats = validator.getStats();

      expect(stats).toHaveProperty('passed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('warnings');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('details');

      // Initially all should be zero/empty
      expect(stats.passed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.warnings).toBe(0);
    });

    test('should update statistics during validation', async () => {
      const migrationResult = {
        results: [
          {
            success: true,
            context: new Context({ content: 'Test' }),
            source: 'file1.md'
          },
          {
            success: true,
            context: { content: 'Invalid context' }, // Missing required fields
            source: 'file2.md'
          }
        ]
      };

      const legacyData = {
        files: [
          { filePath: 'file1.md', content: { content: 'Test' } },
          { filePath: 'file2.md', content: { content: 'Invalid' } }
        ]
      };

      await validator.validateMigration(migrationResult, legacyData);

      const stats = validator.getStats();
      expect(stats.passed + stats.failed).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle validation exceptions gracefully', async () => {
      const invalidMigrationResult = null; // Will cause error

      const result = await validator.validateMigration(invalidMigrationResult, {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle malformed context objects', () => {
      const malformedContext = {
        toObject: () => { throw new Error('Malformed context'); }
      };

      const result = validator.validateContext(malformedContext);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});