const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const IContextStorage = require('../interfaces/IContextStorage');
const ContextSchema = require('../interfaces/ContextSchema');

/**
 * SQLite-based context storage for structured queries and analytics
 * Complements filesystem storage with fast querying capabilities
 */
class SQLiteStorage extends IContextStorage {
  constructor(options = {}) {
    super();
    
    this.dbPath = options.dbPath || path.join(process.cwd(), '.memory-manager', 'contexts.db');
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize the SQLite database
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    return new Promise((resolve, reject) => {
      // Create directory if it doesn't exist
      const fs = require('fs');
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to initialize SQLite database: ${err.message}`));
          return;
        }

        // Create tables
        this.createTables()
          .then(() => {
            this.initialized = true;
            resolve();
          })
          .catch(reject);
      });
    });
  }

  /**
   * Create database tables
   */
  async createTables() {
    const createContextsTable = `
      CREATE TABLE IF NOT EXISTS contexts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        hierarchy_path TEXT NOT NULL,
        importance INTEGER NOT NULL,
        created TEXT NOT NULL,
        updated TEXT NOT NULL,
        content_size INTEGER DEFAULT 0,
        agent_id TEXT,
        retention_policy TEXT DEFAULT 'default',
        parent_id TEXT,
        FOREIGN KEY (parent_id) REFERENCES contexts (id) ON DELETE SET NULL
      )
    `;

    const createHierarchyTable = `
      CREATE TABLE IF NOT EXISTS hierarchy_levels (
        context_id TEXT NOT NULL,
        level INTEGER NOT NULL,
        name TEXT NOT NULL,
        PRIMARY KEY (context_id, level),
        FOREIGN KEY (context_id) REFERENCES contexts (id) ON DELETE CASCADE
      )
    `;

    const createTagsTable = `
      CREATE TABLE IF NOT EXISTS context_tags (
        context_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (context_id, tag),
        FOREIGN KEY (context_id) REFERENCES contexts (id) ON DELETE CASCADE
      )
    `;

    const createDependenciesTable = `
      CREATE TABLE IF NOT EXISTS context_dependencies (
        context_id TEXT NOT NULL,
        dependency_id TEXT NOT NULL,
        PRIMARY KEY (context_id, dependency_id),
        FOREIGN KEY (context_id) REFERENCES contexts (id) ON DELETE CASCADE
      )
    `;

    const createReferencesTable = `
      CREATE TABLE IF NOT EXISTS context_references (
        context_id TEXT NOT NULL,
        referenced_id TEXT NOT NULL,
        PRIMARY KEY (context_id, referenced_id),
        FOREIGN KEY (context_id) REFERENCES contexts (id) ON DELETE CASCADE
      )
    `;

    // Analytics tables
    const createAccessLogTable = `
      CREATE TABLE IF NOT EXISTS access_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        context_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        agent_id TEXT,
        duration_ms INTEGER,
        FOREIGN KEY (context_id) REFERENCES contexts (id) ON DELETE CASCADE
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_contexts_type ON contexts(type);
      CREATE INDEX IF NOT EXISTS idx_contexts_hierarchy ON contexts(hierarchy_path);
      CREATE INDEX IF NOT EXISTS idx_contexts_importance ON contexts(importance);
      CREATE INDEX IF NOT EXISTS idx_contexts_updated ON contexts(updated);
      CREATE INDEX IF NOT EXISTS idx_contexts_agent ON contexts(agent_id);
      CREATE INDEX IF NOT EXISTS idx_hierarchy_levels ON hierarchy_levels(level, name);
      CREATE INDEX IF NOT EXISTS idx_access_log_context ON access_log(context_id);
      CREATE INDEX IF NOT EXISTS idx_access_log_timestamp ON access_log(timestamp);
    `;

    const queries = [
      createContextsTable,
      createHierarchyTable,
      createTagsTable,
      createDependenciesTable,
      createReferencesTable,
      createAccessLogTable,
      createIndexes
    ];

    for (const query of queries) {
      await this.runQuery(query);
    }
  }

  /**
   * Create a new context in the database
   */
  async create(context) {
    await this.ensureInitialized();
    
    const prepared = ContextSchema.prepare(context, false);
    if (!prepared.isValid) {
      throw new Error(`Invalid context: ${prepared.errors.join(', ')}`);
    }

    const normalizedContext = prepared.context;
    const startTime = Date.now();

    try {
      await this.runQuery('BEGIN TRANSACTION');

      // Insert main context record
      await this.runQuery(
        `INSERT INTO contexts 
         (id, type, hierarchy_path, importance, created, updated, content_size, agent_id, retention_policy, parent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          normalizedContext.id,
          normalizedContext.type,
          ContextSchema.getHierarchyPath(normalizedContext.hierarchy),
          normalizedContext.importance,
          normalizedContext.created,
          normalizedContext.updated,
          normalizedContext.content.length,
          normalizedContext.metadata.agent_id,
          normalizedContext.metadata.retention_policy,
          normalizedContext.relationships.parent
        ]
      );

      // Insert hierarchy levels
      for (let i = 0; i < normalizedContext.hierarchy.length; i++) {
        await this.runQuery(
          'INSERT INTO hierarchy_levels (context_id, level, name) VALUES (?, ?, ?)',
          [normalizedContext.id, i, normalizedContext.hierarchy[i]]
        );
      }

      // Insert tags
      for (const tag of normalizedContext.metadata.tags || []) {
        await this.runQuery(
          'INSERT INTO context_tags (context_id, tag) VALUES (?, ?)',
          [normalizedContext.id, tag]
        );
      }

      // Insert dependencies
      for (const dep of normalizedContext.metadata.dependencies || []) {
        await this.runQuery(
          'INSERT INTO context_dependencies (context_id, dependency_id) VALUES (?, ?)',
          [normalizedContext.id, dep]
        );
      }

      // Insert references
      for (const ref of normalizedContext.relationships.references || []) {
        await this.runQuery(
          'INSERT INTO context_references (context_id, referenced_id) VALUES (?, ?)',
          [normalizedContext.id, ref]
        );
      }

      await this.runQuery('COMMIT');

      // Log access
      await this.logAccess(normalizedContext.id, 'create', normalizedContext.metadata.agent_id, Date.now() - startTime);

      return normalizedContext;

    } catch (error) {
      await this.runQuery('ROLLBACK');
      throw new Error(`Failed to create context: ${error.message}`);
    }
  }

  /**
   * Read a context from the database
   */
  async read(id) {
    await this.ensureInitialized();
    const startTime = Date.now();

    try {
      const context = await this.getQuery(
        'SELECT * FROM contexts WHERE id = ?',
        [id]
      );

      if (!context) {
        return null;
      }

      // Reconstruct full context object
      const result = {
        id: context.id,
        type: context.type,
        hierarchy: ContextSchema.parseHierarchyPath(context.hierarchy_path),
        importance: context.importance,
        created: context.created,
        updated: context.updated,
        content: '', // Content is stored in filesystem, not database
        metadata: {
          agent_id: context.agent_id,
          retention_policy: context.retention_policy,
          tags: await this.getContextTags(id),
          dependencies: await this.getContextDependencies(id)
        },
        relationships: {
          parent: context.parent_id,
          children: await this.getContextChildren(id),
          references: await this.getContextReferences(id)
        }
      };

      // Log access
      await this.logAccess(id, 'read', null, Date.now() - startTime);

      return result;

    } catch (error) {
      throw new Error(`Failed to read context ${id}: ${error.message}`);
    }
  }

  /**
   * Update a context in the database
   */
  async update(id, updates) {
    await this.ensureInitialized();
    const startTime = Date.now();

    try {
      await this.runQuery('BEGIN TRANSACTION');

      const existing = await this.read(id);
      if (!existing) {
        throw new Error(`Context not found: ${id}`);
      }

      // Merge updates
      const updatedContext = { ...existing, ...updates, updated: new Date().toISOString() };
      
      const prepared = ContextSchema.prepare(updatedContext, true);
      if (!prepared.isValid) {
        throw new Error(`Invalid context update: ${prepared.errors.join(', ')}`);
      }

      const normalizedContext = prepared.context;

      // Update main context record
      await this.runQuery(
        `UPDATE contexts SET 
         type = ?, hierarchy_path = ?, importance = ?, updated = ?, 
         content_size = ?, agent_id = ?, retention_policy = ?, parent_id = ?
         WHERE id = ?`,
        [
          normalizedContext.type,
          ContextSchema.getHierarchyPath(normalizedContext.hierarchy),
          normalizedContext.importance,
          normalizedContext.updated,
          normalizedContext.content.length,
          normalizedContext.metadata.agent_id,
          normalizedContext.metadata.retention_policy,
          normalizedContext.relationships.parent,
          id
        ]
      );

      // Update related tables - simpler approach: delete and re-insert
      await this.runQuery('DELETE FROM hierarchy_levels WHERE context_id = ?', [id]);
      await this.runQuery('DELETE FROM context_tags WHERE context_id = ?', [id]);
      await this.runQuery('DELETE FROM context_dependencies WHERE context_id = ?', [id]);
      await this.runQuery('DELETE FROM context_references WHERE context_id = ?', [id]);

      // Re-insert hierarchy levels
      for (let i = 0; i < normalizedContext.hierarchy.length; i++) {
        await this.runQuery(
          'INSERT INTO hierarchy_levels (context_id, level, name) VALUES (?, ?, ?)',
          [id, i, normalizedContext.hierarchy[i]]
        );
      }

      // Re-insert tags, dependencies, references
      for (const tag of normalizedContext.metadata.tags || []) {
        await this.runQuery(
          'INSERT INTO context_tags (context_id, tag) VALUES (?, ?)',
          [id, tag]
        );
      }

      for (const dep of normalizedContext.metadata.dependencies || []) {
        await this.runQuery(
          'INSERT INTO context_dependencies (context_id, dependency_id) VALUES (?, ?)',
          [id, dep]
        );
      }

      for (const ref of normalizedContext.relationships.references || []) {
        await this.runQuery(
          'INSERT INTO context_references (context_id, referenced_id) VALUES (?, ?)',
          [id, ref]
        );
      }

      await this.runQuery('COMMIT');

      // Log access
      await this.logAccess(id, 'update', normalizedContext.metadata.agent_id, Date.now() - startTime);

      return normalizedContext;

    } catch (error) {
      await this.runQuery('ROLLBACK');
      throw error;
    }
  }

  /**
   * Delete a context from the database
   */
  async delete(id) {
    await this.ensureInitialized();
    const startTime = Date.now();

    try {
      const result = await this.runQuery('DELETE FROM contexts WHERE id = ?', [id]);
      
      // Log access
      await this.logAccess(id, 'delete', null, Date.now() - startTime);
      
      return result.changes > 0;

    } catch (error) {
      throw new Error(`Failed to delete context ${id}: ${error.message}`);
    }
  }

  /**
   * List contexts with advanced filtering
   */
  async list(options = {}) {
    await this.ensureInitialized();
    
    const {
      type,
      hierarchy,
      limit = 100,
      offset = 0,
      sortBy = 'updated',
      sortOrder = 'desc',
      importanceMin,
      importanceMax,
      tags,
      agentId
    } = options;

    let query = 'SELECT * FROM contexts WHERE 1=1';
    const params = [];

    // Apply filters
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (hierarchy && hierarchy.length > 0) {
      const hierarchyPath = ContextSchema.getHierarchyPath(hierarchy);
      query += ' AND hierarchy_path LIKE ?';
      params.push(`${hierarchyPath}%`);
    }

    if (importanceMin !== undefined) {
      query += ' AND importance >= ?';
      params.push(importanceMin);
    }

    if (importanceMax !== undefined) {
      query += ' AND importance <= ?';
      params.push(importanceMax);
    }

    if (agentId) {
      query += ' AND agent_id = ?';
      params.push(agentId);
    }

    if (tags && tags.length > 0) {
      query += ` AND id IN (
        SELECT context_id FROM context_tags 
        WHERE tag IN (${tags.map(() => '?').join(',')})
        GROUP BY context_id
        HAVING COUNT(DISTINCT tag) = ?
      )`;
      params.push(...tags, tags.length);
    }

    // Sort
    const validSortFields = ['id', 'type', 'hierarchy_path', 'importance', 'created', 'updated'];
    if (validSortFields.includes(sortBy)) {
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    }

    // Paginate
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const results = await this.allQuery(query, params);
      
      // Convert to full context objects (without content)
      return results.map(row => ({
        id: row.id,
        type: row.type,
        hierarchy: ContextSchema.parseHierarchyPath(row.hierarchy_path),
        importance: row.importance,
        created: row.created,
        updated: row.updated,
        content: '', // Not loaded in list view
        metadata: {
          agent_id: row.agent_id,
          retention_policy: row.retention_policy,
          tags: [], // Not loaded in list view for performance
          dependencies: []
        },
        relationships: {
          parent: row.parent_id,
          children: [],
          references: []
        }
      }));

    } catch (error) {
      throw new Error(`Failed to list contexts: ${error.message}`);
    }
  }

  /**
   * Search contexts (database fields only)
   */
  async search(query, options = {}) {
    await this.ensureInitialized();
    
    const { limit = 50, offset = 0 } = options;
    const searchTerm = `%${query.toLowerCase()}%`;

    const sql = `
      SELECT DISTINCT c.* FROM contexts c
      LEFT JOIN context_tags t ON c.id = t.context_id
      LEFT JOIN hierarchy_levels h ON c.id = h.context_id
      WHERE LOWER(c.type) LIKE ?
         OR LOWER(c.hierarchy_path) LIKE ?
         OR LOWER(c.agent_id) LIKE ?
         OR LOWER(t.tag) LIKE ?
         OR LOWER(h.name) LIKE ?
      ORDER BY c.importance DESC, c.updated DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const results = await this.allQuery(sql, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
        limit, offset
      ]);

      return results.map(row => ({
        id: row.id,
        type: row.type,
        hierarchy: ContextSchema.parseHierarchyPath(row.hierarchy_path),
        importance: row.importance,
        created: row.created,
        updated: row.updated,
        content: '',
        metadata: {
          agent_id: row.agent_id,
          retention_policy: row.retention_policy,
          tags: [],
          dependencies: []
        },
        relationships: {
          parent: row.parent_id,
          children: [],
          references: []
        }
      }));

    } catch (error) {
      throw new Error(`Failed to search contexts: ${error.message}`);
    }
  }

  /**
   * Get contexts by hierarchy path
   */
  async getByHierarchy(hierarchy, includeChildren = false) {
    await this.ensureInitialized();
    
    const hierarchyPath = ContextSchema.getHierarchyPath(hierarchy);
    let query = 'SELECT * FROM contexts WHERE ';
    const params = [];

    if (includeChildren) {
      query += 'hierarchy_path LIKE ?';
      params.push(`${hierarchyPath}%`);
    } else {
      query += 'hierarchy_path = ?';
      params.push(hierarchyPath);
    }

    query += ' ORDER BY importance DESC, updated DESC';

    try {
      const results = await this.allQuery(query, params);
      
      return results.map(row => ({
        id: row.id,
        type: row.type,
        hierarchy: ContextSchema.parseHierarchyPath(row.hierarchy_path),
        importance: row.importance,
        created: row.created,
        updated: row.updated,
        content: '',
        metadata: {
          agent_id: row.agent_id,
          retention_policy: row.retention_policy,
          tags: [],
          dependencies: []
        },
        relationships: {
          parent: row.parent_id,
          children: [],
          references: []
        }
      }));

    } catch (error) {
      throw new Error(`Failed to get hierarchy contexts: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.ensureInitialized();
      
      // Test a simple query
      await this.getQuery('SELECT COUNT(*) as count FROM contexts');
      
      return true;
    } catch (error) {
      console.error('Database health check failed:', error.message);
      return false;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          }
          this.db = null;
          this.initialized = false;
          resolve();
        });
      });
    }
  }

  // Analytics methods
  
  /**
   * Get analytics data
   */
  async getAnalytics(options = {}) {
    await this.ensureInitialized();
    
    const { since, agentId, type } = options;
    const results = {};

    try {
      // Context counts by type
      let query = 'SELECT type, COUNT(*) as count FROM contexts GROUP BY type';
      results.contextsByType = await this.allQuery(query);

      // Top agents by activity
      query = `
        SELECT agent_id, COUNT(*) as operations, AVG(duration_ms) as avg_duration
        FROM access_log 
        WHERE agent_id IS NOT NULL
        ${since ? 'AND timestamp >= ?' : ''}
        GROUP BY agent_id 
        ORDER BY operations DESC 
        LIMIT 10
      `;
      results.topAgents = await this.allQuery(query, since ? [since] : []);

      // Operation performance
      query = `
        SELECT operation, COUNT(*) as count, AVG(duration_ms) as avg_duration, MAX(duration_ms) as max_duration
        FROM access_log 
        ${since ? 'WHERE timestamp >= ?' : ''}
        GROUP BY operation
      `;
      results.operationStats = await this.allQuery(query, since ? [since] : []);

      return results;

    } catch (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  // Private helper methods

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getContextTags(contextId) {
    try {
      const results = await this.allQuery(
        'SELECT tag FROM context_tags WHERE context_id = ?',
        [contextId]
      );
      return results.map(row => row.tag);
    } catch (error) {
      return [];
    }
  }

  async getContextDependencies(contextId) {
    try {
      const results = await this.allQuery(
        'SELECT dependency_id FROM context_dependencies WHERE context_id = ?',
        [contextId]
      );
      return results.map(row => row.dependency_id);
    } catch (error) {
      return [];
    }
  }

  async getContextChildren(contextId) {
    try {
      const results = await this.allQuery(
        'SELECT id FROM contexts WHERE parent_id = ?',
        [contextId]
      );
      return results.map(row => row.id);
    } catch (error) {
      return [];
    }
  }

  async getContextReferences(contextId) {
    try {
      const results = await this.allQuery(
        'SELECT referenced_id FROM context_references WHERE context_id = ?',
        [contextId]
      );
      return results.map(row => row.referenced_id);
    } catch (error) {
      return [];
    }
  }

  async logAccess(contextId, operation, agentId = null, duration = 0) {
    try {
      await this.runQuery(
        'INSERT INTO access_log (context_id, operation, timestamp, agent_id, duration_ms) VALUES (?, ?, ?, ?, ?)',
        [contextId, operation, new Date().toISOString(), agentId, duration]
      );
    } catch (error) {
      // Don't fail main operations due to logging errors
      console.warn(`Failed to log access: ${error.message}`);
    }
  }
}

module.exports = SQLiteStorage;