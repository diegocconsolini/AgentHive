/**
 * Context schema validation and transformation
 */
class ContextSchema {
  /**
   * Valid context types
   */
  static TYPES = ['project', 'epic', 'task', 'session', 'agent'];

  /**
   * Valid context statuses
   */
  static STATUSES = ['active', 'idle', 'completed', 'archived', 'error'];

  /**
   * Validate context object
   * @param {Object} context - Context to validate
   * @param {boolean} isUpdate - Whether this is an update (allows partial data)
   * @returns {Object} Validation result with isValid and errors
   */
  static validate(context, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate) {
      // Required fields for new contexts
      if (!context.id || typeof context.id !== 'string') {
        errors.push('id is required and must be a string');
      }
      
      if (!context.type || !this.TYPES.includes(context.type)) {
        errors.push(`type is required and must be one of: ${this.TYPES.join(', ')}`);
      }
      
      if (!Array.isArray(context.hierarchy)) {
        errors.push('hierarchy is required and must be an array');
      }
      
      if (typeof context.importance !== 'number' || context.importance < 0 || context.importance > 100) {
        errors.push('importance is required and must be a number between 0 and 100');
      }
      
      if (typeof context.content !== 'string') {
        errors.push('content is required and must be a string');
      }
    }

    // Optional field validation
    if (context.metadata && typeof context.metadata !== 'object') {
      errors.push('metadata must be an object if provided');
    }
    
    if (context.relationships && typeof context.relationships !== 'object') {
      errors.push('relationships must be an object if provided');
    }

    // Validate hierarchy depth and format
    if (context.hierarchy) {
      if (context.hierarchy.length === 0) {
        errors.push('hierarchy cannot be empty');
      }
      
      if (context.hierarchy.some(level => typeof level !== 'string' || level.trim() === '')) {
        errors.push('all hierarchy levels must be non-empty strings');
      }
      
      if (context.hierarchy.length > 5) {
        errors.push('hierarchy cannot exceed 5 levels');
      }
    }

    // Validate relationships structure
    if (context.relationships) {
      const { parent, children, references } = context.relationships;
      
      if (parent && typeof parent !== 'string') {
        errors.push('relationships.parent must be a string if provided');
      }
      
      if (children && (!Array.isArray(children) || children.some(id => typeof id !== 'string'))) {
        errors.push('relationships.children must be an array of strings if provided');
      }
      
      if (references && (!Array.isArray(references) || references.some(id => typeof id !== 'string'))) {
        errors.push('relationships.references must be an array of strings if provided');
      }
    }

    // Validate metadata structure
    if (context.metadata) {
      const { agent_id, tags, dependencies, retention_policy } = context.metadata;
      
      if (agent_id && typeof agent_id !== 'string') {
        errors.push('metadata.agent_id must be a string if provided');
      }
      
      if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string'))) {
        errors.push('metadata.tags must be an array of strings if provided');
      }
      
      if (dependencies && (!Array.isArray(dependencies) || dependencies.some(dep => typeof dep !== 'string'))) {
        errors.push('metadata.dependencies must be an array of strings if provided');
      }
      
      if (retention_policy && typeof retention_policy !== 'string') {
        errors.push('metadata.retention_policy must be a string if provided');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Normalize context object with default values
   * @param {Object} context - Context to normalize
   * @returns {Object} Normalized context
   */
  static normalize(context) {
    const now = new Date().toISOString();
    
    return {
      id: context.id,
      type: context.type,
      hierarchy: context.hierarchy || [],
      importance: context.importance || 0,
      created: context.created || now,
      updated: now,
      content: context.content || '',
      metadata: {
        agent_id: null,
        tags: [],
        dependencies: [],
        retention_policy: 'default',
        ...context.metadata
      },
      relationships: {
        parent: null,
        children: [],
        references: [],
        ...context.relationships
      }
    };
  }

  /**
   * Generate hierarchical path string for storage
   * @param {Array<string>} hierarchy - Hierarchy array
   * @returns {string} Path string (e.g., 'project/epic/task')
   */
  static getHierarchyPath(hierarchy) {
    return hierarchy.join('/');
  }

  /**
   * Parse hierarchy path string back to array
   * @param {string} path - Path string
   * @returns {Array<string>} Hierarchy array
   */
  static parseHierarchyPath(path) {
    return path ? path.split('/').filter(level => level.trim() !== '') : [];
  }

  /**
   * Generate storage key for context
   * @param {Object} context - Context object
   * @returns {string} Storage key
   */
  static getStorageKey(context) {
    const hierarchyPath = this.getHierarchyPath(context.hierarchy);
    return `${hierarchyPath}/${context.type}/${context.id}`;
  }

  /**
   * Validate and normalize context for storage
   * @param {Object} context - Context to prepare
   * @param {boolean} isUpdate - Whether this is an update
   * @returns {Object} Result with isValid, errors, and normalized context
   */
  static prepare(context, isUpdate = false) {
    const validation = this.validate(context, isUpdate);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        errors: validation.errors,
        context: null
      };
    }
    
    const normalized = this.normalize(context);
    
    return {
      isValid: true,
      errors: [],
      context: normalized
    };
  }
}

module.exports = ContextSchema;