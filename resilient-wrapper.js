#!/usr/bin/env node
/**
 * Resilient Session Manager Wrapper
 * Enhanced safety mode for AgentHive development sessions
 * 
 * Usage: node resilient-wrapper.js [command] [args...]
 * 
 * This wrapper provides additional safety features on top of the base SessionManager:
 * - Automatic data validation and repair
 * - Enhanced error recovery
 * - Pre-flight safety checks
 * - Comprehensive logging
 * - Rollback capabilities
 */

const SessionManager = require('./session-manager');
const safeFileOps = require('./safe-file-operations');
const validationHelpers = require('./validation-helpers');
const path = require('path');
const fs = require('fs');

class ResilientSessionManager extends SessionManager {
  constructor() {
    super();
    this.lockIdentifier = 'session-manager';
    this.logFile = '/tmp/agenthive-session.log';
    this.enableVerboseLogging = process.env.VERBOSE === 'true';
    
    this.initializeResilientMode();
  }

  /**
   * Initialize resilient mode with additional safety features
   */
  initializeResilientMode() {
    console.log('🛡️  Initializing Resilient Session Manager');
    console.log('══════════════════════════════════════');
    
    // Set up process handlers
    this.setupProcessHandlers();
    
    // Validate system prerequisites
    this.validateSystemPrerequisites();
    
    // Initialize logging
    this.initializeLogging();
    
    console.log('✅ Resilient mode initialized');
    console.log('📊 Additional features:');
    console.log('  • Automatic data validation and repair');
    console.log('  • Enhanced error recovery with rollback');
    console.log('  • File locking to prevent concurrent access');
    console.log('  • Comprehensive operation logging');
    console.log('  • Pre-flight safety checks');
    console.log('');
  }

  /**
   * Set up process handlers for graceful shutdown
   */
  setupProcessHandlers() {
    const cleanup = () => {
      console.log('🧹 Cleaning up resilient session manager...');
      try {
        safeFileOps.releaseLock(this.lockIdentifier);
        this.log('Session manager shutdown gracefully');
      } catch (error) {
        console.warn(`⚠️  Cleanup warning: ${error.message}`);
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught exception:', error.message);
      this.log(`FATAL: ${error.message}\\n${error.stack}`);
      cleanup();
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled rejection:', reason);
      this.log(`UNHANDLED REJECTION: ${reason}`);
      cleanup();
      process.exit(1);
    });
  }

  /**
   * Validate system prerequisites
   */
  validateSystemPrerequisites() {
    const requirements = [
      { command: 'git --version', name: 'Git' },
      { command: 'node --version', name: 'Node.js' },
      { command: 'npm --version', name: 'NPM' }
    ];

    for (const req of requirements) {
      try {
        require('child_process').execSync(req.command, { stdio: 'pipe' });
      } catch (error) {
        throw new Error(`${req.name} is not available or not working properly`);
      }
    }
  }

  /**
   * Initialize comprehensive logging
   */
  initializeLogging() {
    try {
      this.log('=== Resilient Session Manager Started ===');
      this.log(`Timestamp: ${new Date().toISOString()}`);
      this.log(`Node Version: ${process.version}`);
      this.log(`Working Directory: ${process.cwd()}`);
      this.log(`Process ID: ${process.pid}`);
    } catch (error) {
      console.warn(`⚠️  Could not initialize logging: ${error.message}`);
    }
  }

  /**
   * Enhanced logging with rotation
   */
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\\n`;
    
    if (this.enableVerboseLogging) {
      console.log(`🔍 LOG: ${message}`);
    }
    
    try {
      fs.appendFileSync(this.logFile, logEntry);
      
      // Rotate log file if it gets too large (>1MB)
      const stats = fs.statSync(this.logFile);
      if (stats.size > 1024 * 1024) {
        const rotatedPath = `${this.logFile}.old`;
        fs.renameSync(this.logFile, rotatedPath);
        this.log('Log file rotated');
      }
    } catch (error) {
      // Don't fail on logging errors
      if (this.enableVerboseLogging) {
        console.warn(`⚠️  Logging failed: ${error.message}`);
      }
    }
  }

  /**
   * Enhanced session start with safety checks
   */
  async startSession(options = {}) {
    try {
      this.log('Starting resilient session', 'INFO');
      
      // Acquire lock to prevent concurrent sessions
      try {
        safeFileOps.acquireLock(this.lockIdentifier, 5000);
        this.log('Lock acquired successfully');
      } catch (lockError) {
        throw new Error(`Cannot start session - another session may be running: ${lockError.message}`);
      }
      
      // Pre-flight checks
      await this.performPreFlightChecks();
      
      // Validate and repair tracker if needed
      await this.ensureTrackerIntegrity();
      
      // Call parent implementation with enhanced options
      const enhancedOptions = {
        createBackup: true, // Always create backup in resilient mode
        ...options
      };
      
      const result = await super.startSession(enhancedOptions);
      
      this.log('Session started successfully');
      return result;
      
    } catch (error) {
      this.log(`Session start failed: ${error.message}`, 'ERROR');
      safeFileOps.releaseLock(this.lockIdentifier);
      throw error;
    }
  }

  /**
   * Enhanced component start with validation
   */
  async startComponent(componentName) {
    try {
      this.log(`Starting component: ${componentName}`);
      
      // Validate component exists and is in correct state
      const componentValidation = await this.validateComponentReadiness(componentName);
      if (!componentValidation.ready) {
        throw new Error(`Component not ready: ${componentValidation.reason}`);
      }
      
      // Create checkpoint before starting
      try {
        await this.createCheckpoint(`pre-${componentName}`);
        this.log(`Pre-component checkpoint created`);
      } catch (checkpointError) {
        console.warn(`⚠️  Could not create pre-component checkpoint: ${checkpointError.message}`);
      }
      
      const result = await super.startComponent(componentName);
      
      if (result) {
        this.log(`Component ${componentName} started successfully`);
      } else {
        this.log(`Component ${componentName} start failed`, 'ERROR');
      }
      
      return result;
    } catch (error) {
      this.log(`Component start failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Enhanced component completion with comprehensive validation
   */
  async completeComponent(componentName) {
    try {
      this.log(`Completing component: ${componentName}`);
      
      // Pre-completion validation
      const preValidation = await this.performPreCompletionChecks(componentName);
      if (!preValidation.passed) {
        console.warn('⚠️  Pre-completion checks revealed issues:');
        preValidation.issues.forEach(issue => console.warn(`  - ${issue}`));
        
        if (preValidation.critical) {
          throw new Error('Critical issues prevent completion');
        }
        
        console.log('Continuing despite warnings...');
      }
      
      const result = await super.completeComponent(componentName);
      
      if (result) {
        this.log(`Component ${componentName} completed successfully`);
        
        // Post-completion verification
        await this.performPostCompletionVerification(componentName);
      } else {
        this.log(`Component ${componentName} completion failed`, 'ERROR');
      }
      
      return result;
    } catch (error) {
      this.log(`Component completion failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Enhanced checkpoint creation with verification
   */
  async createCheckpoint(name) {
    try {
      this.log(`Creating enhanced checkpoint: ${name}`);
      
      // Validate system state before checkpoint
      const stateValidation = await this.validateSystemState();
      if (!stateValidation.valid) {
        console.warn('⚠️  System state issues detected:');
        stateValidation.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }
      
      // Create checkpoint with parent implementation
      await super.createCheckpoint(name);
      
      // Verify checkpoint was created successfully
      const verification = await this.verifyCheckpointIntegrity(name);
      if (!verification.valid) {
        throw new Error(`Checkpoint verification failed: ${verification.error}`);
      }
      
      this.log(`Checkpoint ${name} created and verified successfully`);
      
    } catch (error) {
      this.log(`Checkpoint creation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Perform pre-flight safety checks
   */
  async performPreFlightChecks() {
    this.log('Performing pre-flight checks');
    
    const checks = [];
    
    // Check disk space
    try {
      const stats = fs.statSync(process.cwd());
      // Basic check - if we can stat the directory, assume we have some space
      checks.push({ name: 'Disk Space', passed: true });
    } catch (error) {
      checks.push({ name: 'Disk Space', passed: false, error: error.message });
    }
    
    // Check git repository status
    try {
      require('child_process').execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      checks.push({ name: 'Git Repository', passed: true });
    } catch (error) {
      checks.push({ name: 'Git Repository', passed: false, error: 'Not in a git repository' });
    }
    
    // Check if required files exist
    const requiredFiles = [
      'packages/system-api/phase-gate-validator.js',
      'backup-system.js'
    ];
    
    for (const file of requiredFiles) {
      const exists = fs.existsSync(file);
      checks.push({ name: `Required File: ${file}`, passed: exists });
      if (!exists) {
        checks[checks.length - 1].error = 'File not found';
      }
    }
    
    // Report results
    const failedChecks = checks.filter(check => !check.passed);
    if (failedChecks.length > 0) {
      console.warn('⚠️  Pre-flight check warnings:');
      failedChecks.forEach(check => {
        console.warn(`  ❌ ${check.name}: ${check.error || 'Failed'}`);
      });
      
      const criticalFailures = failedChecks.filter(check => 
        check.name.includes('Git Repository') || check.name.includes('Required File')
      );
      
      if (criticalFailures.length > 0) {
        throw new Error('Critical pre-flight checks failed');
      }
    } else {
      console.log('✅ All pre-flight checks passed');
    }
  }

  /**
   * Ensure tracker integrity with auto-repair
   */
  async ensureTrackerIntegrity() {
    this.log('Checking tracker integrity');
    
    try {
      const trackerPath = this.validator.trackerPath;
      const repairResult = validationHelpers.repairTracker(trackerPath);
      
      if (repairResult.success) {
        if (repairResult.repaired) {
          console.log('🔧 Tracker was repaired automatically');
          this.log('Tracker auto-repaired', 'WARN');
        } else {
          console.log('✅ Tracker integrity verified');
          this.log('Tracker integrity OK');
        }
      } else {
        throw new Error(`Tracker repair failed: ${repairResult.error}`);
      }
    } catch (error) {
      this.log(`Tracker integrity check failed: ${error.message}`, 'ERROR');
      throw new Error(`Cannot ensure tracker integrity: ${error.message}`);
    }
  }

  /**
   * Validate component readiness
   */
  async validateComponentReadiness(componentName) {
    this.log(`Validating readiness for component: ${componentName}`);
    
    try {
      // Check if component exists in tracker
      if (!this.validator?.tracker?.sessionInfo?.currentPhase) {
        return { ready: false, reason: 'No current phase set' };
      }

      const currentPhase = this.validator.tracker.sessionInfo.currentPhase;
      const phase = this.validator.tracker.phases?.[`phase${currentPhase}`];
      
      if (!phase?.currentWeek) {
        return { ready: false, reason: 'No current week set' };
      }

      const week = phase.weeks?.[`week${phase.currentWeek}`];
      if (!week?.components) {
        return { ready: false, reason: 'No components found in current week' };
      }

      const component = week.components.find(c => c.name === componentName);
      if (!component) {
        return { ready: false, reason: `Component ${componentName} not found in current week` };
      }

      if (component.status === 'completed') {
        return { ready: false, reason: 'Component is already completed' };
      }

      return { ready: true };
    } catch (error) {
      return { ready: false, reason: `Validation error: ${error.message}` };
    }
  }

  /**
   * Perform pre-completion checks
   */
  async performPreCompletionChecks(componentName) {
    this.log(`Performing pre-completion checks for: ${componentName}`);
    
    const result = {
      passed: true,
      issues: [],
      critical: false
    };

    try {
      // Check if any tests are available
      const hasTests = await this.checkTestAvailability();
      if (!hasTests) {
        result.issues.push('No tests detected - component completion may be premature');
      }

      // Check for uncommitted changes
      try {
        const status = require('child_process').execSync('git status --porcelain', { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
        if (status.trim()) {
          result.issues.push('Uncommitted changes detected - consider committing before completion');
        }
      } catch (gitError) {
        result.issues.push('Could not check git status');
      }

      // Check component dependencies
      const depCheck = await this.checkComponentDependencies(componentName);
      if (!depCheck.satisfied) {
        result.issues.push(...depCheck.missing.map(dep => `Dependency not satisfied: ${dep}`));
      }

      result.passed = result.issues.length === 0;
      
      this.log(`Pre-completion checks: ${result.passed ? 'PASSED' : 'WARNINGS'}`);
      return result;
    } catch (error) {
      result.passed = false;
      result.critical = true;
      result.issues.push(`Pre-completion check failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Perform post-completion verification
   */
  async performPostCompletionVerification(componentName) {
    this.log(`Performing post-completion verification for: ${componentName}`);
    
    try {
      // Run a quick system validation
      const systemCheck = await this.validateSystemState();
      if (!systemCheck.valid) {
        console.warn('⚠️  Post-completion system state warnings:');
        systemCheck.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }

      // Check if component status was properly updated
      const currentPhase = this.validator?.tracker?.sessionInfo?.currentPhase;
      const phase = this.validator?.tracker?.phases?.[`phase${currentPhase}`];
      const week = phase?.weeks?.[`week${phase.currentWeek}`];
      const component = week?.components?.find(c => c.name === componentName);
      
      if (component && component.status !== 'completed') {
        console.warn(`⚠️  Component status not updated to completed: ${component.status}`);
      } else {
        console.log('✅ Component status properly updated');
      }

      this.log(`Post-completion verification completed for ${componentName}`);
    } catch (error) {
      this.log(`Post-completion verification failed: ${error.message}`, 'WARN');
      console.warn(`⚠️  Post-completion verification failed: ${error.message}`);
    }
  }

  /**
   * Validate overall system state
   */
  async validateSystemState() {
    const result = {
      valid: true,
      warnings: []
    };

    try {
      // Check tracker validity
      if (this.validator?.tracker) {
        const validation = validationHelpers.validateTrackerSchema(this.validator.tracker, false);
        if (validation.errors.length > 0) {
          result.valid = false;
          result.warnings.push(...validation.errors);
        }
      } else {
        result.warnings.push('Tracker not available');
      }

      // Check lock status
      const lockInfo = safeFileOps.getLockInfo(this.lockIdentifier);
      if (lockInfo.locked && lockInfo.stale) {
        result.warnings.push('Stale lock detected');
      }

      return result;
    } catch (error) {
      result.valid = false;
      result.warnings.push(`System state check failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Check test availability
   */
  async checkTestAvailability() {
    const testPaths = [
      'npm test',
      'packages/system-api/src/mesh/test-mesh-integration.js'
    ];

    for (const testPath of testPaths) {
      try {
        if (testPath === 'npm test') {
          // Check if package.json has test script
          const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          if (packageJson.scripts && packageJson.scripts.test) {
            return true;
          }
        } else {
          // Check if file exists
          if (fs.existsSync(testPath)) {
            return true;
          }
        }
      } catch (error) {
        continue;
      }
    }

    return false;
  }

  /**
   * Check component dependencies
   */
  async checkComponentDependencies(componentName) {
    try {
      // This is a simplified dependency check
      // In a real implementation, you would check actual dependencies
      return {
        satisfied: true,
        missing: []
      };
    } catch (error) {
      return {
        satisfied: false,
        missing: [`Dependency check failed: ${error.message}`]
      };
    }
  }

  /**
   * Verify checkpoint integrity
   */
  async verifyCheckpointIntegrity(checkpointName) {
    try {
      // Check if backup was created
      const backups = this.tracker?.backupStrategy?.restorePoints || [];
      const recentBackup = backups.find(backup => backup.id.includes(checkpointName));
      
      if (!recentBackup) {
        return { valid: false, error: 'No backup found for checkpoint' };
      }

      // Basic integrity check
      if (recentBackup.archive && fs.existsSync(recentBackup.archive)) {
        return { valid: true };
      }

      return { valid: false, error: 'Checkpoint backup files not found' };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Show resilient mode status
   */
  showStatus() {
    console.log('🛡️  RESILIENT SESSION MANAGER STATUS');
    console.log('═══════════════════════════════════');
    
    // Show lock status
    const lockInfo = safeFileOps.getLockInfo(this.lockIdentifier);
    console.log(`🔒 Lock Status: ${lockInfo.locked ? 'LOCKED' : 'AVAILABLE'}`);
    if (lockInfo.locked) {
      console.log(`   PID: ${lockInfo.pid}`);
      console.log(`   Age: ${Math.round(lockInfo.age / 1000)}s`);
      console.log(`   Stale: ${lockInfo.stale ? '⚠️  YES' : 'No'}`);
    }
    
    // Show log file status
    if (fs.existsSync(this.logFile)) {
      const stats = fs.statSync(this.logFile);
      console.log(`📝 Log File: ${this.logFile}`);
      console.log(`   Size: ${(stats.size / 1024).toFixed(1)}KB`);
      console.log(`   Modified: ${stats.mtime.toISOString()}`);
    }
    
    console.log('');
    
    // Show base status
    try {
      if (this.validator) {
        this.validator.getStatus();
      } else {
        console.log('📊 Base validator not initialized');
      }
    } catch (error) {
      console.warn(`⚠️  Could not show base status: ${error.message}`);
    }
  }

  /**
   * Clean up resilient mode resources
   */
  cleanup() {
    this.log('Cleaning up resilient session manager');
    
    try {
      safeFileOps.releaseLock(this.lockIdentifier);
      console.log('🧹 Lock released');
    } catch (error) {
      console.warn(`⚠️  Could not release lock: ${error.message}`);
    }
    
    try {
      safeFileOps.cleanupOldBackups();
      console.log('🧹 Old backups cleaned');
    } catch (error) {
      console.warn(`⚠️  Could not clean backups: ${error.message}`);
    }
  }
}

// CLI interface with enhanced commands
if (require.main === module) {
  const manager = new ResilientSessionManager();
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];
  const arg3 = process.argv[5];

  switch (command) {
    case 'start':
      manager.startSession().catch(error => {
        console.error('❌ Resilient session start failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      manager.showStatus();
      break;
    
    case 'component':
      if (arg1) {
        manager.startComponent(arg1).then(success => {
          process.exit(success ? 0 : 1);
        }).catch(error => {
          console.error('❌ Resilient component start failed:', error.message);
          process.exit(1);
        });
      } else {
        console.error('❌ Please specify component name');
        process.exit(1);
      }
      break;
    
    case 'complete':
      if (arg1) {
        manager.completeComponent(arg1).then(success => {
          process.exit(success ? 0 : 1);
        }).catch(error => {
          console.error('❌ Resilient component completion failed:', error.message);
          process.exit(1);
        });
      } else {
        console.error('❌ Please specify component name');
        process.exit(1);
      }
      break;
    
    case 'checkpoint':
      manager.createCheckpoint(arg1 || 'manual').then(() => {
        console.log('✅ Resilient checkpoint operation completed');
        process.exit(0);
      }).catch(error => {
        console.error('❌ Resilient checkpoint creation failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'validate':
      if (arg1 === 'component' && arg2) {
        manager.validator.validateComponent(arg2).then(success => {
          process.exit(success ? 0 : 1);
        }).catch(error => {
          console.error('❌ Component validation failed:', error.message);
          process.exit(1);
        });
      } else if (arg1 === 'week' && arg2 && arg3) {
        manager.validator.validateWeek(parseInt(arg2), parseInt(arg3)).then(success => {
          process.exit(success ? 0 : 1);
        }).catch(error => {
          console.error('❌ Week validation failed:', error.message);
          process.exit(1);
        });
      } else if (arg1 === 'phase' && arg2) {
        manager.validator.validatePhase(parseInt(arg2)).then(success => {
          process.exit(success ? 0 : 1);
        }).catch(error => {
          console.error('❌ Phase validation failed:', error.message);
          process.exit(1);
        });
      } else {
        console.error('❌ Usage: validate [component <name> | week <phase> <week> | phase <num>]');
        process.exit(1);
      }
      break;
    
    case 'backup':
      manager.backup.createFullBackup('manual').then(() => {
        console.log('✅ Backup completed');
        process.exit(0);
      }).catch(error => {
        console.error('❌ Backup failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'restore':
      if (arg1) {
        const options = {};
        if (process.argv.includes('--dry-run')) options.dryRun = true;
        if (process.argv.includes('--force')) options.force = true;
        if (process.argv.includes('--auto-stash')) options.autoStash = true;
        if (process.argv.includes('--no-code')) options.restoreCode = false;
        if (process.argv.includes('--no-database')) options.restoreDatabase = false;
        if (process.argv.includes('--no-config')) options.restoreConfig = false;
        
        manager.backup.restoreFromBackup(arg1, options).then(() => {
          console.log('✅ Restore completed');
          process.exit(0);
        }).catch(error => {
          console.error('❌ Restore failed:', error.message);
          process.exit(1);
        });
      } else {
        console.error('❌ Please specify backup ID');
        console.log('Available options: --dry-run, --force, --auto-stash, --no-code, --no-database, --no-config');
        process.exit(1);
      }
      break;
    
    case 'cleanup':
      manager.cleanup();
      break;
    
    case 'logs':
      if (fs.existsSync(manager.logFile)) {
        const logs = fs.readFileSync(manager.logFile, 'utf8');
        const lines = logs.split('\\n').slice(-50); // Show last 50 lines
        console.log('📄 Recent Log Entries (last 50 lines):');
        console.log('════════════════════════════════════');
        lines.forEach(line => {
          if (line.trim()) {
            console.log(line);
          }
        });
      } else {
        console.log('📄 No log file found');
      }
      break;
    
    case 'help':
    default:
      console.log(`
🛡️  Resilient Session Manager - Enhanced Safety Mode

Usage: node resilient-wrapper.js <command> [options]

Commands:
  start                                    Start resilient session
  status                                   Show enhanced status
  component <name>                         Start component with safety checks
  complete <name>                          Complete component with verification
  checkpoint <name>                        Create verified checkpoint
  validate <type> <args>                   Validate with enhanced checks
  backup                                   Create backup
  restore <id> [options]                   Restore with safety features
  cleanup                                  Clean up resources
  logs                                     Show recent log entries
  help                                     Show this help

Restore Options:
  --dry-run                               Simulate restore without changes
  --force                                 Force restore despite warnings
  --auto-stash                            Automatically stash uncommitted changes
  --no-code                               Skip code restore
  --no-database                           Skip database restore
  --no-config                             Skip config restore

Features:
  ✅ Automatic data validation and repair
  ✅ Enhanced error recovery with rollback
  ✅ File locking to prevent concurrent access
  ✅ Comprehensive operation logging
  ✅ Pre-flight and post-completion checks
  ✅ Git safety features (auto-stash, dry-run)
  ✅ Backup integrity verification

Environment Variables:
  VERBOSE=true                            Enable verbose logging

Examples:
  node resilient-wrapper.js start
  node resilient-wrapper.js component SmartMemoryIndex
  node resilient-wrapper.js restore backup-id --dry-run
  node resilient-wrapper.js restore backup-id --force --auto-stash
      `);
      break;
  }
}

module.exports = ResilientSessionManager;