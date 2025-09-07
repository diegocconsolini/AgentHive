/**
 * Database migration: Create mesh-specific tables
 * This migration creates all necessary tables for AgentHive Mesh 2.0 functionality
 */

const fs = require('fs');
const path = require('path');

class CreateMeshTablesMigration {
    constructor(db) {
        this.db = db;
        this.migrationName = '001-create-mesh-tables';
        this.version = '2.0.0';
    }
    
    /**
     * Execute the migration - create all mesh tables
     */
    async up() {
        console.log(`Running migration: ${this.migrationName}`);
        
        try {
            // Enable foreign key constraints
            this.db.exec('PRAGMA foreign_keys = ON;');
            
            // Create migrations tracking table if it doesn't exist
            await this.createMigrationsTable();
            
            // Create mesh-specific tables
            await this.createMeshSessionsTable();
            await this.createSessionCheckpointsTable();
            await this.createAgentExecutionsTable();
            await this.createTaskDecompositionsTable();
            await this.createMeshMetricsTable();
            await this.createAgentMessagesTable();
            await this.createSessionDependenciesTable();
            
            // Create indexes for performance
            await this.createIndexes();
            
            // Create triggers for automatic timestamp updates
            await this.createTriggers();
            
            // Record successful migration
            await this.recordMigration();
            
            console.log(`Migration ${this.migrationName} completed successfully`);
            
        } catch (error) {
            console.error(`Migration ${this.migrationName} failed:`, error);
            throw error;
        }
    }
    
    /**
     * Reverse the migration - drop all mesh tables
     */
    async down() {
        console.log(`Rolling back migration: ${this.migrationName}`);
        
        try {
            // Drop tables in reverse dependency order
            const tables = [
                'session_dependencies',
                'agent_messages', 
                'mesh_metrics',
                'task_decompositions',
                'agent_executions',
                'session_checkpoints',
                'mesh_sessions'
            ];
            
            for (const table of tables) {
                this.db.exec(`DROP TABLE IF EXISTS ${table}`);
                console.log(`Dropped table: ${table}`);
            }
            
            // Remove migration record
            this.db.prepare(
                'DELETE FROM migrations WHERE name = ?'
            ).run(this.migrationName);
            
            console.log(`Migration ${this.migrationName} rolled back successfully`);
            
        } catch (error) {
            console.error(`Rollback of ${this.migrationName} failed:`, error);
            throw error;
        }
    }
    
    /**
     * Create migrations tracking table
     */
    async createMigrationsTable() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                version TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
    
    /**
     * Create mesh_sessions table - core session tracking
     */
    async createMeshSessionsTable() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS mesh_sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                prompt TEXT NOT NULL,
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'failed', 'cancelled')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                execution_plan TEXT, -- JSON
                execution_strategy TEXT DEFAULT 'auto' CHECK(execution_strategy IN ('auto', 'parallel', 'hybrid', 'sequential', 'single')),
                current_turn INTEGER DEFAULT 0,
                max_turns INTEGER DEFAULT 50,
                token_budget INTEGER DEFAULT 100000,
                tokens_used INTEGER DEFAULT 0,
                cost_usd REAL DEFAULT 0.0,
                success_rate REAL DEFAULT 0.0,
                error_count INTEGER DEFAULT 0,
                warning_count INTEGER DEFAULT 0,
                agents_used TEXT, -- JSON array of agent IDs
                parallel_tasks INTEGER DEFAULT 0,
                completed_tasks INTEGER DEFAULT 0,
                failed_tasks INTEGER DEFAULT 0,
                metadata TEXT, -- JSON
                priority INTEGER DEFAULT 1 CHECK(priority >= 1 AND priority <= 5),
                timeout_ms INTEGER DEFAULT 3600000, -- 1 hour default
                checkpoint_enabled BOOLEAN DEFAULT 1,
                last_checkpoint_at DATETIME
            )
        `);
        
        console.log('Created mesh_sessions table');
    }
    
    /**
     * Create session_checkpoints table - recovery and rollback
     */
    async createSessionCheckpointsTable() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS session_checkpoints (
                checkpoint_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                checkpoint_number INTEGER NOT NULL,
                checkpoint_type TEXT DEFAULT 'auto' CHECK(checkpoint_type IN ('auto', 'manual', 'error', 'milestone', 'final', 'shutdown')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                session_state TEXT NOT NULL, -- JSON
                execution_state TEXT, -- JSON
                agent_states TEXT, -- JSON
                message_bus_state TEXT, -- JSON
                turn_number INTEGER DEFAULT 0,
                tokens_used INTEGER DEFAULT 0,
                cost_usd REAL DEFAULT 0.0,
                completed_tasks INTEGER DEFAULT 0,
                active_agents TEXT, -- JSON array
                pending_messages INTEGER DEFAULT 0,
                checkpoint_size_bytes INTEGER DEFAULT 0,
                compression_ratio REAL DEFAULT 1.0,
                restored_count INTEGER DEFAULT 0,
                is_valid BOOLEAN DEFAULT 1,
                validation_error TEXT,
                FOREIGN KEY (session_id) REFERENCES mesh_sessions(session_id) ON DELETE CASCADE
            )
        `);
        
        console.log('Created session_checkpoints table');
    }
    
    /**
     * Create agent_executions table - individual agent task tracking
     */
    async createAgentExecutionsTable() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS agent_executions (
                execution_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                checkpoint_id TEXT,
                agent_id TEXT NOT NULL,
                agent_type TEXT NOT NULL,
                task_id TEXT,
                task_description TEXT NOT NULL,
                task_complexity TEXT CHECK(task_complexity IN ('simple', 'medium', 'complex')),
                parent_task_id TEXT,
                dependency_count INTEGER DEFAULT 0,
                started_at DATETIME NOT NULL,
                completed_at DATETIME,
                duration_ms INTEGER,
                status TEXT DEFAULT 'running' CHECK(status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'timeout')),
                tokens_input INTEGER DEFAULT 0,
                tokens_output INTEGER DEFAULT 0,
                tokens_total INTEGER DEFAULT 0,
                cost_usd REAL DEFAULT 0.0,
                success BOOLEAN,
                confidence_score REAL CHECK(confidence_score >= 0 AND confidence_score <= 1),
                quality_score REAL CHECK(quality_score >= 0 AND quality_score <= 1),
                result_summary TEXT,
                result_data TEXT, -- JSON
                error_message TEXT,
                error_type TEXT,
                retry_count INTEGER DEFAULT 0,
                max_retries INTEGER DEFAULT 3,
                execution_context TEXT, -- JSON
                performance_metrics TEXT, -- JSON
                memory_usage_mb REAL DEFAULT 0,
                cpu_time_ms INTEGER DEFAULT 0,
                network_requests INTEGER DEFAULT 0,
                FOREIGN KEY (session_id) REFERENCES mesh_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (checkpoint_id) REFERENCES session_checkpoints(checkpoint_id) ON DELETE SET NULL,
                FOREIGN KEY (parent_task_id) REFERENCES agent_executions(execution_id) ON DELETE SET NULL
            )
        `);
        
        console.log('Created agent_executions table');
    }
    
    /**
     * Create task_decompositions table - DAG and execution planning
     */
    async createTaskDecompositionsTable() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS task_decompositions (
                decomposition_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                original_task TEXT NOT NULL,
                complexity_level TEXT CHECK(complexity_level IN ('simple', 'medium', 'complex')),
                domain_type TEXT NOT NULL,
                decomposition_strategy TEXT CHECK(decomposition_strategy IN ('pattern-based', 'dynamic', 'hybrid')),
                subtask_count INTEGER DEFAULT 0,
                subtasks TEXT NOT NULL, -- JSON array
                dag_structure TEXT NOT NULL, -- JSON DAG
                execution_plan TEXT, -- JSON
                parallel_groups TEXT, -- JSON array of parallel task groups
                critical_path TEXT, -- JSON array of critical path tasks
                estimated_duration_seconds INTEGER DEFAULT 0,
                estimated_tokens INTEGER DEFAULT 0,
                estimated_cost_usd REAL DEFAULT 0.0,
                actual_duration_seconds INTEGER,
                actual_tokens INTEGER,
                actual_cost_usd REAL,
                efficiency_ratio REAL, -- actual/estimated
                agent_assignments TEXT, -- JSON mapping of tasks to agents
                dependency_matrix TEXT, -- JSON 2D array
                optimization_applied BOOLEAN DEFAULT 0,
                optimization_details TEXT, -- JSON
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                success_rate REAL DEFAULT 0.0,
                FOREIGN KEY (session_id) REFERENCES mesh_sessions(session_id) ON DELETE CASCADE
            )
        `);
        
        console.log('Created task_decompositions table');
    }
    
    /**
     * Create mesh_metrics table - performance and analytics
     */
    async createMeshMetricsTable() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS mesh_metrics (
                metric_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                metric_category TEXT NOT NULL CHECK(metric_category IN ('performance', 'cost', 'quality', 'efficiency', 'reliability')),
                metric_name TEXT NOT NULL,
                metric_value REAL NOT NULL,
                metric_unit TEXT NOT NULL,
                metric_context TEXT, -- JSON additional context
                aggregation_type TEXT CHECK(aggregation_type IN ('sum', 'avg', 'min', 'max', 'count', 'instant')),
                time_window_seconds INTEGER,
                baseline_value REAL,
                threshold_warning REAL,
                threshold_critical REAL,
                is_anomaly BOOLEAN DEFAULT 0,
                anomaly_score REAL,
                recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                tags TEXT, -- JSON array for categorization
                FOREIGN KEY (session_id) REFERENCES mesh_sessions(session_id) ON DELETE CASCADE
            )
        `);
        
        console.log('Created mesh_metrics table');
    }
    
    /**
     * Create agent_messages table - inter-agent communication tracking
     */
    async createAgentMessagesTable() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS agent_messages (
                message_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                channel TEXT NOT NULL,
                sender_agent_id TEXT NOT NULL,
                receiver_agent_id TEXT,
                message_type TEXT DEFAULT 'standard' CHECK(message_type IN ('standard', 'request', 'response', 'broadcast', 'system')),
                delivery_mode TEXT DEFAULT 'broadcast' CHECK(delivery_mode IN ('broadcast', 'direct', 'anycast')),
                priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                delivered_at DATETIME,
                acknowledged_at DATETIME,
                expires_at DATETIME,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'delivered', 'acknowledged', 'failed', 'expired', 'cancelled')),
                retry_count INTEGER DEFAULT 0,
                max_retries INTEGER DEFAULT 3,
                message_size_bytes INTEGER DEFAULT 0,
                compression_type TEXT,
                encryption_type TEXT,
                content_type TEXT DEFAULT 'application/json',
                content_hash TEXT,
                message_data TEXT NOT NULL, -- JSON message content
                response_channel TEXT,
                correlation_id TEXT,
                conversation_id TEXT,
                delivery_receipt_requested BOOLEAN DEFAULT 0,
                processing_time_ms INTEGER,
                transport_method TEXT CHECK(transport_method IN ('websocket', 'events', 'queue', 'direct')),
                error_message TEXT,
                metadata TEXT, -- JSON
                FOREIGN KEY (session_id) REFERENCES mesh_sessions(session_id) ON DELETE CASCADE
            )
        `);
        
        console.log('Created agent_messages table');
    }
    
    /**
     * Create session_dependencies table - track dependencies between sessions
     */
    async createSessionDependenciesTable() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS session_dependencies (
                dependency_id TEXT PRIMARY KEY,
                parent_session_id TEXT NOT NULL,
                child_session_id TEXT NOT NULL,
                dependency_type TEXT DEFAULT 'sequential' CHECK(dependency_type IN ('sequential', 'data', 'resource', 'conditional')),
                condition_expression TEXT,
                condition_met BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                resolved_at DATETIME,
                timeout_at DATETIME,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'satisfied', 'failed', 'timeout', 'cancelled')),
                priority INTEGER DEFAULT 1 CHECK(priority >= 1 AND priority <= 10),
                metadata TEXT, -- JSON
                FOREIGN KEY (parent_session_id) REFERENCES mesh_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (child_session_id) REFERENCES mesh_sessions(session_id) ON DELETE CASCADE,
                UNIQUE(parent_session_id, child_session_id, dependency_type)
            )
        `);
        
        console.log('Created session_dependencies table');
    }
    
    /**
     * Create database indexes for performance optimization
     */
    async createIndexes() {
        const indexes = [
            // mesh_sessions indexes
            'CREATE INDEX IF NOT EXISTS idx_mesh_sessions_user_id ON mesh_sessions(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_mesh_sessions_status ON mesh_sessions(status)',
            'CREATE INDEX IF NOT EXISTS idx_mesh_sessions_created_at ON mesh_sessions(created_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_mesh_sessions_updated_at ON mesh_sessions(updated_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_mesh_sessions_priority ON mesh_sessions(priority DESC, created_at DESC)',
            
            // session_checkpoints indexes
            'CREATE INDEX IF NOT EXISTS idx_checkpoints_session_id ON session_checkpoints(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_checkpoints_number ON session_checkpoints(session_id, checkpoint_number)',
            'CREATE INDEX IF NOT EXISTS idx_checkpoints_type ON session_checkpoints(checkpoint_type)',
            'CREATE INDEX IF NOT EXISTS idx_checkpoints_created ON session_checkpoints(created_at DESC)',
            
            // agent_executions indexes
            'CREATE INDEX IF NOT EXISTS idx_executions_session_id ON agent_executions(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_executions_agent_id ON agent_executions(agent_id)',
            'CREATE INDEX IF NOT EXISTS idx_executions_status ON agent_executions(status)',
            'CREATE INDEX IF NOT EXISTS idx_executions_started_at ON agent_executions(started_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_executions_duration ON agent_executions(duration_ms)',
            'CREATE INDEX IF NOT EXISTS idx_executions_parent_task ON agent_executions(parent_task_id)',
            'CREATE INDEX IF NOT EXISTS idx_executions_agent_status ON agent_executions(agent_id, status)',
            
            // task_decompositions indexes
            'CREATE INDEX IF NOT EXISTS idx_decompositions_session_id ON task_decompositions(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_decompositions_complexity ON task_decompositions(complexity_level)',
            'CREATE INDEX IF NOT EXISTS idx_decompositions_domain ON task_decompositions(domain_type)',
            'CREATE INDEX IF NOT EXISTS idx_decompositions_created ON task_decompositions(created_at DESC)',
            
            // mesh_metrics indexes
            'CREATE INDEX IF NOT EXISTS idx_metrics_session_id ON mesh_metrics(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_metrics_category ON mesh_metrics(metric_category)',
            'CREATE INDEX IF NOT EXISTS idx_metrics_name ON mesh_metrics(metric_name)',
            'CREATE INDEX IF NOT EXISTS idx_metrics_recorded_at ON mesh_metrics(recorded_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_metrics_category_name ON mesh_metrics(metric_category, metric_name)',
            'CREATE INDEX IF NOT EXISTS idx_metrics_anomaly ON mesh_metrics(is_anomaly, recorded_at DESC)',
            
            // agent_messages indexes
            'CREATE INDEX IF NOT EXISTS idx_messages_session_id ON agent_messages(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_messages_channel ON agent_messages(channel)',
            'CREATE INDEX IF NOT EXISTS idx_messages_sender ON agent_messages(sender_agent_id)',
            'CREATE INDEX IF NOT EXISTS idx_messages_receiver ON agent_messages(receiver_agent_id)',
            'CREATE INDEX IF NOT EXISTS idx_messages_status ON agent_messages(status)',
            'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON agent_messages(created_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_messages_correlation ON agent_messages(correlation_id)',
            'CREATE INDEX IF NOT EXISTS idx_messages_conversation ON agent_messages(conversation_id)',
            
            // session_dependencies indexes
            'CREATE INDEX IF NOT EXISTS idx_dependencies_parent ON session_dependencies(parent_session_id)',
            'CREATE INDEX IF NOT EXISTS idx_dependencies_child ON session_dependencies(child_session_id)',
            'CREATE INDEX IF NOT EXISTS idx_dependencies_status ON session_dependencies(status)',
            'CREATE INDEX IF NOT EXISTS idx_dependencies_priority ON session_dependencies(priority DESC, created_at DESC)'
        ];
        
        for (const indexSql of indexes) {
            this.db.exec(indexSql);
        }
        
        console.log(`Created ${indexes.length} database indexes`);
    }
    
    /**
     * Create triggers for automatic timestamp updates and data validation
     */
    async createTriggers() {
        // Update timestamp triggers
        const timestampTriggers = [
            `CREATE TRIGGER IF NOT EXISTS update_mesh_sessions_timestamp 
             AFTER UPDATE ON mesh_sessions 
             BEGIN 
                 UPDATE mesh_sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = NEW.session_id;
             END`,
            
            `CREATE TRIGGER IF NOT EXISTS validate_session_status_change
             BEFORE UPDATE OF status ON mesh_sessions
             WHEN OLD.status IN ('completed', 'failed', 'cancelled') AND NEW.status = 'active'
             BEGIN
                 SELECT RAISE(FAIL, 'Cannot reactivate completed/failed session');
             END`,
             
            `CREATE TRIGGER IF NOT EXISTS update_session_completion
             AFTER UPDATE OF status ON mesh_sessions
             WHEN NEW.status IN ('completed', 'failed', 'cancelled') AND OLD.completed_at IS NULL
             BEGIN
                 UPDATE mesh_sessions SET completed_at = CURRENT_TIMESTAMP WHERE session_id = NEW.session_id;
             END`,
             
            `CREATE TRIGGER IF NOT EXISTS validate_checkpoint_session
             BEFORE INSERT ON session_checkpoints
             WHEN (SELECT status FROM mesh_sessions WHERE session_id = NEW.session_id) NOT IN ('active', 'paused')
             BEGIN
                 SELECT RAISE(FAIL, 'Cannot create checkpoint for inactive session');
             END`,
             
            `CREATE TRIGGER IF NOT EXISTS update_execution_duration
             AFTER UPDATE OF completed_at ON agent_executions
             WHEN NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL
             BEGIN
                 UPDATE agent_executions 
                 SET duration_ms = (julianday(NEW.completed_at) - julianday(started_at)) * 86400000
                 WHERE execution_id = NEW.execution_id;
             END`,
             
            `CREATE TRIGGER IF NOT EXISTS validate_message_expiry
             BEFORE INSERT ON agent_messages
             WHEN NEW.expires_at IS NOT NULL AND NEW.expires_at <= CURRENT_TIMESTAMP
             BEGIN
                 SELECT RAISE(FAIL, 'Message expiry time must be in the future');
             END`
        ];
        
        for (const triggerSql of timestampTriggers) {
            this.db.exec(triggerSql);
        }
        
        console.log(`Created ${timestampTriggers.length} database triggers`);
    }
    
    /**
     * Record this migration as completed
     */
    async recordMigration() {
        this.db.prepare(
            'INSERT OR IGNORE INTO migrations (name, version) VALUES (?, ?)'
        ).run(this.migrationName, this.version);
    }
    
    /**
     * Check if migration has been applied
     */
    async isApplied() {
        const result = this.db.prepare(
            'SELECT COUNT(*) as count FROM migrations WHERE name = ?'
        ).get(this.migrationName);
        
        return result.count > 0;
    }
    
    /**
     * Get migration info
     */
    getInfo() {
        return {
            name: this.migrationName,
            version: this.version,
            description: 'Create all mesh-specific database tables for AgentHive 2.0',
            tables: [
                'mesh_sessions',
                'session_checkpoints', 
                'agent_executions',
                'task_decompositions',
                'mesh_metrics',
                'agent_messages',
                'session_dependencies'
            ],
            indexes: 27,
            triggers: 6
        };
    }
}

module.exports = CreateMeshTablesMigration;