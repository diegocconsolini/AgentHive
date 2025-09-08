#!/usr/bin/env node
/**
 * AgentHive Backup & Rollback System
 * Session-resilient implementation with comprehensive recovery
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    
    const backup = this.tracker?.backupStrategy?.restorePoints?.find(b => b.id === backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }
    
    try {
      // Create current state backup before restore
      if (!options.skipCurrentBackup) {
        console.log('📦 Creating pre-restore backup...');
        await this.createFullBackup('pre-restore');
      }
      
      // Restore git repository
      if (options.restoreCode !== false && fs.existsSync(backup.git)) {
        console.log('🔄 Restoring code...');
        await this.restoreGit(backup);
      }
      
      // Restore database
      if (options.restoreDatabase !== false && fs.existsSync(backup.database)) {
        console.log('🔄 Restoring database...');
        await this.restoreDatabase(backup);
      }
      
      // Restore configuration
      if (options.restoreConfig !== false && fs.existsSync(backup.config)) {
        console.log('🔄 Restoring configuration...');
        await this.restoreConfig(backup);
      }
      
      console.log('✅ Restore completed successfully');
      console.log('⚠️  Please restart services and run tests');
      
    } catch (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      throw error;
    }
  }

  async restoreGit(backup) {
    const gitInfoPath = path.join(backup.git, 'git-info.json');
    if (!fs.existsSync(gitInfoPath)) {
      throw new Error('Git info not found in backup');
    }
    
    const gitInfo = JSON.parse(fs.readFileSync(gitInfoPath, 'utf8'));
    
    // Reset to backup state
    execSync(`cd ${this.rootDir} && git reset --hard ${gitInfo.commit}`, { stdio: 'inherit' });
    
    if (gitInfo.branch !== 'master' && gitInfo.branch !== 'main') {
      execSync(`cd ${this.rootDir} && git checkout ${gitInfo.branch}`, { stdio: 'inherit' });
    }
  }

  async restoreDatabase(backup) {
    const dbInfoPath = path.join(backup.database, 'db-info.json');
    if (!fs.existsSync(dbInfoPath)) {
      throw new Error('Database info not found in backup');
    }
    
    const dbInfo = JSON.parse(fs.readFileSync(dbInfoPath, 'utf8'));
    
    for (const dbFile of dbInfo.files) {
      const originalPath = path.join(this.rootDir, dbFile.original);
      if (fs.existsSync(dbFile.backup)) {
        fs.copyFileSync(dbFile.backup, originalPath);
        console.log(`  ✅ Restored: ${dbFile.original}`);
      }
    }
  }

  async restoreConfig(backup) {
    const configInfoPath = path.join(backup.config, 'config-info.json');
    if (!fs.existsSync(configInfoPath)) {
      throw new Error('Config info not found in backup');
    }
    
    const configInfo = JSON.parse(fs.readFileSync(configInfoPath, 'utf8'));
    
    for (const configFile of configInfo.files) {
      const originalPath = path.join(this.rootDir, configFile.original);
      if (fs.existsSync(configFile.backup)) {
        fs.copyFileSync(configFile.backup, originalPath);
        console.log(`  ✅ Restored: ${configFile.original}`);
      }
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
        process.exit(1);
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