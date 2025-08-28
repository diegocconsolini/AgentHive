/**
 * Core storage interface for context management
 * Defines the contract for all storage implementations
 */
class IContextStorage {
  /**
   * Create a new context
   * @param {Object} context - Context object to create
   * @param {string} context.id - Unique identifier
   * @param {string} context.type - Context type (project|epic|task|session|agent)
   * @param {Array<string>} context.hierarchy - Hierarchical path
   * @param {number} context.importance - Importance score (0-100)
   * @param {string} context.content - Context content
   * @param {Object} context.metadata - Additional metadata
   * @param {Object} context.relationships - Parent/child relationships
   * @returns {Promise<Object>} Created context with timestamps
   */
  async create(context) {
    throw new Error('create() method must be implemented');
  }

  /**
   * Retrieve a context by ID
   * @param {string} id - Context ID
   * @returns {Promise<Object|null>} Context object or null if not found
   */
  async read(id) {
    throw new Error('read() method must be implemented');
  }

  /**
   * Update an existing context
   * @param {string} id - Context ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated context
   */
  async update(id, updates) {
    throw new Error('update() method must be implemented');
  }

  /**
   * Delete a context
   * @param {string} id - Context ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    throw new Error('delete() method must be implemented');
  }

  /**
   * List contexts with filtering and pagination
   * @param {Object} options - Query options
   * @param {string} options.type - Filter by context type
   * @param {Array<string>} options.hierarchy - Filter by hierarchy path
   * @param {number} options.limit - Maximum results to return
   * @param {number} options.offset - Number of results to skip
   * @param {string} options.sortBy - Field to sort by
   * @param {string} options.sortOrder - Sort order (asc|desc)
   * @returns {Promise<Array<Object>>} Array of contexts
   */
  async list(options = {}) {
    throw new Error('list() method must be implemented');
  }

  /**
   * Search contexts by content or metadata
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array<Object>>} Array of matching contexts
   */
  async search(query, options = {}) {
    throw new Error('search() method must be implemented');
  }

  /**
   * Get contexts by hierarchy path
   * @param {Array<string>} hierarchy - Hierarchical path
   * @param {boolean} includeChildren - Include child contexts
   * @returns {Promise<Array<Object>>} Array of contexts in hierarchy
   */
  async getByHierarchy(hierarchy, includeChildren = false) {
    throw new Error('getByHierarchy() method must be implemented');
  }

  /**
   * Check if storage is healthy and accessible
   * @returns {Promise<boolean>} True if storage is healthy
   */
  async healthCheck() {
    throw new Error('healthCheck() method must be implemented');
  }

  /**
   * Initialize storage (create directories, tables, etc.)
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() method must be implemented');
  }

  /**
   * Close storage connections and cleanup
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('close() method must be implemented');
  }
}

module.exports = IContextStorage;