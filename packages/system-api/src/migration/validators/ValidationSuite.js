const fs = require('fs').promises;
const path = require('path');

/**
 * Validation Suite
 * Comprehensive validation and integrity verification for migration process
 */
class ValidationSuite {
  constructor(options = {}) {
    this.options = {
      strictMode: false,
      validateContent: true,
      validateRelationships: true,
      validateMetadata: true,
      maxContentDifference: 0.1, // 10% difference allowed
      requiredFields: ['id', 'type', 'hierarchy', 'content'],
      ...options
    };

    this.validationResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: [],
      warnings: [],
      details: []
    };
  }

  /**
   * Validate complete migration result
   * @param {Object} migrationResult - Complete migration result
   * @param {Object} legacyData - Original legacy data
   * @returns {Promise<Object>} Validation result
   */
  async validateMigration(migrationResult, legacyData) {
    this._resetResults();

    try {
      // Validate migration structure
      await this._validateMigrationStructure(migrationResult);

      // Validate individual contexts
      await this._validateContexts(migrationResult.results);

      // Validate data integrity
      await this._validateDataIntegrity(migrationResult, legacyData);

      // Validate relationships
      if (this.options.validateRelationships) {
        await this._validateRelationships(migrationResult.results);
      }

      // Validate storage consistency
      await this._validateStorageConsistency(migrationResult);

      // Generate final assessment
      const assessment = this._generateAssessment();

      return {
        success: this.validationResults.failed === 0 && (!this.options.strictMode || this.validationResults.warnings === 0),
        summary: {
          passed: this.validationResults.passed,
          failed: this.validationResults.failed,
          warnings: this.validationResults.warnings,
          total: this.validationResults.passed + this.validationResults.failed
        },
        assessment,
        errors: this.validationResults.errors,
        warnings: this.validationResults.warnings,
        details: this.validationResults.details
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        summary: this.validationResults
      };
    }
  }

  /**
   * Validate individual context object
   * @param {Object} context - Context object to validate
   * @param {Object} source - Original source data (optional)
   * @returns {Object} Validation result for single context
   */
  validateContext(context, source = null) {
    const errors = [];
    const warnings = [];
    const checks = [];

    try {
      // Schema validation
      const schemaResult = this._validateContextSchema(context);
      checks.push(schemaResult);
      if (!schemaResult.passed) {
        errors.push(...schemaResult.errors);
      }

      // Content validation
      if (this.options.validateContent && source) {
        const contentResult = this._validateContentIntegrity(context, source);
        checks.push(contentResult);
        if (!contentResult.passed) {
          warnings.push(...contentResult.warnings);
        }
      }

      // Metadata validation
      if (this.options.validateMetadata) {
        const metadataResult = this._validateMetadataStructure(context);
        checks.push(metadataResult);
        if (!metadataResult.passed) {
          warnings.push(...metadataResult.warnings);
        }
      }

      return {
        success: errors.length === 0,
        errors,
        warnings,
        checks,
        contextId: context.id
      };

    } catch (error) {
      return {
        success: false,
        errors: [error.message],
        warnings: [],
        checks: [],
        contextId: context?.id || 'unknown'
      };
    }
  }

  /**
   * Validate migration manifest
   * @param {Object} manifest - Migration manifest
   * @returns {Object} Manifest validation result
   */
  validateManifest(manifest) {
    const errors = [];
    const warnings = [];

    // Required manifest fields
    const requiredFields = ['version', 'timestamp', 'files', 'mappings'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push(`Missing required manifest field: ${field}`);
      }
    }

    // Validate files array
    if (manifest.files && Array.isArray(manifest.files)) {
      for (const file of manifest.files) {
        if (!file.source || !file.targetHierarchy || !file.targetType) {
          errors.push(`Invalid file manifest entry: ${JSON.stringify(file)}`);
        }
      }
    }

    // Validate mappings
    if (manifest.mappings && Array.isArray(manifest.mappings)) {
      const sourceSet = new Set();
      const targetSet = new Set();

      for (const mapping of manifest.mappings) {
        if (sourceSet.has(mapping.source)) {
          warnings.push(`Duplicate source in mappings: ${mapping.source}`);
        }
        sourceSet.add(mapping.source);

        if (targetSet.has(mapping.target?.storageKey)) {
          errors.push(`Duplicate target in mappings: ${mapping.target?.storageKey}`);
        }
        targetSet.add(mapping.target?.storageKey);
      }
    }

    // Check for conflicts
    if (manifest.conflicts && manifest.conflicts.length > 0) {
      warnings.push(`Manifest contains ${manifest.conflicts.length} conflicts`);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
      fileCount: manifest.files?.length || 0,
      mappingCount: manifest.mappings?.length || 0,
      conflictCount: manifest.conflicts?.length || 0
    };
  }

  /**
   * Validate migration structure
   * @param {Object} migrationResult - Migration result to validate
   * @private
   */
  async _validateMigrationStructure(migrationResult) {
    const check = {
      name: 'migration_structure',
      description: 'Validate overall migration result structure'
    };

    if (!migrationResult || typeof migrationResult !== 'object') {
      check.passed = false;
      check.errors = ['Migration result is not a valid object'];
    } else if (!migrationResult.results || !Array.isArray(migrationResult.results)) {
      check.passed = false;
      check.errors = ['Migration result missing results array'];
    } else {
      check.passed = true;
      check.errors = [];
    }

    this._recordCheck(check);
  }

  /**
   * Validate all contexts in migration result
   * @param {Array} results - Array of migration results
   * @private
   */
  async _validateContexts(results) {
    for (const result of results) {
      if (result.success && result.context) {
        const validation = this.validateContext(result.context);
        
        if (validation.success) {
          this.validationResults.passed++;
        } else {
          this.validationResults.failed++;
          this.validationResults.errors.push({
            contextId: result.context.id,
            source: result.source,
            errors: validation.errors
          });
        }

        if (validation.warnings.length > 0) {
          this.validationResults.warnings++;
          this.validationResults.warnings.push({
            contextId: result.context.id,
            source: result.source,
            warnings: validation.warnings
          });
        }

        this.validationResults.details.push({
          contextId: result.context.id,
          source: result.source,
          validation
        });
      }
    }
  }

  /**
   * Validate data integrity between source and target
   * @param {Object} migrationResult - Migration result
   * @param {Object} legacyData - Original legacy data
   * @private
   */
  async _validateDataIntegrity(migrationResult, legacyData) {
    const check = {
      name: 'data_integrity',
      description: 'Validate data integrity between source and target',
      details: []
    };

    const legacyFileMap = new Map();
    if (legacyData && legacyData.files) {
      legacyData.files.forEach(file => {
        legacyFileMap.set(file.filePath, file);
      });
    }

    let integrityIssues = 0;

    for (const result of migrationResult.results) {
      if (!result.success) continue;

      const legacyFile = legacyFileMap.get(result.source);
      if (!legacyFile) {
        check.details.push({
          contextId: result.context.id,
          issue: 'No matching legacy file found',
          source: result.source
        });
        integrityIssues++;
        continue;
      }

      // Validate content preservation
      if (this.options.validateContent) {
        const contentCheck = this._validateContentIntegrity(result.context, legacyFile);
        if (!contentCheck.passed) {
          check.details.push({
            contextId: result.context.id,
            issue: 'Content integrity check failed',
            details: contentCheck.warnings
          });
          integrityIssues++;
        }
      }
    }

    check.passed = integrityIssues === 0;
    check.errors = integrityIssues > 0 ? [`${integrityIssues} integrity issues found`] : [];

    this._recordCheck(check);
  }

  /**
   * Validate relationships between contexts
   * @param {Array} results - Array of migration results
   * @private
   */
  async _validateRelationships(results) {
    const check = {
      name: 'relationships',
      description: 'Validate context relationships',
      details: []
    };

    const contextMap = new Map();
    const successfulResults = results.filter(r => r.success);

    // Build context map
    successfulResults.forEach(result => {
      contextMap.set(result.context.id, result.context);
    });

    let relationshipIssues = 0;

    for (const result of successfulResults) {
      const context = result.context;

      // Validate parent relationship
      if (context.relationships.parent) {
        if (!contextMap.has(context.relationships.parent)) {
          check.details.push({
            contextId: context.id,
            issue: 'Parent context not found',
            parentId: context.relationships.parent
          });
          relationshipIssues++;
        }
      }

      // Validate children relationships
      for (const childId of context.relationships.children) {
        const child = contextMap.get(childId);
        if (!child) {
          check.details.push({
            contextId: context.id,
            issue: 'Child context not found',
            childId
          });
          relationshipIssues++;
        } else if (child.relationships.parent !== context.id) {
          check.details.push({
            contextId: context.id,
            issue: 'Child does not reference parent',
            childId
          });
          relationshipIssues++;
        }
      }

      // Validate references
      for (const refId of context.relationships.references) {
        if (!contextMap.has(refId)) {
          check.details.push({
            contextId: context.id,
            issue: 'Referenced context not found',
            referenceId: refId
          });
          relationshipIssues++;
        }
      }
    }

    check.passed = relationshipIssues === 0;
    check.errors = relationshipIssues > 0 ? [`${relationshipIssues} relationship issues found`] : [];

    this._recordCheck(check);
  }

  /**
   * Validate storage consistency
   * @param {Object} migrationResult - Migration result
   * @private
   */
  async _validateStorageConsistency(migrationResult) {
    const check = {
      name: 'storage_consistency',
      description: 'Validate storage consistency',
      details: []
    };

    // This would require access to the storage layer
    // For now, we'll do basic validation
    const storageKeys = new Set();
    let duplicates = 0;

    for (const result of migrationResult.results) {
      if (!result.success) continue;

      const storageKey = result.context.getStorageKey();
      if (storageKeys.has(storageKey)) {
        check.details.push({
          contextId: result.context.id,
          issue: 'Duplicate storage key',
          storageKey
        });
        duplicates++;
      }
      storageKeys.add(storageKey);
    }

    check.passed = duplicates === 0;
    check.errors = duplicates > 0 ? [`${duplicates} duplicate storage keys found`] : [];

    this._recordCheck(check);
  }

  /**
   * Validate context schema
   * @param {Object} context - Context to validate
   * @returns {Object} Schema validation result
   * @private
   */
  _validateContextSchema(context) {
    const errors = [];

    // Check required fields
    for (const field of this.options.requiredFields) {
      if (context[field] === undefined || context[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field types
    if (context.id && typeof context.id !== 'string') {
      errors.push('ID must be a string');
    }

    if (context.hierarchy && !Array.isArray(context.hierarchy)) {
      errors.push('Hierarchy must be an array');
    }

    if (context.importance && (typeof context.importance !== 'number' || context.importance < 0 || context.importance > 100)) {
      errors.push('Importance must be a number between 0 and 100');
    }

    if (context.metadata && typeof context.metadata !== 'object') {
      errors.push('Metadata must be an object');
    }

    if (context.relationships && typeof context.relationships !== 'object') {
      errors.push('Relationships must be an object');
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Validate content integrity
   * @param {Object} context - Target context
   * @param {Object} source - Source data
   * @returns {Object} Content validation result
   * @private
   */
  _validateContentIntegrity(context, source) {
    const warnings = [];

    if (!source.content) {
      warnings.push('Source content not available for comparison');
      return { passed: true, warnings };
    }

    const sourceContent = typeof source.content === 'string' ? 
      source.content : 
      (source.content.content || JSON.stringify(source.content));

    const targetContent = context.content;

    // Basic length comparison
    const lengthDifference = Math.abs(sourceContent.length - targetContent.length) / sourceContent.length;
    if (lengthDifference > this.options.maxContentDifference) {
      warnings.push(`Significant content length difference: ${(lengthDifference * 100).toFixed(1)}%`);
    }

    // Check for essential content preservation
    if (sourceContent.length > 100 && targetContent.length < 50) {
      warnings.push('Significant content reduction detected');
    }

    // Check for content presence
    if (sourceContent.trim() && !targetContent.trim()) {
      warnings.push('Target content is empty while source had content');
    }

    return {
      passed: warnings.length === 0,
      warnings
    };
  }

  /**
   * Validate metadata structure
   * @param {Object} context - Context to validate
   * @returns {Object} Metadata validation result
   * @private
   */
  _validateMetadataStructure(context) {
    const warnings = [];

    if (!context.metadata) {
      warnings.push('Context missing metadata');
      return { passed: false, warnings };
    }

    // Check for expected metadata fields
    const expectedFields = ['tags', 'dependencies', 'retention_policy'];
    for (const field of expectedFields) {
      if (context.metadata[field] === undefined) {
        warnings.push(`Missing metadata field: ${field}`);
      }
    }

    // Validate metadata field types
    if (context.metadata.tags && !Array.isArray(context.metadata.tags)) {
      warnings.push('Metadata tags must be an array');
    }

    if (context.metadata.dependencies && !Array.isArray(context.metadata.dependencies)) {
      warnings.push('Metadata dependencies must be an array');
    }

    if (context.metadata.agent_id && typeof context.metadata.agent_id !== 'string') {
      warnings.push('Metadata agent_id must be a string');
    }

    return {
      passed: warnings.length === 0,
      warnings
    };
  }

  /**
   * Record validation check result
   * @param {Object} check - Check result
   * @private
   */
  _recordCheck(check) {
    this.validationResults.details.push(check);

    if (check.passed) {
      this.validationResults.passed++;
    } else {
      this.validationResults.failed++;
      if (check.errors) {
        this.validationResults.errors.push(...check.errors);
      }
    }

    if (check.warnings) {
      this.validationResults.warnings += check.warnings.length;
      this.validationResults.warnings.push(...check.warnings);
    }
  }

  /**
   * Generate overall assessment
   * @returns {Object} Assessment result
   * @private
   */
  _generateAssessment() {
    const total = this.validationResults.passed + this.validationResults.failed;
    const successRate = total > 0 ? (this.validationResults.passed / total) * 100 : 100;

    let grade = 'F';
    let description = 'Failed';

    if (successRate >= 95) {
      grade = 'A';
      description = 'Excellent';
    } else if (successRate >= 85) {
      grade = 'B';
      description = 'Good';
    } else if (successRate >= 70) {
      grade = 'C';
      description = 'Acceptable';
    } else if (successRate >= 60) {
      grade = 'D';
      description = 'Poor';
    }

    return {
      grade,
      description,
      successRate: Math.round(successRate * 100) / 100,
      criticalIssues: this.validationResults.errors.filter(e => 
        typeof e === 'string' && (e.includes('Missing required') || e.includes('duplicate'))
      ).length,
      recommendations: this._generateRecommendations()
    };
  }

  /**
   * Generate recommendations based on validation results
   * @returns {Array} Array of recommendations
   * @private
   */
  _generateRecommendations() {
    const recommendations = [];

    if (this.validationResults.failed > 0) {
      recommendations.push('Review and fix validation errors before proceeding');
    }

    if (this.validationResults.warnings > 10) {
      recommendations.push('Consider investigating the high number of warnings');
    }

    const duplicateErrors = this.validationResults.errors.filter(e => 
      typeof e === 'string' && e.includes('duplicate')
    );
    if (duplicateErrors.length > 0) {
      recommendations.push('Resolve duplicate storage key conflicts');
    }

    const contentWarnings = this.validationResults.warnings.filter(w => 
      typeof w === 'string' && w.includes('content')
    );
    if (contentWarnings.length > 0) {
      recommendations.push('Review content transformation settings');
    }

    return recommendations;
  }

  /**
   * Reset validation results
   * @private
   */
  _resetResults() {
    this.validationResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: [],
      warnings: [],
      details: []
    };
  }

  /**
   * Get current validation statistics
   * @returns {Object} Current validation statistics
   */
  getStats() {
    return { ...this.validationResults };
  }
}

module.exports = ValidationSuite;