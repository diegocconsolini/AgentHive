#!/usr/bin/env node
/**
 * AgentHive Backup & Rollback System
 * Session-resilient implementation with comprehensive recovery
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const safeFileOps = require('./safe-file-operations');
const { safeExit } = require('./process-cleanup');
const validationHelpers = require('./validation-helpers');

class BackupSystem {
  constructor() {
    this.rootDir = '/home/diegocc/AgentHive';
    this.backupsDir = path.join(this.rootDir, 'backups');
    this.checkpointsDir = path.join(this.rootDir, 'checkpoints');
    this.trackerPath = path.join(this.rootDir, 'packages/system-api/phase-tracker.json');
    
    this.ensureDirectories();
    this.tracker = this.loadTracker();
  }

  ensureDirectories() {
    [this.backupsDir, this.checkpointsDir,
     path.join(this.backupsDir, 'code'),
     path.join(this.backupsDir, 'database'),
     path.join(this.backupsDir, 'config'),
     path.join(this.backupsDir, 'full')].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadTracker() {
    try {
      return JSON.parse(fs.readFileSync(this.trackerPath, 'utf8'));
    } catch (error) {
      console.error('❌ Failed to load phase tracker:', error.message);
      return null;
    }
  }

  saveTracker() {
    fs.writeFileSync(this.trackerPath, JSON.stringify(this.tracker, null, 2));
  }

  /**
   * Create comprehensive system backup
   */
  async createFullBackup(label = 'auto') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `${label}-${timestamp}`;
    
    console.log(`🔄 Creating full backup: ${backupId}`);
    
    try {
      // 1. Git backup (code)
      const gitBackup = await this.createGitBackup(backupId);
      
      // 2. Database backup
      const dbBackup = await this.createDatabaseBackup(backupId);
      
      // 3. Configuration backup
      const configBackup = await this.createConfigBackup(backupId);
      
      // 4. System state backup
      const stateBackup = await this.createStateBackup(backupId);
      
      // 5. Create full system archive
      const fullArchive = await this.createFullArchive(backupId);
      
      // Update tracker with backup info
      this.updateBackupTracker(backupId, {
        timestamp: new Date().toISOString(),
        git: gitBackup,
        database: dbBackup,
        config: configBackup,
        state: stateBackup,
        archive: fullArchive,
        phase: this.tracker?.sessionInfo?.currentPhase || 2,
        week: this.tracker?.phases?.[`phase${this.tracker?.sessionInfo?.currentPhase || 2}`]?.currentWeek || 1
      });
      
      console.log(`✅ Full backup created: ${backupId}`);
      return backupId;
      
    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create Git-based code backup
   */
  async createGitBackup(backupId) {
    const gitDir = path.join(this.backupsDir, 'code', backupId);
    
    try {
      // Create git bundle (complete repo backup)
      const bundlePath = path.join(gitDir, 'repo.bundle');
      fs.mkdirSync(gitDir, { recursive: true });
      
      execSync(`cd ${this.rootDir} && git bundle create ${bundlePath} --all`, {
        stdio: 'pipe'
      });
      
      // Save current branch and commit info
      const branch = execSync('git branch --show-current', { 
        cwd: this.rootDir, 
        encoding: 'utf8' 
      }).trim();
      
      const commit = execSync('git rev-parse HEAD', { 
        cwd: this.rootDir, 
        encoding: 'utf8' 
      }).trim();
      
      const status = execSync('git status --porcelain', { 
        cwd: this.rootDir, 
        encoding: 'utf8' 
      }).trim();
      
      const gitInfo = {
        branch,
        commit,
        hasUncommitted: status.length > 0,
        status,
        bundlePath
      };
      
      fs.writeFileSync(
        path.join(gitDir, 'git-info.json'), 
        JSON.stringify(gitInfo, null, 2)
      );
      
      console.log(`  ✅ Git backup: ${gitDir}`);
      return gitDir;
      
    } catch (error) {
      console.error(`  ❌ Git backup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create database backup
   */
  async createDatabaseBackup(backupId) {
    const dbDir = path.join(this.backupsDir, 'database', backupId);
    fs.mkdirSync(dbDir, { recursive: true });
    
    try {
      // Find SQLite databases
      const dbFiles = [];
      
      // Common database locations
      const dbPaths = [
        'database.sqlite',
        'packages/user-api/database.sqlite',
        'packages/system-api/database.sqlite'
      ];
      
      for (const dbPath of dbPaths) {
        const fullPath = path.join(this.rootDir, dbPath);
        if (fs.existsSync(fullPath)) {
          const backupPath = path.join(dbDir, path.basename(dbPath));
          fs.copyFileSync(fullPath, backupPath);
          
          // Create SQL dump as well
          try {
            const sqlDump = execSync(`sqlite3 ${fullPath} .dump`, { encoding: 'utf8' });
            fs.writeFileSync(backupPath + '.sql', sqlDump);
          } catch (sqlError) {
            console.warn(`  ⚠️  Could not create SQL dump for ${dbPath}`);
          }
          
          dbFiles.push({ original: dbPath, backup: backupPath });
        }
      }
      
      // Save database info
      fs.writeFileSync(
        path.join(dbDir, 'db-info.json'),
        JSON.stringify({ files: dbFiles, timestamp: new Date().toISOString() }, null, 2)
      );
      
      console.log(`  ✅ Database backup: ${dbFiles.length} databases backed up`);
      return dbDir;
      
    } catch (error) {
      console.error(`  ❌ Database backup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create configuration backup
   */
  async createConfigBackup(backupId) {
    const configDir = path.join(this.backupsDir, 'config', backupId);
    fs.mkdirSync(configDir, { recursive: true });
    
    try {
      // Important config files
      const configFiles = [
        '.env',
        'package.json',
        'packages/system-api/package.json',
        'packages/user-api/package.json',
        'packages/web/package.json',
        'packages/cli/package.json',
        'packages/system-api/phase-tracker.json',
        'agents-data.json'
      ];
      
      const backedUpFiles = [];
      
      for (const configFile of configFiles) {
        const fullPath = path.join(this.rootDir, configFile);
        if (fs.existsSync(fullPath)) {
          const backupPath = path.join(configDir, configFile.replace(/\//g, '_'));
          fs.copyFileSync(fullPath, backupPath);
          backedUpFiles.push({ original: configFile, backup: backupPath });
        }
      }
      
      // Save config info
      fs.writeFileSync(
        path.join(configDir, 'config-info.json'),
        JSON.stringify({ files: backedUpFiles, timestamp: new Date().toISOString() }, null, 2)
      );
      
      console.log(`  ✅ Config backup: ${backedUpFiles.length} files backed up`);
      return configDir;
      
    } catch (error) {
      console.error(`  ❌ Config backup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create system state backup
   */
  async createStateBackup(backupId) {
    const stateDir = path.join(this.backupsDir, 'state', backupId);
    fs.mkdirSync(stateDir, { recursive: true });
    
    try {
      // System information
      const systemInfo = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        workingDirectory: process.cwd(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          AI_PROVIDER_ENDPOINT: process.env.AI_PROVIDER_ENDPOINT,
          SYSTEM_API_PORT: process.env.SYSTEM_API_PORT,
          USER_API_PORT: process.env.USER_API_PORT
        }
      };
      
      // Running processes (if any)
      try {
        const processes = execSync('ps aux | grep "node\\|npm"', { encoding: 'utf8' });
        systemInfo.processes = processes;
      } catch (error) {
        systemInfo.processes = 'Could not get process list';
      }
      
      // Network ports
      try {
        const netstat = execSync('netstat -tlnp 2>/dev/null | grep ":300[0-9]\\|:400[0-9]"', { encoding: 'utf8' });
        systemInfo.ports = netstat;
      } catch (error) {
        systemInfo.ports = 'Could not get port list';
      }
      
      // GPU status (if available)
      try {
        const gpuInfo = execSync('nvidia-smi --query-gpu=name,memory.total,memory.free,memory.used,utilization.gpu,temperature.gpu --format=csv,noheader', { encoding: 'utf8' });
        systemInfo.gpu = gpuInfo.trim();
      } catch (error) {
        systemInfo.gpu = 'GPU info not available';
      }
      
      fs.writeFileSync(
        path.join(stateDir, 'system-info.json'),
        JSON.stringify(systemInfo, null, 2)
      );
      
      console.log(`  ✅ System state backup: ${stateDir}`);
      return stateDir;
      
    } catch (error) {
      console.error(`  ❌ System state backup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create full system archive
   */
  async createFullArchive(backupId) {
    const archivePath = path.join(this.backupsDir, 'full', `${backupId}.tar.gz`);
    
    try {
      // Create compressed archive of entire project (excluding node_modules and large files)
      execSync(`cd ${this.rootDir} && tar -czf ${archivePath} \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='build' \
        --exclude='.next' \
        --exclude='*.log' \
        --exclude='backups' \
        --exclude='.git' \
        .`, { stdio: 'pipe' });
      
      const stats = fs.statSync(archivePath);
      console.log(`  ✅ Full archive: ${archivePath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
      
      return archivePath;
      
    } catch (error) {
      console.error(`  ❌ Full archive failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update backup tracker
   */
  updateBackupTracker(backupId, backupInfo) {
    if (!this.tracker) return;
    
    if (!this.tracker.backupStrategy.restorePoints) {
      this.tracker.backupStrategy.restorePoints = [];
    }
    
    // Add restore point
    this.tracker.backupStrategy.restorePoints.unshift({
      id: backupId,
      ...backupInfo
    });
    
    // Keep only last 10 restore points
    this.tracker.backupStrategy.restorePoints = 
      this.tracker.backupStrategy.restorePoints.slice(0, 10);
    
    // Update last backup timestamps
    const now = new Date().toISOString();
    this.tracker.backupStrategy.backupTypes.code.lastBackup = now;
    this.tracker.backupStrategy.backupTypes.database.lastBackup = now;
    this.tracker.backupStrategy.backupTypes.configuration.lastBackup = now;
    this.tracker.backupStrategy.backupTypes.fullSystem.lastBackup = now;
    
    this.saveTracker();
  }

  /**
   * List available backups
   */
  listBackups() {
    console.log('📦 AVAILABLE BACKUPS');
    console.log('═══════════════════');
    
    if (!this.tracker?.backupStrategy?.restorePoints) {
      console.log('No backups found');
      return [];
    }
    
    for (const [index, backup] of this.tracker.backupStrategy.restorePoints.entries()) {
      console.log(`${index + 1}. ${backup.id}`);
      console.log(`   📅 ${backup.timestamp}`);
      console.log(`   📍 Phase ${backup.phase}, Week ${backup.week}`);
      console.log(`   💾 Archive: ${fs.existsSync(backup.archive) ? '✅' : '❌'}`);
      console.log(`   🗃️  Git: ${fs.existsSync(backup.git) ? '✅' : '❌'}`);
      console.log('');
    }
    
    return this.tracker.backupStrategy.restorePoints;
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId, options = {}) {
    console.log(`🔄 Restoring from backup: ${backupId}`);
    
    try {
      // Validate inputs
      if (!backupId || typeof backupId !== 'string') {
        throw new Error('Backup ID is required and must be a string');
      }

      // Find backup
      const backup = this.tracker?.backupStrategy?.restorePoints?.find(b => b.id === backupId);
      if (!backup) {
        console.error(`❌ Backup ${backupId} not found`);
        console.log('Available backups:');
        if (this.tracker?.backupStrategy?.restorePoints) {
          this.tracker.backupStrategy.restorePoints.forEach(bp => {
            console.log(`  - ${bp.id} (${bp.timestamp})`);
          });
        }
        throw new Error(`Backup ${backupId} not found`);
      }

      // Validate backup integrity
      const integrityCheck = await this.validateBackupIntegrity(backup);
      if (!integrityCheck.valid) {
        throw new Error(`Backup integrity check failed: ${integrityCheck.error}`);
      }

      // Check for uncommitted changes and warn user
      if (options.restoreCode !== false) {
        const hasUncommitted = await this.checkUncommittedChanges();
        if (hasUncommitted && !options.force) {
          console.warn('⚠️  Uncommitted changes detected!');
          console.log('Options:');
          console.log('  1. Commit your changes: git add . && git commit -m "Save before restore"');
          console.log('  2. Stash your changes: git stash');
          console.log('  3. Force restore (will lose changes): add --force option');
          console.log('  4. Skip code restore: add --no-code option');
          
          if (options.autoStash !== false) {
            console.log('Creating automatic stash...');
            try {
              execSync('git stash push -m "Auto-stash before restore"', { cwd: this.rootDir });
              console.log('✅ Changes stashed (use "git stash pop" to recover)');
            } catch (stashError) {
              throw new Error(`Failed to stash changes: ${stashError.message}`);
            }
          } else {
            throw new Error('Cannot restore with uncommitted changes without --force or --auto-stash');
          }
        }
      }

      // Dry run option
      if (options.dryRun) {
        console.log('🔍 DRY RUN - No changes will be made');
        return this.simulateRestore(backup, options);
      }
      
      // Create current state backup before restore
      if (!options.skipCurrentBackup) {
        console.log('📦 Creating pre-restore backup...');
        try {
          await this.createFullBackup('pre-restore');
        } catch (backupError) {
          console.warn(`⚠️  Pre-restore backup failed: ${backupError.message}`);
          if (!options.force) {
            throw new Error('Pre-restore backup failed. Use --force to proceed anyway.');
          }
        }
      }
      
      const restoreResults = {
        code: false,
        database: false,
        config: false
      };
      
      // Restore git repository
      if (options.restoreCode !== false && backup.git && fs.existsSync(backup.git)) {
        console.log('🔄 Restoring code...');
        try {
          await this.restoreGit(backup, options);
          restoreResults.code = true;
        } catch (codeError) {
          console.error(`❌ Code restore failed: ${codeError.message}`);
          if (!options.continueOnError) {
            throw codeError;
          }
        }
      }
      
      // Restore database
      if (options.restoreDatabase !== false && backup.database && fs.existsSync(backup.database)) {
        console.log('🔄 Restoring database...');
        try {
          await this.restoreDatabase(backup);
          restoreResults.database = true;
        } catch (dbError) {
          console.error(`❌ Database restore failed: ${dbError.message}`);
          if (!options.continueOnError) {
            throw dbError;
          }
        }
      }
      
      // Restore configuration
      if (options.restoreConfig !== false && backup.config && fs.existsSync(backup.config)) {
        console.log('🔄 Restoring configuration...');
        try {
          await this.restoreConfig(backup);
          restoreResults.config = true;
        } catch (configError) {
          console.error(`❌ Configuration restore failed: ${configError.message}`);
          if (!options.continueOnError) {
            throw configError;
          }
        }
      }
      
      // Summary
      console.log('\n📊 Restore Summary:');
      console.log(`  Code: ${restoreResults.code ? '✅' : '❌'}`);
      console.log(`  Database: ${restoreResults.database ? '✅' : '❌'}`);
      console.log(`  Config: ${restoreResults.config ? '✅' : '❌'}`);
      
      const successCount = Object.values(restoreResults).filter(Boolean).length;
      const totalCount = Object.values(restoreResults).length;
      
      if (successCount === totalCount) {
        console.log('\n✅ Restore completed successfully');
      } else if (successCount > 0) {
        console.log('\n⚠️  Restore completed with some failures');
      } else {
        throw new Error('All restore operations failed');
      }
      
      console.log('⚠️  Please restart services and run tests');
      
      return restoreResults;
      
    } catch (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      throw error;
    }
  }

  async restoreGit(backup, options = {}) {
    const gitInfoPath = path.join(backup.git, 'git-info.json');
    if (!fs.existsSync(gitInfoPath)) {
      throw new Error('Git info not found in backup');
    }
    
    try {
      const gitInfo = safeFileOps.safeJsonRead(gitInfoPath, null);
      if (!gitInfo) {
        throw new Error('Could not read git info from backup');
      }

      // Validate git info structure
      const requiredFields = ['branch', 'commit'];
      for (const field of requiredFields) {
        if (!gitInfo[field]) {
          throw new Error(`Git info missing required field: ${field}`);
        }
      }

      console.log(`Restoring to commit: ${gitInfo.commit.substring(0, 8)}`);
      console.log(`Target branch: ${gitInfo.branch}`);
      
      // Check if target commit exists
      try {
        execSync(`cd ${this.rootDir} && git cat-file -e ${gitInfo.commit}`, { stdio: 'pipe' });
      } catch (commitError) {
        throw new Error(`Target commit ${gitInfo.commit} not found in repository`);
      }
      
      // Reset to backup state with safety checks
      try {
        execSync(`cd ${this.rootDir} && git reset --hard ${gitInfo.commit}`, { 
          stdio: options.verbose ? 'inherit' : 'pipe'
        });
      } catch (resetError) {
        throw new Error(`Git reset failed: ${resetError.message}`);
      }
      
      // Checkout branch if different from current
      if (gitInfo.branch && gitInfo.branch !== 'master' && gitInfo.branch !== 'main') {
        try {
          // Check if branch exists
          execSync(`cd ${this.rootDir} && git show-ref --verify --quiet refs/heads/${gitInfo.branch}`, { stdio: 'pipe' });
          
          // Checkout the branch
          execSync(`cd ${this.rootDir} && git checkout ${gitInfo.branch}`, { 
            stdio: options.verbose ? 'inherit' : 'pipe'
          });
        } catch (branchError) {
          console.warn(`⚠️  Could not checkout branch ${gitInfo.branch}: ${branchError.message}`);
          console.log('Continuing with current branch...');
        }
      }
      
      // Verify restore
      try {
        const currentCommit = execSync('cd ' + this.rootDir + ' && git rev-parse HEAD', { encoding: 'utf8' }).trim();
        if (currentCommit !== gitInfo.commit) {
          throw new Error(`Git restore verification failed: expected ${gitInfo.commit}, got ${currentCommit}`);
        }
        console.log('✅ Git repository restored successfully');
      } catch (verifyError) {
        throw new Error(`Git restore verification failed: ${verifyError.message}`);
      }
      
    } catch (error) {
      throw new Error(`Git restore failed: ${error.message}`);
    }
  }

  async restoreDatabase(backup) {
    const dbInfoPath = path.join(backup.database, 'db-info.json');
    if (!fs.existsSync(dbInfoPath)) {
      throw new Error('Database info not found in backup');
    }
    
    try {
      const dbInfo = safeFileOps.safeJsonRead(dbInfoPath, null);
      if (!dbInfo || !dbInfo.files) {
        throw new Error('Invalid database info in backup');
      }

      let restoredCount = 0;
      let totalCount = dbInfo.files.length;
      
      for (const dbFile of dbInfo.files) {
        if (!dbFile.original || !dbFile.backup) {
          console.warn(`⚠️  Skipping invalid database file entry`);
          continue;
        }
        
        const originalPath = path.join(this.rootDir, dbFile.original);
        
        if (!fs.existsSync(dbFile.backup)) {
          console.warn(`⚠️  Backup file not found: ${dbFile.backup}`);
          continue;
        }
        
        try {
          // Create backup of existing file if it exists
          if (fs.existsSync(originalPath)) {
            const tempBackup = `${originalPath}.pre-restore.${Date.now()}`;
            fs.copyFileSync(originalPath, tempBackup);
            console.log(`  📦 Backed up existing: ${dbFile.original}`);
          }
          
          // Restore the database file
          fs.copyFileSync(dbFile.backup, originalPath);
          
          // Verify the restore
          const backupStats = fs.statSync(dbFile.backup);
          const restoredStats = fs.statSync(originalPath);
          
          if (backupStats.size !== restoredStats.size) {
            throw new Error(`Size mismatch: backup ${backupStats.size} != restored ${restoredStats.size}`);
          }
          
          console.log(`  ✅ Restored: ${dbFile.original} (${backupStats.size} bytes)`);
          restoredCount++;
        } catch (fileError) {
          console.error(`  ❌ Failed to restore ${dbFile.original}: ${fileError.message}`);
        }
      }
      
      if (restoredCount === 0) {
        throw new Error('No database files were restored');
      }
      
      console.log(`✅ Database restore completed: ${restoredCount}/${totalCount} files`);
    } catch (error) {
      throw new Error(`Database restore failed: ${error.message}`);
    }
  }

  async restoreConfig(backup) {
    const configInfoPath = path.join(backup.config, 'config-info.json');
    if (!fs.existsSync(configInfoPath)) {
      throw new Error('Config info not found in backup');
    }
    
    try {
      const configInfo = safeFileOps.safeJsonRead(configInfoPath, null);
      if (!configInfo || !configInfo.files) {
        throw new Error('Invalid config info in backup');
      }

      let restoredCount = 0;
      let totalCount = configInfo.files.length;
      
      for (const configFile of configInfo.files) {
        if (!configFile.original || !configFile.backup) {
          console.warn(`⚠️  Skipping invalid config file entry`);
          continue;
        }
        
        const originalPath = path.join(this.rootDir, configFile.original);
        
        if (!fs.existsSync(configFile.backup)) {
          console.warn(`⚠️  Config backup file not found: ${configFile.backup}`);
          continue;
        }
        
        try {
          // Create backup of existing file if it exists
          if (fs.existsSync(originalPath)) {
            const tempBackup = `${originalPath}.pre-restore.${Date.now()}`;
            fs.copyFileSync(originalPath, tempBackup);
          }
          
          // Restore the config file using safe operations
          const backupContent = fs.readFileSync(configFile.backup, 'utf8');
          safeFileOps.atomicWrite(originalPath, backupContent);
          
          console.log(`  ✅ Restored: ${configFile.original}`);
          restoredCount++;
        } catch (fileError) {
          console.error(`  ❌ Failed to restore ${configFile.original}: ${fileError.message}`);
        }
      }
      
      if (restoredCount === 0) {
        throw new Error('No config files were restored');
      }
      
      console.log(`✅ Config restore completed: ${restoredCount}/${totalCount} files`);
    } catch (error) {
      throw new Error(`Config restore failed: ${error.message}`);
    }
  }

  /**
   * Clean old backups
   */
  cleanup(retentionDays = 30) {
    console.log(`🧹 Cleaning backups older than ${retentionDays} days...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    let cleaned = 0;
    
    if (this.tracker?.backupStrategy?.restorePoints) {
      this.tracker.backupStrategy.restorePoints = 
        this.tracker.backupStrategy.restorePoints.filter(backup => {
          const backupDate = new Date(backup.timestamp);
          if (backupDate < cutoffDate) {
            // Remove backup files
            try {
              if (fs.existsSync(backup.archive)) fs.unlinkSync(backup.archive);
              if (fs.existsSync(backup.git)) fs.rmSync(backup.git, { recursive: true });
              if (fs.existsSync(backup.database)) fs.rmSync(backup.database, { recursive: true });
              if (fs.existsSync(backup.config)) fs.rmSync(backup.config, { recursive: true });
              cleaned++;
            } catch (error) {
              console.warn(`⚠️  Could not clean backup ${backup.id}: ${error.message}`);
            }
            return false;
          }
          return true;
        });
      
      this.saveTracker();
    }
    
    console.log(`✅ Cleaned ${cleaned} old backups`);
  }

  /**
   * Check for uncommitted changes in git repository
   */
  async checkUncommittedChanges() {
    try {
      const status = execSync('git status --porcelain', { 
        cwd: this.rootDir, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return status.trim().length > 0;
    } catch (error) {
      console.warn(`⚠️  Could not check git status: ${error.message}`);
      return false; // Assume no changes if we can't check
    }
  }

  /**
   * Validate backup integrity
   */
  async validateBackupIntegrity(backup) {
    const result = {
      valid: true,
      error: null,
      warnings: []
    };

    try {
      // Check required fields
      const requiredFields = ['id', 'timestamp', 'phase', 'week'];
      for (const field of requiredFields) {
        if (!backup[field]) {
          result.valid = false;
          result.error = `Missing required field: ${field}`;
          return result;
        }
      }

      // Check if backup files exist
      const backupPaths = ['git', 'database', 'config', 'archive'];
      let existingPaths = 0;

      for (const pathType of backupPaths) {
        if (backup[pathType] && fs.existsSync(backup[pathType])) {
          existingPaths++;
        } else if (backup[pathType]) {
          result.warnings.push(`${pathType} backup path does not exist: ${backup[pathType]}`);
        }
      }

      if (existingPaths === 0) {
        result.valid = false;
        result.error = 'No backup files found';
        return result;
      }

      // Validate git backup
      if (backup.git && fs.existsSync(backup.git)) {
        const gitInfoPath = path.join(backup.git, 'git-info.json');
        if (!fs.existsSync(gitInfoPath)) {
          result.warnings.push('Git info file missing');
        } else {
          try {
            const gitInfo = safeFileOps.safeJsonRead(gitInfoPath);
            if (!gitInfo || !gitInfo.commit || !gitInfo.branch) {
              result.warnings.push('Git info incomplete');
            }
          } catch (gitError) {
            result.warnings.push(`Git info invalid: ${gitError.message}`);
          }
        }
      }

      // Validate database backup
      if (backup.database && fs.existsSync(backup.database)) {
        const dbInfoPath = path.join(backup.database, 'db-info.json');
        if (!fs.existsSync(dbInfoPath)) {
          result.warnings.push('Database info file missing');
        }
      }

      // Validate config backup
      if (backup.config && fs.existsSync(backup.config)) {
        const configInfoPath = path.join(backup.config, 'config-info.json');
        if (!fs.existsSync(configInfoPath)) {
          result.warnings.push('Config info file missing');
        }
      }

      if (result.warnings.length > 0) {
        console.warn('⚠️  Backup integrity warnings:');
        result.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }

      return result;
    } catch (error) {
      result.valid = false;
      result.error = `Integrity check failed: ${error.message}`;
      return result;
    }
  }

  /**
   * Simulate restore operation (dry run)
   */
  async simulateRestore(backup, options = {}) {
    console.log('📋 RESTORE SIMULATION');
    console.log('═══════════════════');
    
    const simulation = {
      code: false,
      database: false,
      config: false,
      warnings: [],
      errors: []
    };

    try {
      // Simulate code restore
      if (options.restoreCode !== false && backup.git && fs.existsSync(backup.git)) {
        console.log('🔍 Code restore simulation:');
        
        const gitInfoPath = path.join(backup.git, 'git-info.json');
        if (fs.existsSync(gitInfoPath)) {
          try {
            const gitInfo = safeFileOps.safeJsonRead(gitInfoPath);
            if (gitInfo && gitInfo.commit && gitInfo.branch) {
              console.log(`  📍 Target commit: ${gitInfo.commit.substring(0, 8)}`);
              console.log(`  🌿 Target branch: ${gitInfo.branch}`);
              
              // Check if commit exists
              try {
                execSync(`cd ${this.rootDir} && git cat-file -e ${gitInfo.commit}`, { stdio: 'pipe' });
                console.log('  ✅ Target commit exists');
                simulation.code = true;
              } catch (commitError) {
                simulation.errors.push(`Target commit ${gitInfo.commit} not found`);
                console.log('  ❌ Target commit not found');
              }
            } else {
              simulation.warnings.push('Git info incomplete');
            }
          } catch (gitError) {
            simulation.errors.push(`Git info invalid: ${gitError.message}`);
          }
        } else {
          simulation.errors.push('Git info file missing');
        }
      }

      // Simulate database restore
      if (options.restoreDatabase !== false && backup.database && fs.existsSync(backup.database)) {
        console.log('🔍 Database restore simulation:');
        
        const dbInfoPath = path.join(backup.database, 'db-info.json');
        if (fs.existsSync(dbInfoPath)) {
          try {
            const dbInfo = safeFileOps.safeJsonRead(dbInfoPath);
            if (dbInfo && dbInfo.files && Array.isArray(dbInfo.files)) {
              console.log(`  📊 ${dbInfo.files.length} database files to restore`);
              
              let validFiles = 0;
              for (const dbFile of dbInfo.files) {
                if (fs.existsSync(dbFile.backup)) {
                  validFiles++;
                } else {
                  simulation.warnings.push(`Database backup file missing: ${dbFile.backup}`);
                }
              }
              
              console.log(`  ✅ ${validFiles}/${dbInfo.files.length} backup files available`);
              simulation.database = validFiles > 0;
            } else {
              simulation.errors.push('Database info incomplete');
            }
          } catch (dbError) {
            simulation.errors.push(`Database info invalid: ${dbError.message}`);
          }
        } else {
          simulation.errors.push('Database info file missing');
        }
      }

      // Simulate config restore
      if (options.restoreConfig !== false && backup.config && fs.existsSync(backup.config)) {
        console.log('🔍 Config restore simulation:');
        
        const configInfoPath = path.join(backup.config, 'config-info.json');
        if (fs.existsSync(configInfoPath)) {
          try {
            const configInfo = safeFileOps.safeJsonRead(configInfoPath);
            if (configInfo && configInfo.files && Array.isArray(configInfo.files)) {
              console.log(`  📁 ${configInfo.files.length} config files to restore`);
              
              let validFiles = 0;
              for (const configFile of configInfo.files) {
                if (fs.existsSync(configFile.backup)) {
                  validFiles++;
                } else {
                  simulation.warnings.push(`Config backup file missing: ${configFile.backup}`);
                }
              }
              
              console.log(`  ✅ ${validFiles}/${configInfo.files.length} backup files available`);
              simulation.config = validFiles > 0;
            } else {
              simulation.errors.push('Config info incomplete');
            }
          } catch (configError) {
            simulation.errors.push(`Config info invalid: ${configError.message}`);
          }
        } else {
          simulation.errors.push('Config info file missing');
        }
      }

      // Summary
      console.log('\n📊 SIMULATION RESULTS:');
      console.log(`  Code: ${simulation.code ? '✅' : '❌'}`);
      console.log(`  Database: ${simulation.database ? '✅' : '❌'}`);
      console.log(`  Config: ${simulation.config ? '✅' : '❌'}`);
      
      if (simulation.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        simulation.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      if (simulation.errors.length > 0) {
        console.log('\n❌ Errors:');
        simulation.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      const successCount = Object.values(simulation).filter(v => typeof v === 'boolean' && v).length;
      if (successCount > 0) {
        console.log(`\n🎯 Restore would ${simulation.errors.length > 0 ? 'partially' : 'fully'} succeed`);
      } else {
        console.log('\n💥 Restore would fail completely');
      }
      
      return simulation;
    } catch (error) {
      console.error(`❌ Simulation failed: ${error.message}`);
      return simulation;
    }
  }
}

// CLI interface
if (require.main === module) {
  const backup = new BackupSystem();
  const command = process.argv[2];
  const arg1 = process.argv[3];
  
  switch (command) {
    case 'create':
      backup.createFullBackup(arg1 || 'manual').catch(console.error);
      break;
    
    case 'list':
      backup.listBackups();
      break;
    
    case 'restore':
      if (!arg1) {
        console.error('❌ Please specify backup ID');
        safeExit(1);
      }
      backup.restoreFromBackup(arg1).catch(console.error);
      break;
    
    case 'cleanup':
      backup.cleanup(parseInt(arg1) || 30);
      break;
    
    case 'help':
    default:
      console.log(`
📦 AgentHive Backup System

Usage:
  node backup-system.js create [label]     Create full backup
  node backup-system.js list              List available backups
  node backup-system.js restore <id>      Restore from backup
  node backup-system.js cleanup [days]    Clean old backups (default: 30 days)

Examples:
  node backup-system.js create phase2-start
  node backup-system.js restore auto-2025-01-07T19-00-00-000Z
  node backup-system.js cleanup 7
      `);
      break;
  }
}

module.exports = BackupSystem;