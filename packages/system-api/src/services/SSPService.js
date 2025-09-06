const { randomUUID } = require('crypto');

/**
 * Stable Success Patterns Service
 * Implements procedural memory through pattern learning and success prediction
 */
class SSPService {
  constructor(storageManager, agentMemoryManager) {
    this.storage = storageManager;
    this.memory = agentMemoryManager;
    this.minPatternLength = 2;
    this.maxPatternLength = 5;
    this.minSuccessesForPattern = 3;
  }

  /**
   * Record a procedure execution in the database
   */
  async recordProcedureExecution(contextId, agentId, sessionId, success, executionTime, patternId = null) {
    const execution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      context_id: contextId,
      agent_id: agentId,
      session_id: sessionId,
      success: success ? 1 : 0,
      execution_time: executionTime,
      pattern_id: patternId,
      created_at: Date.now()
    };

    const insertQuery = `
      INSERT INTO procedure_executions 
      (id, context_id, agent_id, session_id, success, execution_time, pattern_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.storage.indexStorage.runQuery(insertQuery, [
      execution.id,
      execution.context_id,
      execution.agent_id,
      execution.session_id,
      execution.success,
      execution.execution_time,
      execution.pattern_id,
      execution.created_at
    ]);

    console.log(`SSP: Recorded execution ${execution.id} - ${success ? 'SUCCESS' : 'FAILURE'} in ${executionTime}ms`);
    return execution;
  }

  /**
   * Detect successful procedure sequences using existing Context queries
   */
  async detectPatterns(userId, sessionId, agentId) {
    try {
      // Get recent successful executions for this agent/session
      const query = `
        SELECT pe.*, c.type, c.hierarchy_path, c.content
        FROM procedure_executions pe
        JOIN contexts c ON pe.context_id = c.id
        WHERE pe.agent_id = ? AND pe.session_id = ? AND pe.success = 1
        ORDER BY pe.created_at DESC
        LIMIT 20
      `;

      const recentExecutions = await this.storage.indexStorage.allQuery(query, [agentId, sessionId]);
      
      if (recentExecutions.length < 2) {
        console.log(`SSP: Not enough executions for pattern detection (${recentExecutions.length})`);
        return [];
      }

      const patterns = [];
      
      // Generate sequences of different lengths
      for (let length = this.minPatternLength; length <= Math.min(this.maxPatternLength, recentExecutions.length); length++) {
        for (let start = 0; start <= recentExecutions.length - length; start++) {
          const sequence = recentExecutions.slice(start, start + length);
          const contextIds = sequence.map(e => e.context_id);
          
          await this.recordSuccessPattern(agentId, contextIds, sessionId, userId);
          patterns.push({
            procedures: contextIds,
            length: length,
            avgExecutionTime: sequence.reduce((sum, e) => sum + e.execution_time, 0) / sequence.length
          });
        }
      }

      console.log(`SSP: Detected ${patterns.length} potential patterns for agent ${agentId}`);
      return patterns;
    } catch (error) {
      console.error('SSP: Pattern detection error:', error);
      return [];
    }
  }

  /**
   * Record success pattern using existing agent memory system
   */
  async recordSuccessPattern(agentId, procedureSequence, sessionId, userId) {
    try {
      const memory = await this.memory.getAgentMemory(agentId, userId, sessionId);
      const patternKey = procedureSequence.join('->');
      const existingKnowledge = memory.knowledge[`pattern:${patternKey}`];

      if (existingKnowledge) {
        // Update existing pattern
        existingKnowledge.value.successCount++;
        existingKnowledge.value.totalCount++;
        existingKnowledge.confidence = Math.min(1.0, existingKnowledge.confidence + 0.1);
        existingKnowledge.value.lastUsed = Date.now();
      } else {
        // Create new pattern using existing knowledge system
        await memory.addKnowledge({
          domain: 'procedural-patterns',
          concept: `pattern:${patternKey}`,
          value: {
            procedures: procedureSequence,
            successCount: 1,
            totalCount: 1,
            firstSeen: Date.now(),
            lastUsed: Date.now(),
            agentId: agentId
          },
          confidence: 0.5
        });
      }

      // Save using existing method
      await this.memory.saveAgentMemory(memory);
      
      console.log(`SSP: Recorded pattern ${patternKey} for agent ${agentId}`);
      return `pattern:${patternKey}`;
    } catch (error) {
      console.error('SSP: Pattern recording error:', error);
      return null;
    }
  }

  /**
   * Get relevant patterns for current procedure
   */
  async getRelevantPatterns(agentId, currentProcedure, userId, sessionId) {
    try {
      const memory = await this.memory.getAgentMemory(agentId, userId, sessionId);
      const relevantPatterns = [];

      // Search existing knowledge for patterns containing current procedure
      for (const [concept, knowledge] of Object.entries(memory.knowledge)) {
        if (concept.startsWith('pattern:') && knowledge.value.procedures.includes(currentProcedure)) {
          const successRate = knowledge.value.successCount / knowledge.value.totalCount;
          if (successRate > 0.6) { // Only high-success patterns
            relevantPatterns.push({
              patternId: concept,
              procedures: knowledge.value.procedures,
              successRate,
              confidence: knowledge.confidence,
              lastUsed: knowledge.value.lastUsed,
              totalExecutions: knowledge.value.totalCount
            });
          }
        }
      }

      // Sort by success rate and confidence
      relevantPatterns.sort((a, b) => (b.successRate * b.confidence) - (a.successRate * a.confidence));
      
      console.log(`SSP: Found ${relevantPatterns.length} relevant patterns for procedure ${currentProcedure}`);
      return relevantPatterns.slice(0, 5); // Top 5 patterns
    } catch (error) {
      console.error('SSP: Pattern retrieval error:', error);
      return [];
    }
  }

  /**
   * Predict success using existing patterns
   */
  async predictProcedureSuccess(procedureId, agentId, userId, sessionId) {
    try {
      const context = await this.storage.read(procedureId);
      if (!context) {
        console.log(`SSP: Context not found for prediction: ${procedureId}`);
        return 0.5; // Default probability
      }

      const baseSuccess = context.getProcedureSuccessRate() || 0.5;
      const patterns = await this.getRelevantPatterns(agentId, procedureId, userId, sessionId);

      let patternBoost = 0;
      for (const pattern of patterns.slice(0, 3)) { // Top 3 patterns
        patternBoost += (pattern.successRate * pattern.confidence) * 0.05; // Max 15% boost
      }

      const prediction = Math.min(0.95, baseSuccess + patternBoost);
      
      console.log(`SSP: Predicted success for ${procedureId}: ${Math.round(prediction * 100)}% (base: ${Math.round(baseSuccess * 100)}%, boost: +${Math.round(patternBoost * 100)}%)`);
      return prediction;
    } catch (error) {
      console.error('SSP: Prediction error:', error);
      return 0.5;
    }
  }

  /**
   * Get SSP analytics for an agent
   */
  async getAgentSSPAnalytics(agentId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_executions,
          SUM(success) as successful_executions,
          AVG(execution_time) as avg_execution_time,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(DISTINCT context_id) as unique_procedures
        FROM procedure_executions 
        WHERE agent_id = ?
      `;

      const stats = await this.storage.indexStorage.getQuery(query, [agentId]);
      
      const successRate = stats.total_executions > 0 ? 
        (stats.successful_executions / stats.total_executions) : 0;

      return {
        agentId,
        totalExecutions: stats.total_executions || 0,
        successfulExecutions: stats.successful_executions || 0,
        successRate: successRate,
        avgExecutionTime: Math.round(stats.avg_execution_time || 0),
        uniqueSessions: stats.unique_sessions || 0,
        uniqueProcedures: stats.unique_procedures || 0
      };
    } catch (error) {
      console.error('SSP: Analytics error:', error);
      return {
        agentId,
        totalExecutions: 0,
        successfulExecutions: 0,
        successRate: 0,
        avgExecutionTime: 0,
        uniqueSessions: 0,
        uniqueProcedures: 0
      };
    }
  }

  /**
   * Share successful patterns across agents
   */
  async shareSuccessfulPatterns(sourceAgentId, targetAgentIds, userId, sessionId) {
    try {
      const sourceMemory = await this.memory.getAgentMemory(sourceAgentId, userId, sessionId);
      let sharedCount = 0;

      for (const [concept, knowledge] of Object.entries(sourceMemory.knowledge)) {
        if (concept.startsWith('pattern:') && knowledge.value.successCount >= this.minSuccessesForPattern) {
          const successRate = knowledge.value.successCount / knowledge.value.totalCount;
          
          if (successRate > 0.8) { // Only share highly successful patterns
            for (const targetAgentId of targetAgentIds) {
              await this.recordSuccessPattern(
                targetAgentId, 
                knowledge.value.procedures, 
                sessionId, 
                userId
              );
            }
            sharedCount++;
          }
        }
      }

      console.log(`SSP: Shared ${sharedCount} patterns from ${sourceAgentId} to ${targetAgentIds.length} agents`);
      return sharedCount;
    } catch (error) {
      console.error('SSP: Pattern sharing error:', error);
      return 0;
    }
  }
}

module.exports = SSPService;