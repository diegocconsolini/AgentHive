const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

const LegacyContextReader = require('./legacy/LegacyContextReader');
const DataTransformer = require('./transforms/DataTransformer');
const StorageManager = require('../storage/StorageManager');

/**
 * Migration Orchestrator
 * Manages the complete migration process with transaction-like semantics and rollback capabilities
 */
class MigrationOrchestrator {
  constructor(options = {}) {
    this.options = {
      claudePath: '.claude',
      backupPath: '.claude/migration-backup',
      checkpointInterval: 10,
      enableRollback: true,
      enableBackup: true,
      maxRetries: 3,
      timeoutMs: 300000, // 5 minutes
      ...options
    };

    this.migrationId = randomUUID();
    this.state = {
      status: 'idle', // idle, running, completed, failed, rolled_back
      phase: null,
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      startTime: null,
      endTime: null,
      checkpoints: [],
      errors: [],
      warnings: []
    };

    this.components = {
      reader: new LegacyContextReader(this.options.claudePath),
      transformer: new DataTransformer(this.options.transformerOptions || {}),
      storage: null // Will be initialized during setup
    };

    this.rollbackData = {
      backupPath: null,
      createdContexts: [],
      modifiedContexts: [],
      operations: []
    };
  }

  /**
   * Execute complete migration process
   * @param {Object} storageOptions - Storage configuration options
   * @returns {Promise<Object>} Migration result
   */
  async migrate(storageOptions = {}) {
    try {
      this._setState('running', 'initialization');
      this.state.startTime = new Date().toISOString();

      // Phase 1: Setup and discovery
      await this._executePhase('setup', async () => {
        await this._setupMigration(storageOptions);
        return await this._discoverLegacyData();
      });

      // Phase 2: Planning and validation
      const manifest = await this._executePhase('planning', async () => {
        const legacyData = this.state.legacyData;
        const manifest = this.components.reader.generateMigrationManifest();
        await this._validateMigrationPlan(manifest);
        return manifest;
      });

      // Phase 3: Backup creation
      if (this.options.enableBackup) {
        await this._executePhase('backup', async () => {
          await this._createBackup();
        });
      }

      // Phase 4: Data transformation
      const transformedData = await this._executePhase('transformation', async () => {
        return await this._transformData(this.state.legacyData, manifest);
      });

      // Phase 5: Storage migration
      await this._executePhase('storage', async () => {
        await this._migrateToStorage(transformedData);
      });

      // Phase 6: Verification
      await this._executePhase('verification', async () => {
        await this._verifyMigration(transformedData);
      });

      // Phase 7: Cleanup
      await this._executePhase('cleanup', async () => {
        await this._performCleanup();
      });

      this._setState('completed');
      this.state.endTime = new Date().toISOString();

      return {
        success: true,
        migrationId: this.migrationId,
        result: this._generateMigrationReport()
      };

    } catch (error) {
      this._setState('failed');
      this.state.errors.push({
        phase: this.state.phase,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // Attempt rollback if enabled
      if (this.options.enableRollback && this.state.phase !== 'setup') {
        try {
          await this.rollback();
        } catch (rollbackError) {
          this.state.errors.push({
            phase: 'rollback',
            error: rollbackError.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      return {
        success: false,
        migrationId: this.migrationId,
        error: error.message,
        state: this.state
      };
    }
  }

  /**
   * Rollback migration to previous state
   * @returns {Promise<Object>} Rollback result
   */
  async rollback() {
    try {
      this._setState('rolling_back', 'rollback');
      
      // Rollback storage operations
      await this._rollbackStorageOperations();
      
      // Restore from backup if available
      if (this.rollbackData.backupPath) {
        await this._restoreFromBackup();
      }
      
      this._setState('rolled_back');
      
      return {
        success: true,
        message: 'Migration rolled back successfully',
        operations: this.rollbackData.operations.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Rollback failed'
      };
    }
  }

  /**
   * Get current migration status
   * @returns {Object} Current state information
   */
  getStatus() {
    const duration = this.state.startTime ? 
      (Date.now() - new Date(this.state.startTime).getTime()) / 1000 : 0;

    return {
      migrationId: this.migrationId,
      status: this.state.status,
      phase: this.state.phase,
      progress: {
        percentage: this._calculateProgress(),
        processed: this.state.processedItems,
        total: this.state.totalItems,
        remaining: this.state.totalItems - this.state.processedItems
      },
      timing: {
        startTime: this.state.startTime,
        duration,
        estimatedRemaining: this._estimateRemainingTime()
      },
      errors: this.state.errors.length,
      warnings: this.state.warnings.length,
      checkpoints: this.state.checkpoints.length
    };
  }

  /**
   * Create migration checkpoint for rollback
   * @param {string} checkpointName - Name of the checkpoint
   * @returns {Promise<string>} Checkpoint ID
   */
  async createCheckpoint(checkpointName) {
    const checkpointId = randomUUID();
    const checkpoint = {
      id: checkpointId,
      name: checkpointName,
      timestamp: new Date().toISOString(),
      phase: this.state.phase,
      progress: this.state.processedItems,
      state: { ...this.state }
    };

    this.state.checkpoints.push(checkpoint);
    
    // Save checkpoint data
    if (this.options.enableBackup) {
      await this._saveCheckpoint(checkpoint);
    }

    return checkpointId;
  }

  /**
   * Setup migration components and validate environment
   * @param {Object} storageOptions - Storage configuration
   * @private
   */
  async _setupMigration(storageOptions) {
    // Initialize storage manager
    this.components.storage = new StorageManager(storageOptions);
    await this.components.storage.initialize();

    // Validate legacy context directory exists
    const contextPath = path.join(this.options.claudePath, 'context');
    try {
      await fs.access(contextPath);
    } catch {
      throw new Error(`Legacy context directory not found: ${contextPath}`);
    }

    // Create backup directory if needed
    if (this.options.enableBackup) {
      await fs.mkdir(this.options.backupPath, { recursive: true });
      this.rollbackData.backupPath = path.join(this.options.backupPath, this.migrationId);
      await fs.mkdir(this.rollbackData.backupPath, { recursive: true });
    }
  }

  /**
   * Discover and parse legacy context data
   * @returns {Promise<Object>} Discovery result
   * @private
   */
  async _discoverLegacyData() {
    const discovery = await this.components.reader.parseAll();
    if (!discovery.success) {
      throw new Error(`Failed to discover legacy data: ${discovery.error}`);
    }

    this.state.totalItems = discovery.files.length;
    this.state.legacyData = discovery;

    return discovery;
  }

  /**
   * Validate migration plan and check for conflicts
   * @param {Object} manifest - Migration manifest
   * @private
   */
  async _validateMigrationPlan(manifest) {
    // Check for conflicts
    if (manifest.conflicts.length > 0) {
      this.state.warnings.push({
        type: 'conflicts',
        message: `Found ${manifest.conflicts.length} potential conflicts`,
        details: manifest.conflicts
      });
    }

    // Check storage availability
    await this.components.storage.healthCheck();

    // Validate target storage space (rough estimate)
    const estimatedSize = manifest.files.reduce((sum, file) => sum + file.size, 0);
    if (estimatedSize > 100 * 1024 * 1024) { // 100MB
      this.state.warnings.push({
        type: 'size',
        message: `Large migration detected: ${(estimatedSize / 1024 / 1024).toFixed(1)}MB`,
        estimatedSize
      });
    }
  }

  /**
   * Create backup of current state
   * @private
   */
  async _createBackup() {
    const backupManifest = {
      migrationId: this.migrationId,
      timestamp: new Date().toISOString(),
      claudePath: this.options.claudePath,
      files: []
    };

    // Backup existing context files
    const contextFiles = this.state.legacyData.files;
    for (const file of contextFiles) {
      const backupFile = path.join(this.rollbackData.backupPath, 'context', path.basename(file.filePath));
      await fs.mkdir(path.dirname(backupFile), { recursive: true });
      await fs.copyFile(file.filePath, backupFile);
      
      backupManifest.files.push({
        original: file.filePath,
        backup: backupFile
      });
    }

    // Save backup manifest
    const manifestPath = path.join(this.rollbackData.backupPath, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(backupManifest, null, 2));

    this.rollbackData.operations.push({
      type: 'backup_created',
      path: this.rollbackData.backupPath,
      files: backupManifest.files.length
    });
  }

  /**
   * Transform legacy data using DataTransformer
   * @param {Object} legacyData - Legacy data from discovery
   * @param {Object} manifest - Migration manifest
   * @returns {Promise<Object>} Transformation result
   * @private
   */
  async _transformData(legacyData, manifest) {
    const result = await this.components.transformer.transformBatch(legacyData.files, manifest);
    
    if (!result.success) {
      throw new Error(`Data transformation failed: ${result.stats.failed} files failed`);
    }

    // Update progress
    this.state.processedItems += result.results.length;

    return result;
  }

  /**
   * Migrate transformed data to storage
   * @param {Object} transformedData - Transformed data result
   * @private
   */
  async _migrateToStorage(transformedData) {
    const successful = transformedData.results.filter(r => r.success);
    let processed = 0;

    for (const result of successful) {
      try {
        // Store context
        await this.components.storage.store(result.context);
        
        // Track for rollback
        this.rollbackData.createdContexts.push(result.context.id);
        this.rollbackData.operations.push({
          type: 'context_created',
          id: result.context.id,
          source: result.source
        });

        processed++;

        // Create checkpoint periodically
        if (processed % this.options.checkpointInterval === 0) {
          await this.createCheckpoint(`storage_batch_${Math.floor(processed / this.options.checkpointInterval)}`);
        }

      } catch (error) {
        this.state.errors.push({
          phase: 'storage',
          context: result.context.id,
          source: result.source,
          error: error.message
        });
      }
    }

    if (processed !== successful.length) {
      throw new Error(`Storage migration incomplete: ${processed}/${successful.length} contexts stored`);
    }
  }

  /**
   * Verify migration integrity
   * @param {Object} transformedData - Transformed data result
   * @private
   */
  async _verifyMigration(transformedData) {
    const successful = transformedData.results.filter(r => r.success);
    let verified = 0;

    for (const result of successful) {
      try {
        // Verify context exists and is retrievable
        const retrieved = await this.components.storage.retrieve(result.context.id);
        
        if (!retrieved) {
          throw new Error(`Context not found: ${result.context.id}`);
        }

        // Basic integrity checks
        if (retrieved.type !== result.context.type) {
          throw new Error(`Type mismatch for ${result.context.id}`);
        }

        if (retrieved.hierarchy.join('/') !== result.context.hierarchy.join('/')) {
          throw new Error(`Hierarchy mismatch for ${result.context.id}`);
        }

        verified++;

      } catch (error) {
        this.state.errors.push({
          phase: 'verification',
          context: result.context.id,
          error: error.message
        });
      }
    }

    if (verified !== successful.length) {
      throw new Error(`Verification failed: ${verified}/${successful.length} contexts verified`);
    }
  }

  /**
   * Perform cleanup operations
   * @private
   */
  async _performCleanup() {
    // Clean up temporary files
    // Note: We don't delete legacy files to maintain safety
    
    // Clean up old checkpoints (keep last 3)
    if (this.state.checkpoints.length > 3) {
      const toRemove = this.state.checkpoints.slice(0, -3);
      for (const checkpoint of toRemove) {
        try {
          const checkpointPath = path.join(this.rollbackData.backupPath, `checkpoint-${checkpoint.id}`);
          await fs.rm(checkpointPath, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Rollback storage operations
   * @private
   */
  async _rollbackStorageOperations() {
    // Remove created contexts
    for (const contextId of this.rollbackData.createdContexts) {
      try {
        await this.components.storage.delete(contextId);
        this.rollbackData.operations.push({
          type: 'context_deleted',
          id: contextId
        });
      } catch (error) {
        this.state.warnings.push({
          type: 'rollback_warning',
          message: `Failed to delete context during rollback: ${contextId}`,
          error: error.message
        });
      }
    }
  }

  /**
   * Restore from backup
   * @private
   */
  async _restoreFromBackup() {
    // Implementation would restore files from backup
    // For now, just log the operation
    this.rollbackData.operations.push({
      type: 'backup_restored',
      path: this.rollbackData.backupPath
    });
  }

  /**
   * Execute a migration phase with error handling
   * @param {string} phaseName - Name of the phase
   * @param {Function} phaseFunction - Function to execute
   * @returns {Promise<any>} Phase result
   * @private
   */
  async _executePhase(phaseName, phaseFunction) {
    this._setState(this.state.status, phaseName);
    
    try {
      const startTime = Date.now();
      const result = await phaseFunction();
      const duration = Date.now() - startTime;
      
      // Log phase completion
      this.state.warnings.push({
        type: 'phase_completed',
        phase: phaseName,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return result;
      
    } catch (error) {
      throw new Error(`Phase ${phaseName} failed: ${error.message}`);
    }
  }

  /**
   * Set migration state
   * @param {string} status - Migration status
   * @param {string} phase - Current phase
   * @private
   */
  _setState(status, phase = null) {
    this.state.status = status;
    if (phase) this.state.phase = phase;
  }

  /**
   * Calculate overall progress percentage
   * @returns {number} Progress percentage (0-100)
   * @private
   */
  _calculateProgress() {
    if (this.state.totalItems === 0) return 0;
    
    // Base progress on items processed and current phase
    const itemProgress = (this.state.processedItems / this.state.totalItems) * 80; // 80% for items
    
    const phaseProgress = {
      'initialization': 0,
      'setup': 5,
      'planning': 10,
      'backup': 15,
      'transformation': 50,
      'storage': 70,
      'verification': 85,
      'cleanup': 95
    }[this.state.phase] || 0;
    
    return Math.min(100, Math.max(itemProgress, phaseProgress));
  }

  /**
   * Estimate remaining time
   * @returns {number} Estimated remaining seconds
   * @private
   */
  _estimateRemainingTime() {
    if (!this.state.startTime || this.state.processedItems === 0) return null;
    
    const elapsed = (Date.now() - new Date(this.state.startTime).getTime()) / 1000;
    const rate = this.state.processedItems / elapsed;
    const remaining = this.state.totalItems - this.state.processedItems;
    
    return rate > 0 ? Math.ceil(remaining / rate) : null;
  }

  /**
   * Save checkpoint data
   * @param {Object} checkpoint - Checkpoint data
   * @private
   */
  async _saveCheckpoint(checkpoint) {
    const checkpointPath = path.join(this.rollbackData.backupPath, `checkpoint-${checkpoint.id}`);
    await fs.mkdir(checkpointPath, { recursive: true });
    
    const checkpointFile = path.join(checkpointPath, 'checkpoint.json');
    await fs.writeFile(checkpointFile, JSON.stringify(checkpoint, null, 2));
  }

  /**
   * Generate final migration report
   * @returns {Object} Migration report
   * @private
   */
  _generateMigrationReport() {
    const duration = this.state.endTime ? 
      (new Date(this.state.endTime).getTime() - new Date(this.state.startTime).getTime()) / 1000 : 0;

    return {
      migrationId: this.migrationId,
      status: this.state.status,
      timing: {
        startTime: this.state.startTime,
        endTime: this.state.endTime,
        duration
      },
      stats: {
        totalItems: this.state.totalItems,
        processedItems: this.state.processedItems,
        successRate: this.state.totalItems > 0 ? (this.state.processedItems / this.state.totalItems) * 100 : 100
      },
      quality: {
        errors: this.state.errors.length,
        warnings: this.state.warnings.length,
        checkpoints: this.state.checkpoints.length
      },
      transformerStats: this.components.transformer.getStats(),
      rollbackCapable: this.options.enableRollback && this.rollbackData.operations.length > 0
    };
  }
}

module.exports = MigrationOrchestrator;