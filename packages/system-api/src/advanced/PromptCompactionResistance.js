/**
 * PromptCompactionResistance.js
 * Advanced prompt compaction resistance with ML-ready importance scoring,
 * compression algorithms, and emergency recovery mechanisms
 */

const crypto = require('crypto');
const zlib = require('zlib');
const { EventEmitter } = require('events');

/**
 * Importance scoring algorithms with ML-ready structure
 */
class ImportanceScorer {
  constructor() {
    this.weights = {
      frequency: 0.25,
      recency: 0.20,
      dependency: 0.20,
      semantic: 0.15,
      userMarked: 0.10,
      systemCritical: 0.10
    };
    
    this.mlFeatures = new Map();
    this.semanticCache = new Map();
  }

  /**
   * Calculate importance score for a context item
   * @param {Object} item - Context item to score
   * @param {Object} metadata - Additional metadata for scoring
   * @returns {Object} Score with ML features
   */
  calculateScore(item, metadata = {}) {
    const features = this.extractFeatures(item, metadata);
    const baseScore = this.computeBaseScore(features);
    const adjustedScore = this.applyContextualAdjustments(baseScore, features);
    
    // Store features for ML training
    this.mlFeatures.set(item.id, {
      features,
      score: adjustedScore,
      timestamp: Date.now()
    });
    
    return {
      score: adjustedScore,
      features,
      confidence: this.calculateConfidence(features),
      breakdown: this.getScoreBreakdown(features)
    };
  }

  /**
   * Extract ML-ready features from context item
   */
  extractFeatures(item, metadata) {
    return {
      // Temporal features
      age: Date.now() - item.timestamp,
      lastAccessed: metadata.lastAccessed || item.timestamp,
      accessFrequency: metadata.accessCount || 0,
      
      // Structural features
      size: JSON.stringify(item).length,
      depth: this.calculateDepth(item),
      complexity: this.calculateComplexity(item),
      
      // Semantic features
      category: item.type || 'unknown',
      tags: item.tags || [],
      semanticSimilarity: this.calculateSemanticSimilarity(item),
      
      // Dependency features
      dependencies: item.dependencies || [],
      dependencyCount: (item.dependencies || []).length,
      isDependedUpon: metadata.isDependedUpon || false,
      
      // User/System markers
      userMarked: item.userMarked || false,
      systemCritical: item.systemCritical || false,
      priority: item.priority || 0
    };
  }

  /**
   * Compute base importance score
   */
  computeBaseScore(features) {
    let score = 0;
    
    // Frequency component
    score += this.weights.frequency * Math.min(1, features.accessFrequency / 100);
    
    // Recency component (exponential decay)
    const recencyScore = Math.exp(-features.age / (7 * 24 * 60 * 60 * 1000)); // 7-day half-life
    score += this.weights.recency * recencyScore;
    
    // Dependency component
    const depScore = features.isDependedUpon ? 1 : Math.min(1, features.dependencyCount / 10);
    score += this.weights.dependency * depScore;
    
    // Semantic component
    score += this.weights.semantic * features.semanticSimilarity;
    
    // User marked component
    score += this.weights.userMarked * (features.userMarked ? 1 : 0);
    
    // System critical component
    score += this.weights.systemCritical * (features.systemCritical ? 1 : 0);
    
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Apply contextual adjustments to score
   */
  applyContextualAdjustments(baseScore, features) {
    let adjustedScore = baseScore;
    
    // Boost for high priority items
    if (features.priority > 0) {
      adjustedScore *= (1 + features.priority * 0.1);
    }
    
    // Boost for complex items (likely contain more information)
    adjustedScore *= (1 + features.complexity * 0.05);
    
    // Penalty for very old items without recent access
    const staleness = features.age - features.lastAccessed;
    if (staleness > 30 * 24 * 60 * 60 * 1000) { // 30 days
      adjustedScore *= 0.5;
    }
    
    return Math.min(1, Math.max(0, adjustedScore));
  }

  /**
   * Calculate depth of nested structure
   */
  calculateDepth(obj, currentDepth = 0) {
    if (typeof obj !== 'object' || obj === null) return currentDepth;
    
    let maxDepth = currentDepth;
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        maxDepth = Math.max(maxDepth, this.calculateDepth(value, currentDepth + 1));
      }
    }
    return maxDepth;
  }

  /**
   * Calculate complexity score
   */
  calculateComplexity(item) {
    const factors = {
      size: JSON.stringify(item).length / 10000,
      depth: this.calculateDepth(item) / 10,
      uniqueKeys: new Set(this.getAllKeys(item)).size / 100
    };
    
    return Math.min(1, (factors.size + factors.depth + factors.uniqueKeys) / 3);
  }

  /**
   * Get all keys recursively
   */
  getAllKeys(obj, keys = []) {
    if (typeof obj !== 'object' || obj === null) return keys;
    
    Object.keys(obj).forEach(key => {
      keys.push(key);
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.getAllKeys(obj[key], keys);
      }
    });
    
    return keys;
  }

  /**
   * Calculate semantic similarity (simplified version)
   */
  calculateSemanticSimilarity(item) {
    // In production, this would use embeddings and vector similarity
    // For now, use a simplified tag-based approach
    const commonTags = ['core', 'api', 'database', 'cache', 'security'];
    const itemTags = item.tags || [];
    
    const matches = itemTags.filter(tag => commonTags.includes(tag)).length;
    return matches / Math.max(1, commonTags.length);
  }

  /**
   * Calculate confidence in the score
   */
  calculateConfidence(features) {
    let confidence = 0.5; // Base confidence
    
    // More data points increase confidence
    if (features.accessFrequency > 10) confidence += 0.1;
    if (features.dependencyCount > 0) confidence += 0.1;
    if (features.userMarked || features.systemCritical) confidence += 0.2;
    if (features.tags.length > 0) confidence += 0.1;
    
    return Math.min(1, confidence);
  }

  /**
   * Get detailed score breakdown
   */
  getScoreBreakdown(features) {
    return {
      frequency: this.weights.frequency * Math.min(1, features.accessFrequency / 100),
      recency: this.weights.recency * Math.exp(-features.age / (7 * 24 * 60 * 60 * 1000)),
      dependency: this.weights.dependency * (features.isDependedUpon ? 1 : Math.min(1, features.dependencyCount / 10)),
      semantic: this.weights.semantic * features.semanticSimilarity,
      userMarked: this.weights.userMarked * (features.userMarked ? 1 : 0),
      systemCritical: this.weights.systemCritical * (features.systemCritical ? 1 : 0)
    };
  }

  /**
   * Export ML features for training
   */
  exportMLFeatures() {
    return Array.from(this.mlFeatures.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  /**
   * Update weights from ML model
   */
  updateWeights(newWeights) {
    Object.assign(this.weights, newWeights);
  }
}

/**
 * Advanced compression algorithms with critical info protection
 */
class CompressionEngine {
  constructor() {
    this.compressionLevels = {
      none: 0,
      light: 3,
      moderate: 6,
      heavy: 9
    };
    
    this.criticalPatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /credential/i,
      /auth/i
    ];
    
    this.compressionStats = {
      totalCompressed: 0,
      totalDecompressed: 0,
      averageRatio: 0,
      failures: 0
    };
  }

  /**
   * Compress context with critical info protection
   * @param {Object} context - Context to compress
   * @param {Object} options - Compression options
   * @returns {Object} Compressed context with metadata
   */
  compress(context, options = {}) {
    const startTime = Date.now();
    const originalSize = JSON.stringify(context).length;
    
    try {
      // Separate critical and non-critical data
      const { critical, nonCritical } = this.separateCriticalData(context);
      
      // Determine compression level based on importance scores
      const level = this.determineCompressionLevel(context, options);
      
      // Compress non-critical data
      const compressedNonCritical = this.compressData(nonCritical, level);
      
      // Lightly compress critical data (or not at all)
      const compressedCritical = options.compressCritical ? 
        this.compressData(critical, this.compressionLevels.light) : 
        critical;
      
      const result = {
        compressed: true,
        timestamp: Date.now(),
        originalSize,
        compressedSize: JSON.stringify(compressedNonCritical).length + JSON.stringify(compressedCritical).length,
        compressionRatio: 0,
        level,
        critical: compressedCritical,
        nonCritical: compressedNonCritical,
        metadata: {
          algorithm: 'zlib',
          version: '1.0.0',
          duration: Date.now() - startTime
        }
      };
      
      result.compressionRatio = 1 - (result.compressedSize / originalSize);
      
      // Update stats
      this.updateStats(result);
      
      return result;
    } catch (error) {
      this.compressionStats.failures++;
      throw new Error(`Compression failed: ${error.message}`);
    }
  }

  /**
   * Decompress context
   * @param {Object} compressedContext - Compressed context to restore
   * @returns {Object} Decompressed context
   */
  decompress(compressedContext) {
    const startTime = Date.now();
    
    try {
      if (!compressedContext.compressed) {
        return compressedContext;
      }
      
      // Decompress non-critical data
      const nonCritical = this.decompressData(compressedContext.nonCritical);
      
      // Decompress critical data if it was compressed
      const critical = typeof compressedContext.critical === 'string' ?
        this.decompressData(compressedContext.critical) :
        compressedContext.critical;
      
      // Merge back together
      const decompressed = this.mergeCriticalData(critical, nonCritical);
      
      this.compressionStats.totalDecompressed++;
      
      return decompressed;
    } catch (error) {
      this.compressionStats.failures++;
      throw new Error(`Decompression failed: ${error.message}`);
    }
  }

  /**
   * Separate critical from non-critical data
   */
  separateCriticalData(context) {
    const critical = {};
    const nonCritical = {};
    
    const separate = (obj, criticalTarget, nonCriticalTarget, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (this.isCritical(key, value, fullPath)) {
          criticalTarget[key] = value;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          criticalTarget[key] = {};
          nonCriticalTarget[key] = {};
          separate(value, criticalTarget[key], nonCriticalTarget[key], fullPath);
        } else {
          nonCriticalTarget[key] = value;
        }
      }
    };
    
    separate(context, critical, nonCritical);
    
    return { critical, nonCritical };
  }

  /**
   * Check if data is critical
   */
  isCritical(key, value, path) {
    // Check key patterns
    for (const pattern of this.criticalPatterns) {
      if (pattern.test(key) || pattern.test(path)) {
        return true;
      }
    }
    
    // Check value patterns
    if (typeof value === 'string') {
      for (const pattern of this.criticalPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }
    
    // Check for marked critical items
    if (typeof value === 'object' && value !== null) {
      if (value.systemCritical || value.userMarked || value.priority > 8) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Merge critical data back into decompressed context
   */
  mergeCriticalData(critical, nonCritical) {
    const merged = { ...nonCritical };
    
    const merge = (target, source) => {
      for (const [key, value] of Object.entries(source)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if (!target[key]) target[key] = {};
          merge(target[key], value);
        } else if (value !== undefined && value !== null && Object.keys(value).length > 0) {
          target[key] = value;
        }
      }
    };
    
    merge(merged, critical);
    return merged;
  }

  /**
   * Determine compression level based on context
   */
  determineCompressionLevel(context, options) {
    if (options.level) {
      return this.compressionLevels[options.level] || this.compressionLevels.moderate;
    }
    
    // Auto-determine based on size and importance
    const size = JSON.stringify(context).length;
    
    if (size < 1000) return this.compressionLevels.none;
    if (size < 10000) return this.compressionLevels.light;
    if (size < 100000) return this.compressionLevels.moderate;
    
    return this.compressionLevels.heavy;
  }

  /**
   * Compress data using zlib
   */
  compressData(data, level) {
    if (level === 0) return data;
    
    const json = JSON.stringify(data);
    const compressed = zlib.deflateSync(json, { level });
    return compressed.toString('base64');
  }

  /**
   * Decompress data using zlib
   */
  decompressData(data) {
    if (typeof data !== 'string') return data;
    
    try {
      const buffer = Buffer.from(data, 'base64');
      const decompressed = zlib.inflateSync(buffer);
      return JSON.parse(decompressed.toString());
    } catch (error) {
      // If decompression fails, assume it's not compressed
      return data;
    }
  }

  /**
   * Update compression statistics
   */
  updateStats(result) {
    this.compressionStats.totalCompressed++;
    
    const currentAvg = this.compressionStats.averageRatio;
    const count = this.compressionStats.totalCompressed;
    
    this.compressionStats.averageRatio = 
      (currentAvg * (count - 1) + result.compressionRatio) / count;
  }

  /**
   * Get compression statistics
   */
  getStats() {
    return { ...this.compressionStats };
  }
}

/**
 * Context reconstruction and emergency recovery
 */
class ContextReconstructor {
  constructor() {
    this.reconstructionCache = new Map();
    this.recoveryPoints = [];
    this.maxRecoveryPoints = 10;
  }

  /**
   * Reconstruct context from compressed state
   * @param {Object} compressedState - Compressed context state
   * @param {Object} options - Reconstruction options
   * @returns {Object} Reconstructed context
   */
  async reconstruct(compressedState, options = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(compressedState);
      if (this.reconstructionCache.has(cacheKey) && !options.skipCache) {
        return this.reconstructionCache.get(cacheKey);
      }
      
      // Decompress if needed
      const decompressor = new CompressionEngine();
      const decompressed = decompressor.decompress(compressedState);
      
      // Rebuild relationships and dependencies
      const withRelationships = this.rebuildRelationships(decompressed);
      
      // Restore metadata
      const withMetadata = this.restoreMetadata(withRelationships);
      
      // Validate reconstructed context
      const validated = this.validateReconstruction(withMetadata);
      
      // Cache the result
      this.reconstructionCache.set(cacheKey, validated);
      
      // Prune cache if too large
      if (this.reconstructionCache.size > 100) {
        const firstKey = this.reconstructionCache.keys().next().value;
        this.reconstructionCache.delete(firstKey);
      }
      
      return {
        context: validated,
        reconstructionTime: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      return this.emergencyRecovery(compressedState, error);
    }
  }

  /**
   * Emergency recovery when normal reconstruction fails
   * @param {Object} state - Failed state
   * @param {Error} error - Original error
   * @returns {Object} Emergency recovered context
   */
  async emergencyRecovery(state, error) {
    console.error('Emergency recovery initiated:', error.message);
    
    const startTime = Date.now();
    
    try {
      // Try to find the nearest recovery point
      const nearestPoint = this.findNearestRecoveryPoint(state);
      
      if (nearestPoint) {
        // Attempt to restore from recovery point
        const recovered = await this.restoreFromRecoveryPoint(nearestPoint);
        
        return {
          context: recovered,
          reconstructionTime: Date.now() - startTime,
          success: true,
          recoveryMethod: 'recovery_point',
          warning: 'Restored from recovery point - some data may be outdated'
        };
      }
      
      // Fallback: Try to extract any salvageable data
      const salvaged = this.salvageData(state);
      
      return {
        context: salvaged,
        reconstructionTime: Date.now() - startTime,
        success: false,
        recoveryMethod: 'salvage',
        warning: 'Emergency recovery - significant data loss possible',
        originalError: error.message
      };
    } catch (recoveryError) {
      // Last resort: Return minimal viable context
      return {
        context: this.getMinimalViableContext(),
        reconstructionTime: Date.now() - startTime,
        success: false,
        recoveryMethod: 'minimal',
        warning: 'Critical failure - returned minimal context',
        errors: [error.message, recoveryError.message]
      };
    }
  }

  /**
   * Create a recovery point
   * @param {Object} context - Context to save as recovery point
   */
  createRecoveryPoint(context) {
    const recoveryPoint = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      context: JSON.parse(JSON.stringify(context)), // Deep clone
      checksum: this.calculateChecksum(context)
    };
    
    this.recoveryPoints.push(recoveryPoint);
    
    // Keep only the most recent recovery points
    if (this.recoveryPoints.length > this.maxRecoveryPoints) {
      this.recoveryPoints.shift();
    }
    
    return recoveryPoint.id;
  }

  /**
   * Find nearest recovery point
   */
  findNearestRecoveryPoint(state) {
    if (this.recoveryPoints.length === 0) return null;
    
    // Try to find a recovery point that matches closely
    const stateStr = JSON.stringify(state);
    const stateChecksum = this.calculateChecksum(state);
    
    // First, try exact checksum match
    for (const point of this.recoveryPoints) {
      if (point.checksum === stateChecksum) {
        return point;
      }
    }
    
    // Return the most recent recovery point
    return this.recoveryPoints[this.recoveryPoints.length - 1];
  }

  /**
   * Restore from recovery point
   */
  async restoreFromRecoveryPoint(recoveryPoint) {
    // Validate the recovery point
    const checksum = this.calculateChecksum(recoveryPoint.context);
    if (checksum !== recoveryPoint.checksum) {
      throw new Error('Recovery point corrupted');
    }
    
    // Return deep clone of the context
    return JSON.parse(JSON.stringify(recoveryPoint.context));
  }

  /**
   * Salvage any recoverable data
   */
  salvageData(state) {
    const salvaged = {
      recovered: true,
      partial: true,
      timestamp: Date.now(),
      data: {}
    };
    
    // Try to extract any valid JSON structures
    const extract = (obj, target) => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const [key, value] of Object.entries(obj)) {
        try {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              target[key] = {};
              extract(value, target[key]);
            } else {
              target[key] = value;
            }
          }
        } catch (e) {
          // Skip corrupted values
        }
      }
    };
    
    extract(state, salvaged.data);
    
    return salvaged;
  }

  /**
   * Get minimal viable context
   */
  getMinimalViableContext() {
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      emergency: true,
      minimal: true,
      data: {},
      metadata: {
        created: new Date().toISOString(),
        reason: 'emergency_recovery_failed'
      }
    };
  }

  /**
   * Rebuild relationships in context
   */
  rebuildRelationships(context) {
    if (!context || typeof context !== 'object') return context;
    
    const rebuilt = { ...context };
    const idMap = new Map();
    
    // First pass: collect all IDs
    const collectIds = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      if (obj.id) {
        idMap.set(obj.id, obj);
      }
      
      for (const value of Object.values(obj)) {
        if (typeof value === 'object') {
          collectIds(value);
        }
      }
    };
    
    collectIds(rebuilt);
    
    // Second pass: rebuild references
    const rebuildRefs = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      // Handle dependency references
      if (obj.dependencies && Array.isArray(obj.dependencies)) {
        obj.dependencies = obj.dependencies.map(depId => 
          idMap.get(depId) || depId
        );
      }
      
      // Handle parent references
      if (obj.parentId && idMap.has(obj.parentId)) {
        obj.parent = idMap.get(obj.parentId);
      }
      
      for (const value of Object.values(obj)) {
        if (typeof value === 'object') {
          rebuildRefs(value);
        }
      }
    };
    
    rebuildRefs(rebuilt);
    
    return rebuilt;
  }

  /**
   * Restore metadata to context
   */
  restoreMetadata(context) {
    if (!context || typeof context !== 'object') return context;
    
    const restored = { ...context };
    
    // Ensure essential metadata exists
    if (!restored.metadata) {
      restored.metadata = {};
    }
    
    const meta = restored.metadata;
    
    // Restore timestamps
    if (!meta.created) {
      meta.created = new Date().toISOString();
    }
    
    if (!meta.lastModified) {
      meta.lastModified = new Date().toISOString();
    }
    
    // Restore version info
    if (!meta.version) {
      meta.version = '1.0.0';
    }
    
    // Restore system info
    if (!meta.system) {
      meta.system = {
        reconstructed: true,
        timestamp: Date.now()
      };
    }
    
    return restored;
  }

  /**
   * Validate reconstructed context
   */
  validateReconstruction(context) {
    const errors = [];
    
    // Check for required fields
    if (!context || typeof context !== 'object') {
      errors.push('Context is not an object');
    }
    
    // Check for data corruption
    try {
      JSON.stringify(context);
    } catch (e) {
      errors.push('Context contains circular references');
    }
    
    // Check metadata
    if (!context.metadata) {
      context.metadata = {};
    }
    
    // Add validation results
    context.metadata.validation = {
      validated: true,
      timestamp: Date.now(),
      errors: errors.length > 0 ? errors : null,
      valid: errors.length === 0
    };
    
    return context;
  }

  /**
   * Calculate checksum for data
   */
  calculateChecksum(data) {
    const str = JSON.stringify(data);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Get cache key for compressed state
   */
  getCacheKey(compressedState) {
    if (typeof compressedState === 'string') {
      return crypto.createHash('md5').update(compressedState).digest('hex');
    }
    return crypto.createHash('md5').update(JSON.stringify(compressedState)).digest('hex');
  }
}

/**
 * Main PromptCompactionResistance class
 */
class PromptCompactionResistance extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      resistanceLevel: options.resistanceLevel || 'high',
      autoResist: options.autoResist !== false,
      preservationTarget: options.preservationTarget || 0.95,
      mlEnabled: options.mlEnabled || false,
      emergencyRecoveryEnabled: options.emergencyRecoveryEnabled !== false,
      ...options
    };
    
    // Initialize components
    this.scorer = new ImportanceScorer();
    this.compressor = new CompressionEngine();
    this.reconstructor = new ContextReconstructor();
    
    // Resistance strategies
    this.strategies = {
      lowMemory: this.lowMemoryStrategy.bind(this),
      highImportance: this.highImportanceStrategy.bind(this),
      balanced: this.balancedStrategy.bind(this),
      aggressive: this.aggressiveStrategy.bind(this)
    };
    
    // Metrics
    this.metrics = {
      totalResistanceEvents: 0,
      successfulResistance: 0,
      failedResistance: 0,
      averagePreservationRate: 0,
      compressionRatio: 0,
      recoveryEvents: 0
    };
    
    // Auto-resistance monitoring
    if (this.options.autoResist) {
      this.startAutoResistance();
    }
  }

  /**
   * Apply prompt compaction resistance
   * @param {Object} context - Context to protect
   * @param {Object} options - Resistance options
   * @returns {Object} Protected context
   */
  async resist(context, options = {}) {
    const startTime = Date.now();
    this.metrics.totalResistanceEvents++;
    
    try {
      // Score all items for importance
      const scoredContext = await this.scoreContext(context);
      
      // Determine strategy based on conditions
      const strategy = this.selectStrategy(scoredContext, options);
      
      // Apply resistance strategy
      const protectedContext = await this.strategies[strategy](scoredContext, options);
      
      // Create recovery point
      if (this.options.emergencyRecoveryEnabled) {
        this.reconstructor.createRecoveryPoint(protectedContext);
      }
      
      // Calculate preservation rate
      const preservationRate = this.calculatePreservationRate(context, protectedContext);
      
      // Update metrics
      this.updateMetrics(preservationRate, true);
      
      // Emit resistance event
      this.emit('resistance', {
        strategy,
        preservationRate,
        duration: Date.now() - startTime,
        originalSize: JSON.stringify(context).length,
        protectedSize: JSON.stringify(protectedContext).length
      });
      
      return {
        context: protectedContext,
        metadata: {
          resistance: {
            applied: true,
            strategy,
            preservationRate,
            timestamp: Date.now(),
            duration: Date.now() - startTime
          }
        }
      };
    } catch (error) {
      this.metrics.failedResistance++;
      this.emit('resistance-error', error);
      
      // Attempt emergency recovery
      if (this.options.emergencyRecoveryEnabled) {
        return await this.emergencyProtection(context, error);
      }
      
      throw error;
    }
  }

  /**
   * Score entire context for importance
   */
  async scoreContext(context) {
    const scored = { ...context };
    const scores = new Map();
    
    const scoreRecursive = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          // Score this object
          const score = this.scorer.calculateScore(value, {
            path: fullPath,
            context: obj
          });
          
          scores.set(fullPath, score);
          
          // Add score metadata to object
          if (!value._resistance) {
            value._resistance = {};
          }
          value._resistance.importance = score.score;
          value._resistance.confidence = score.confidence;
          
          // Recurse
          scoreRecursive(value, fullPath);
        }
      }
    };
    
    scoreRecursive(scored);
    
    scored._resistanceScores = scores;
    
    return scored;
  }

  /**
   * Select appropriate resistance strategy
   */
  selectStrategy(context, options) {
    if (options.strategy) {
      return options.strategy;
    }
    
    // Check memory pressure
    const memoryUsage = process.memoryUsage();
    const memoryPressure = memoryUsage.heapUsed / memoryUsage.heapTotal;
    
    if (memoryPressure > 0.8) {
      return 'lowMemory';
    }
    
    // Check context importance
    const avgImportance = this.calculateAverageImportance(context);
    
    if (avgImportance > 0.7) {
      return 'highImportance';
    }
    
    // Check resistance level setting
    if (this.options.resistanceLevel === 'aggressive') {
      return 'aggressive';
    }
    
    return 'balanced';
  }

  /**
   * Low memory resistance strategy
   */
  async lowMemoryStrategy(context, options) {
    // Aggressively compress non-critical items
    const compressed = this.compressor.compress(context, {
      level: 'heavy',
      compressCritical: false
    });
    
    // Keep only high-importance items uncompressed
    const threshold = 0.8;
    const filtered = this.filterByImportance(context, threshold);
    
    return {
      ...filtered,
      _compressed: compressed,
      _strategy: 'lowMemory'
    };
  }

  /**
   * High importance resistance strategy
   */
  async highImportanceStrategy(context, options) {
    // Minimal compression, maximum preservation
    const compressed = this.compressor.compress(context, {
      level: 'light',
      compressCritical: false
    });
    
    // Keep all items with importance > 0.5
    const threshold = 0.5;
    const filtered = this.filterByImportance(context, threshold);
    
    return {
      ...filtered,
      _compressed: compressed,
      _strategy: 'highImportance'
    };
  }

  /**
   * Balanced resistance strategy
   */
  async balancedStrategy(context, options) {
    // Moderate compression
    const compressed = this.compressor.compress(context, {
      level: 'moderate',
      compressCritical: false
    });
    
    // Keep items with importance > 0.6
    const threshold = 0.6;
    const filtered = this.filterByImportance(context, threshold);
    
    return {
      ...filtered,
      _compressed: compressed,
      _strategy: 'balanced'
    };
  }

  /**
   * Aggressive resistance strategy
   */
  async aggressiveStrategy(context, options) {
    // No compression, full preservation
    // Reorganize for maximum resistance
    const reorganized = this.reorganizeForResistance(context);
    
    // Add redundancy for critical items
    const withRedundancy = this.addRedundancy(reorganized);
    
    return {
      ...withRedundancy,
      _strategy: 'aggressive',
      _redundancy: true
    };
  }

  /**
   * Filter context by importance threshold
   */
  filterByImportance(context, threshold) {
    const filtered = {};
    
    const filter = (source, target, path = '') => {
      for (const [key, value] of Object.entries(source)) {
        const fullPath = path ? `${path}.${key}` : key;
        
        // Always keep system-critical items
        if (value && value._resistance && value._resistance.importance >= threshold) {
          target[key] = value;
        } else if (value && value.systemCritical) {
          target[key] = value;
        } else if (typeof value === 'object' && value !== null && !value._resistance) {
          // Recurse into objects without scores
          target[key] = {};
          filter(value, target[key], fullPath);
          
          // Remove empty objects
          if (Object.keys(target[key]).length === 0) {
            delete target[key];
          }
        }
      }
    };
    
    filter(context, filtered);
    
    return filtered;
  }

  /**
   * Reorganize context for maximum resistance
   */
  reorganizeForResistance(context) {
    const reorganized = {
      critical: {},
      important: {},
      standard: {},
      low: {}
    };
    
    const organize = (source) => {
      for (const [key, value] of Object.entries(source)) {
        if (!value || typeof value !== 'object') continue;
        
        const importance = value._resistance?.importance || 0;
        
        if (value.systemCritical || importance >= 0.9) {
          reorganized.critical[key] = value;
        } else if (importance >= 0.7) {
          reorganized.important[key] = value;
        } else if (importance >= 0.4) {
          reorganized.standard[key] = value;
        } else {
          reorganized.low[key] = value;
        }
      }
    };
    
    organize(context);
    
    return reorganized;
  }

  /**
   * Add redundancy for critical items
   */
  addRedundancy(context) {
    const withRedundancy = { ...context };
    
    // Create backup copies of critical items
    if (context.critical) {
      withRedundancy._backup = {
        critical: JSON.parse(JSON.stringify(context.critical)),
        timestamp: Date.now(),
        checksum: this.reconstructor.calculateChecksum(context.critical)
      };
    }
    
    return withRedundancy;
  }

  /**
   * Emergency protection when normal resistance fails
   */
  async emergencyProtection(context, error) {
    this.metrics.recoveryEvents++;
    
    try {
      // Attempt minimal preservation
      const minimal = {
        emergency: true,
        timestamp: Date.now(),
        error: error.message,
        preserved: {}
      };
      
      // Try to preserve at least critical items
      for (const [key, value] of Object.entries(context)) {
        if (value && value.systemCritical) {
          minimal.preserved[key] = value;
        }
      }
      
      return {
        context: minimal,
        metadata: {
          resistance: {
            applied: false,
            emergency: true,
            error: error.message,
            timestamp: Date.now()
          }
        }
      };
    } catch (emergencyError) {
      // Return absolute minimum
      return {
        context: { failed: true },
        metadata: {
          resistance: {
            applied: false,
            failed: true,
            errors: [error.message, emergencyError.message]
          }
        }
      };
    }
  }

  /**
   * Calculate average importance across context
   */
  calculateAverageImportance(context) {
    if (!context._resistanceScores) return 0.5;
    
    const scores = Array.from(context._resistanceScores.values());
    if (scores.length === 0) return 0.5;
    
    const sum = scores.reduce((acc, score) => acc + score.score, 0);
    return sum / scores.length;
  }

  /**
   * Calculate preservation rate
   */
  calculatePreservationRate(original, protectedContext) {
    const originalKeys = this.countKeys(original);
    const protectedKeys = this.countKeys(protectedContext);
    
    return protectedKeys / Math.max(1, originalKeys);
  }

  /**
   * Count total keys in object
   */
  countKeys(obj) {
    let count = 0;
    
    const counter = (o) => {
      if (!o || typeof o !== 'object') return;
      
      for (const value of Object.values(o)) {
        count++;
        if (typeof value === 'object' && value !== null) {
          counter(value);
        }
      }
    };
    
    counter(obj);
    return count;
  }

  /**
   * Update metrics
   */
  updateMetrics(preservationRate, success) {
    if (success) {
      this.metrics.successfulResistance++;
      
      const current = this.metrics.averagePreservationRate;
      const count = this.metrics.successfulResistance;
      
      this.metrics.averagePreservationRate = 
        (current * (count - 1) + preservationRate) / count;
    } else {
      this.metrics.failedResistance++;
    }
    
    this.metrics.compressionRatio = this.compressor.getStats().averageRatio;
  }

  /**
   * Start automatic resistance monitoring
   */
  startAutoResistance() {
    // Monitor memory usage
    this.resistanceInterval = setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const memoryPressure = memoryUsage.heapUsed / memoryUsage.heapTotal;
      
      if (memoryPressure > 0.7) {
        this.emit('memory-pressure', {
          pressure: memoryPressure,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal
        });
      }
    }, 5000);
  }

  /**
   * Stop automatic resistance monitoring
   */
  stopAutoResistance() {
    if (this.resistanceInterval) {
      clearInterval(this.resistanceInterval);
      this.resistanceInterval = null;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      compressionStats: this.compressor.getStats(),
      recoveryPoints: this.reconstructor.recoveryPoints.length,
      cacheSize: this.reconstructor.reconstructionCache.size
    };
  }

  /**
   * Export ML features for training
   */
  exportMLFeatures() {
    return this.scorer.exportMLFeatures();
  }

  /**
   * Update ML weights
   */
  updateMLWeights(weights) {
    this.scorer.updateWeights(weights);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopAutoResistance();
    this.reconstructor.reconstructionCache.clear();
    this.reconstructor.recoveryPoints = [];
  }
}

module.exports = PromptCompactionResistance;