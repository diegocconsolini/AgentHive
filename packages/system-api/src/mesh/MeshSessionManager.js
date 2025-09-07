const EventEmitter = require('events');
const path = require('path');
const StorageManager = require('../storage/StorageManager');

/**
 * MeshSessionManager handles lifecycle, persistence, and recovery of mesh sessions
 * Provides checkpoint/restore functionality and session cleanup
 */
class MeshSessionManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Session management configuration
        this.config = {
            maxSessions: options.maxSessions || 100,
            sessionTimeout: options.sessionTimeout || 3600000, // 1 hour
            checkpointInterval: options.checkpointInterval || 30000, // 30 seconds
            enableAutoCleanup: options.enableAutoCleanup !== false,
            retentionPeriod: options.retentionPeriod || 86400000, // 24 hours
            maxCheckpoints: options.maxCheckpoints || 10
        };
        
        // Storage for session persistence
        this.storageManager = new StorageManager({
            baseDir: options.baseDir || '.agent-mesh-sessions',
            dbPath: options.dbPath || path.join(options.baseDir || '.agent-mesh-sessions', 'sessions.db')
        });
        
        // In-memory session tracking
        this.activeSessions = new Map();
        this.sessionHistory = new Map();
        this.checkpointTimers = new Map();
        
        // Session metrics
        this.metrics = {
            totalSessions: 0,
            activeSessions: 0,
            completedSessions: 0,
            failedSessions: 0,
            restoredSessions: 0,
            checkpointsCreated: 0,
            averageSessionDuration: 0
        };
        
        // Auto-cleanup interval
        if (this.config.enableAutoCleanup) {
            this.cleanupInterval = setInterval(() => {
                this.cleanupExpiredSessions();
            }, 300000); // Every 5 minutes
        }
        
        console.log('MeshSessionManager initialized:', this.config);
    }
    
    /**
     * Initialize the session manager and storage
     */
    async initialize() {
        try {
            await this.storageManager.initialize();
            
            // Create mesh-specific tables if they don't exist
            await this.ensureMeshTables();
            
            // Restore active sessions from storage
            await this.restoreActiveSessions();
            
            console.log('MeshSessionManager initialized successfully');
            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize MeshSessionManager:', error);
            throw error;
        }
    }
    
    /**
     * Ensure mesh-specific database tables exist
     */
    async ensureMeshTables() {
        const db = this.storageManager.indexStorage.db;
        
        // Mesh sessions table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS mesh_sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT,
                prompt TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                execution_plan TEXT,
                current_turn INTEGER DEFAULT 0,
                max_turns INTEGER DEFAULT 50,
                token_budget INTEGER DEFAULT 100000,
                tokens_used INTEGER DEFAULT 0,
                cost_usd REAL DEFAULT 0.0,
                success_rate REAL DEFAULT 0.0,
                error_count INTEGER DEFAULT 0,
                metadata TEXT
            )
        `);
        
        // Session checkpoints table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS session_checkpoints (
                checkpoint_id TEXT PRIMARY KEY,
                session_id TEXT,
                checkpoint_number INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                session_state TEXT,
                execution_state TEXT,
                agent_states TEXT,
                turn_number INTEGER,
                tokens_used INTEGER,
                cost_usd REAL,
                FOREIGN KEY (session_id) REFERENCES mesh_sessions(session_id)
            )
        `);
        
        // Agent execution history table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS agent_executions (
                execution_id TEXT PRIMARY KEY,
                session_id TEXT,
                agent_id TEXT,
                task_description TEXT,
                started_at DATETIME,
                completed_at DATETIME,
                duration_ms INTEGER,
                tokens_used INTEGER,
                cost_usd REAL,
                success BOOLEAN,
                result TEXT,
                error_message TEXT,
                FOREIGN KEY (session_id) REFERENCES mesh_sessions(session_id)
            )
        `);
        
        // Task decompositions table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS task_decompositions (
                decomposition_id TEXT PRIMARY KEY,
                session_id TEXT,
                original_task TEXT,
                complexity_level TEXT,
                domain_type TEXT,
                subtasks TEXT,
                execution_plan TEXT,
                estimated_duration INTEGER,
                estimated_cost REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES mesh_sessions(session_id)
            )
        `);
        
        // Mesh metrics table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS mesh_metrics (
                metric_id TEXT PRIMARY KEY,
                session_id TEXT,
                metric_name TEXT,
                metric_value REAL,
                metric_unit TEXT,
                recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES mesh_sessions(session_id)
            )
        `);
        
        console.log('Mesh database tables created/verified');
    }
    
    /**
     * Create a new mesh session
     */
    async createSession(sessionConfig) {
        const sessionId = this.generateSessionId();
        const session = {
            sessionId,
            userId: sessionConfig.userId || 'anonymous',
            prompt: sessionConfig.prompt || '',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            executionPlan: sessionConfig.executionPlan || null,
            currentTurn: 0,
            maxTurns: sessionConfig.maxTurns || 50,
            tokenBudget: sessionConfig.tokenBudget || 100000,
            tokensUsed: 0,
            costUsd: 0.0,
            successRate: 0.0,
            errorCount: 0,
            metadata: sessionConfig.metadata || {},
            
            // Runtime state (not persisted)
            agentStates: new Map(),
            executionHistory: [],
            checkpoints: [],
            lastCheckpoint: null
        };
        
        // Validate session limits
        if (this.activeSessions.size >= this.config.maxSessions) {
            throw new Error(`Maximum active sessions limit reached (${this.config.maxSessions})`);
        }
        
        // Store in memory
        this.activeSessions.set(sessionId, session);
        
        // Persist to database
        await this.persistSession(session);
        
        // Schedule automatic checkpointing
        this.scheduleCheckpointing(sessionId);
        
        // Update metrics
        this.metrics.totalSessions++;
        this.metrics.activeSessions = this.activeSessions.size;
        
        console.log(`Created mesh session: ${sessionId}`);
        this.emit('session-created', { sessionId, session });
        
        return session;
    }
    
    /**
     * Get session by ID
     */
    async getSession(sessionId) {
        // Check active sessions first
        if (this.activeSessions.has(sessionId)) {
            return this.activeSessions.get(sessionId);
        }
        
        // Try to restore from storage
        return await this.restoreSession(sessionId);
    }
    
    /**
     * Update session state
     */
    async updateSession(sessionId, updates) {
        const session = await this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        // Apply updates
        Object.assign(session, updates, {
            updatedAt: new Date().toISOString()
        });
        
        // Persist changes
        await this.persistSession(session);
        
        console.log(`Updated session ${sessionId}:`, Object.keys(updates));
        this.emit('session-updated', { sessionId, updates });
        
        return session;
    }
    
    /**
     * Complete a session
     */
    async completeSession(sessionId, result = {}) {
        const session = await this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        // Update session status
        session.status = result.success ? 'completed' : 'failed';
        session.completedAt = new Date().toISOString();
        session.updatedAt = new Date().toISOString();
        
        if (result.tokensUsed) session.tokensUsed = result.tokensUsed;
        if (result.costUsd) session.costUsd = result.costUsd;
        if (result.successRate !== undefined) session.successRate = result.successRate;
        if (result.errorCount) session.errorCount = result.errorCount;
        
        // Create final checkpoint
        await this.createCheckpoint(sessionId, 'final');
        
        // Move to history
        this.sessionHistory.set(sessionId, session);
        this.activeSessions.delete(sessionId);
        
        // Cancel checkpointing
        this.cancelCheckpointing(sessionId);
        
        // Persist final state
        await this.persistSession(session);
        
        // Update metrics
        this.metrics.activeSessions = this.activeSessions.size;
        if (result.success) {
            this.metrics.completedSessions++;
        } else {
            this.metrics.failedSessions++;
        }
        
        const duration = new Date(session.completedAt) - new Date(session.createdAt);
        this.updateAverageSessionDuration(duration);
        
        console.log(`Completed session ${sessionId} with status: ${session.status}`);
        this.emit('session-completed', { sessionId, session, result });
        
        return session;
    }
    
    /**
     * Create a checkpoint for session recovery
     */
    async createCheckpoint(sessionId, checkpointType = 'auto') {
        const session = await this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        const checkpointId = this.generateCheckpointId(sessionId);
        const checkpointNumber = session.checkpoints.length + 1;
        
        const checkpoint = {
            checkpointId,
            sessionId,
            checkpointNumber,
            type: checkpointType,
            createdAt: new Date().toISOString(),
            sessionState: this.serializeSessionState(session),
            executionState: this.serializeExecutionState(session),
            agentStates: this.serializeAgentStates(session),
            turnNumber: session.currentTurn,
            tokensUsed: session.tokensUsed,
            costUsd: session.costUsd
        };
        
        // Add to session checkpoints
        session.checkpoints.push(checkpoint);
        session.lastCheckpoint = checkpoint;
        
        // Keep only recent checkpoints in memory
        if (session.checkpoints.length > this.config.maxCheckpoints) {
            session.checkpoints.splice(0, session.checkpoints.length - this.config.maxCheckpoints);
        }
        
        // Persist checkpoint to database
        await this.persistCheckpoint(checkpoint);
        
        this.metrics.checkpointsCreated++;
        
        console.log(`Created checkpoint ${checkpointNumber} for session ${sessionId}`);
        this.emit('checkpoint-created', { sessionId, checkpoint });
        
        return checkpoint;
    }
    
    /**
     * Restore session from a specific checkpoint
     */
    async restoreFromCheckpoint(sessionId, checkpointNumber = null) {
        const session = await this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        // Get the checkpoint
        let checkpoint;
        if (checkpointNumber) {
            checkpoint = session.checkpoints.find(cp => cp.checkpointNumber === checkpointNumber);
        } else {
            checkpoint = session.lastCheckpoint;
        }
        
        if (!checkpoint) {
            // Try to load from database
            checkpoint = await this.loadCheckpoint(sessionId, checkpointNumber);
        }
        
        if (!checkpoint) {
            throw new Error(`No checkpoint found for session ${sessionId}`);
        }
        
        // Restore session state from checkpoint
        this.deserializeSessionState(session, checkpoint.sessionState);
        this.deserializeExecutionState(session, checkpoint.executionState);
        this.deserializeAgentStates(session, checkpoint.agentStates);
        
        session.currentTurn = checkpoint.turnNumber;
        session.tokensUsed = checkpoint.tokensUsed;
        session.costUsd = checkpoint.costUsd;
        session.status = 'active';
        session.updatedAt = new Date().toISOString();
        
        // Restart checkpointing
        this.scheduleCheckpointing(sessionId);
        
        this.metrics.restoredSessions++;
        
        console.log(`Restored session ${sessionId} from checkpoint ${checkpoint.checkpointNumber}`);
        this.emit('session-restored', { sessionId, checkpoint });
        
        return session;
    }
    
    /**
     * Record agent execution
     */
    async recordAgentExecution(sessionId, agentExecution) {
        const execution = {
            executionId: this.generateExecutionId(),
            sessionId,
            agentId: agentExecution.agentId,
            taskDescription: agentExecution.taskDescription,
            startedAt: agentExecution.startedAt,
            completedAt: agentExecution.completedAt || new Date().toISOString(),
            durationMs: agentExecution.durationMs,
            tokensUsed: agentExecution.tokensUsed || 0,
            costUsd: agentExecution.costUsd || 0.0,
            success: agentExecution.success !== false,
            result: JSON.stringify(agentExecution.result || {}),
            errorMessage: agentExecution.errorMessage || null
        };
        
        // Persist execution record
        const db = this.storageManager.indexStorage.db;
        const stmt = db.prepare(`
            INSERT INTO agent_executions 
            (execution_id, session_id, agent_id, task_description, started_at, 
             completed_at, duration_ms, tokens_used, cost_usd, success, result, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            execution.executionId, execution.sessionId, execution.agentId,
            execution.taskDescription, execution.startedAt, execution.completedAt,
            execution.durationMs, execution.tokensUsed, execution.costUsd,
            execution.success, execution.result, execution.errorMessage
        ]);
        
        console.log(`Recorded agent execution: ${execution.executionId}`);
        this.emit('agent-execution-recorded', execution);
        
        return execution;
    }
    
    /**
     * Record task decomposition
     */
    async recordTaskDecomposition(sessionId, decomposition) {
        const decompositionRecord = {
            decompositionId: this.generateDecompositionId(),
            sessionId,
            originalTask: decomposition.originalTask,
            complexityLevel: decomposition.analysis?.complexity || 'unknown',
            domainType: decomposition.analysis?.domain || 'general',
            subtasks: JSON.stringify(decomposition.dag?.nodes || []),
            executionPlan: JSON.stringify(decomposition.executionPlan || {}),
            estimatedDuration: decomposition.estimates?.timeSeconds || 0,
            estimatedCost: decomposition.estimates?.costUsd || 0.0,
            createdAt: new Date().toISOString()
        };
        
        // Persist decomposition record
        const db = this.storageManager.indexStorage.db;
        const stmt = db.prepare(`
            INSERT INTO task_decompositions
            (decomposition_id, session_id, original_task, complexity_level, domain_type,
             subtasks, execution_plan, estimated_duration, estimated_cost, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            decompositionRecord.decompositionId, decompositionRecord.sessionId,
            decompositionRecord.originalTask, decompositionRecord.complexityLevel,
            decompositionRecord.domainType, decompositionRecord.subtasks,
            decompositionRecord.executionPlan, decompositionRecord.estimatedDuration,
            decompositionRecord.estimatedCost, decompositionRecord.createdAt
        ]);
        
        console.log(`Recorded task decomposition: ${decompositionRecord.decompositionId}`);
        this.emit('decomposition-recorded', decompositionRecord);
        
        return decompositionRecord;
    }
    
    /**
     * Schedule automatic checkpointing for a session
     */
    scheduleCheckpointing(sessionId) {
        // Cancel existing timer
        this.cancelCheckpointing(sessionId);
        
        // Schedule new checkpoint
        const timer = setInterval(async () => {
            try {
                await this.createCheckpoint(sessionId, 'auto');
            } catch (error) {
                console.error(`Auto-checkpoint failed for session ${sessionId}:`, error);
            }
        }, this.config.checkpointInterval);
        
        this.checkpointTimers.set(sessionId, timer);
    }
    
    /**
     * Cancel checkpointing for a session
     */
    cancelCheckpointing(sessionId) {
        if (this.checkpointTimers.has(sessionId)) {
            clearInterval(this.checkpointTimers.get(sessionId));
            this.checkpointTimers.delete(sessionId);
        }
    }
    
    /**
     * Persist session to database
     */
    async persistSession(session) {
        const db = this.storageManager.indexStorage.db;
        
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO mesh_sessions
            (session_id, user_id, prompt, status, created_at, updated_at, completed_at,
             execution_plan, current_turn, max_turns, token_budget, tokens_used,
             cost_usd, success_rate, error_count, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            session.sessionId, session.userId, session.prompt, session.status,
            session.createdAt, session.updatedAt, session.completedAt,
            JSON.stringify(session.executionPlan), session.currentTurn,
            session.maxTurns, session.tokenBudget, session.tokensUsed,
            session.costUsd, session.successRate, session.errorCount,
            JSON.stringify(session.metadata)
        ]);
    }
    
    /**
     * Persist checkpoint to database
     */
    async persistCheckpoint(checkpoint) {
        const db = this.storageManager.indexStorage.db;
        
        const stmt = db.prepare(`
            INSERT INTO session_checkpoints
            (checkpoint_id, session_id, checkpoint_number, created_at,
             session_state, execution_state, agent_states, turn_number,
             tokens_used, cost_usd)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            checkpoint.checkpointId, checkpoint.sessionId, checkpoint.checkpointNumber,
            checkpoint.createdAt, checkpoint.sessionState, checkpoint.executionState,
            checkpoint.agentStates, checkpoint.turnNumber, checkpoint.tokensUsed,
            checkpoint.costUsd
        ]);
    }
    
    /**
     * Restore active sessions from storage
     */
    async restoreActiveSessions() {
        const db = this.storageManager.indexStorage.db;
        
        try {
            const sessions = db.prepare(`
                SELECT * FROM mesh_sessions 
                WHERE status = 'active' 
                ORDER BY updated_at DESC
            `).all();
            
            for (const sessionData of sessions) {
                const session = await this.deserializeSessionFromDb(sessionData);
                if (session) {
                    this.activeSessions.set(session.sessionId, session);
                    this.scheduleCheckpointing(session.sessionId);
                }
            }
            
            this.metrics.activeSessions = this.activeSessions.size;
            console.log(`Restored ${this.activeSessions.size} active sessions`);
        } catch (error) {
            console.error('Failed to restore active sessions:', error);
        }
    }
    
    /**
     * Restore specific session from storage
     */
    async restoreSession(sessionId) {
        const db = this.storageManager.indexStorage.db;
        
        const sessionData = db.prepare(`
            SELECT * FROM mesh_sessions WHERE session_id = ?
        `).get(sessionId);
        
        if (!sessionData) {
            return null;
        }
        
        return await this.deserializeSessionFromDb(sessionData);
    }
    
    /**
     * Deserialize session from database record
     */
    async deserializeSessionFromDb(sessionData) {
        try {
            const session = {
                sessionId: sessionData.session_id,
                userId: sessionData.user_id,
                prompt: sessionData.prompt,
                status: sessionData.status,
                createdAt: sessionData.created_at,
                updatedAt: sessionData.updated_at,
                completedAt: sessionData.completed_at,
                executionPlan: JSON.parse(sessionData.execution_plan || '{}'),
                currentTurn: sessionData.current_turn,
                maxTurns: sessionData.max_turns,
                tokenBudget: sessionData.token_budget,
                tokensUsed: sessionData.tokens_used,
                costUsd: sessionData.cost_usd,
                successRate: sessionData.success_rate,
                errorCount: sessionData.error_count,
                metadata: JSON.parse(sessionData.metadata || '{}'),
                
                // Runtime state
                agentStates: new Map(),
                executionHistory: [],
                checkpoints: [],
                lastCheckpoint: null
            };
            
            return session;
        } catch (error) {
            console.error(`Failed to deserialize session ${sessionData.session_id}:`, error);
            return null;
        }
    }
    
    /**
     * Session state serialization methods
     */
    
    serializeSessionState(session) {
        return JSON.stringify({
            sessionId: session.sessionId,
            userId: session.userId,
            status: session.status,
            currentTurn: session.currentTurn,
            tokensUsed: session.tokensUsed,
            costUsd: session.costUsd,
            successRate: session.successRate,
            errorCount: session.errorCount,
            metadata: session.metadata
        });
    }
    
    deserializeSessionState(session, serializedState) {
        const state = JSON.parse(serializedState);
        Object.assign(session, state);
    }
    
    serializeExecutionState(session) {
        return JSON.stringify({
            executionPlan: session.executionPlan,
            executionHistory: session.executionHistory
        });
    }
    
    deserializeExecutionState(session, serializedState) {
        const state = JSON.parse(serializedState);
        session.executionPlan = state.executionPlan;
        session.executionHistory = state.executionHistory || [];
    }
    
    serializeAgentStates(session) {
        const agentStatesObj = {};
        for (const [agentId, state] of session.agentStates.entries()) {
            agentStatesObj[agentId] = state;
        }
        return JSON.stringify(agentStatesObj);
    }
    
    deserializeAgentStates(session, serializedStates) {
        const statesObj = JSON.parse(serializedStates);
        session.agentStates = new Map();
        for (const [agentId, state] of Object.entries(statesObj)) {
            session.agentStates.set(agentId, state);
        }
    }
    
    /**
     * Cleanup expired sessions
     */
    async cleanupExpiredSessions() {
        const now = Date.now();
        const cleanedSessions = [];
        
        for (const [sessionId, session] of this.activeSessions.entries()) {
            const lastActivity = new Date(session.updatedAt).getTime();
            const age = now - lastActivity;
            
            if (age > this.config.sessionTimeout) {
                console.log(`Cleaning up expired session: ${sessionId} (age: ${age}ms)`);
                
                try {
                    await this.completeSession(sessionId, { 
                        success: false, 
                        reason: 'timeout' 
                    });
                    cleanedSessions.push(sessionId);
                } catch (error) {
                    console.error(`Failed to cleanup session ${sessionId}:`, error);
                }
            }
        }
        
        if (cleanedSessions.length > 0) {
            this.emit('sessions-cleaned', { count: cleanedSessions.length, sessions: cleanedSessions });
        }
        
        return cleanedSessions;
    }
    
    /**
     * Utility methods
     */
    
    generateSessionId() {
        return `mesh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateCheckpointId(sessionId) {
        return `cp_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateDecompositionId() {
        return `decomp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    updateAverageSessionDuration(duration) {
        if (this.metrics.averageSessionDuration === 0) {
            this.metrics.averageSessionDuration = duration;
        } else {
            this.metrics.averageSessionDuration = 
                (this.metrics.averageSessionDuration + duration) / 2;
        }
    }
    
    /**
     * Get session statistics
     */
    getStatistics() {
        return {
            ...this.metrics,
            activeSessions: this.activeSessions.size,
            sessionHistory: this.sessionHistory.size,
            checkpointTimers: this.checkpointTimers.size
        };
    }
    
    /**
     * Get all active sessions
     */
    getActiveSessions() {
        return Array.from(this.activeSessions.values());
    }
    
    /**
     * Get session history
     */
    getSessionHistory(limit = 50) {
        return Array.from(this.sessionHistory.values())
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, limit);
    }
    
    /**
     * Shutdown session manager
     */
    async shutdown() {
        console.log('Shutting down MeshSessionManager...');
        
        // Cancel all checkpoint timers
        for (const timer of this.checkpointTimers.values()) {
            clearInterval(timer);
        }
        this.checkpointTimers.clear();
        
        // Cancel cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // Create final checkpoints for active sessions
        const activeSessions = Array.from(this.activeSessions.keys());
        for (const sessionId of activeSessions) {
            try {
                await this.createCheckpoint(sessionId, 'shutdown');
            } catch (error) {
                console.error(`Failed to create shutdown checkpoint for ${sessionId}:`, error);
            }
        }
        
        // Clear memory structures
        this.activeSessions.clear();
        this.sessionHistory.clear();
        
        this.emit('shutdown');
        console.log('MeshSessionManager shutdown complete');
    }
}

module.exports = MeshSessionManager;