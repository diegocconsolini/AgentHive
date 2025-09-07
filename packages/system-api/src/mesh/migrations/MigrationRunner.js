const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

/**
 * MigrationRunner handles execution of database migrations for mesh tables
 */
class MigrationRunner {
    constructor(options = {}) {
        this.dbPath = options.dbPath || path.join(__dirname, '../../../.agent-mesh-sessions/sessions.db');
        this.migrationsDir = options.migrationsDir || __dirname;
        this.db = null;
        this.migrations = new Map();
        
        console.log('MigrationRunner initialized:', {
            dbPath: this.dbPath,
            migrationsDir: this.migrationsDir
        });
    }
    
    /**
     * Initialize database connection and discover migrations
     */
    async initialize() {
        try {
            // Ensure directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
                console.log(`Created database directory: ${dbDir}`);
            }
            
            // Open database connection
            this.db = new Database(this.dbPath);
            
            // Configure SQLite for better performance and reliability
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('foreign_keys = ON');
            this.db.pragma('temp_store = MEMORY');
            this.db.pragma('mmap_size = 268435456'); // 256MB
            
            // Discover and load migrations
            await this.discoverMigrations();
            
            console.log(`Database initialized: ${this.dbPath}`);
            console.log(`Discovered ${this.migrations.size} migrations`);
            
        } catch (error) {
            console.error('Failed to initialize MigrationRunner:', error);
            throw error;
        }
    }
    
    /**
     * Discover migration files in the migrations directory
     */
    async discoverMigrations() {
        try {
            const files = fs.readdirSync(this.migrationsDir);
            const migrationFiles = files
                .filter(file => file.endsWith('.js') && file !== 'MigrationRunner.js')
                .sort(); // Ensure migrations run in order
            
            for (const file of migrationFiles) {
                try {
                    const migrationPath = path.join(this.migrationsDir, file);
                    const MigrationClass = require(migrationPath);
                    const migration = new MigrationClass(this.db);
                    
                    this.migrations.set(migration.migrationName || file, {
                        migration,
                        file,
                        path: migrationPath
                    });
                    
                    console.log(`Loaded migration: ${migration.migrationName || file}`);
                } catch (error) {
                    console.error(`Failed to load migration ${file}:`, error);
                    // Continue with other migrations
                }
            }
        } catch (error) {
            console.error('Failed to discover migrations:', error);
            throw error;
        }
    }
    
    /**
     * Run all pending migrations
     */
    async runMigrations() {
        console.log('Running database migrations...');
        
        let migrationsRun = 0;
        const startTime = Date.now();
        
        try {
            // Begin transaction
            const transaction = this.db.transaction(() => {
                for (const [name, { migration }] of this.migrations.entries()) {
                    try {
                        // Check if migration has already been applied
                        if (migration.isApplied && migration.isApplied()) {
                            console.log(`Migration ${name} already applied, skipping`);
                            continue;
                        }
                        
                        console.log(`Running migration: ${name}`);
                        migration.up();
                        migrationsRun++;
                        
                    } catch (error) {
                        console.error(`Migration ${name} failed:`, error);
                        throw error;
                    }
                }
            });
            
            // Execute all migrations in a single transaction
            transaction();
            
            const duration = Date.now() - startTime;
            console.log(`Completed ${migrationsRun} migrations in ${duration}ms`);
            
            return {
                success: true,
                migrationsRun,
                duration,
                totalMigrations: this.migrations.size
            };
            
        } catch (error) {
            console.error('Migration execution failed:', error);
            throw error;
        }
    }
    
    /**
     * Rollback migrations (reverse order)
     */
    async rollbackMigrations(count = 1) {
        console.log(`Rolling back ${count} migrations...`);
        
        const migrationEntries = Array.from(this.migrations.entries()).reverse();
        let rolledBack = 0;
        
        try {
            const transaction = this.db.transaction(() => {
                for (const [name, { migration }] of migrationEntries) {
                    if (rolledBack >= count) break;
                    
                    try {
                        // Check if migration is applied before rolling back
                        if (migration.isApplied && !migration.isApplied()) {
                            console.log(`Migration ${name} not applied, skipping rollback`);
                            continue;
                        }
                        
                        console.log(`Rolling back migration: ${name}`);
                        if (migration.down) {
                            migration.down();
                            rolledBack++;
                        } else {
                            console.warn(`Migration ${name} has no rollback method`);
                        }
                        
                    } catch (error) {
                        console.error(`Rollback of ${name} failed:`, error);
                        throw error;
                    }
                }
            });
            
            transaction();
            
            console.log(`Rolled back ${rolledBack} migrations`);
            return { success: true, rolledBack };
            
        } catch (error) {
            console.error('Migration rollback failed:', error);
            throw error;
        }
    }
    
    /**
     * Get migration status
     */
    async getMigrationStatus() {
        const status = [];
        
        for (const [name, { migration }] of this.migrations.entries()) {
            let applied = false;
            let appliedAt = null;
            
            try {
                if (migration.isApplied) {
                    applied = migration.isApplied();
                }
                
                // Try to get application timestamp from migrations table
                if (applied && this.db) {
                    try {
                        const record = this.db.prepare(
                            'SELECT applied_at FROM migrations WHERE name = ?'
                        ).get(name);
                        
                        if (record) {
                            appliedAt = record.applied_at;
                        }
                    } catch (error) {
                        // Migrations table might not exist yet
                    }
                }
            } catch (error) {
                console.warn(`Failed to check status of migration ${name}:`, error);
            }
            
            status.push({
                name,
                applied,
                appliedAt,
                info: migration.getInfo ? migration.getInfo() : null
            });
        }
        
        return status;
    }
    
    /**
     * Reset database (drop all tables and rerun migrations)
     */
    async resetDatabase() {
        console.log('Resetting database...');
        
        try {
            // Get all table names
            const tables = this.db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
            `).all();
            
            // Drop all tables
            const transaction = this.db.transaction(() => {
                for (const { name } of tables) {
                    this.db.exec(`DROP TABLE IF EXISTS ${name}`);
                    console.log(`Dropped table: ${name}`);
                }
            });
            
            transaction();
            
            // Rerun all migrations
            await this.runMigrations();
            
            console.log('Database reset completed');
            return { success: true };
            
        } catch (error) {
            console.error('Database reset failed:', error);
            throw error;
        }
    }
    
    /**
     * Verify database integrity
     */
    async verifyIntegrity() {
        console.log('Verifying database integrity...');
        
        try {
            // SQLite integrity check
            const integrityResult = this.db.prepare('PRAGMA integrity_check').get();
            
            if (integrityResult.integrity_check !== 'ok') {
                throw new Error(`Database integrity check failed: ${integrityResult.integrity_check}`);
            }
            
            // Foreign key check
            const foreignKeyResult = this.db.prepare('PRAGMA foreign_key_check').all();
            
            if (foreignKeyResult.length > 0) {
                console.warn('Foreign key violations found:', foreignKeyResult);
                return { 
                    success: false, 
                    integrity: true,
                    foreignKeyViolations: foreignKeyResult
                };
            }
            
            // Quick analyze for statistics
            this.db.exec('ANALYZE');
            
            console.log('Database integrity verification passed');
            return { 
                success: true, 
                integrity: true,
                foreignKeyViolations: []
            };
            
        } catch (error) {
            console.error('Database integrity verification failed:', error);
            return { 
                success: false, 
                integrity: false,
                error: error.message
            };
        }
    }
    
    /**
     * Optimize database (vacuum, reindex, analyze)
     */
    async optimizeDatabase() {
        console.log('Optimizing database...');
        
        try {
            const startTime = Date.now();
            
            // Get database size before optimization
            const beforeStats = this.db.prepare('PRAGMA page_count').get();
            
            // Vacuum to reclaim space and defragment
            console.log('Running VACUUM...');
            this.db.exec('VACUUM');
            
            // Reindex all indexes
            console.log('Rebuilding indexes...');
            this.db.exec('REINDEX');
            
            // Update statistics for query planner
            console.log('Updating statistics...');
            this.db.exec('ANALYZE');
            
            // Get database size after optimization
            const afterStats = this.db.prepare('PRAGMA page_count').get();
            
            const duration = Date.now() - startTime;
            const spaceReclaimed = (beforeStats.page_count - afterStats.page_count) * 4096; // 4KB per page
            
            console.log(`Database optimization completed in ${duration}ms`);
            console.log(`Space reclaimed: ${spaceReclaimed} bytes`);
            
            return {
                success: true,
                duration,
                pagesBefore: beforeStats.page_count,
                pagesAfter: afterStats.page_count,
                spaceReclaimed
            };
            
        } catch (error) {
            console.error('Database optimization failed:', error);
            throw error;
        }
    }
    
    /**
     * Get database statistics
     */
    async getDatabaseStats() {
        try {
            const stats = {};
            
            // Basic database info
            const dbInfo = {
                pageSize: this.db.prepare('PRAGMA page_size').get().page_size,
                pageCount: this.db.prepare('PRAGMA page_count').get().page_count,
                journalMode: this.db.prepare('PRAGMA journal_mode').get().journal_mode,
                synchronous: this.db.prepare('PRAGMA synchronous').get().synchronous,
                foreignKeys: this.db.prepare('PRAGMA foreign_keys').get().foreign_keys
            };
            
            stats.database = dbInfo;
            stats.database.sizeBytes = dbInfo.pageSize * dbInfo.pageCount;
            
            // Table statistics
            const tables = this.db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            `).all();
            
            stats.tables = {};
            for (const { name } of tables) {
                try {
                    const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get();
                    stats.tables[name] = { rowCount: count.count };
                } catch (error) {
                    stats.tables[name] = { error: error.message };
                }
            }
            
            // Migration status
            stats.migrations = await this.getMigrationStatus();
            
            return stats;
            
        } catch (error) {
            console.error('Failed to get database statistics:', error);
            throw error;
        }
    }
    
    /**
     * Create database backup
     */
    async createBackup(backupPath) {
        if (!backupPath) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            backupPath = this.dbPath.replace('.db', `_backup_${timestamp}.db`);
        }
        
        console.log(`Creating database backup: ${backupPath}`);
        
        try {
            // Use SQLite backup API for consistent backup
            const backup = this.db.backup(backupPath);
            backup.step(-1); // Copy all pages
            backup.finish();
            
            // Verify backup
            const testDb = new Database(backupPath, { readonly: true });
            const integrityCheck = testDb.prepare('PRAGMA integrity_check').get();
            testDb.close();
            
            if (integrityCheck.integrity_check !== 'ok') {
                throw new Error('Backup verification failed');
            }
            
            console.log(`Database backup created successfully: ${backupPath}`);
            return { success: true, backupPath };
            
        } catch (error) {
            console.error('Database backup failed:', error);
            throw error;
        }
    }
    
    /**
     * Restore database from backup
     */
    async restoreFromBackup(backupPath) {
        console.log(`Restoring database from backup: ${backupPath}`);
        
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file does not exist: ${backupPath}`);
        }
        
        try {
            // Close current database
            if (this.db) {
                this.db.close();
            }
            
            // Copy backup to main database file
            fs.copyFileSync(backupPath, this.dbPath);
            
            // Reopen database
            await this.initialize();
            
            // Verify restored database
            const verification = await this.verifyIntegrity();
            
            if (!verification.success) {
                throw new Error('Restored database failed integrity check');
            }
            
            console.log('Database restored successfully');
            return { success: true };
            
        } catch (error) {
            console.error('Database restore failed:', error);
            throw error;
        }
    }
    
    /**
     * Close database connection
     */
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('Database connection closed');
        }
    }
    
    /**
     * Get database connection (for external use)
     */
    getDatabase() {
        return this.db;
    }
}

module.exports = MigrationRunner;