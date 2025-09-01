const { randomUUID } = require('crypto');
const ContextSchema = require('../storage/interfaces/ContextSchema');

/**
 * Core Context Model
 * Represents a context object with full lifecycle management, validation, and relationship handling
 */
class Context {
  /**
   * Create a new Context instance
   * @param {Object} data - Initial context data
   * @param {string} data.id - Unique identifier (UUID)
   * @param {string} data.type - Context type (project, epic, task, session, agent)
   * @param {Array<string>} data.hierarchy - Hierarchical path
   * @param {number} data.importance - Importance score (0-100)
   * @param {string} data.content - Context content (can be compressed)
   * @param {Object} data.metadata - Metadata object
   * @param {Object} data.relationships - Relationship structure
   * @param {string} data.created - Creation timestamp (ISO string)
   * @param {string} data.updated - Last update timestamp (ISO string)
   */
  constructor(data = {}) {
    // Core required fields
    this.id = data.id || this._generateId();
    this.type = data.type || 'task';
    this.hierarchy = data.hierarchy || [];
    this.importance = data.importance || 0;
    
    // Timestamps
    const now = new Date().toISOString();
    this.created = data.created || now;
    this.updated = data.updated || now;
    
    // Content (can be compressed)
    this.content = data.content || '';
    
    // Metadata structure
    this.metadata = {
      agent_id: null,
      tags: [],
      dependencies: [],
      retention_policy: 'default',
      ...data.metadata
    };
    
    // Relationship structure
    this.relationships = {
      parent: null,
      children: [],
      references: [],
      ...data.relationships
    };
    
    // Session-specific data for orchestration
    this.userId = data.userId || null;
    this.sessionId = data.sessionId || null;
    this.previousInteractions = data.previousInteractions || [];
    this.agentPreferences = data.agentPreferences || {};
  }

  /**
   * Generate a UUID for new contexts
   * @returns {string} UUID string
   * @private
   */
  _generateId() {
    return randomUUID();
  }

  /**
   * Validate the context using ContextSchema
   * @param {boolean} isUpdate - Whether this is an update validation
   * @returns {Object} Validation result with isValid and errors
   */
  validate(isUpdate = false) {
    return ContextSchema.validate(this.toObject(), isUpdate);
  }

  /**
   * Convert context to plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      type: this.type,
      hierarchy: this.hierarchy,
      importance: this.importance,
      created: this.created,
      updated: this.updated,
      content: this.content,
      metadata: this.metadata,
      relationships: this.relationships
    };
  }

  /**
   * Serialize context to JSON string
   * @returns {string} JSON representation
   */
  serialize() {
    return JSON.stringify(this.toObject());
  }

  /**
   * Create Context instance from JSON string
   * @param {string} jsonString - JSON string representation
   * @returns {Context} New Context instance
   * @static
   */
  static deserialize(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return new Context(data);
    } catch (error) {
      throw new Error(`Failed to deserialize context: ${error.message}`);
    }
  }

  /**
   * Create Context instance from plain object with validation
   * @param {Object} data - Context data
   * @returns {Context} New Context instance
   * @throws {Error} If validation fails
   * @static
   */
  static fromObject(data) {
    const context = new Context(data);
    const validation = context.validate();
    
    if (!validation.isValid) {
      throw new Error(`Invalid context data: ${validation.errors.join(', ')}`);
    }
    
    return context;
  }

  /**
   * Update context properties and refresh timestamp
   * @param {Object} updates - Properties to update
   * @returns {Context} Returns this for chaining
   */
  update(updates) {
    // Update specific properties
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'created' && this.hasOwnProperty(key)) {
        if (key === 'metadata' || key === 'relationships') {
          // Merge objects rather than replace
          this[key] = { ...this[key], ...updates[key] };
        } else {
          this[key] = updates[key];
        }
      }
    });
    
    // Always update the timestamp
    this.updated = new Date().toISOString();
    
    return this;
  }

  /**
   * Get hierarchical path as string
   * @returns {string} Hierarchy path (e.g., 'project/epic/task')
   */
  getHierarchyPath() {
    return ContextSchema.getHierarchyPath(this.hierarchy);
  }

  /**
   * Get storage key for this context
   * @returns {string} Storage key
   */
  getStorageKey() {
    return ContextSchema.getStorageKey(this);
  }

  /**
   * Check if context has a parent relationship
   * @returns {boolean} True if has parent
   */
  hasParent() {
    return this.relationships.parent !== null;
  }

  /**
   * Check if context has child relationships
   * @returns {boolean} True if has children
   */
  hasChildren() {
    return this.relationships.children.length > 0;
  }

  /**
   * Check if context has reference relationships
   * @returns {boolean} True if has references
   */
  hasReferences() {
    return this.relationships.references.length > 0;
  }

  /**
   * Add a child relationship
   * @param {string} childId - ID of child context
   * @returns {Context} Returns this for chaining
   */
  addChild(childId) {
    if (!this.relationships.children.includes(childId)) {
      this.relationships.children.push(childId);
      this.updated = new Date().toISOString();
    }
    return this;
  }

  /**
   * Remove a child relationship
   * @param {string} childId - ID of child context to remove
   * @returns {Context} Returns this for chaining
   */
  removeChild(childId) {
    const index = this.relationships.children.indexOf(childId);
    if (index !== -1) {
      this.relationships.children.splice(index, 1);
      this.updated = new Date().toISOString();
    }
    return this;
  }

  /**
   * Set parent relationship
   * @param {string} parentId - ID of parent context
   * @returns {Context} Returns this for chaining
   */
  setParent(parentId) {
    this.relationships.parent = parentId;
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Remove parent relationship
   * @returns {Context} Returns this for chaining
   */
  removeParent() {
    this.relationships.parent = null;
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Add a reference relationship
   * @param {string} referenceId - ID of referenced context
   * @returns {Context} Returns this for chaining
   */
  addReference(referenceId) {
    if (!this.relationships.references.includes(referenceId)) {
      this.relationships.references.push(referenceId);
      this.updated = new Date().toISOString();
    }
    return this;
  }

  /**
   * Remove a reference relationship
   * @param {string} referenceId - ID of reference to remove
   * @returns {Context} Returns this for chaining
   */
  removeReference(referenceId) {
    const index = this.relationships.references.indexOf(referenceId);
    if (index !== -1) {
      this.relationships.references.splice(index, 1);
      this.updated = new Date().toISOString();
    }
    return this;
  }

  /**
   * Add a tag to metadata
   * @param {string} tag - Tag to add
   * @returns {Context} Returns this for chaining
   */
  addTag(tag) {
    if (!this.metadata.tags.includes(tag)) {
      this.metadata.tags.push(tag);
      this.updated = new Date().toISOString();
    }
    return this;
  }

  /**
   * Remove a tag from metadata
   * @param {string} tag - Tag to remove
   * @returns {Context} Returns this for chaining
   */
  removeTag(tag) {
    const index = this.metadata.tags.indexOf(tag);
    if (index !== -1) {
      this.metadata.tags.splice(index, 1);
      this.updated = new Date().toISOString();
    }
    return this;
  }

  /**
   * Calculate importance score based on various factors
   * @param {Object} options - Scoring options
   * @param {number} options.hierarchyBonus - Bonus points for hierarchy depth (default: 5 per level)
   * @param {number} options.childrenBonus - Bonus points per child (default: 3 per child)
   * @param {number} options.referencesBonus - Bonus points per reference (default: 2 per reference)
   * @param {number} options.ageDecay - Decay factor for age (default: 0.1 per day)
   * @param {number} options.tagBonus - Bonus points for having tags (default: 1 per tag)
   * @returns {number} Calculated importance score (0-100)
   */
  calculateImportance(options = {}) {
    const {
      hierarchyBonus = 5,
      childrenBonus = 3,
      referencesBonus = 2,
      ageDecay = 0.1,
      tagBonus = 1
    } = options;

    let score = this.importance || 0;

    // Hierarchy depth bonus
    score += this.hierarchy.length * hierarchyBonus;

    // Relationship bonuses
    score += this.relationships.children.length * childrenBonus;
    score += this.relationships.references.length * referencesBonus;

    // Tag bonus
    score += this.metadata.tags.length * tagBonus;

    // Age decay (contexts become less important over time)
    const ageInDays = (Date.now() - new Date(this.updated).getTime()) / (1000 * 60 * 60 * 24);
    score -= ageInDays * ageDecay;

    // Type-based importance
    const typeScores = {
      project: 20,
      epic: 15,
      task: 10,
      session: 5,
      agent: 8
    };
    score += typeScores[this.type] || 0;

    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Update importance score using calculation
   * @param {Object} options - Scoring options (see calculateImportance)
   * @returns {Context} Returns this for chaining
   */
  updateImportance(options = {}) {
    this.importance = this.calculateImportance(options);
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Clone this context with new ID
   * @param {Object} overrides - Properties to override in the clone
   * @returns {Context} New Context instance
   */
  clone(overrides = {}) {
    const data = {
      ...this.toObject(),
      id: this._generateId(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      ...overrides
    };
    return new Context(data);
  }

  /**
   * Check if context matches a query
   * @param {Object} query - Query parameters
   * @param {string} query.type - Context type to match
   * @param {Array<string>} query.tags - Tags that must be present
   * @param {Array<string>} query.hierarchy - Hierarchy levels that must match
   * @param {number} query.minImportance - Minimum importance score
   * @param {string} query.contentSearch - Text to search in content
   * @returns {boolean} True if context matches query
   */
  matches(query) {
    // Type matching
    if (query.type && this.type !== query.type) {
      return false;
    }

    // Tag matching - all specified tags must be present
    if (query.tags && query.tags.length > 0) {
      if (!query.tags.every(tag => this.metadata.tags.includes(tag))) {
        return false;
      }
    }

    // Hierarchy matching - all specified levels must match
    if (query.hierarchy && query.hierarchy.length > 0) {
      if (this.hierarchy.length < query.hierarchy.length) {
        return false;
      }
      if (!query.hierarchy.every((level, index) => this.hierarchy[index] === level)) {
        return false;
      }
    }

    // Importance threshold
    if (query.minImportance && this.importance < query.minImportance) {
      return false;
    }

    // Content search
    if (query.contentSearch) {
      const searchTerm = query.contentSearch.toLowerCase();
      if (!this.content.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Add an interaction to the context history
   * @param {Object} interaction - Interaction data
   * @returns {Context} Returns this for chaining
   */
  addInteraction(interaction) {
    if (!this.previousInteractions) {
      this.previousInteractions = [];
    }
    
    this.previousInteractions.push({
      timestamp: interaction.timestamp || new Date(),
      prompt: interaction.prompt || '',
      agentId: interaction.agentId || 'unknown',
      response: interaction.response || '',
      tokens: interaction.tokens || 0,
      duration: interaction.duration || 0
    });
    
    // Keep only last 20 interactions to prevent memory bloat
    if (this.previousInteractions.length > 20) {
      this.previousInteractions = this.previousInteractions.slice(-20);
    }
    
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Get a summary of the context for debugging/logging
   * @returns {string} Summary string
   */
  getSummary() {
    const hierarchyPath = this.getHierarchyPath();
    const childCount = this.relationships.children.length;
    const refCount = this.relationships.references.length;
    const tagCount = this.metadata.tags.length;
    
    return `Context[${this.id.substring(0, 8)}...] ${this.type} at ${hierarchyPath} (importance: ${this.importance}, children: ${childCount}, refs: ${refCount}, tags: ${tagCount})`;
  }
}

module.exports = Context;