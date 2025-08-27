const { randomUUID } = require('crypto');
const Context = require('../../models/Context');

/**
 * Data Transformer
 * Converts legacy context formats into new hierarchical Context objects
 */
class DataTransformer {
  constructor(options = {}) {
    this.options = {
      preserveTimestamps: true,
      generateIds: true,
      calculateImportance: true,
      compressContent: false,
      maxContentSize: 50000,
      ...options
    };
    
    this.transformationStats = {
      processed: 0,
      successful: 0,
      failed: 0,
      warnings: [],
      errors: []
    };
  }

  /**
   * Transform a single legacy context file into a new Context object
   * @param {Object} legacyData - Legacy context data from LegacyContextReader
   * @param {Object} manifest - Migration manifest entry for this file
   * @returns {Promise<Object>} Transformation result
   */
  async transformFile(legacyData, manifest) {
    try {
      this.transformationStats.processed++;

      // Extract content from legacy format
      const extractedContent = this._extractContent(legacyData);
      
      // Generate context data structure
      const contextData = this._buildContextData(legacyData, manifest, extractedContent);
      
      // Apply transformations
      const transformedData = await this._applyTransformations(contextData, manifest.transformations);
      
      // Create and validate Context instance
      const context = Context.fromObject(transformedData);
      
      // Calculate importance if requested
      if (this.options.calculateImportance) {
        context.updateImportance(this._getImportanceOptions(legacyData, manifest));
      }

      this.transformationStats.successful++;
      
      return {
        success: true,
        context,
        source: legacyData.filePath,
        target: manifest.target,
        metadata: {
          originalSize: legacyData.size,
          transformedSize: context.content.length,
          compressionRatio: this._calculateCompressionRatio(legacyData.size, context.content.length),
          transformations: manifest.transformations.length
        }
      };

    } catch (error) {
      this.transformationStats.failed++;
      this.transformationStats.errors.push({
        file: legacyData.filePath,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        source: legacyData.filePath,
        target: manifest?.target || null
      };
    }
  }

  /**
   * Transform multiple legacy context files in batch
   * @param {Array} legacyFiles - Array of legacy context data
   * @param {Object} migrationManifest - Complete migration manifest
   * @returns {Promise<Object>} Batch transformation result
   */
  async transformBatch(legacyFiles, migrationManifest) {
    const results = [];
    const manifestMap = new Map();
    
    // Create mapping for quick manifest lookup
    migrationManifest.files.forEach(file => {
      manifestMap.set(file.source, file);
    });

    // Transform each file
    for (const legacyFile of legacyFiles) {
      const manifest = manifestMap.get(legacyFile.filePath);
      if (!manifest) {
        this.transformationStats.warnings.push({
          file: legacyFile.filePath,
          warning: 'No migration manifest found for file'
        });
        continue;
      }

      const result = await this.transformFile(legacyFile, manifest);
      results.push(result);
      
      // Add small delay to prevent overwhelming the system
      if (results.length % 10 === 0) {
        await this._delay(100);
      }
    }

    // Post-process results to establish relationships
    const processedResults = this._establishRelationships(results, migrationManifest);

    return {
      success: this.transformationStats.failed === 0,
      results: processedResults,
      stats: { ...this.transformationStats },
      summary: {
        total: legacyFiles.length,
        successful: this.transformationStats.successful,
        failed: this.transformationStats.failed,
        warnings: this.transformationStats.warnings.length,
        relationships: this._countRelationships(processedResults)
      }
    };
  }

  /**
   * Extract content from legacy format
   * @param {Object} legacyData - Legacy context data
   * @returns {Object} Extracted content structure
   * @private
   */
  _extractContent(legacyData) {
    let content = '';
    let metadata = {};

    if (legacyData.type === 'markdown') {
      content = this._extractMarkdownContent(legacyData.content);
      metadata = this._extractMarkdownMetadata(legacyData.content);
    } else if (legacyData.type === 'json') {
      content = this._extractJsonContent(legacyData.content);
      metadata = this._extractJsonMetadata(legacyData.content);
    } else {
      content = legacyData.content?.content || legacyData.content || '';
    }

    // Apply content compression if needed
    if (this.options.compressContent && content.length > this.options.maxContentSize) {
      content = this._compressContent(content);
    }

    return {
      content,
      metadata,
      originalFormat: legacyData.type,
      size: content.length
    };
  }

  /**
   * Extract content from markdown structure
   * @param {Object} markdownData - Parsed markdown data
   * @returns {string} Extracted content
   * @private
   */
  _extractMarkdownContent(markdownData) {
    if (!markdownData.sections || markdownData.sections.length === 0) {
      return markdownData.content || '';
    }

    let content = '';
    
    // Include title if present
    if (markdownData.title) {
      content += `# ${markdownData.title}\n\n`;
    }

    // Process sections
    for (const section of markdownData.sections) {
      content += `${'#'.repeat(section.level)} ${section.title}\n\n`;
      content += section.content.join('\n') + '\n\n';
    }

    return content.trim();
  }

  /**
   * Extract metadata from markdown structure
   * @param {Object} markdownData - Parsed markdown data
   * @returns {Object} Extracted metadata
   * @private
   */
  _extractMarkdownMetadata(markdownData) {
    const metadata = {};
    
    if (markdownData.title) {
      metadata.title = markdownData.title;
    }
    
    metadata.sections = markdownData.sections?.length || 0;
    metadata.format = 'markdown';
    
    // Extract tags from content (looking for common patterns)
    const content = markdownData.content || '';
    const tagMatches = content.match(/#(\w+)/g);
    if (tagMatches) {
      metadata.discoveredTags = tagMatches.map(tag => tag.substring(1));
    }

    return metadata;
  }

  /**
   * Extract content from JSON structure
   * @param {Object} jsonData - Parsed JSON data
   * @returns {string} Extracted content
   * @private
   */
  _extractJsonContent(jsonData) {
    if (typeof jsonData === 'string') {
      return jsonData;
    }

    // Try to find content in common JSON structures
    if (jsonData.content) {
      return jsonData.content;
    }
    
    if (jsonData.description) {
      return jsonData.description;
    }
    
    if (jsonData.text) {
      return jsonData.text;
    }

    // If no obvious content field, stringify the object
    return JSON.stringify(jsonData, null, 2);
  }

  /**
   * Extract metadata from JSON structure
   * @param {Object} jsonData - Parsed JSON data
   * @returns {Object} Extracted metadata
   * @private
   */
  _extractJsonMetadata(jsonData) {
    const metadata = { format: 'json' };
    
    // Extract known metadata fields
    const metadataFields = ['title', 'tags', 'author', 'version', 'type', 'category'];
    
    for (const field of metadataFields) {
      if (jsonData[field] !== undefined) {
        metadata[field] = jsonData[field];
      }
    }

    return metadata;
  }

  /**
   * Build context data structure for new format
   * @param {Object} legacyData - Legacy context data
   * @param {Object} manifest - Migration manifest
   * @param {Object} extractedContent - Extracted content
   * @returns {Object} Context data structure
   * @private
   */
  _buildContextData(legacyData, manifest, extractedContent) {
    const now = new Date().toISOString();
    const id = this.options.generateIds ? randomUUID() : `legacy-${legacyData.basename}`;

    return {
      id,
      type: manifest.targetType,
      hierarchy: manifest.targetHierarchy,
      importance: this._calculateInitialImportance(legacyData, extractedContent),
      created: this.options.preserveTimestamps ? legacyData.modified : now,
      updated: now,
      content: extractedContent.content,
      metadata: {
        agent_id: null,
        tags: this._extractTags(legacyData, extractedContent),
        dependencies: this._extractDependencies(legacyData, extractedContent),
        retention_policy: 'default',
        legacy: {
          originalFile: legacyData.filePath,
          originalType: legacyData.type,
          originalSize: legacyData.size,
          migrationDate: now,
          ...extractedContent.metadata
        }
      },
      relationships: {
        parent: null,
        children: [],
        references: []
      }
    };
  }

  /**
   * Apply transformation pipeline
   * @param {Object} contextData - Context data structure
   * @param {Array} transformations - Array of transformations to apply
   * @returns {Promise<Object>} Transformed context data
   * @private
   */
  async _applyTransformations(contextData, transformations) {
    let data = { ...contextData };

    for (const transformation of transformations) {
      switch (transformation.type) {
        case 'content_extraction':
          // Already done in _extractContent
          break;
          
        case 'metadata_generation':
          data.metadata = this._enhanceMetadata(data.metadata, data);
          break;
          
        case 'relationship_mapping':
          data.relationships = this._enhanceRelationships(data.relationships, data);
          break;
          
        case 'importance_calculation':
          data.importance = this._calculateEnhancedImportance(data);
          break;
          
        default:
          this.transformationStats.warnings.push({
            transformation: transformation.type,
            message: `Unknown transformation type: ${transformation.type}`
          });
      }
    }

    return data;
  }

  /**
   * Calculate initial importance score
   * @param {Object} legacyData - Legacy context data
   * @param {Object} extractedContent - Extracted content
   * @returns {number} Initial importance score
   * @private
   */
  _calculateInitialImportance(legacyData, extractedContent) {
    let importance = 30; // Base importance

    // Size factor
    const sizeScore = Math.min(20, Math.floor(extractedContent.size / 1000));
    importance += sizeScore;

    // Type factor
    const typeScores = {
      project: 25,
      progress: 15,
      tech: 20,
      product: 20,
      style: 10,
      session: 5,
      agent: 15,
      generic: 5
    };
    importance += typeScores[legacyData.contextType] || 5;

    // Recent modification bonus
    const daysSinceModified = (Date.now() - new Date(legacyData.modified).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceModified < 30) {
      importance += 15;
    } else if (daysSinceModified < 90) {
      importance += 5;
    }

    return Math.min(100, Math.max(0, importance));
  }

  /**
   * Extract tags from legacy data
   * @param {Object} legacyData - Legacy context data
   * @param {Object} extractedContent - Extracted content
   * @returns {Array<string>} Array of tags
   * @private
   */
  _extractTags(legacyData, extractedContent) {
    const tags = ['legacy', 'migrated'];
    
    // Add context type as tag
    tags.push(legacyData.contextType);
    
    // Add original format as tag
    tags.push(extractedContent.originalFormat);
    
    // Add discovered tags from metadata
    if (extractedContent.metadata?.discoveredTags) {
      tags.push(...extractedContent.metadata.discoveredTags);
    }
    
    // Remove duplicates and return
    return [...new Set(tags)];
  }

  /**
   * Extract dependencies from legacy data
   * @param {Object} legacyData - Legacy context data
   * @param {Object} extractedContent - Extracted content
   * @returns {Array<string>} Array of dependencies
   * @private
   */
  _extractDependencies(legacyData, extractedContent) {
    const dependencies = [];
    
    // Look for file references in content
    const content = extractedContent.content;
    const fileReferences = content.match(/([a-zA-Z-]+)\.md/g) || [];
    
    for (const ref of fileReferences) {
      const basename = ref.replace('.md', '');
      if (basename !== legacyData.basename) {
        dependencies.push(`legacy-${basename}`);
      }
    }
    
    return [...new Set(dependencies)];
  }

  /**
   * Enhance metadata with additional information
   * @param {Object} metadata - Current metadata
   * @param {Object} contextData - Full context data
   * @returns {Object} Enhanced metadata
   * @private
   */
  _enhanceMetadata(metadata, contextData) {
    const enhanced = { ...metadata };
    
    // Add content analysis
    enhanced.analysis = {
      wordCount: this._countWords(contextData.content),
      lineCount: contextData.content.split('\n').length,
      hasCode: /```/.test(contextData.content),
      hasLinks: /\[.*\]\(.*\)/.test(contextData.content),
      hasList: /^[\s]*[-*+]/.test(contextData.content)
    };
    
    // Add hierarchy information
    enhanced.hierarchyInfo = {
      depth: contextData.hierarchy.length,
      path: contextData.hierarchy.join('/'),
      level: contextData.hierarchy[contextData.hierarchy.length - 1]
    };
    
    return enhanced;
  }

  /**
   * Enhance relationships structure
   * @param {Object} relationships - Current relationships
   * @param {Object} contextData - Full context data
   * @returns {Object} Enhanced relationships
   * @private
   */
  _enhanceRelationships(relationships, contextData) {
    const enhanced = { ...relationships };
    
    // Convert dependencies to references
    if (contextData.metadata.dependencies?.length > 0) {
      enhanced.references = [...contextData.metadata.dependencies];
    }
    
    return enhanced;
  }

  /**
   * Calculate enhanced importance score
   * @param {Object} contextData - Full context data
   * @returns {number} Enhanced importance score
   * @private
   */
  _calculateEnhancedImportance(contextData) {
    let importance = contextData.importance;
    
    // Content richness bonus
    const analysis = contextData.metadata.analysis;
    if (analysis) {
      if (analysis.hasCode) importance += 5;
      if (analysis.hasLinks) importance += 3;
      if (analysis.hasList) importance += 2;
      if (analysis.wordCount > 500) importance += 5;
    }
    
    // Dependency bonus
    if (contextData.metadata.dependencies?.length > 0) {
      importance += contextData.metadata.dependencies.length * 2;
    }
    
    return Math.min(100, Math.max(0, importance));
  }

  /**
   * Establish relationships between transformed contexts
   * @param {Array} results - Array of transformation results
   * @param {Object} migrationManifest - Migration manifest
   * @returns {Array} Results with established relationships
   * @private
   */
  _establishRelationships(results, migrationManifest) {
    const contextMap = new Map();
    const successfulResults = results.filter(r => r.success);
    
    // Build context map for quick lookup
    successfulResults.forEach(result => {
      contextMap.set(result.source, result);
    });
    
    // Establish relationships
    for (const result of successfulResults) {
      const context = result.context;
      const dependencies = context.metadata.dependencies || [];
      
      for (const dep of dependencies) {
        // Find the referenced context
        const referencedResult = Array.from(contextMap.values()).find(r => 
          r.context.metadata.legacy?.originalFile?.includes(dep.replace('legacy-', ''))
        );
        
        if (referencedResult) {
          context.addReference(referencedResult.context.id);
        }
      }
    }
    
    return results;
  }

  /**
   * Count relationships in results
   * @param {Array} results - Array of results
   * @returns {Object} Relationship counts
   * @private
   */
  _countRelationships(results) {
    let references = 0;
    let children = 0;
    let parents = 0;
    
    const successfulResults = results.filter(r => r.success);
    
    for (const result of successfulResults) {
      const context = result.context;
      references += context.relationships.references.length;
      children += context.relationships.children.length;
      if (context.relationships.parent) parents++;
    }
    
    return { references, children, parents };
  }

  /**
   * Compress content if too large
   * @param {string} content - Content to compress
   * @returns {string} Compressed content
   * @private
   */
  _compressContent(content) {
    // Simple compression: remove excessive whitespace and truncate if necessary
    let compressed = content
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple empty lines
      .replace(/[ \t]+/g, ' ') // Normalize spaces
      .trim();
    
    if (compressed.length > this.options.maxContentSize) {
      compressed = compressed.substring(0, this.options.maxContentSize - 100) + '\n\n[Content truncated during migration]';
    }
    
    return compressed;
  }

  /**
   * Calculate compression ratio
   * @param {number} original - Original size
   * @param {number} compressed - Compressed size
   * @returns {number} Compression ratio
   * @private
   */
  _calculateCompressionRatio(original, compressed) {
    if (original === 0) return 1;
    return compressed / original;
  }

  /**
   * Count words in text
   * @param {string} text - Text to count
   * @returns {number} Word count
   * @private
   */
  _countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get importance calculation options based on legacy data
   * @param {Object} legacyData - Legacy context data
   * @param {Object} manifest - Migration manifest
   * @returns {Object} Importance options
   * @private
   */
  _getImportanceOptions(legacyData, manifest) {
    return {
      hierarchyBonus: 8,
      childrenBonus: 5,
      referencesBonus: 3,
      ageDecay: 0.05, // Reduced decay for migrated content
      tagBonus: 2
    };
  }

  /**
   * Simple delay utility
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get transformation statistics
   * @returns {Object} Current transformation statistics
   */
  getStats() {
    return { ...this.transformationStats };
  }

  /**
   * Reset transformation statistics
   */
  resetStats() {
    this.transformationStats = {
      processed: 0,
      successful: 0,
      failed: 0,
      warnings: [],
      errors: []
    };
  }
}

module.exports = DataTransformer;