const MigrationOrchestrator = require('./MigrationOrchestrator');
const ValidationSuite = require('./validators/ValidationSuite');
const LegacyContextReader = require('./legacy/LegacyContextReader');
const DataTransformer = require('./transforms/DataTransformer');

/**
 * Context Migrator
 * Main entry point for the complete context migration system
 * Provides high-level API for migrating legacy .claude/context/ files to new hierarchical structure
 */
class ContextMigrator {
  constructor(options = {}) {
    this.options = {
      // Source configuration
      claudePath: '.claude',
      
      // Storage configuration
      storageType: 'filesystem', // 'filesystem' or 'sqlite'
      storageOptions: {
        basePath: './context-storage'
      },
      
      // Migration configuration
      enableBackup: true,
      enableRollback: true,
      enableValidation: true,
      strictValidation: false,
      
      // Transformation configuration
      preserveTimestamps: true,
      calculateImportance: true,
      compressContent: false,
      maxContentSize: 50000,
      
      // Progress configuration
      enableProgress: true,
      progressInterval: 1000, // ms
      
      ...options
    };

    this.orchestrator = null;
    this.validator = null;
    this.progressCallback = null;
    this.state = {
      status: 'idle',
      migrationId: null,
      result: null
    };
  }

  /**
   * Execute complete migration process
   * @param {Object} overrideOptions - Options to override defaults
   * @returns {Promise<Object>} Migration result
   */
  async migrate(overrideOptions = {}) {
    const options = { ...this.options, ...overrideOptions };
    
    try {
      this.state.status = 'running';
      
      // Initialize components
      this.orchestrator = new MigrationOrchestrator({
        claudePath: options.claudePath,
        enableBackup: options.enableBackup,
        enableRollback: options.enableRollback,
        transformerOptions: {
          preserveTimestamps: options.preserveTimestamps,
          calculateImportance: options.calculateImportance,
          compressContent: options.compressContent,
          maxContentSize: options.maxContentSize
        }
      });

      if (options.enableValidation) {
        this.validator = new ValidationSuite({
          strictMode: options.strictValidation,
          validateContent: true,
          validateRelationships: true,
          validateMetadata: true
        });
      }

      // Set up progress monitoring if enabled
      if (options.enableProgress && this.progressCallback) {
        this._setupProgressMonitoring();
      }

      // Execute migration
      const migrationResult = await this.orchestrator.migrate(options.storageOptions);
      this.state.migrationId = migrationResult.migrationId;

      // Validate migration if enabled
      let validationResult = null;
      if (options.enableValidation && migrationResult.success) {
        validationResult = await this._validateMigration(migrationResult);
      }

      // Prepare final result
      const result = this._prepareFinalResult(migrationResult, validationResult);
      this.state.result = result;
      this.state.status = result.success ? 'completed' : 'failed';

      return result;

    } catch (error) {
      this.state.status = 'error';
      
      return {
        success: false,
        error: error.message,
        migrationId: this.state.migrationId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Dry run migration (analysis only, no actual migration)
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyze(options = {}) {
    try {
      const reader = new LegacyContextReader(options.claudePath || this.options.claudePath);
      
      // Discover legacy data
      const discovery = await reader.parseAll();
      if (!discovery.success) {
        return {
          success: false,
          error: discovery.error
        };
      }

      // Generate migration manifest
      const manifest = reader.generateMigrationManifest();
      
      // Validate manifest
      const manifestValidation = this.validator ? 
        this.validator.validateManifest(manifest) : 
        { success: true, warnings: [], errors: [] };

      // Analyze complexity and provide recommendations
      const analysis = this._analyzeComplexity(discovery, manifest);

      return {
        success: true,
        analysis: {
          discovery,
          manifest,
          validation: manifestValidation,
          complexity: analysis,
          recommendations: this._generateAnalysisRecommendations(discovery, manifest, analysis)
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Rollback a previous migration
   * @param {string} migrationId - ID of migration to rollback (optional, uses current if available)
   * @returns {Promise<Object>} Rollback result
   */
  async rollback(migrationId = null) {
    try {
      if (!this.orchestrator) {
        return {
          success: false,
          error: 'No active migration to rollback'
        };
      }

      const result = await this.orchestrator.rollback();
      this.state.status = result.success ? 'rolled_back' : 'rollback_failed';

      return {
        ...result,
        migrationId: migrationId || this.state.migrationId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get current migration status
   * @returns {Object} Status information
   */
  getStatus() {
    const baseStatus = {
      status: this.state.status,
      migrationId: this.state.migrationId,
      timestamp: new Date().toISOString()
    };

    if (this.orchestrator) {
      return {
        ...baseStatus,
        orchestrator: this.orchestrator.getStatus()
      };
    }

    return baseStatus;
  }

  /**
   * Set progress callback for monitoring
   * @param {Function} callback - Progress callback function
   */
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  /**
   * Test migration system integrity
   * @returns {Promise<Object>} System test result
   */
  async testSystem() {
    try {
      const tests = [];

      // Test component initialization
      tests.push(await this._testComponentInitialization());

      // Test legacy data discovery
      tests.push(await this._testLegacyDiscovery());

      // Test validation system
      if (this.options.enableValidation) {
        tests.push(await this._testValidationSystem());
      }

      const passedTests = tests.filter(t => t.passed).length;
      const totalTests = tests.length;

      return {
        success: passedTests === totalTests,
        results: {
          passed: passedTests,
          total: totalTests,
          tests
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create migration summary report
   * @param {Object} migrationResult - Migration result to report on
   * @returns {Object} Formatted report
   */
  generateReport(migrationResult = null) {
    const result = migrationResult || this.state.result;
    
    if (!result) {
      return {
        error: 'No migration result available',
        timestamp: new Date().toISOString()
      };
    }

    return {
      executive_summary: this._generateExecutiveSummary(result),
      technical_details: this._generateTechnicalDetails(result),
      recommendations: this._generatePostMigrationRecommendations(result),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate migration result
   * @param {Object} migrationResult - Migration result to validate
   * @returns {Promise<Object>} Validation result
   * @private
   */
  async _validateMigration(migrationResult) {
    if (!this.validator) {
      return { success: true, message: 'Validation disabled' };
    }

    // We need the original legacy data for validation
    const reader = new LegacyContextReader(this.options.claudePath);
    const legacyData = await reader.parseAll();

    return await this.validator.validateMigration(migrationResult, legacyData);
  }

  /**
   * Prepare final migration result
   * @param {Object} migrationResult - Migration result from orchestrator
   * @param {Object} validationResult - Validation result
   * @returns {Object} Final result
   * @private
   */
  _prepareFinalResult(migrationResult, validationResult) {
    const result = {
      success: migrationResult.success && (!validationResult || validationResult.success),
      migrationId: migrationResult.migrationId,
      timestamp: new Date().toISOString(),
      migration: migrationResult,
      validation: validationResult,
      summary: {
        status: migrationResult.success ? (validationResult?.success !== false ? 'completed' : 'completed_with_warnings') : 'failed',
        duration: this._calculateDuration(migrationResult),
        itemsProcessed: migrationResult.result?.stats?.processedItems || 0,
        errors: this._countErrors(migrationResult, validationResult),
        warnings: this._countWarnings(migrationResult, validationResult)
      }
    };

    // Add quality metrics
    result.quality = this._calculateQualityMetrics(migrationResult, validationResult);

    return result;
  }

  /**
   * Setup progress monitoring
   * @private
   */
  _setupProgressMonitoring() {
    const interval = setInterval(() => {
      if (this.orchestrator && this.progressCallback) {
        const status = this.orchestrator.getStatus();
        this.progressCallback(status);
        
        if (['completed', 'failed', 'rolled_back'].includes(status.status)) {
          clearInterval(interval);
        }
      }
    }, this.options.progressInterval);
  }

  /**
   * Analyze migration complexity
   * @param {Object} discovery - Discovery result
   * @param {Object} manifest - Migration manifest
   * @returns {Object} Complexity analysis
   * @private
   */
  _analyzeComplexity(discovery, manifest) {
    const fileCount = discovery.files?.length || 0;
    const totalSize = discovery.files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
    const conflicts = manifest.conflicts?.length || 0;
    
    let complexity = 'low';
    let estimatedDuration = '< 1 minute';
    
    if (fileCount > 20 || totalSize > 1024 * 1024 || conflicts > 0) {
      complexity = 'medium';
      estimatedDuration = '1-5 minutes';
    }
    
    if (fileCount > 50 || totalSize > 10 * 1024 * 1024 || conflicts > 5) {
      complexity = 'high';
      estimatedDuration = '5-15 minutes';
    }

    return {
      level: complexity,
      estimatedDuration,
      factors: {
        fileCount,
        totalSize,
        conflicts,
        averageFileSize: fileCount > 0 ? Math.round(totalSize / fileCount) : 0
      }
    };
  }

  /**
   * Generate analysis recommendations
   * @param {Object} discovery - Discovery result
   * @param {Object} manifest - Migration manifest
   * @param {Object} analysis - Complexity analysis
   * @returns {Array} Recommendations
   * @private
   */
  _generateAnalysisRecommendations(discovery, manifest, analysis) {
    const recommendations = [];

    if (manifest.conflicts?.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `Resolve ${manifest.conflicts.length} conflicts before migration`,
        action: 'Review manifest conflicts and adjust target mappings'
      });
    }

    if (analysis.factors.totalSize > 5 * 1024 * 1024) {
      recommendations.push({
        type: 'info',
        message: 'Large migration detected',
        action: 'Consider enabling content compression and backup'
      });
    }

    if (analysis.level === 'high') {
      recommendations.push({
        type: 'info',
        message: 'Complex migration detected',
        action: 'Plan for longer migration time and enable progress monitoring'
      });
    }

    return recommendations;
  }

  /**
   * Test component initialization
   * @returns {Promise<Object>} Test result
   * @private
   */
  async _testComponentInitialization() {
    try {
      const testOrchestrator = new MigrationOrchestrator({ claudePath: this.options.claudePath });
      const testValidator = new ValidationSuite();
      
      return {
        name: 'component_initialization',
        passed: true,
        message: 'All components initialized successfully'
      };
    } catch (error) {
      return {
        name: 'component_initialization',
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Test legacy data discovery
   * @returns {Promise<Object>} Test result
   * @private
   */
  async _testLegacyDiscovery() {
    try {
      const reader = new LegacyContextReader(this.options.claudePath);
      const discovery = await reader.discover();
      
      return {
        name: 'legacy_discovery',
        passed: discovery.success,
        message: discovery.success ? 
          `Found ${discovery.summary.total} legacy files` : 
          discovery.error,
        details: discovery.summary
      };
    } catch (error) {
      return {
        name: 'legacy_discovery',
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Test validation system
   * @returns {Promise<Object>} Test result
   * @private
   */
  async _testValidationSystem() {
    try {
      const validator = new ValidationSuite();
      
      // Test with a mock context
      const mockContext = {
        id: 'test-id',
        type: 'task',
        hierarchy: ['test'],
        importance: 50,
        content: 'test content',
        metadata: { tags: [], dependencies: [] },
        relationships: { parent: null, children: [], references: [] }
      };
      
      const result = validator.validateContext(mockContext);
      
      return {
        name: 'validation_system',
        passed: result.success,
        message: result.success ? 'Validation system working' : 'Validation system failed',
        details: result
      };
    } catch (error) {
      return {
        name: 'validation_system',
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate migration duration
   * @param {Object} migrationResult - Migration result
   * @returns {number} Duration in seconds
   * @private
   */
  _calculateDuration(migrationResult) {
    if (migrationResult.result?.timing) {
      return migrationResult.result.timing.duration;
    }
    return 0;
  }

  /**
   * Count total errors
   * @param {Object} migrationResult - Migration result
   * @param {Object} validationResult - Validation result
   * @returns {number} Total error count
   * @private
   */
  _countErrors(migrationResult, validationResult) {
    let errors = 0;
    
    if (migrationResult.result?.quality?.errors) {
      errors += migrationResult.result.quality.errors;
    }
    
    if (validationResult?.summary?.failed) {
      errors += validationResult.summary.failed;
    }
    
    return errors;
  }

  /**
   * Count total warnings
   * @param {Object} migrationResult - Migration result
   * @param {Object} validationResult - Validation result
   * @returns {number} Total warning count
   * @private
   */
  _countWarnings(migrationResult, validationResult) {
    let warnings = 0;
    
    if (migrationResult.result?.quality?.warnings) {
      warnings += migrationResult.result.quality.warnings;
    }
    
    if (validationResult?.summary?.warnings) {
      warnings += validationResult.summary.warnings;
    }
    
    return warnings;
  }

  /**
   * Calculate quality metrics
   * @param {Object} migrationResult - Migration result
   * @param {Object} validationResult - Validation result
   * @returns {Object} Quality metrics
   * @private
   */
  _calculateQualityMetrics(migrationResult, validationResult) {
    const metrics = {
      overallScore: 0,
      dataIntegrity: 0,
      completeness: 0,
      performance: 0
    };

    // Data integrity score
    if (validationResult && validationResult.success) {
      metrics.dataIntegrity = 100;
    } else if (validationResult) {
      const successRate = validationResult.summary.passed / 
        (validationResult.summary.passed + validationResult.summary.failed) * 100;
      metrics.dataIntegrity = Math.max(0, successRate);
    } else {
      metrics.dataIntegrity = 85; // Default if validation disabled
    }

    // Completeness score
    if (migrationResult.success) {
      const stats = migrationResult.result?.stats;
      if (stats) {
        metrics.completeness = (stats.processedItems / stats.totalItems) * 100;
      } else {
        metrics.completeness = 100;
      }
    }

    // Performance score (based on duration and items)
    if (migrationResult.result?.timing) {
      const itemsPerSecond = migrationResult.result.stats.processedItems / 
        migrationResult.result.timing.duration;
      metrics.performance = Math.min(100, itemsPerSecond * 10);
    } else {
      metrics.performance = 80; // Default
    }

    // Overall score (weighted average)
    metrics.overallScore = Math.round(
      (metrics.dataIntegrity * 0.4) + 
      (metrics.completeness * 0.4) + 
      (metrics.performance * 0.2)
    );

    return metrics;
  }

  /**
   * Generate executive summary
   * @param {Object} result - Migration result
   * @returns {Object} Executive summary
   * @private
   */
  _generateExecutiveSummary(result) {
    return {
      status: result.summary.status,
      itemsProcessed: result.summary.itemsProcessed,
      duration: result.summary.duration,
      qualityScore: result.quality.overallScore,
      success: result.success
    };
  }

  /**
   * Generate technical details
   * @param {Object} result - Migration result
   * @returns {Object} Technical details
   * @private
   */
  _generateTechnicalDetails(result) {
    return {
      migration: result.migration,
      validation: result.validation,
      quality: result.quality
    };
  }

  /**
   * Generate post-migration recommendations
   * @param {Object} result - Migration result
   * @returns {Array} Recommendations
   * @private
   */
  _generatePostMigrationRecommendations(result) {
    const recommendations = [];

    if (result.quality.overallScore < 80) {
      recommendations.push('Consider reviewing migration settings for better quality');
    }

    if (result.summary.warnings > 0) {
      recommendations.push('Review migration warnings for potential issues');
    }

    if (result.success) {
      recommendations.push('Migration completed successfully - consider archiving legacy files');
    }

    return recommendations;
  }
}

module.exports = ContextMigrator;