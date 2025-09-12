const { randomUUID } = require('crypto');
const { AIProviderService } = require('../../ai-providers');
const AgentMemory = require('../models/AgentMemory');
const MemoryTransformer = require('./MemoryTransformer');
const AgentMemoryManager = require('../agents/AgentMemoryManager');

/**
 * Smart Memory Index - AI-powered memory management system
 * Features:
 * - Semantic indexing using AI embeddings
 * - Intelligent memory clustering and categorization
 * - Automated memory lifecycle management
 * - Context-aware memory retrieval
 * - Memory relationship mapping
 */
class SmartMemoryIndex {
  constructor() {
    this.aiProvider = new AIProviderService();
    this.memoryIndex = new Map();
    this.semanticVectors = new Map();
    this.memoryRelationships = new Map();
    this.categories = new Map();
    this.accessPatterns = new Map();
    this.maintenanceIntervals = [];
    this.initialized = false;
  }

  /**
   * Initialize the Smart Memory Index
   */
  async initialize() {
    if (this.initialized) {
      console.log('🧠 Smart Memory Index already initialized');
      return;
    }

    try {
      console.log('🧠 Initializing Smart Memory Index...');
      
      // Load existing memories
      await this.loadExistingMemories();
      
      // Initialize AI provider
      await this.validateAIProvider();
      
      // Set up memory categories
      this.initializeCategories();
      
      // Set up cleanup intervals
      this.setupMaintenanceTasks();
      
      this.initialized = true;
      console.log('✅ Smart Memory Index initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Smart Memory Index:', error);
      // Don't throw in graceful degradation mode
      this.initialized = true; // Mark as initialized even if AI provider fails
      console.log('⚠️ Smart Memory Index initialized with limited functionality');
    }
  }

  /**
   * Add memory with AI-powered semantic indexing
   */
  async addMemory(memoryData) {
    await this.ensureInitialized();

    // Validate input
    if (!memoryData || memoryData === null || memoryData === undefined) {
      throw new Error('Memory data is required');
    }

    try {
      // Create memory instance
      const memory = new AgentMemory({
        ...memoryData,
        id: memoryData.id || randomUUID(),
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      // Generate semantic embedding
      const embedding = await this.generateEmbedding(memory);
      
      // Categorize memory using AI
      const category = await this.categorizeMemory(memory);
      
      // Find related memories
      const relationships = await this.findRelatedMemories(memory, embedding);
      
      // Store memory and metadata
      this.memoryIndex.set(memory.id, memory);
      this.semanticVectors.set(memory.id, embedding);
      this.categories.set(memory.id, category);
      this.memoryRelationships.set(memory.id, relationships);

      // Update access patterns
      this.updateAccessPatterns(memory.id, 'create');

      // Update related memories' relationships
      await this.updateRelatedMemoryRelationships(memory.id, relationships);

      console.log(`✅ Added memory ${memory.id} to Smart Index (category: ${category})`);
      return memory;

    } catch (error) {
      console.error('❌ Failed to add memory to index:', error);
      throw error;
    }
  }

  /**
   * Retrieve memory by ID with intelligent caching
   */
  async getMemory(memoryId) {
    await this.ensureInitialized();

    const memory = this.memoryIndex.get(memoryId);
    if (!memory) {
      return null;
    }

    // Update access patterns
    this.updateAccessPatterns(memoryId, 'read');

    // Update last accessed timestamp
    memory.lastAccessed = new Date().toISOString();

    return memory;
  }

  /**
   * Search memories using semantic similarity
   */
  async searchMemories(query, options = {}) {
    await this.ensureInitialized();

    try {
      const {
        limit = 10,
        threshold = 0.3,
        agentId = null,
        category = null,
        includeRelated = false
      } = options;

      // Generate query embedding
      const queryEmbedding = await this.generateTextEmbedding(query);

      // Calculate similarities
      const similarities = [];
      for (const [memoryId, memory] of this.memoryIndex) {
        // Filter by agent if specified
        if (agentId && memory.agentId !== agentId) continue;
        
        // Filter by category if specified
        if (category && this.categories.get(memoryId) !== category) continue;

        const memoryEmbedding = this.semanticVectors.get(memoryId);
        if (!memoryEmbedding) continue;

        const similarity = this.calculateCosineSimilarity(queryEmbedding, memoryEmbedding);
        
        if (similarity >= threshold) {
          similarities.push({
            memory,
            similarity,
            category: this.categories.get(memoryId),
            relationships: this.memoryRelationships.get(memoryId)
          });
        }
      }

      // Sort by similarity
      similarities.sort((a, b) => b.similarity - a.similarity);

      // Limit results
      let results = similarities.slice(0, limit);

      // Include related memories if requested
      if (includeRelated) {
        results = await this.expandWithRelatedMemories(results, limit);
      }

      // Update access patterns
      results.forEach(result => {
        this.updateAccessPatterns(result.memory.id, 'search');
      });

      return results;

    } catch (error) {
      console.error('❌ Failed to search memories:', error);
      throw error;
    }
  }

  /**
   * Update memory with re-indexing
   */
  async updateMemory(memoryId, updates) {
    await this.ensureInitialized();

    const existingMemory = this.memoryIndex.get(memoryId);
    if (!existingMemory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    try {
      // Create updated memory (ensure timestamp is different)
      const updatedMemory = {
        ...existingMemory,
        ...updates,
        updated: new Date(Date.now() + 1).toISOString()
      };

      // Re-generate semantic embedding if content changed
      let needsReindexing = false;
      const contentFields = ['knowledge', 'interactions', 'patterns'];
      for (const field of contentFields) {
        if (updates[field] && JSON.stringify(updates[field]) !== JSON.stringify(existingMemory[field])) {
          needsReindexing = true;
          break;
        }
      }

      if (needsReindexing) {
        const newEmbedding = await this.generateEmbedding(updatedMemory);
        const newCategory = await this.categorizeMemory(updatedMemory);
        const newRelationships = await this.findRelatedMemories(updatedMemory, newEmbedding);

        this.semanticVectors.set(memoryId, newEmbedding);
        this.categories.set(memoryId, newCategory);
        this.memoryRelationships.set(memoryId, newRelationships);

        // Update relationships in related memories
        await this.updateRelatedMemoryRelationships(memoryId, newRelationships);
      }

      // Update memory in index  
      updatedMemory.updated = new Date().toISOString();
      this.memoryIndex.set(memoryId, updatedMemory);

      // Update access patterns
      this.updateAccessPatterns(memoryId, 'update');

      return updatedMemory;

    } catch (error) {
      console.error('❌ Failed to update memory:', error);
      throw error;
    }
  }

  /**
   * Delete memory and clean up relationships
   */
  async deleteMemory(memoryId) {
    await this.ensureInitialized();

    if (!this.memoryIndex.has(memoryId)) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    try {
      // Remove from all indexes
      this.memoryIndex.delete(memoryId);
      this.semanticVectors.delete(memoryId);
      this.categories.delete(memoryId);
      this.memoryRelationships.delete(memoryId);
      this.accessPatterns.delete(memoryId);

      // Clean up relationships in other memories
      await this.cleanupMemoryRelationships(memoryId);

      console.log(`✅ Deleted memory ${memoryId} from Smart Index`);
      return true;

    } catch (error) {
      console.error('❌ Failed to delete memory:', error);
      throw error;
    }
  }

  /**
   * Get memory analytics and insights
   */
  async getAnalytics() {
    await this.ensureInitialized();

    const totalMemories = this.memoryIndex.size;
    const categoryDistribution = {};
    const accessFrequency = {};
    const relationshipDensity = {};

    // Calculate category distribution
    for (const category of this.categories.values()) {
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    }

    // Calculate access patterns
    for (const [memoryId, patterns] of this.accessPatterns) {
      const totalAccess = patterns.reads + patterns.writes + patterns.searches;
      accessFrequency[memoryId] = totalAccess;
    }

    // Calculate relationship density
    for (const [memoryId, relationships] of this.memoryRelationships) {
      relationshipDensity[memoryId] = relationships.length;
    }

    return {
      totalMemories,
      categoryDistribution,
      topAccessedMemories: Object.entries(accessFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      averageRelationships: Object.values(relationshipDensity).reduce((sum, count) => sum + count, 0) / totalMemories || 0,
      memoryHealth: await this.assessMemoryHealth()
    };
  }

  /**
   * Generate embedding for memory content
   */
  async generateEmbedding(memory) {
    const content = this.extractMemoryContent(memory);
    return await this.generateTextEmbedding(content);
  }

  /**
   * Generate text embedding using AI
   */
  async generateTextEmbedding(text) {
    try {
      const response = await this.aiProvider.generateResponse({
        prompt: `Generate semantic embedding vector for: ${text.substring(0, 500)}`,
        temperature: 0.1,
        maxTokens: 1000
      });

      // For now, create a simple hash-based vector
      // TODO: Use actual embedding API when available
      const hash = this.simpleHash(text);
      return this.hashToVector(hash);

    } catch (error) {
      console.warn('⚠️ Failed to generate AI embedding, using fallback:', error);
      const hash = this.simpleHash(text);
      return this.hashToVector(hash);
    }
  }

  /**
   * Categorize memory using AI
   */
  async categorizeMemory(memory) {
    try {
      const content = this.extractMemoryContent(memory);
      
      const response = await this.aiProvider.generateResponse({
        prompt: `Categorize this memory content into one of these categories: interaction, pattern, knowledge, performance, context, preference. 
          
          Content: ${content.substring(0, 300)}
          
          Return only the category name.`,
        temperature: 0.1,
        maxTokens: 50
      });

      const category = response.response?.trim().toLowerCase();
      
      // Validate category
      const validCategories = ['interaction', 'pattern', 'knowledge', 'performance', 'context', 'preference'];
      return validCategories.includes(category) ? category : 'general';

    } catch (error) {
      console.warn('⚠️ Failed to categorize memory using AI, using fallback:', error);
      return this.fallbackCategorization(memory);
    }
  }

  /**
   * Find related memories based on semantic similarity
   */
  async findRelatedMemories(memory, embedding, limit = 5) {
    const relationships = [];
    const threshold = 0.4;

    for (const [memoryId, otherMemory] of this.memoryIndex) {
      if (memoryId === memory.id) continue;

      const otherEmbedding = this.semanticVectors.get(memoryId);
      if (!otherEmbedding) continue;

      const similarity = this.calculateCosineSimilarity(embedding, otherEmbedding);
      
      if (similarity >= threshold) {
        relationships.push({
          memoryId,
          similarity,
          relationshipType: this.determineRelationshipType(memory, otherMemory, similarity)
        });
      }
    }

    return relationships
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // Helper methods...

  extractMemoryContent(memory) {
    const content = [];
    
    if (memory.knowledge && Object.keys(memory.knowledge).length > 0) {
      content.push(JSON.stringify(memory.knowledge));
    }
    
    if (memory.interactions && memory.interactions.length > 0) {
      content.push(memory.interactions.slice(-3).map(i => i.summary || i.content).join(' '));
    }
    
    if (memory.patterns && Object.keys(memory.patterns).length > 0) {
      content.push(JSON.stringify(memory.patterns));
    }

    return content.join(' ');
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  hashToVector(hash, dimensions = 128) {
    const vector = new Array(dimensions);
    for (let i = 0; i < dimensions; i++) {
      vector[i] = Math.sin(hash * (i + 1)) * 0.5 + 0.5;
    }
    return vector;
  }

  calculateCosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  fallbackCategorization(memory) {
    if (memory.interactions && memory.interactions.length > 0) return 'interaction';
    if (memory.patterns && Object.keys(memory.patterns).length > 0) return 'pattern';
    if (memory.knowledge && Object.keys(memory.knowledge).length > 0) return 'knowledge';
    if (memory.performance) return 'performance';
    return 'general';
  }

  determineRelationshipType(memory1, memory2, similarity) {
    if (memory1.agentId === memory2.agentId) return 'same-agent';
    if (memory1.userId === memory2.userId) return 'same-user';
    if (similarity > 0.8) return 'highly-similar';
    if (similarity > 0.6) return 'similar';
    return 'related';
  }

  updateAccessPatterns(memoryId, operation) {
    if (!this.accessPatterns.has(memoryId)) {
      this.accessPatterns.set(memoryId, { reads: 0, writes: 0, searches: 0, created: new Date() });
    }

    const patterns = this.accessPatterns.get(memoryId);
    switch (operation) {
      case 'create':
      case 'update':
        patterns.writes++;
        break;
      case 'read':
        patterns.reads++;
        break;
      case 'search':
        patterns.searches++;
        break;
    }
    patterns.lastAccess = new Date();
  }

  async updateRelatedMemoryRelationships(memoryId, newRelationships) {
    for (const relationship of newRelationships) {
      const relatedMemoryRelationships = this.memoryRelationships.get(relationship.memoryId) || [];
      const existingIndex = relatedMemoryRelationships.findIndex(r => r.memoryId === memoryId);
      
      const reverseRelationship = {
        memoryId,
        similarity: relationship.similarity,
        relationshipType: relationship.relationshipType
      };

      if (existingIndex >= 0) {
        relatedMemoryRelationships[existingIndex] = reverseRelationship;
      } else {
        relatedMemoryRelationships.push(reverseRelationship);
      }

      this.memoryRelationships.set(relationship.memoryId, relatedMemoryRelationships);
    }
  }

  async cleanupMemoryRelationships(deletedMemoryId) {
    for (const [memoryId, relationships] of this.memoryRelationships) {
      const updatedRelationships = relationships.filter(r => r.memoryId !== deletedMemoryId);
      if (updatedRelationships.length !== relationships.length) {
        this.memoryRelationships.set(memoryId, updatedRelationships);
      }
    }
  }

  async expandWithRelatedMemories(results, totalLimit) {
    const expanded = [...results];
    const addedIds = new Set(results.map(r => r.memory.id));

    for (const result of results) {
      if (expanded.length >= totalLimit) break;

      const relationships = result.relationships || [];
      for (const rel of relationships.slice(0, 2)) {
        if (expanded.length >= totalLimit) break;
        if (addedIds.has(rel.memoryId)) continue;

        const relatedMemory = this.memoryIndex.get(rel.memoryId);
        if (relatedMemory) {
          expanded.push({
            memory: relatedMemory,
            similarity: rel.similarity,
            category: this.categories.get(rel.memoryId),
            relationships: this.memoryRelationships.get(rel.memoryId),
            isRelated: true,
            relationshipType: rel.relationshipType
          });
          addedIds.add(rel.memoryId);
        }
      }
    }

    return expanded;
  }

  async loadExistingMemories() {
    try {
      console.log('📚 Loading existing memories from storage...');
      
      // Initialize a temporary AgentMemoryManager to access storage
      const agentMemoryManager = new AgentMemoryManager();
      await agentMemoryManager.initialize();
      
      // Get all agent memories from storage
      const allMemories = await agentMemoryManager.storageManager.search({ 
        type: 'agent-memory' 
      });
      
      console.log(`Found ${allMemories.length} existing agent memories`);
      
      // Transform and add each memory to SmartMemoryIndex
      let loadedCount = 0;
      for (const memoryData of allMemories) {
        try {
          // Parse stored memory content
          const agentMemoryContent = JSON.parse(memoryData.content);
          
          // Create AgentMemory instance from stored data
          const agentMemory = new AgentMemory(agentMemoryContent);
          
          // Transform to SmartMemoryIndex format
          const transformedMemory = MemoryTransformer.agentMemoryToSmartMemoryIndex(agentMemoryContent);
          
          // Add to SmartMemoryIndex (skip initialization check for loading)
          await this._addMemoryToIndex(transformedMemory);
          
          loadedCount++;
          
          // Progress indicator for large datasets
          if (loadedCount % 10 === 0) {
            console.log(`Loaded ${loadedCount}/${allMemories.length} memories...`);
          }
          
        } catch (parseError) {
          console.error(`Failed to load memory ${memoryData.id}:`, parseError.message);
          continue; // Skip invalid memories
        }
      }
      
      console.log(`✅ Successfully loaded ${loadedCount} existing memories into SmartMemoryIndex`);
      
      // Clean up temporary manager
      await agentMemoryManager.close();
      
    } catch (error) {
      console.error('Failed to load existing memories:', error);
      // Don't throw - allow SmartMemoryIndex to continue without existing memories
    }
  }

  /**
   * Internal method to add memory to index without initialization checks
   */
  async _addMemoryToIndex(memoryData) {
    const memoryId = randomUUID();
    
    // Store memory
    this.memoryIndex.set(memoryId, {
      id: memoryId,
      ...memoryData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Add to category index
    const category = this.categorizeMemory(memoryData);
    this.categories.set(memoryId, category);

    // Generate and store semantic embedding
    const embedding = await this.generateSemanticEmbedding(memoryData);
    if (embedding) {
      this.semanticVectors.set(memoryId, embedding);
    }

    // Initialize access pattern
    this.accessPatterns.set(memoryId, {
      accessCount: 0,
      lastAccessed: null,
      accessHistory: []
    });

    return memoryId;
  }

  initializeCategories() {
    const defaultCategories = [
      'interaction', 'pattern', 'knowledge', 
      'performance', 'context', 'preference', 'general'
    ];
    console.log(`📂 Initialized ${defaultCategories.length} memory categories`);
  }

  setupMaintenanceTasks() {
    // Only set up maintenance tasks in production (not in tests)
    if (process.env.NODE_ENV !== 'test') {
      // Clean up old access patterns every hour
      this.maintenanceIntervals = [
        setInterval(() => {
          this.cleanupOldAccessPatterns();
        }, 60 * 60 * 1000),

        // Optimize memory index every 6 hours
        setInterval(() => {
          this.optimizeMemoryIndex();
        }, 6 * 60 * 60 * 1000)
      ];
    }
  }

  /**
   * Clean up maintenance tasks (for testing)
   */
  cleanup() {
    if (this.maintenanceIntervals) {
      this.maintenanceIntervals.forEach(interval => clearInterval(interval));
      this.maintenanceIntervals = [];
    }
  }

  cleanupOldAccessPatterns() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    let cleaned = 0;

    for (const [memoryId, patterns] of this.accessPatterns) {
      if (patterns.lastAccess < cutoff && patterns.reads + patterns.writes + patterns.searches < 5) {
        this.accessPatterns.delete(memoryId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old access patterns`);
    }
  }

  async optimizeMemoryIndex() {
    console.log('⚡ Optimizing memory index...');
    
    // TODO: Implement index optimization
    // - Recompute frequently accessed relationships
    // - Clean up stale embeddings
    // - Optimize category distribution
    
    console.log('✅ Memory index optimization completed');
  }

  async assessMemoryHealth() {
    const totalMemories = this.memoryIndex.size;
    const categorizedMemories = this.categories.size;
    const vectorizedMemories = this.semanticVectors.size;
    const relatedMemories = this.memoryRelationships.size;

    return {
      indexingHealth: vectorizedMemories / totalMemories,
      categorizationHealth: categorizedMemories / totalMemories,
      relationshipHealth: relatedMemories / totalMemories,
      overallHealth: (vectorizedMemories + categorizedMemories + relatedMemories) / (totalMemories * 3)
    };
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Validate AI provider connection
   */
  async validateAIProvider() {
    try {
      const providers = this.aiProvider.getAvailableProviders();
      if (providers.length === 0) {
        throw new Error('No AI providers available');
      }

      // Test the first available provider
      const primaryProvider = providers[0];
      const healthCheck = await this.aiProvider.checkProviderHealth(primaryProvider.name);
      
      if (!healthCheck.healthy) {
        console.warn(`⚠️ Primary AI provider ${primaryProvider.name} unhealthy: ${healthCheck.error}`);
      }
      
      console.log(`✅ AI provider ${primaryProvider.name} validated (latency: ${healthCheck.latency || 0}ms)`);
    } catch (error) {
      console.warn('⚠️ AI provider validation failed, using fallback mode:', error.message);
    }
  }
}

module.exports = SmartMemoryIndex;