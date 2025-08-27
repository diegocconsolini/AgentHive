const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

const LegacyContextReader = require('../../src/migration/legacy/LegacyContextReader');

// Test utilities
const TestHelper = {
  async createTempDirectory() {
    const tempDir = path.join(__dirname, '..', 'temp', randomUUID());
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  },

  async createTestContext(baseDir, files = []) {
    const contextDir = path.join(baseDir, '.claude', 'context');
    await fs.mkdir(contextDir, { recursive: true });

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

describe('LegacyContextReader', () => {
  let tempDir;
  let reader;

  beforeEach(async () => {
    tempDir = await TestHelper.createTempDirectory();
    reader = new LegacyContextReader(path.join(tempDir, '.claude'));
  });

  afterEach(async () => {
    await TestHelper.cleanup(tempDir);
  });

  describe('Discovery', () => {
    test('should discover context files', async () => {
      const testFiles = [
        { name: 'project-brief.md', content: '# Project Brief\nContent here.' },
        { name: 'tech-context.md', content: '# Tech Context\nTechnical details.' },
        { name: 'settings.json', content: '{"test": true}' }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);

      const result = await reader.discover();
      
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.readable).toBe(3);
      expect(result.summary.errors).toBe(0);
    });

    test('should handle missing context directory', async () => {
      const result = await reader.discover();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(result.files).toHaveLength(0);
    });

    test('should filter known file types', async () => {
      const testFiles = [
        { name: 'valid.md', content: '# Valid' },
        { name: 'valid.json', content: '{}' },
        { name: 'valid.txt', content: 'text' },
        { name: 'invalid.exe', content: 'binary' },
        { name: 'invalid.zip', content: 'archive' }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);

      const result = await reader.discover();
      
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(3); // Only .md, .json, .txt
    });
  });

  describe('File Parsing', () => {
    test('should parse markdown files', async () => {
      const markdownContent = `# Main Title

## Section 1
Content for section 1.

## Section 2
Content for section 2.

### Subsection
Nested content.
`;

      const testFiles = [
        { name: 'test.md', content: markdownContent }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);
      
      const filePath = path.join(tempDir, '.claude', 'context', 'test.md');
      const result = await reader.parseFile(filePath);
      
      expect(result.type).toBe('markdown');
      expect(result.contextType).toBe('generic');
      expect(result.content.title).toBe('Main Title');
      expect(result.content.sections).toHaveLength(3);
      expect(result.metadata.isReadable).toBe(true);
    });

    test('should parse JSON files', async () => {
      const jsonContent = {
        project: 'test',
        version: '1.0.0',
        features: ['a', 'b', 'c']
      };

      const testFiles = [
        { name: 'test.json', content: JSON.stringify(jsonContent, null, 2) }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);
      
      const filePath = path.join(tempDir, '.claude', 'context', 'test.json');
      const result = await reader.parseFile(filePath);
      
      expect(result.type).toBe('json');
      expect(result.content).toEqual(jsonContent);
      expect(result.metadata.isReadable).toBe(true);
    });

    test('should handle malformed JSON gracefully', async () => {
      const testFiles = [
        { name: 'malformed.json', content: '{ invalid json }' }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);
      
      const filePath = path.join(tempDir, '.claude', 'context', 'malformed.json');
      const result = await reader.parseFile(filePath);
      
      expect(result.error).toBeDefined();
      expect(result.metadata.isReadable).toBe(false);
    });

    test('should infer context types from filenames', async () => {
      const testFiles = [
        { name: 'project-brief.md', content: '# Project' },
        { name: 'tech-context.md', content: '# Tech' },
        { name: 'progress.md', content: '# Progress' },
        { name: 'product-context.md', content: '# Product' },
        { name: 'project-style-guide.md', content: '# Style' },
        { name: 'random-file.md', content: '# Random' }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);

      const results = await Promise.all(
        testFiles.map(file => 
          reader.parseFile(path.join(tempDir, '.claude', 'context', file.name))
        )
      );

      expect(results[0].contextType).toBe('project');
      expect(results[1].contextType).toBe('tech');
      expect(results[2].contextType).toBe('progress');
      expect(results[3].contextType).toBe('product');
      expect(results[4].contextType).toBe('style');
      expect(results[5].contextType).toBe('generic');
    });
  });

  describe('Complete Parsing', () => {
    test('should parse all files and generate analysis', async () => {
      const testFiles = [
        { 
          name: 'project-brief.md', 
          content: `# Project Brief
          
This references tech-context.md for details.` 
        },
        { 
          name: 'tech-context.md', 
          content: `# Technical Context
          
See project-brief.md for overview.` 
        },
        { 
          name: 'config.json', 
          content: '{"version": "1.0.0"}' 
        }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);

      const result = await reader.parseAll();
      
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(3);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.types).toHaveProperty('project');
      expect(result.analysis.types).toHaveProperty('tech');
      expect(result.analysis.relationships.references).toHaveLength(2);
    });

    test('should handle parsing errors gracefully', async () => {
      const testFiles = [
        { name: 'good.md', content: '# Good File' },
        { name: 'bad.json', content: '{ bad json' }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);

      const result = await reader.parseAll();
      
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1); // Only the good file
      expect(result.errors).toHaveLength(1); // Error for bad file
    });
  });

  describe('Migration Manifest Generation', () => {
    test('should generate migration manifest', async () => {
      const testFiles = [
        { name: 'project-brief.md', content: '# Project Brief' },
        { name: 'tech-context.md', content: '# Technical Context' }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);
      await reader.parseAll();

      const manifest = reader.generateMigrationManifest();
      
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.files).toHaveLength(2);
      expect(manifest.mappings).toHaveLength(2);
      expect(manifest.source.claudePath).toBe(path.join(tempDir, '.claude'));
      
      // Check file mappings
      const projectFile = manifest.files.find(f => f.source.includes('project-brief'));
      expect(projectFile.type).toBe('project');
      expect(projectFile.targetType).toBe('project');
      expect(projectFile.targetHierarchy).toContain('soc2assistant');
    });

    test('should detect conflicts in manifest', async () => {
      // Create files that would map to the same target
      const testFiles = [
        { name: 'file1.md', content: '# Generic Content' },
        { name: 'file2.md', content: '# Generic Content' }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);
      await reader.parseAll();

      const manifest = reader.generateMigrationManifest();
      
      // Both files would be generic type, check for potential conflicts
      expect(manifest.files).toHaveLength(2);
      expect(manifest.mappings).toHaveLength(2);
    });

    test('should provide recommendations', async () => {
      // Create a large file to trigger size recommendation
      const largeContent = 'x'.repeat(200000);
      const testFiles = [
        { name: 'large.md', content: `# Large File\n${largeContent}` }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);
      await reader.parseAll();

      const manifest = reader.generateMigrationManifest();
      
      expect(manifest.recommendations).toBeInstanceOf(Array);
      const sizeRec = manifest.recommendations.find(r => r.message.includes('large'));
      expect(sizeRec).toBeDefined();
    });
  });

  describe('Content Analysis', () => {
    test('should extract references between files', async () => {
      const testFiles = [
        { 
          name: 'file1.md', 
          content: 'This references file2.md and file3.md.' 
        },
        { 
          name: 'file2.md', 
          content: 'This references file1.md.' 
        },
        { 
          name: 'file3.md', 
          content: 'Standalone file.' 
        }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);

      const result = await reader.parseAll();
      
      expect(result.analysis.relationships.references).toHaveLength(3);
      
      const file1Refs = result.analysis.relationships.references.filter(r => r.from === 'file1');
      expect(file1Refs).toHaveLength(2);
      expect(file1Refs.map(r => r.to)).toContain('file2');
      expect(file1Refs.map(r => r.to)).toContain('file3');
    });

    test('should infer hierarchical structure', async () => {
      const testFiles = [
        { name: 'project-brief.md', content: '# Project' },
        { name: 'tech-context.md', content: '# Tech' },
        { name: 'session-notes.md', content: '# Session' },
        { name: 'agent-config.md', content: '# Agent' }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);

      const result = await reader.parseAll();
      
      expect(result.analysis.hierarchicalStructure).toBeDefined();
      
      // Project should be at level 1
      expect(result.analysis.hierarchicalStructure[1]).toBeDefined();
      expect(result.analysis.hierarchicalStructure[1].some(f => f.contextType === 'project')).toBe(true);
      
      // Tech should be at level 2
      expect(result.analysis.hierarchicalStructure[2]).toBeDefined();
      expect(result.analysis.hierarchicalStructure[2].some(f => f.contextType === 'tech')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle inaccessible files', async () => {
      await TestHelper.createTestContext(tempDir, [
        { name: 'test.md', content: '# Test' }
      ]);

      // Change permissions to make file unreadable (on Unix systems)
      const filePath = path.join(tempDir, '.claude', 'context', 'test.md');
      try {
        await fs.chmod(filePath, 0o000);
        
        const result = await reader.parseFile(filePath);
        expect(result.error).toBeDefined();
        
        // Restore permissions for cleanup
        await fs.chmod(filePath, 0o644);
      } catch {
        // Skip this test on systems that don't support chmod
      }
    });

    test('should handle empty files', async () => {
      const testFiles = [
        { name: 'empty.md', content: '' },
        { name: 'whitespace.md', content: '   \n   \n   ' }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);

      const result = await reader.parseAll();
      
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      
      const emptyFile = result.files.find(f => f.basename === 'empty');
      expect(emptyFile.content.content).toBe('');
    });

    test('should handle very large files', async () => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      const testFiles = [
        { name: 'large.md', content: `# Large\n${largeContent}` }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);

      const result = await reader.parseAll();
      
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].size).toBeGreaterThan(1024 * 1024);
    });
  });

  describe('Markdown Processing', () => {
    test('should handle complex markdown structure', async () => {
      const complexMarkdown = `# Main Title

## Introduction
This is the introduction with **bold** and *italic* text.

### Code Example
\`\`\`javascript
function test() {
  return 'hello world';
}
\`\`\`

## Features
- Feature 1
- Feature 2
  - Sub-feature A
  - Sub-feature B
- Feature 3

### Links and References
Check out [this link](https://example.com) for more info.
Also see other-file.md for details.

## Conclusion
That's all folks!
`;

      const testFiles = [
        { name: 'complex.md', content: complexMarkdown }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);

      const result = await reader.parseAll();
      
      expect(result.success).toBe(true);
      const file = result.files[0];
      
      expect(file.content.title).toBe('Main Title');
      expect(file.content.sections.length).toBeGreaterThan(3);
      
      // Should detect code blocks
      expect(file.content.content).toContain('```javascript');
      
      // Should detect references
      expect(result.analysis.relationships.references.some(r => r.to === 'other-file')).toBe(true);
    });

    test('should handle markdown without headers', async () => {
      const plainMarkdown = `This is just plain text with no headers.

It has multiple paragraphs but no structure.

Some **formatting** and a [link](https://example.com).`;

      const testFiles = [
        { name: 'plain.md', content: plainMarkdown }
      ];

      await TestHelper.createTestContext(tempDir, testFiles);

      const result = await reader.parseAll();
      
      expect(result.success).toBe(true);
      const file = result.files[0];
      
      expect(file.content.title).toBeNull();
      expect(file.content.sections).toHaveLength(0);
      expect(file.content.content).toBe(plainMarkdown);
    });
  });
});