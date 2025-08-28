const fs = require('fs').promises;
const path = require('path');
const IContextStorage = require('../interfaces/IContextStorage');
const ContextSchema = require('../interfaces/ContextSchema');
const FileLock = require('../interfaces/FileLock');

/**
 * File system-based context storage implementation
 * Organizes contexts hierarchically in the filesystem
 */
class FileSystemStorage extends IContextStorage {
  constructor(options = {}) {
    super();
    
    this.baseDir = options.baseDir || path.join(process.cwd(), '.memory-manager');
    this.contextDir = path.join(this.baseDir, 'contexts');
    this.indexDir = path.join(this.baseDir, 'indexes');
    this.lockDir = path.join(this.baseDir, 'locks');
    
    this.fileLock = new FileLock(this.lockDir);
    this.initialized = false;
  }

  /**
   * Initialize the file system storage
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Create directory structure
      await fs.mkdir(this.baseDir, { recursive: true });
      await fs.mkdir(this.contextDir, { recursive: true });
      await fs.mkdir(this.indexDir, { recursive: true });
      
      // Initialize file locking
      await this.fileLock.initialize();
      
      // Create/update indexes
      await this.rebuildIndexes();
      
      this.initialized = true;
      
    } catch (error) {
      throw new Error(`Failed to initialize FileSystemStorage: ${error.message}`);
    }
  }

  /**
   * Create a new context
   */
  async create(context) {
    await this.ensureInitialized();
    
    const prepared = ContextSchema.prepare(context, false);
    if (!prepared.isValid) {
      throw new Error(`Invalid context: ${prepared.errors.join(', ')}`);
    }

    const normalizedContext = prepared.context;
    const contextPath = this.getContextPath(normalizedContext);
    
    return await this.fileLock.withLock(normalizedContext.id, async () => {
      // Check if context already exists
      try {
        await fs.access(contextPath);
        throw new Error(`Context already exists: ${normalizedContext.id}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Create directory structure if needed
      await fs.mkdir(path.dirname(contextPath), { recursive: true });
      
      // Write context file
      await fs.writeFile(contextPath, JSON.stringify(normalizedContext, null, 2));
      
      // Update indexes
      await this.updateIndexes(normalizedContext, 'create');
      
      return normalizedContext;
    });
  }

  /**
   * Read a context by ID
   */
  async read(id) {
    await this.ensureInitialized();
    
    // First try to find in index
    const contextPath = await this.findContextPath(id);
    if (!contextPath) {
      return null;
    }

    try {
      const data = await fs.readFile(contextPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Context was deleted after index lookup, clean up index
        await this.cleanupIndex(id);
        return null;
      }
      throw new Error(`Failed to read context ${id}: ${error.message}`);
    }
  }

  /**
   * Update an existing context
   */
  async update(id, updates) {
    await this.ensureInitialized();
    
    return await this.fileLock.withLock(id, async () => {
      const existing = await this.read(id);
      if (!existing) {
        throw new Error(`Context not found: ${id}`);
      }

      // Merge updates
      const updatedContext = { ...existing, ...updates, updated: new Date().toISOString() };
      
      // Validate the updated context
      const prepared = ContextSchema.prepare(updatedContext, true);
      if (!prepared.isValid) {
        throw new Error(`Invalid context update: ${prepared.errors.join(', ')}`);
      }

      const normalizedContext = prepared.context;
      const oldPath = this.getContextPath(existing);
      const newPath = this.getContextPath(normalizedContext);
      
      // If hierarchy changed, we need to move the file
      if (oldPath !== newPath) {
        await fs.mkdir(path.dirname(newPath), { recursive: true });
        await fs.writeFile(newPath, JSON.stringify(normalizedContext, null, 2));
        await fs.unlink(oldPath);
      } else {
        // Just update in place
        await fs.writeFile(oldPath, JSON.stringify(normalizedContext, null, 2));
      }
      
      // Update indexes
      await this.updateIndexes(normalizedContext, 'update');
      
      return normalizedContext;
    });
  }

  /**
   * Delete a context
   */
  async delete(id) {
    await this.ensureInitialized();
    
    return await this.fileLock.withLock(id, async () => {
      const context = await this.read(id);
      if (!context) {
        return false;
      }

      const contextPath = this.getContextPath(context);
      
      try {
        await fs.unlink(contextPath);
        await this.updateIndexes(context, 'delete');
        return true;
      } catch (error) {
        if (error.code === 'ENOENT') {
          // Already deleted, clean up index
          await this.cleanupIndex(id);
          return false;
        }
        throw error;
      }
    });
  }

  /**
   * List contexts with filtering and pagination
   */
  async list(options = {}) {
    await this.ensureInitialized();
    
    const {
      type,
      hierarchy,
      limit = 100,
      offset = 0,
      sortBy = 'updated',
      sortOrder = 'desc'
    } = options;

    try {
      const index = await this.loadIndex();
      let results = Object.values(index.contexts);

      // Apply filters
      if (type) {
        results = results.filter(ctx => ctx.type === type);
      }
      
      if (hierarchy && hierarchy.length > 0) {
        const hierarchyStr = ContextSchema.getHierarchyPath(hierarchy);
        results = results.filter(ctx => 
          ContextSchema.getHierarchyPath(ctx.hierarchy).startsWith(hierarchyStr)
        );
      }

      // Sort
      results.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (sortBy === 'created' || sortBy === 'updated') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        } else {
          return aVal > bVal ? 1 : -1;
        }
      });

      // Paginate
      return results.slice(offset, offset + limit);
      
    } catch (error) {
      // Fallback to filesystem scan if index is corrupted
      console.warn('Index unavailable, falling back to filesystem scan');
      return await this.listFromFilesystem(options);
    }
  }

  /**
   * Search contexts by content or metadata
   */
  async search(query, options = {}) {
    await this.ensureInitialized();
    
    const { limit = 50, offset = 0 } = options;
    const results = [];
    
    try {
      const index = await this.loadIndex();
      const contexts = Object.values(index.contexts);
      
      const queryLower = query.toLowerCase();
      
      for (const contextMeta of contexts) {
        // Search in metadata first (faster)
        if (this.matchesQuery(contextMeta, queryLower)) {
          // Load full context for content search
          const fullContext = await this.read(contextMeta.id);
          if (fullContext && fullContext.content.toLowerCase().includes(queryLower)) {
            results.push(fullContext);
          }
        }
      }
      
    } catch (error) {
      console.warn('Search index unavailable, performing full scan');
      return await this.searchFromFilesystem(query, options);
    }

    return results.slice(offset, offset + limit);
  }

  /**
   * Get contexts by hierarchy path
   */
  async getByHierarchy(hierarchy, includeChildren = false) {
    await this.ensureInitialized();
    
    const hierarchyPath = ContextSchema.getHierarchyPath(hierarchy);
    const results = [];
    
    try {
      const index = await this.loadIndex();
      
      for (const context of Object.values(index.contexts)) {
        const contextPath = ContextSchema.getHierarchyPath(context.hierarchy);
        
        if (includeChildren) {
          if (contextPath.startsWith(hierarchyPath)) {
            const fullContext = await this.read(context.id);
            if (fullContext) results.push(fullContext);
          }
        } else {
          if (contextPath === hierarchyPath) {
            const fullContext = await this.read(context.id);
            if (fullContext) results.push(fullContext);
          }
        }
      }
      
    } catch (error) {
      console.warn('Hierarchy index unavailable, scanning filesystem');
      return await this.getByHierarchyFromFilesystem(hierarchy, includeChildren);
    }

    return results;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.ensureInitialized();
      
      // Test read/write access
      const testPath = path.join(this.baseDir, '.health-check');
      await fs.writeFile(testPath, 'ok');
      await fs.readFile(testPath);
      await fs.unlink(testPath);
      
      return true;
    } catch (error) {
      console.error('Health check failed:', error.message);
      return false;
    }
  }

  /**
   * Close storage and cleanup
   */
  async close() {
    if (this.fileLock) {
      await this.fileLock.cleanup();
    }
    this.initialized = false;
  }

  // Private helper methods

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  getContextPath(context) {
    const hierarchyPath = ContextSchema.getHierarchyPath(context.hierarchy);
    const fileName = `${context.id}.json`;
    return path.join(this.contextDir, hierarchyPath, context.type, fileName);
  }

  async findContextPath(id) {
    try {
      const index = await this.loadIndex();
      const contextMeta = index.contexts[id];
      return contextMeta ? this.getContextPath(contextMeta) : null;
    } catch (error) {
      // Fallback to filesystem scan
      return await this.scanForContext(id);
    }
  }

  async scanForContext(id) {
    // Recursively search for context file
    const searchDir = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            const result = await searchDir(fullPath);
            if (result) return result;
          } else if (entry.name === `${id}.json`) {
            return fullPath;
          }
        }
      } catch (error) {
        // Directory not accessible, skip
      }
      return null;
    };

    return await searchDir(this.contextDir);
  }

  async loadIndex() {
    const indexPath = path.join(this.indexDir, 'contexts.json');
    try {
      const data = await fs.readFile(indexPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { contexts: {}, lastRebuild: null };
      }
      throw error;
    }
  }

  async saveIndex(index) {
    const indexPath = path.join(this.indexDir, 'contexts.json');
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  }

  async updateIndexes(context, operation) {
    try {
      const index = await this.loadIndex();
      
      switch (operation) {
        case 'create':
        case 'update':
          index.contexts[context.id] = {
            id: context.id,
            type: context.type,
            hierarchy: context.hierarchy,
            importance: context.importance,
            created: context.created,
            updated: context.updated,
            metadata: context.metadata
          };
          break;
          
        case 'delete':
          delete index.contexts[context.id];
          break;
      }
      
      await this.saveIndex(index);
    } catch (error) {
      console.warn(`Failed to update index: ${error.message}`);
      // Continue without index - functionality will work but be slower
    }
  }

  async cleanupIndex(id) {
    try {
      const index = await this.loadIndex();
      delete index.contexts[id];
      await this.saveIndex(index);
    } catch (error) {
      console.warn(`Failed to cleanup index for ${id}: ${error.message}`);
    }
  }

  async rebuildIndexes() {
    console.log('Rebuilding context indexes...');
    
    const index = { contexts: {}, lastRebuild: new Date().toISOString() };
    
    const scanDirectory = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.name.endsWith('.json')) {
            try {
              const data = await fs.readFile(fullPath, 'utf8');
              const context = JSON.parse(data);
              
              // Add to index
              index.contexts[context.id] = {
                id: context.id,
                type: context.type,
                hierarchy: context.hierarchy,
                importance: context.importance,
                created: context.created,
                updated: context.updated,
                metadata: context.metadata
              };
            } catch (error) {
              console.warn(`Skipping invalid context file: ${fullPath}`);
            }
          }
        }
      } catch (error) {
        // Directory not accessible
      }
    };

    await scanDirectory(this.contextDir);
    await this.saveIndex(index);
    
    console.log(`Index rebuilt with ${Object.keys(index.contexts).length} contexts`);
  }

  matchesQuery(contextMeta, queryLower) {
    const searchFields = [
      contextMeta.type,
      ContextSchema.getHierarchyPath(contextMeta.hierarchy),
      ...(contextMeta.metadata?.tags || []),
      contextMeta.metadata?.agent_id
    ].filter(Boolean);

    return searchFields.some(field => 
      field.toLowerCase().includes(queryLower)
    );
  }

  // Fallback methods for when indexes are unavailable
  async listFromFilesystem(options) {
    // Implementation for direct filesystem listing
    // This would be slower but more reliable fallback
    return [];
  }

  async searchFromFilesystem(query, options) {
    // Implementation for direct filesystem search
    return [];
  }

  async getByHierarchyFromFilesystem(hierarchy, includeChildren) {
    // Implementation for direct filesystem hierarchy search
    return [];
  }
}

module.exports = FileSystemStorage;