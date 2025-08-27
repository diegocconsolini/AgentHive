const fs = require('fs').promises;
const path = require('path');

/**
 * Legacy Context Reader
 * Reads and parses existing .claude/context/ files to understand structure and content
 */
class LegacyContextReader {
  constructor(claudePath = '.claude') {
    this.claudePath = claudePath;
    this.contextPath = path.join(claudePath, 'context');
    this.discoveredFiles = new Map();
    this.parsedData = new Map();
    this.errors = [];
  }

  /**
   * Discover all context files in the legacy directory
   * @returns {Promise<Object>} Discovery result with files, errors, and summary
   */
  async discover() {
    try {
      const contextExists = await this._checkContextDirectory();
      if (!contextExists) {
        return {
          success: false,
          error: 'Legacy context directory not found',
          files: [],
          summary: { total: 0, readable: 0, errors: 0 }
        };
      }

      const files = await this._findContextFiles();
      const fileAnalysis = await this._analyzeFiles(files);

      return {
        success: true,
        files: fileAnalysis.files,
        errors: fileAnalysis.errors,
        summary: {
          total: files.length,
          readable: fileAnalysis.files.length,
          errors: fileAnalysis.errors.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        files: [],
        summary: { total: 0, readable: 0, errors: 0 }
      };
    }
  }

  /**
   * Parse a specific legacy context file
   * @param {string} filePath - Path to the context file
   * @returns {Promise<Object>} Parsed context data
   */
  async parseFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf8');
      const extension = path.extname(filePath).toLowerCase();
      
      let parsedContent;
      let type = 'unknown';

      if (extension === '.json') {
        parsedContent = JSON.parse(content);
        type = 'json';
      } else if (extension === '.md') {
        parsedContent = this._parseMarkdown(content);
        type = 'markdown';
      } else {
        parsedContent = { content };
        type = 'text';
      }

      const basename = path.basename(filePath, extension);
      const contextType = this._inferContextType(basename, parsedContent);

      return {
        filePath,
        basename,
        extension,
        type,
        contextType,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        content: parsedContent,
        metadata: {
          encoding: 'utf8',
          isReadable: true,
          hasStructure: type !== 'text'
        }
      };
    } catch (error) {
      return {
        filePath,
        error: error.message,
        metadata: {
          isReadable: false,
          hasStructure: false
        }
      };
    }
  }

  /**
   * Parse all discovered context files
   * @returns {Promise<Object>} Complete parsing result
   */
  async parseAll() {
    const discovery = await this.discover();
    if (!discovery.success) {
      return discovery;
    }

    const parsed = [];
    const errors = [...discovery.errors];

    for (const fileInfo of discovery.files) {
      const result = await this.parseFile(fileInfo.filePath);
      if (result.error) {
        errors.push({
          file: fileInfo.filePath,
          error: result.error
        });
      } else {
        parsed.push(result);
        this.parsedData.set(result.filePath, result);
      }
    }

    // Analyze relationships and structure
    const analysis = this._analyzeStructure(parsed);

    return {
      success: true,
      files: parsed,
      errors,
      analysis,
      summary: {
        total: discovery.summary.total,
        parsed: parsed.length,
        errors: errors.length,
        types: analysis.types,
        relationships: analysis.relationships
      }
    };
  }

  /**
   * Generate migration manifest from parsed data
   * @returns {Object} Migration manifest with source mappings
   */
  generateMigrationManifest() {
    const manifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      source: {
        claudePath: this.claudePath,
        contextPath: this.contextPath
      },
      files: [],
      mappings: [],
      conflicts: [],
      recommendations: []
    };

    for (const [filePath, parsed] of this.parsedData) {
      const fileManifest = {
        source: filePath,
        type: parsed.contextType,
        size: parsed.size,
        modified: parsed.modified,
        targetHierarchy: this._generateTargetHierarchy(parsed),
        targetType: this._mapToNewType(parsed.contextType),
        transformations: this._generateTransformations(parsed)
      };

      manifest.files.push(fileManifest);
      
      // Generate target mapping
      const mapping = {
        source: filePath,
        target: {
          hierarchy: fileManifest.targetHierarchy,
          type: fileManifest.targetType,
          storageKey: this._generateStorageKey(fileManifest)
        }
      };
      manifest.mappings.push(mapping);
    }

    // Detect potential conflicts
    manifest.conflicts = this._detectConflicts(manifest.mappings);
    
    // Generate recommendations
    manifest.recommendations = this._generateRecommendations(manifest);

    return manifest;
  }

  /**
   * Check if context directory exists
   * @returns {Promise<boolean>} True if directory exists
   * @private
   */
  async _checkContextDirectory() {
    try {
      const stats = await fs.stat(this.contextPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Find all context files in the directory
   * @returns {Promise<Array>} Array of file paths
   * @private
   */
  async _findContextFiles() {
    const entries = await fs.readdir(this.contextPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = path.join(this.contextPath, entry.name);
        files.push(filePath);
      }
    }

    return files;
  }

  /**
   * Analyze discovered files for basic metadata
   * @param {Array<string>} files - Array of file paths
   * @returns {Promise<Object>} Analysis result
   * @private
   */
  async _analyzeFiles(files) {
    const analysisResults = [];
    const errors = [];

    for (const filePath of files) {
      try {
        const stats = await fs.stat(filePath);
        const extension = path.extname(filePath).toLowerCase();
        const basename = path.basename(filePath, extension);

        // Only include known context file types
        if (['.md', '.json', '.txt'].includes(extension)) {
          analysisResults.push({
            filePath,
            basename,
            extension,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            isReadable: true
          });
        }
      } catch (error) {
        errors.push({
          file: filePath,
          error: error.message
        });
      }
    }

    return {
      files: analysisResults,
      errors
    };
  }

  /**
   * Parse markdown content into structured data
   * @param {string} content - Markdown content
   * @returns {Object} Parsed markdown structure
   * @private
   */
  _parseMarkdown(content) {
    const lines = content.split('\n');
    const structure = {
      title: null,
      sections: [],
      metadata: {},
      content: content
    };

    let currentSection = null;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) continue;

      // Detect headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();

        if (level === 1 && !structure.title) {
          structure.title = title;
        } else {
          if (currentSection) {
            structure.sections.push(currentSection);
          }
          currentSection = {
            level,
            title,
            content: [],
            startLine: i
          };
        }
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    }

    if (currentSection) {
      structure.sections.push(currentSection);
    }

    return structure;
  }

  /**
   * Infer context type from filename and content
   * @param {string} basename - Base filename
   * @param {Object} content - Parsed content
   * @returns {string} Inferred context type
   * @private
   */
  _inferContextType(basename, content) {
    const lowerBasename = basename.toLowerCase();

    // Known context file patterns
    const typePatterns = {
      project: ['project-brief', 'project-overview', 'project-vision'],
      progress: ['progress', 'status'],
      tech: ['tech-context', 'system-patterns', 'project-structure'],
      style: ['project-style-guide', 'style-guide'],
      product: ['product-context'],
      session: ['session'],
      agent: ['agent']
    };

    for (const [type, patterns] of Object.entries(typePatterns)) {
      if (patterns.some(pattern => lowerBasename.includes(pattern))) {
        return type;
      }
    }

    // Try to infer from content structure
    if (content && typeof content === 'object') {
      if (content.title) {
        const title = content.title.toLowerCase();
        if (title.includes('project')) return 'project';
        if (title.includes('progress')) return 'progress';
        if (title.includes('tech')) return 'tech';
        if (title.includes('product')) return 'product';
      }
    }

    return 'generic';
  }

  /**
   * Analyze overall structure and relationships
   * @param {Array} parsedFiles - Array of parsed file data
   * @returns {Object} Structure analysis
   * @private
   */
  _analyzeStructure(parsedFiles) {
    const types = {};
    const relationships = {
      references: [],
      dependencies: []
    };

    for (const file of parsedFiles) {
      // Count types
      types[file.contextType] = (types[file.contextType] || 0) + 1;

      // Look for cross-references in content
      if (file.content && typeof file.content === 'object') {
        this._extractReferences(file, relationships);
      }
    }

    return {
      types,
      relationships,
      hierarchicalStructure: this._inferHierarchy(parsedFiles)
    };
  }

  /**
   * Extract references between context files
   * @param {Object} file - Parsed file data
   * @param {Object} relationships - Relationships structure to populate
   * @private
   */
  _extractReferences(file, relationships) {
    const content = file.content.content || '';
    
    // Look for references to other context files
    const fileRefPattern = /([a-zA-Z-]+)\.md/g;
    let match;
    
    while ((match = fileRefPattern.exec(content)) !== null) {
      const referencedFile = match[1];
      if (referencedFile !== file.basename) {
        relationships.references.push({
          from: file.basename,
          to: referencedFile,
          type: 'file_reference'
        });
      }
    }
  }

  /**
   * Infer hierarchical structure from context types
   * @param {Array} parsedFiles - Array of parsed file data
   * @returns {Object} Inferred hierarchy
   * @private
   */
  _inferHierarchy(parsedFiles) {
    // Default hierarchy based on context types
    const hierarchyLevels = {
      project: 1,
      progress: 2,
      tech: 2,
      product: 2,
      style: 3,
      session: 4,
      agent: 5,
      generic: 3
    };

    const hierarchy = {};
    
    for (const file of parsedFiles) {
      const level = hierarchyLevels[file.contextType] || 3;
      if (!hierarchy[level]) {
        hierarchy[level] = [];
      }
      hierarchy[level].push(file);
    }

    return hierarchy;
  }

  /**
   * Generate target hierarchy for new system
   * @param {Object} parsed - Parsed file data
   * @returns {Array<string>} Target hierarchy array
   * @private
   */
  _generateTargetHierarchy(parsed) {
    const hierarchyMappings = {
      project: ['soc2assistant'],
      progress: ['soc2assistant', 'project'],
      tech: ['soc2assistant', 'technical'],
      product: ['soc2assistant', 'product'],
      style: ['soc2assistant', 'development'],
      session: ['soc2assistant', 'sessions'],
      agent: ['soc2assistant', 'agents'],
      generic: ['soc2assistant', 'general']
    };

    return hierarchyMappings[parsed.contextType] || ['soc2assistant', 'general'];
  }

  /**
   * Map legacy type to new context type
   * @param {string} legacyType - Legacy context type
   * @returns {string} New context type
   * @private
   */
  _mapToNewType(legacyType) {
    const typeMappings = {
      project: 'project',
      progress: 'task',
      tech: 'task',
      product: 'task',
      style: 'task',
      session: 'session',
      agent: 'agent',
      generic: 'task'
    };

    return typeMappings[legacyType] || 'task';
  }

  /**
   * Generate transformations needed for a file
   * @param {Object} parsed - Parsed file data
   * @returns {Array} Array of transformation steps
   * @private
   */
  _generateTransformations(parsed) {
    const transformations = [];

    // Content transformation
    transformations.push({
      type: 'content_extraction',
      description: 'Extract and clean content from legacy format'
    });

    // Metadata generation
    transformations.push({
      type: 'metadata_generation',
      description: 'Generate metadata structure for new format'
    });

    // Relationship mapping
    transformations.push({
      type: 'relationship_mapping',
      description: 'Map legacy references to new relationship structure'
    });

    // Importance calculation
    transformations.push({
      type: 'importance_calculation',
      description: 'Calculate importance score based on content and type'
    });

    return transformations;
  }

  /**
   * Generate storage key for target context
   * @param {Object} fileManifest - File manifest data
   * @returns {string} Storage key
   * @private
   */
  _generateStorageKey(fileManifest) {
    const hierarchyPath = fileManifest.targetHierarchy.join('/');
    const id = `legacy-${fileManifest.source.replace(/[^a-zA-Z0-9]/g, '-')}`;
    return `${hierarchyPath}/${fileManifest.targetType}/${id}`;
  }

  /**
   * Detect potential conflicts in mappings
   * @param {Array} mappings - Array of mapping objects
   * @returns {Array} Array of conflicts
   * @private
   */
  _detectConflicts(mappings) {
    const conflicts = [];
    const targetKeys = new Set();

    for (const mapping of mappings) {
      const key = mapping.target.storageKey;
      if (targetKeys.has(key)) {
        conflicts.push({
          type: 'storage_key_conflict',
          storageKey: key,
          sources: mappings.filter(m => m.target.storageKey === key).map(m => m.source)
        });
      }
      targetKeys.add(key);
    }

    return conflicts;
  }

  /**
   * Generate recommendations for migration
   * @param {Object} manifest - Migration manifest
   * @returns {Array} Array of recommendations
   * @private
   */
  _generateRecommendations(manifest) {
    const recommendations = [];

    // Check for conflicts
    if (manifest.conflicts.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `Found ${manifest.conflicts.length} potential conflicts that need resolution`,
        action: 'Review conflicts and adjust target mappings'
      });
    }

    // Check for large files
    const largeFiles = manifest.files.filter(f => f.size > 100000);
    if (largeFiles.length > 0) {
      recommendations.push({
        type: 'info',
        message: `Found ${largeFiles.length} large files that may need content compression`,
        action: 'Consider enabling content compression for large files'
      });
    }

    // Check file count
    if (manifest.files.length > 20) {
      recommendations.push({
        type: 'info',
        message: 'Large number of context files detected',
        action: 'Consider batch processing for migration performance'
      });
    }

    return recommendations;
  }
}

module.exports = LegacyContextReader;