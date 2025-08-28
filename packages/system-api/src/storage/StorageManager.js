const FileSystemStorage = require('./filesystem/FileSystemStorage');
const SQLiteStorage = require('./database/SQLiteStorage');
const IContextStorage = require('./interfaces/IContextStorage');

/**
 * Hybrid storage manager that combines filesystem and database storage
 * - Filesystem: Full context content storage with hierarchical organization
 * - Database: Fast queries, analytics, and metadata indexing
 */
class StorageManager extends IContextStorage {
  constructor(options = {}) {
    super();
    
    this.baseDir = options.baseDir || '.memory-manager';
    this.primaryStorage = new FileSystemStorage({ baseDir: this.baseDir });
    this.indexStorage = new SQLiteStorage({ 
      dbPath: options.dbPath || `${this.baseDir}/contexts.db`
    });
    
    this.syncEnabled = options.syncEnabled !== false;
    this.initialized = false;
  }

  /**
   * Initialize both storage systems
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize both storage systems
      await Promise.all([
        this.primaryStorage.initialize(),
        this.indexStorage.initialize()
      ]);

      // If sync is enabled, sync any missing data
      if (this.syncEnabled) {
        await this.syncStorages();
      }

      this.initialized = true;
      
    } catch (error) {
      throw new Error(`Failed to initialize StorageManager: ${error.message}`);
    }
  }

  /**
   * Create a new context in both storage systems
   */
  async create(context) {
    await this.ensureInitialized();

    try {
      // Create in primary storage first (filesystem)
      const createdContext = await this.primaryStorage.create(context);
      
      // Then create in index storage (database)
      if (this.syncEnabled) {
        try {
          await this.indexStorage.create(createdContext);
        } catch (error) {
          // Log warning but don't fail - filesystem is primary
          console.warn(`Failed to create context in database index: ${error.message}`);
        }
      }

      return createdContext;
      
    } catch (error) {
      throw error; // Re-throw filesystem errors as they are critical
    }
  }

  /**
   * Read a context, preferring filesystem for full content
   */
  async read(id) {
    await this.ensureInitialized();

    try {
      // Always read from filesystem for complete content
      const context = await this.primaryStorage.read(id);
      
      if (context && this.syncEnabled) {
        // Ensure database is in sync (lazy sync)
        try {
          const dbContext = await this.indexStorage.read(id);
          if (!dbContext) {
            await this.indexStorage.create(context);
          }
        } catch (error) {
          console.warn(`Database sync warning for context ${id}: ${error.message}`);
        }
      }

      return context;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a context in both storage systems
   */
  async update(id, updates) {
    await this.ensureInitialized();

    try {
      // Update in primary storage first
      const updatedContext = await this.primaryStorage.update(id, updates);
      
      // Then update in index storage
      if (this.syncEnabled) {
        try {
          await this.indexStorage.update(id, updates);
        } catch (error) {
          console.warn(`Failed to update context in database index: ${error.message}`);
        }
      }

      return updatedContext;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a context from both storage systems
   */
  async delete(id) {
    await this.ensureInitialized();

    try {
      // Delete from primary storage first
      const deleted = await this.primaryStorage.delete(id);
      
      // Then delete from index storage
      if (deleted && this.syncEnabled) {
        try {
          await this.indexStorage.delete(id);
        } catch (error) {
          console.warn(`Failed to delete context from database index: ${error.message}`);
        }
      }

      return deleted;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * List contexts using database for fast queries
   */
  async list(options = {}) {
    await this.ensureInitialized();

    try {
      if (this.syncEnabled) {
        // Use database for fast listing with metadata
        const results = await this.indexStorage.list(options);
        
        // Optionally load full content for results if requested
        if (options.includeContent) {
          const fullResults = [];
          for (const context of results) {
            const fullContext = await this.primaryStorage.read(context.id);
            if (fullContext) {
              fullResults.push(fullContext);
            }
          }
          return fullResults;
        }
        
        return results;
      } else {
        // Fallback to filesystem listing
        return await this.primaryStorage.list(options);
      }
      
    } catch (error) {
      // Fallback to filesystem if database fails
      console.warn('Database list failed, falling back to filesystem:', error.message);
      return await this.primaryStorage.list(options);
    }
  }

  /**
   * Search contexts using database index
   */
  async search(query, options = {}) {
    await this.ensureInitialized();

    try {
      if (this.syncEnabled) {
        // Use database for fast metadata search
        const metadataResults = await this.indexStorage.search(query, options);
        
        // For content search, use filesystem
        const contentResults = await this.primaryStorage.search(query, options);
        
        // Merge results by ID, prioritizing content matches
        const resultsMap = new Map();
        
        contentResults.forEach(context => {
          resultsMap.set(context.id, context);
        });
        
        metadataResults.forEach(context => {
          if (!resultsMap.has(context.id)) {
            resultsMap.set(context.id, context);
          }
        });
        
        return Array.from(resultsMap.values());
      } else {
        return await this.primaryStorage.search(query, options);
      }
      
    } catch (error) {
      console.warn('Database search failed, falling back to filesystem:', error.message);
      return await this.primaryStorage.search(query, options);
    }
  }

  /**
   * Get contexts by hierarchy using database index
   */
  async getByHierarchy(hierarchy, includeChildren = false) {
    await this.ensureInitialized();

    try {
      if (this.syncEnabled) {
        const results = await this.indexStorage.getByHierarchy(hierarchy, includeChildren);
        
        // Load full content from filesystem
        const fullResults = [];
        for (const context of results) {
          const fullContext = await this.primaryStorage.read(context.id);
          if (fullContext) {
            fullResults.push(fullContext);
          }
        }
        return fullResults;
      } else {
        return await this.primaryStorage.getByHierarchy(hierarchy, includeChildren);
      }
      
    } catch (error) {
      console.warn('Database hierarchy query failed, falling back to filesystem:', error.message);
      return await this.primaryStorage.getByHierarchy(hierarchy, includeChildren);
    }
  }

  /**
   * Health check both storage systems
   */
  async healthCheck() {
    try {
      await this.ensureInitialized();
      
      const [fsHealth, dbHealth] = await Promise.all([
        this.primaryStorage.healthCheck(),
        this.syncEnabled ? this.indexStorage.healthCheck() : Promise.resolve(true)
      ]);

      return {
        overall: fsHealth && (!this.syncEnabled || dbHealth),
        filesystem: fsHealth,
        database: this.syncEnabled ? dbHealth : 'disabled'
      };
      
    } catch (error) {
      console.error('Health check failed:', error.message);
      return {
        overall: false,
        filesystem: false,
        database: false,
        error: error.message
      };
    }
  }

  /**
   * Close both storage systems
   */
  async close() {
    const closePromises = [
      this.primaryStorage.close()
    ];
    
    if (this.syncEnabled) {
      closePromises.push(this.indexStorage.close());
    }
    
    await Promise.all(closePromises);
    this.initialized = false;
  }

  /**
   * Get analytics from database storage
   */
  async getAnalytics(options = {}) {
    await this.ensureInitialized();
    
    if (!this.syncEnabled) {
      throw new Error('Analytics require database storage to be enabled');
    }

    return await this.indexStorage.getAnalytics(options);
  }

  /**
   * Sync filesystem and database storage
   */
  async syncStorages() {
    if (!this.syncEnabled) {
      return;
    }

    console.log('Syncing storage systems...');
    let syncCount = 0;
    let errorCount = 0;

    try {
      // Get all contexts from filesystem
      const fsContexts = await this.primaryStorage.list({ limit: 10000 });
      
      for (const fsContext of fsContexts) {
        try {
          // Read full context from filesystem
          const fullContext = await this.primaryStorage.read(fsContext.id);
          if (!fullContext) continue;

          // Check if exists in database
          const dbContext = await this.indexStorage.read(fsContext.id);
          
          if (!dbContext) {
            // Create in database
            await this.indexStorage.create(fullContext);
            syncCount++;
          } else if (new Date(fullContext.updated) > new Date(dbContext.updated)) {
            // Update in database if filesystem is newer
            await this.indexStorage.update(fsContext.id, fullContext);
            syncCount++;
          }
          
        } catch (error) {
          console.warn(`Sync error for context ${fsContext.id}: ${error.message}`);
          errorCount++;
        }
      }
      
      console.log(`Storage sync completed: ${syncCount} contexts synced, ${errorCount} errors`);
      
    } catch (error) {
      console.error('Storage sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Force rebuild of database indexes from filesystem
   */
  async rebuildIndex() {
    if (!this.syncEnabled) {
      throw new Error('Index rebuild requires database storage to be enabled');
    }

    console.log('Rebuilding database index from filesystem...');
    
    // Clear existing database
    await this.indexStorage.close();
    
    // Reinitialize database (this will recreate tables)
    await this.indexStorage.initialize();
    
    // Sync all data
    await this.syncStorages();
    
    console.log('Index rebuild completed');
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    await this.ensureInitialized();
    
    const stats = {
      filesystem: {},
      database: {},
      sync: {
        enabled: this.syncEnabled,
        lastSync: null // Could be tracked in the future
      }
    };

    try {
      // Get filesystem stats
      const fsContexts = await this.primaryStorage.list({ limit: 10000 });
      stats.filesystem.totalContexts = fsContexts.length;
      
      if (this.syncEnabled) {
        // Get database stats
        const dbContexts = await this.indexStorage.list({ limit: 10000 });
        stats.database.totalContexts = dbContexts.length;
        
        // Analytics
        const analytics = await this.indexStorage.getAnalytics();
        stats.database.analytics = analytics;
      }
      
    } catch (error) {
      stats.error = error.message;
    }

    return stats;
  }

  // Private helper methods

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

module.exports = StorageManager;