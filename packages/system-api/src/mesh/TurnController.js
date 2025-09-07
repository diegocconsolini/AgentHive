const EventEmitter = require('events');

/**
 * TurnController manages execution limits and controls for mesh operations
 * Prevents runaway execution, enforces budgets, and provides completion mechanisms
 */
class TurnController extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Default limits and budgets
        this.defaultLimits = {
            maxTurns: options.maxTurns || 50,
            maxTokens: options.maxTokens || 100000,
            maxTimeMs: options.maxTimeMs || 300000, // 5 minutes
            maxCostUsd: options.maxCostUsd || 10.0,
            warningThresholds: {
                turns: 0.8,
                tokens: 0.9,
                time: 0.9,
                cost: 0.9
            }
        };
        
        // Active session tracking
        this.activeSessions = new Map();
        
        // Cost calculation rates (approximate)
        this.tokenCosts = {
            input: 0.00001,  // $0.01 per 1K tokens
            output: 0.00003  // $0.03 per 1K tokens
        };
        
        console.log('TurnController initialized with limits:', this.defaultLimits);
    }
    
    /**
     * Initialize turn tracking for a session
     */
    initializeSession(sessionId, customLimits = {}) {
        const limits = { ...this.defaultLimits, ...customLimits };
        const session = {
            sessionId,
            limits,
            current: {
                turns: 0,
                tokens: 0,
                timeMs: 0,
                costUsd: 0.0
            },
            startTime: Date.now(),
            status: 'active',
            warningsSent: new Set(),
            history: []
        };
        
        this.activeSessions.set(sessionId, session);
        console.log(`Turn tracking initialized for session ${sessionId}:`, limits);
        
        this.emit('session-initialized', { sessionId, limits });
        return session;
    }
    
    /**
     * Record a turn execution
     */
    recordTurn(sessionId, turnData = {}) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found in turn controller`);
        }
        
        if (session.status !== 'active') {
            throw new Error(`Session ${sessionId} is ${session.status}, cannot record turn`);
        }
        
        // Update current counters
        session.current.turns += 1;
        session.current.tokens += turnData.tokensUsed || 0;
        session.current.timeMs = Date.now() - session.startTime;
        session.current.costUsd += this.calculateTurnCost(turnData);
        
        // Record turn in history
        const turnRecord = {
            turnNumber: session.current.turns,
            timestamp: Date.now(),
            agent: turnData.agent,
            action: turnData.action,
            tokensUsed: turnData.tokensUsed || 0,
            costUsd: this.calculateTurnCost(turnData),
            duration: turnData.duration || 0,
            success: turnData.success !== false
        };
        
        session.history.push(turnRecord);
        
        console.log(`Turn ${session.current.turns} recorded for session ${sessionId}:`, {
            agent: turnData.agent,
            tokens: turnData.tokensUsed,
            cost: turnRecord.costUsd.toFixed(4)
        });
        
        // Check limits and send warnings
        this.checkLimitsAndWarn(session);
        
        this.emit('turn-recorded', { sessionId, turn: turnRecord, current: session.current });
        
        return {
            canContinue: session.status === 'active',
            current: session.current,
            limits: session.limits,
            nextTurnAllowed: this.isNextTurnAllowed(session)
        };
    }
    
    /**
     * Calculate cost for a turn based on token usage
     */
    calculateTurnCost(turnData) {
        const inputTokens = turnData.inputTokens || 0;
        const outputTokens = turnData.outputTokens || 0;
        const totalTokens = turnData.tokensUsed || (inputTokens + outputTokens);
        
        if (inputTokens && outputTokens) {
            return (inputTokens * this.tokenCosts.input) + (outputTokens * this.tokenCosts.output);
        }
        
        // Fallback: assume 70% input, 30% output
        return (totalTokens * 0.7 * this.tokenCosts.input) + (totalTokens * 0.3 * this.tokenCosts.output);
    }
    
    /**
     * Check if next turn is allowed based on limits
     */
    isNextTurnAllowed(session) {
        if (session.status !== 'active') {
            return false;
        }
        
        const { current, limits } = session;
        
        // Hard limits check
        if (current.turns >= limits.maxTurns) return false;
        if (current.tokens >= limits.maxTokens) return false;
        if (current.timeMs >= limits.maxTimeMs) return false;
        if (current.costUsd >= limits.maxCostUsd) return false;
        
        return true;
    }
    
    /**
     * Check limits and send warnings when thresholds are reached
     */
    checkLimitsAndWarn(session) {
        const { current, limits, warningsSent } = session;
        const thresholds = limits.warningThresholds;
        
        // Check each limit type
        const checks = [
            { type: 'turns', current: current.turns, max: limits.maxTurns },
            { type: 'tokens', current: current.tokens, max: limits.maxTokens },
            { type: 'time', current: current.timeMs, max: limits.maxTimeMs },
            { type: 'cost', current: current.costUsd, max: limits.maxCostUsd }
        ];
        
        for (const check of checks) {
            const ratio = check.current / check.max;
            const threshold = thresholds[check.type];
            
            if (ratio >= threshold && !warningsSent.has(check.type)) {
                warningsSent.add(check.type);
                const warning = {
                    sessionId: session.sessionId,
                    type: check.type,
                    current: check.current,
                    max: check.max,
                    ratio: ratio,
                    threshold: threshold
                };
                
                console.warn(`Turn limit warning for ${session.sessionId}:`, warning);
                this.emit('limit-warning', warning);
                
                // Auto-terminate if at 100%
                if (ratio >= 1.0) {
                    this.forceComplete(session.sessionId, `${check.type} limit reached`);
                }
            }
        }
    }
    
    /**
     * Force completion of a session
     */
    forceComplete(sessionId, reason = 'Manual completion') {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            console.warn(`Cannot force complete session ${sessionId}: not found`);
            return false;
        }
        
        session.status = 'completed';
        session.completionTime = Date.now();
        session.completionReason = reason;
        
        console.log(`Session ${sessionId} force completed:`, reason);
        this.emit('session-completed', { sessionId, reason, session });
        
        return true;
    }
    
    /**
     * Pause a session (can be resumed)
     */
    pauseSession(sessionId, reason = 'Manual pause') {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            console.warn(`Cannot pause session ${sessionId}: not found`);
            return false;
        }
        
        session.status = 'paused';
        session.pausedAt = Date.now();
        session.pauseReason = reason;
        
        console.log(`Session ${sessionId} paused:`, reason);
        this.emit('session-paused', { sessionId, reason });
        
        return true;
    }
    
    /**
     * Resume a paused session
     */
    resumeSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            console.warn(`Cannot resume session ${sessionId}: not found`);
            return false;
        }
        
        if (session.status !== 'paused') {
            console.warn(`Cannot resume session ${sessionId}: status is ${session.status}`);
            return false;
        }
        
        session.status = 'active';
        const pauseDuration = Date.now() - session.pausedAt;
        session.startTime += pauseDuration; // Adjust start time to exclude pause duration
        
        delete session.pausedAt;
        delete session.pauseReason;
        
        console.log(`Session ${sessionId} resumed after ${pauseDuration}ms pause`);
        this.emit('session-resumed', { sessionId, pauseDuration });
        
        return true;
    }
    
    /**
     * Get session status and statistics
     */
    getSessionStatus(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return null;
        }
        
        const runtime = session.status === 'paused' 
            ? session.pausedAt - session.startTime
            : Date.now() - session.startTime;
        
        return {
            sessionId,
            status: session.status,
            current: session.current,
            limits: session.limits,
            runtime,
            canContinue: this.isNextTurnAllowed(session),
            utilizationRates: {
                turns: session.current.turns / session.limits.maxTurns,
                tokens: session.current.tokens / session.limits.maxTokens,
                time: session.current.timeMs / session.limits.maxTimeMs,
                cost: session.current.costUsd / session.limits.maxCostUsd
            },
            completionReason: session.completionReason,
            historyLength: session.history.length
        };
    }
    
    /**
     * Get detailed session history
     */
    getSessionHistory(sessionId, limit = null) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return null;
        }
        
        let history = session.history;
        if (limit && limit > 0) {
            history = history.slice(-limit);
        }
        
        return {
            sessionId,
            totalTurns: session.current.turns,
            history
        };
    }
    
    /**
     * Clean up completed sessions (optional memory management)
     */
    cleanupCompletedSessions(maxAge = 3600000) { // 1 hour default
        const now = Date.now();
        const cleanedSessions = [];
        
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.status === 'completed' && session.completionTime) {
                const age = now - session.completionTime;
                if (age > maxAge) {
                    this.activeSessions.delete(sessionId);
                    cleanedSessions.push(sessionId);
                }
            }
        }
        
        if (cleanedSessions.length > 0) {
            console.log(`Cleaned up ${cleanedSessions.length} completed sessions:`, cleanedSessions);
            this.emit('sessions-cleaned', { count: cleanedSessions.length, sessions: cleanedSessions });
        }
        
        return cleanedSessions;
    }
    
    /**
     * Get statistics across all active sessions
     */
    getGlobalStatistics() {
        const sessions = Array.from(this.activeSessions.values());
        const active = sessions.filter(s => s.status === 'active');
        const paused = sessions.filter(s => s.status === 'paused');
        const completed = sessions.filter(s => s.status === 'completed');
        
        const totalTurns = sessions.reduce((sum, s) => sum + s.current.turns, 0);
        const totalTokens = sessions.reduce((sum, s) => sum + s.current.tokens, 0);
        const totalCost = sessions.reduce((sum, s) => sum + s.current.costUsd, 0);
        
        return {
            totalSessions: sessions.length,
            activeSessions: active.length,
            pausedSessions: paused.length,
            completedSessions: completed.length,
            totalTurns,
            totalTokens,
            totalCost,
            averageTurnsPerSession: sessions.length > 0 ? totalTurns / sessions.length : 0,
            averageCostPerSession: sessions.length > 0 ? totalCost / sessions.length : 0
        };
    }
    
    /**
     * Validate turn limits configuration
     */
    static validateLimits(limits) {
        const required = ['maxTurns', 'maxTokens', 'maxTimeMs', 'maxCostUsd'];
        const errors = [];
        
        for (const field of required) {
            if (typeof limits[field] !== 'number' || limits[field] <= 0) {
                errors.push(`${field} must be a positive number`);
            }
        }
        
        if (limits.warningThresholds) {
            const thresholds = limits.warningThresholds;
            for (const [key, value] of Object.entries(thresholds)) {
                if (typeof value !== 'number' || value < 0 || value > 1) {
                    errors.push(`warningThresholds.${key} must be between 0 and 1`);
                }
            }
        }
        
        return errors;
    }
}

module.exports = TurnController;