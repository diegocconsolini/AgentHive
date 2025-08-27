const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

const ContextMigrator = require('../../src/migration/ContextMigrator');
const StorageManager = require('../../src/storage/StorageManager');

// Test utilities
const TestHelper = {
  async createTempDirectory() {
    const tempDir = path.join(__dirname, '..', 'temp', randomUUID());
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  },

  async createMockLegacyContext(baseDir) {
    const contextDir = path.join(baseDir, '.claude', 'context');
    await fs.mkdir(contextDir, { recursive: true });

    // Create sample legacy files
    const files = [
      {
        name: 'project-brief.md',
        content: `# Project Brief

This is a sample project brief for testing migration.

## Objectives
- Test migration functionality
- Validate data integrity
- Ensure backward compatibility

## Requirements
- Support legacy format
- Maintain relationships
- Preserve metadata
`
      },
      {
        name: 'tech-context.md',
        content: `# Technical Context

## Dependencies
- Node.js 18+
- SQLite for storage
- Jest for testing

## Architecture
The system uses a hierarchical context model with the following components:
- Context models
- Storage interfaces
- Migration system
`
      },
      {
        name: 'progress.md',
        content: `# Progress Report

## Completed
- [x] Basic context models
- [x] Storage infrastructure
- [x] Migration framework

## In Progress
- [ ] Validation system
- [ ] Test coverage

## Next Steps
- Complete migration testing
- Deploy to production
`
      },
      {
        name: 'settings.json',
        content: JSON.stringify({
          project: 'test-migration',
          version: '1.0.0',
          author: 'test-user',
          features: ['migration', 'validation', 'rollback']
        }, null, 2)
      }
    ];

    for (const file of files) {
      await fs.writeFile(path.join(contextDir, file.name), file.content);
    }

    return contextDir;
  },

  async cleanup(directory) {
    try {
      await fs.rm(directory, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
};

describe('ContextMigrator', () => {
  let tempDir;
  let migrator;
  let storageOptions;

  beforeEach(async () => {
    tempDir = await TestHelper.createTempDirectory();
    await TestHelper.createMockLegacyContext(tempDir);
    
    storageOptions = {
      type: 'filesystem',
      basePath: path.join(tempDir, 'storage')
    };

    migrator = new ContextMigrator({
      claudePath: path.join(tempDir, '.claude'),
      storageOptions,
      enableBackup: true,
      enableValidation: true
    });
  });

  afterEach(async () => {
    await TestHelper.cleanup(tempDir);
  });

  describe('Construction', () => {
    test('should create migrator with default options', () => {
      const defaultMigrator = new ContextMigrator();
      expect(defaultMigrator.options.claudePath).toBe('.claude');
      expect(defaultMigrator.options.enableBackup).toBe(true);
      expect(defaultMigrator.options.enableValidation).toBe(true);
    });

    test('should accept custom options', () => {
      const customMigrator = new ContextMigrator({
        claudePath: '/custom/path',
        enableBackup: false,
        strictValidation: true
      });
      
      expect(customMigrator.options.claudePath).toBe('/custom/path');
      expect(customMigrator.options.enableBackup).toBe(false);
      expect(customMigrator.options.strictValidation).toBe(true);
    });
  });

  describe('Analysis', () => {
    test('should analyze legacy context structure', async () => {
      const analysis = await migrator.analyze();
      
      expect(analysis.success).toBe(true);
      expect(analysis.analysis).toHaveProperty('discovery');
      expect(analysis.analysis).toHaveProperty('manifest');
      expect(analysis.analysis).toHaveProperty('complexity');
      
      // Check discovery results
      expect(analysis.analysis.discovery.files).toHaveLength(4);
      expect(analysis.analysis.discovery.summary.total).toBe(4);
      
      // Check manifest
      expect(analysis.analysis.manifest.files).toHaveLength(4);
      expect(analysis.analysis.manifest.mappings).toHaveLength(4);
      
      // Check complexity analysis
      expect(analysis.analysis.complexity.level).toMatch(/^(low|medium|high)$/);
      expect(analysis.analysis.complexity.factors.fileCount).toBe(4);
    });

    test('should handle missing legacy context', async () => {
      const noContextMigrator = new ContextMigrator({
        claudePath: path.join(tempDir, 'nonexistent')
      });
      
      const analysis = await noContextMigrator.analyze();
      expect(analysis.success).toBe(false);
      expect(analysis.error).toContain('not found');
    });

    test('should provide migration recommendations', async () => {
      const analysis = await migrator.analyze();
      
      expect(analysis.analysis.recommendations).toBeInstanceOf(Array);
      // Should have some recommendations for a basic migration
      expect(analysis.analysis.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Migration', () => {
    test('should execute complete migration successfully', async () => {
      const result = await migrator.migrate();
      
      expect(result.success).toBe(true);
      expect(result.migrationId).toBeDefined();
      expect(result.summary.status).toBe('completed');
      expect(result.summary.itemsProcessed).toBe(4);
      expect(result.summary.errors).toBe(0);
      
      // Check migration details
      expect(result.migration.success).toBe(true);
      expect(result.validation.success).toBe(true);
      expect(result.quality.overallScore).toBeGreaterThan(0);
    }, 30000); // Longer timeout for full migration

    test('should handle migration with warnings', async () => {
      // Create a problematic legacy file
      const contextDir = path.join(tempDir, '.claude', 'context');
      await fs.writeFile(path.join(contextDir, 'malformed.md'), '# Incomplete file\n[Broken link](');
      
      const result = await migrator.migrate();
      
      expect(result.success).toBe(true); // Should still succeed
      expect(result.summary.warnings).toBeGreaterThanOrEqual(0);
    });

    test('should support progress monitoring', async () => {
      const progressUpdates = [];
      
      migrator.setProgressCallback((status) => {
        progressUpdates.push(status);
      });
      
      const result = await migrator.migrate();
      
      expect(result.success).toBe(true);
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      // Check that progress updates contain expected fields
      const lastUpdate = progressUpdates[progressUpdates.length - 1];
      expect(lastUpdate).toHaveProperty('status');
      expect(lastUpdate).toHaveProperty('progress');
    });

    test('should create backup when enabled', async () => {
      const result = await migrator.migrate();
      
      expect(result.success).toBe(true);
      
      // Check if backup was created
      const backupPath = path.join(tempDir, '.claude', 'migration-backup');
      const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);
      expect(backupExists).toBe(true);
    });

    test('should skip backup when disabled', async () => {
      migrator.options.enableBackup = false;
      
      const result = await migrator.migrate({ enableBackup: false });
      
      expect(result.success).toBe(true);
      
      // Backup should not exist
      const backupPath = path.join(tempDir, '.claude', 'migration-backup');
      const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);
      expect(backupExists).toBe(false);
    });
  });

  describe('Validation', () => {
    test('should validate migrated data', async () => {
      const result = await migrator.migrate();
      
      expect(result.success).toBe(true);
      expect(result.validation).toBeDefined();
      expect(result.validation.success).toBe(true);
      expect(result.validation.summary.passed).toBeGreaterThan(0);
      expect(result.validation.summary.failed).toBe(0);
    });

    test('should work with validation disabled', async () => {
      migrator.options.enableValidation = false;
      
      const result = await migrator.migrate({ enableValidation: false });
      
      expect(result.success).toBe(true);
      expect(result.validation).toEqual({ success: true, message: 'Validation disabled' });
    });

    test('should handle strict validation mode', async () => {
      migrator.options.strictValidation = true;
      
      const result = await migrator.migrate({ strictValidation: true });
      
      expect(result.success).toBe(true);
      // In strict mode, warnings might affect success
      if (result.summary.warnings > 0) {
        expect(result.summary.status).toContain('warning');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle storage initialization failure', async () => {
      const badStorageOptions = {
        type: 'invalid',
        basePath: '/invalid/path'
      };
      
      const result = await migrator.migrate(badStorageOptions);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle corrupted legacy files gracefully', async () => {
      // Create a corrupted JSON file
      const contextDir = path.join(tempDir, '.claude', 'context');
      await fs.writeFile(path.join(contextDir, 'corrupted.json'), '{ invalid json }');
      
      const result = await migrator.migrate();
      
      // Should still migrate other files
      expect(result.summary.itemsProcessed).toBeGreaterThan(0);
      expect(result.summary.errors).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Rollback', () => {
    test('should rollback migration', async () => {
      // First, perform a migration
      const migrationResult = await migrator.migrate();
      expect(migrationResult.success).toBe(true);
      
      // Then rollback
      const rollbackResult = await migrator.rollback();
      
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.migrationId).toBe(migrationResult.migrationId);
    });

    test('should handle rollback without active migration', async () => {
      const rollbackResult = await migrator.rollback();
      
      expect(rollbackResult.success).toBe(false);
      expect(rollbackResult.error).toContain('No active migration');
    });
  });

  describe('Status Monitoring', () => {
    test('should provide status information', () => {
      const status = migrator.getStatus();
      
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('timestamp');
      expect(status.status).toBe('idle');
    });

    test('should update status during migration', async () => {
      const migrationPromise = migrator.migrate();
      
      // Check status while running
      const runningStatus = migrator.getStatus();
      expect(['idle', 'running']).toContain(runningStatus.status);
      
      // Wait for completion
      await migrationPromise;
      
      const completedStatus = migrator.getStatus();
      expect(['completed', 'failed']).toContain(completedStatus.status);
    });
  });

  describe('System Testing', () => {
    test('should pass system integrity tests', async () => {
      const testResult = await migrator.testSystem();
      
      expect(testResult.success).toBe(true);
      expect(testResult.results.passed).toBeGreaterThan(0);
      expect(testResult.results.total).toBeGreaterThan(0);
      expect(testResult.results.tests).toBeInstanceOf(Array);
      
      // All tests should pass
      expect(testResult.results.passed).toBe(testResult.results.total);
    });

    test('should provide detailed test results', async () => {
      const testResult = await migrator.testSystem();
      
      expect(testResult.results.tests).toHaveLength(testResult.results.total);
      
      for (const test of testResult.results.tests) {
        expect(test).toHaveProperty('name');
        expect(test).toHaveProperty('passed');
        expect(typeof test.passed).toBe('boolean');
      }
    });
  });

  describe('Reporting', () => {
    test('should generate migration report', async () => {
      const migrationResult = await migrator.migrate();
      const report = migrator.generateReport();
      
      expect(report).toHaveProperty('executive_summary');
      expect(report).toHaveProperty('technical_details');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('timestamp');
      
      // Executive summary should contain key metrics
      expect(report.executive_summary).toHaveProperty('status');
      expect(report.executive_summary).toHaveProperty('itemsProcessed');
      expect(report.executive_summary).toHaveProperty('qualityScore');
    });

    test('should handle report generation without migration', () => {
      const report = migrator.generateReport();
      
      expect(report).toHaveProperty('error');
      expect(report.error).toContain('No migration result available');
    });
  });

  describe('Quality Metrics', () => {
    test('should calculate quality metrics', async () => {
      const result = await migrator.migrate();
      
      expect(result.quality).toHaveProperty('overallScore');
      expect(result.quality).toHaveProperty('dataIntegrity');
      expect(result.quality).toHaveProperty('completeness');
      expect(result.quality).toHaveProperty('performance');
      
      // Scores should be valid percentages
      expect(result.quality.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.quality.overallScore).toBeLessThanOrEqual(100);
      expect(result.quality.dataIntegrity).toBeGreaterThanOrEqual(0);
      expect(result.quality.dataIntegrity).toBeLessThanOrEqual(100);
    });

    test('should reflect migration quality accurately', async () => {
      const result = await migrator.migrate();
      
      // For a successful migration with no errors, quality should be high
      if (result.success && result.summary.errors === 0) {
        expect(result.quality.overallScore).toBeGreaterThan(70);
        expect(result.quality.completeness).toBe(100);
      }
    });
  });

  describe('Integration', () => {
    test('should work with filesystem storage', async () => {
      const result = await migrator.migrate({
        storageOptions: {
          type: 'filesystem',
          basePath: path.join(tempDir, 'fs-storage')
        }
      });
      
      expect(result.success).toBe(true);
      
      // Check that storage directory was created
      const storageExists = await fs.access(path.join(tempDir, 'fs-storage'))
        .then(() => true).catch(() => false);
      expect(storageExists).toBe(true);
    });

    test('should preserve content integrity across migration', async () => {
      const analysis = await migrator.analyze();
      const originalFiles = analysis.analysis.discovery.files;
      
      const result = await migrator.migrate();
      expect(result.success).toBe(true);
      
      // Validate that each original file has a corresponding migrated context
      expect(result.migration.result.results.length).toBe(originalFiles.length);
      
      const successfulMigrations = result.migration.result.results.filter(r => r.success);
      expect(successfulMigrations.length).toBe(originalFiles.length);
    });

    test('should handle large migrations efficiently', async () => {
      // Create additional test files
      const contextDir = path.join(tempDir, '.claude', 'context');
      
      for (let i = 0; i < 20; i++) {
        await fs.writeFile(
          path.join(contextDir, `test-file-${i}.md`),
          `# Test File ${i}\n\nThis is test content for file ${i}.`
        );
      }
      
      const startTime = Date.now();
      const result = await migrator.migrate();
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.summary.itemsProcessed).toBe(24); // Original 4 + 20 new files
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    }, 35000);
  });
});

describe('Migration Edge Cases', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await TestHelper.createTempDirectory();
  });

  afterEach(async () => {
    await TestHelper.cleanup(tempDir);
  });

  test('should handle empty context directory', async () => {
    const contextDir = path.join(tempDir, '.claude', 'context');
    await fs.mkdir(contextDir, { recursive: true });
    
    const migrator = new ContextMigrator({
      claudePath: path.join(tempDir, '.claude')
    });
    
    const analysis = await migrator.analyze();
    expect(analysis.success).toBe(true);
    expect(analysis.analysis.discovery.files).toHaveLength(0);
    
    const result = await migrator.migrate();
    expect(result.success).toBe(true);
    expect(result.summary.itemsProcessed).toBe(0);
  });

  test('should handle binary files gracefully', async () => {
    const contextDir = path.join(tempDir, '.claude', 'context');
    await fs.mkdir(contextDir, { recursive: true });
    
    // Create a binary file (simulate with non-UTF8 content)
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE]);
    await fs.writeFile(path.join(contextDir, 'binary.dat'), binaryContent);
    
    const migrator = new ContextMigrator({
      claudePath: path.join(tempDir, '.claude')
    });
    
    const result = await migrator.migrate();
    expect(result.success).toBe(true);
    // Binary files should be ignored or handled gracefully
  });

  test('should handle very large files', async () => {
    const contextDir = path.join(tempDir, '.claude', 'context');
    await fs.mkdir(contextDir, { recursive: true });
    
    // Create a large file (1MB of content)
    const largeContent = 'x'.repeat(1024 * 1024);
    await fs.writeFile(path.join(contextDir, 'large.md'), `# Large File\n\n${largeContent}`);
    
    const migrator = new ContextMigrator({
      claudePath: path.join(tempDir, '.claude'),
      compressContent: true,
      maxContentSize: 50000
    });
    
    const result = await migrator.migrate();
    expect(result.success).toBe(true);
    
    // Content should be compressed or truncated
    const migratedContext = result.migration.result.results.find(r => r.success);
    expect(migratedContext.context.content.length).toBeLessThanOrEqual(50000);
  });
});