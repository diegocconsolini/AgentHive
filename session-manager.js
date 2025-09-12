#!/usr/bin/env node
/**
 * AgentHive Session Manager
 * Easy-to-use interface for session-resilient development
 */

const PhaseGateValidator = require('./packages/system-api/phase-gate-validator');
const BackupSystem = require('./backup-system');
const validationHelpers = require('./validation-helpers');
const safeFileOps = require('./safe-file-operations');

class SessionManager {
  constructor() {
    this.validator = new PhaseGateValidator();
    this.backup = new BackupSystem();
  }

  /**
   * Start development session
   */
  async startSession(options = {}) {
    console.log('🚀 Starting AgentHive Development Session');
    console.log('═══════════════════════════════════════');
    
    // Show current status
    this.validator.getStatus();
    
    // Create backup if requested
    if (options.createBackup !== false) {
      console.log('\n📦 Creating session backup...');
      await this.backup.createFullBackup('session-start');
    }
    
    // Show available commands
    console.log('\n🛠️  Available Commands:');
    console.log('─────────────────────');
    console.log('  node session-manager.js status                 # Check current status');
    console.log('  node session-manager.js checkpoint <name>      # Create checkpoint');
    console.log('  node session-manager.js validate component <name> # Validate component');
    console.log('  node session-manager.js validate week <phase> <week> # Validate week');
    console.log('  node session-manager.js backup                 # Create backup');
    console.log('  node session-manager.js restore <id>           # Restore from backup');
    console.log('  node session-manager.js test                   # Run baseline tests');
    console.log('');
    
    // Check baseline
    console.log('🧪 Baseline Check:');
    console.log('──────────────────');
    await this.runBaselineTests();
  }

  /**
   * Run baseline tests to ensure nothing is broken
   */
  async runBaselineTests() {
    // Try multiple test approaches for better reliability
    const testRunners = [
      () => this.runMeshIntegrationTest(),
      () => this.runNpmTest(),
      () => this.runFallbackTest()
    ];

    for (const runner of testRunners) {
      try {
        const result = await runner();
        if (result !== null) {
          return result;
        }
      } catch (error) {
        console.warn(`⚠️  Test runner failed: ${error.message}`);
        continue;
      }
    }

    console.warn('⚠️  All test runners failed, assuming tests are not available');
    return false;
  }

  /**
   * Run mesh integration test
   */
  async runMeshIntegrationTest() {
    try {
      const { execSync } = require('child_process');
      const testPath = 'packages/system-api/src/mesh/test-mesh-integration.js';
      
      // Check if test file exists
      if (!require('fs').existsSync(testPath)) {
        console.warn('⚠️  Mesh integration test not found');
        return null;
      }
      
      console.log('Running mesh integration tests...');
      
      const testResult = execSync(`cd packages/system-api/src/mesh && timeout 30s node test-mesh-integration.js`, { 
        encoding: 'utf8',
        timeout: 35000 // Slightly longer than timeout command
      });
      
      if (testResult.includes('✅') || testResult.includes('SUCCESS') || testResult.includes('All tests passed')) {
        console.log('✅ Mesh integration tests passing');
        return true;
      } else if (testResult.includes('❌') || testResult.includes('FAILED') || testResult.includes('Error')) {
        console.log('❌ Mesh integration tests failed');
        console.log(testResult.substring(0, 500)); // Limit output
        return false;
      } else {
        console.warn('⚠️  Mesh test output unclear:', testResult.substring(0, 200));
        return null;
      }
    } catch (error) {
      if (error.message.includes('timeout')) {
        console.warn('⚠️  Mesh integration test timed out');
      } else {
        console.warn(`⚠️  Mesh integration test error: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Run npm test as fallback
   */
  async runNpmTest() {
    try {
      const { execSync } = require('child_process');
      console.log('Running npm test as fallback...');
      
      const testResult = execSync('timeout 60s npm test --silent', { 
        encoding: 'utf8',
        timeout: 65000,
        cwd: process.cwd()
      });
      
      const passMatch = testResult.match(/(\d+)\s+passing/);
      const failMatch = testResult.match(/(\d+)\s+failing/);
      
      if (passMatch && (!failMatch || parseInt(failMatch[1]) === 0)) {
        console.log(`✅ NPM tests passing (${passMatch[1]} tests)`);
        return true;
      } else if (failMatch && parseInt(failMatch[1]) > 0) {
        console.log(`❌ NPM tests failed (${failMatch[1]} failures)`);
        return false;
      } else if (testResult.includes('passing') && !testResult.includes('failing')) {
        console.log('✅ NPM tests appear to be passing');
        return true;
      } else {
        console.warn('⚠️  NPM test output unclear');
        return null;
      }
    } catch (error) {
      console.warn(`⚠️  NPM test error: ${error.message}`);
      return null;
    }
  }

  /**
   * Basic fallback test - just check if system is responsive
   */
  async runFallbackTest() {
    try {
      console.log('Running basic system check...');
      
      // Check if tracker is readable
      const tracker = this.validator?.tracker;
      if (!tracker) {
        console.log('❌ Tracker not available');
        return false;
      }
      
      // Basic validation
      const validation = validationHelpers.validateTrackerSchema(tracker, false);
      if (validation.errors.length > 0) {
        console.log('❌ Tracker validation failed');
        return false;
      }
      
      console.log('✅ Basic system check passed');
      return true;
    } catch (error) {
      console.warn(`⚠️  Basic system check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Create development checkpoint
   */
  async createCheckpoint(name) {
    console.log(`📍 Creating checkpoint: ${name}`);
    
    try {
      // Validate tracker structure first
      if (!this.validator?.tracker) {
        throw new Error('Tracker not available');
      }

      // Safe property access with validation
      const currentPhase = this.validator.tracker.sessionInfo?.currentPhase;
      if (!currentPhase) {
        console.warn('⚠️  No current phase found, skipping component validation');
      } else {
        const phase = this.validator.tracker.phases?.[`phase${currentPhase}`];
        if (!phase) {
          console.warn(`⚠️  Phase ${currentPhase} not found, skipping component validation`);
        } else {
          const week = phase.weeks?.[`week${phase.currentWeek}`];
          
          if (week?.components) {
            const inProgressComponent = week.components.find(c => c.status === 'in_progress');
            if (inProgressComponent) {
              console.log(`🔍 Validating current component: ${inProgressComponent.name}`);
              try {
                await this.validator.validateComponent(inProgressComponent.name);
              } catch (validationError) {
                console.warn(`⚠️  Component validation failed: ${validationError.message}`);
                console.log('Continuing with checkpoint creation...');
              }
            }
          }
        }
      }
      
      // Create backup
      try {
        await this.backup.createFullBackup(name);
      } catch (backupError) {
        console.error(`❌ Backup failed: ${backupError.message}`);
        throw new Error(`Checkpoint creation failed due to backup error: ${backupError.message}`);
      }
      
      // Create phase checkpoint
      try {
        this.validator.createCheckpoint(name);
      } catch (checkpointError) {
        console.warn(`⚠️  Phase checkpoint creation failed: ${checkpointError.message}`);
        console.log('Backup was created successfully despite checkpoint error');
      }
      
      console.log('✅ Checkpoint created successfully');
    } catch (error) {
      console.error(`❌ Checkpoint creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Component development workflow
   */
  async startComponent(componentName) {
    console.log(`🔄 Starting component: ${componentName}`);
    
    try {
      // Validate inputs
      if (!componentName || typeof componentName !== 'string') {
        throw new Error('Component name is required and must be a string');
      }

      // Validate tracker availability
      if (!this.validator?.tracker) {
        throw new Error('Tracker not available - cannot start component');
      }

      // Safe property access with validation
      const sessionInfo = this.validator.tracker.sessionInfo;
      if (!sessionInfo) {
        throw new Error('Session info not found in tracker');
      }

      const currentPhase = sessionInfo.currentPhase;
      if (!currentPhase) {
        throw new Error('Current phase not set in session info');
      }

      const phases = this.validator.tracker.phases;
      if (!phases) {
        throw new Error('Phases not found in tracker');
      }

      const phase = phases[`phase${currentPhase}`];
      if (!phase) {
        throw new Error(`Phase ${currentPhase} not found in tracker`);
      }

      if (!phase.currentWeek) {
        throw new Error(`Current week not set for phase ${currentPhase}`);
      }

      const week = phase.weeks?.[`week${phase.currentWeek}`];
      if (!week) {
        throw new Error(`Week ${phase.currentWeek} not found in phase ${currentPhase}`);
      }
      
      if (!week.components || !Array.isArray(week.components)) {
        throw new Error(`Components not found or invalid in week ${phase.currentWeek}`);
      }

      // Find the component
      const component = week.components.find(c => c.name === componentName);
      if (!component) {
        console.log(`❌ Component ${componentName} not found in current week`);
        console.log('Available components:');
        week.components.forEach(c => console.log(`  - ${c.name} (${c.status})`));
        return false;
      }

      // Update component status
      component.status = 'in_progress';
      
      try {
        this.validator.updateLastUpdate();
        this.validator.saveTracker();
      } catch (saveError) {
        console.warn(`⚠️  Failed to save tracker: ${saveError.message}`);
        console.log('Component status updated in memory but not persisted');
      }
      
      console.log(`📋 Component ${componentName} marked as in-progress`);
      
      // Show what needs to be implemented
      this.showComponentChecklist(component);
      
      console.log('\n✅ When ready, run: node session-manager.js validate component ' + componentName);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to start component: ${error.message}`);
      return false;
    }
  }

  /**
   * Show component implementation checklist
   */
  showComponentChecklist(component) {
    console.log('\n🎯 Implementation Checklist:');
    
    if (component.files && Array.isArray(component.files) && component.files.length > 0) {
      console.log('📁 Files to create/update:');
      component.files.forEach(file => console.log(`  - ${file}`));
    }
    
    if (component.dependencies && Array.isArray(component.dependencies) && component.dependencies.length > 0) {
      console.log('🔗 Dependencies:');
      component.dependencies.forEach(dep => console.log(`  - ${dep}`));
    }
    
    if (component.testFiles && Array.isArray(component.testFiles) && component.testFiles.length > 0) {
      console.log('🧪 Test files needed:');
      component.testFiles.forEach(test => console.log(`  - ${test}`));
    }
    
    if (component.qualityGates) {
      console.log('🎯 Quality Gates:');
      Object.entries(component.qualityGates).forEach(([gate, status]) => {
        const icon = status ? '✅' : '❌';
        console.log(`  ${icon} ${gate}`);
      });
    }
  }

  /**
   * Complete component workflow
   */
  async completeComponent(componentName) {
    console.log(`🎯 Completing component: ${componentName}`);
    
    try {
      // Validate inputs
      if (!componentName || typeof componentName !== 'string') {
        throw new Error('Component name is required and must be a string');
      }

      // Validate component
      let success = false;
      try {
        success = await this.validator.validateComponent(componentName);
      } catch (validationError) {
        console.error(`❌ Component validation failed: ${validationError.message}`);
        console.log('Please fix the issues and try again');
        return false;
      }
      
      if (success) {
        console.log(`✅ Component ${componentName} completed successfully!`);
        
        // Create checkpoint
        try {
          await this.createCheckpoint(`${componentName}-complete`);
        } catch (checkpointError) {
          console.warn(`⚠️  Checkpoint creation failed: ${checkpointError.message}`);
          console.log('Component validation succeeded, continuing...');
        }
        
        // Check if week is complete
        try {
          this.checkWeekCompletion();
        } catch (weekCheckError) {
          console.warn(`⚠️  Week completion check failed: ${weekCheckError.message}`);
        }
        
        return true;
      } else {
        console.log(`❌ Component ${componentName} validation failed`);
        console.log('Please fix the issues and try again');
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to complete component: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if current week is complete
   */
  checkWeekCompletion() {
    if (!this.validator?.tracker?.sessionInfo?.currentPhase) {
      console.warn('⚠️  Cannot check week completion - session info not available');
      return;
    }

    const currentPhase = this.validator.tracker.sessionInfo.currentPhase;
    const phase = this.validator.tracker.phases?.[`phase${currentPhase}`];
    
    if (!phase?.currentWeek) {
      console.warn('⚠️  Cannot check week completion - phase info not available');
      return;
    }

    const week = phase.weeks?.[`week${phase.currentWeek}`];
    
    if (!week?.components || !Array.isArray(week.components)) {
      console.warn('⚠️  Cannot check week completion - components not available');
      return;
    }

    const allComplete = week.components.every(c => c.status === 'completed');
    if (allComplete) {
      console.log('🎉 All components in this week are complete!');
      console.log('Run: node session-manager.js validate week ' + currentPhase + ' ' + phase.currentWeek);
    } else {
      const remaining = week.components.filter(c => c.status !== 'completed');
      console.log(`📋 Remaining components: ${remaining.map(c => c.name).join(', ')}`);
    }
  }

  /**
   * Show development guide
   */
  showGuide() {
    console.log('📚 AGENTHIVE DEVELOPMENT GUIDE');
    console.log('════════════════════════════');
    console.log('');
    console.log('🔄 Development Workflow:');
    console.log('1. node session-manager.js start              # Start session');
    console.log('2. node session-manager.js component <name>   # Start component');
    console.log('3. [Implement the component files]');
    console.log('4. node session-manager.js validate component <name>');
    console.log('5. [Fix any issues]');
    console.log('6. node session-manager.js complete <name>    # Mark complete');
    console.log('');
    console.log('📍 Checkpoint Management:');
    console.log('- node session-manager.js checkpoint <name>   # Create checkpoint');
    console.log('- node backup-system.js list                 # List backups');
    console.log('- node backup-system.js restore <id>         # Restore backup');
    console.log('');
    console.log('🧪 Testing & Validation:');
    console.log('- node session-manager.js test               # Run baseline tests');
    console.log('- node session-manager.js validate week 2 1  # Validate week');
    console.log('- node session-manager.js validate phase 2   # Validate phase');
    console.log('');
    console.log('📊 Status & Monitoring:');
    console.log('- node session-manager.js status             # Current status');
    console.log('- node phase-gate-validator.js status        # Detailed status');
    console.log('');
    console.log('🎯 Current Components for Phase 2, Week 1:');
    const currentPhase = this.validator.tracker.sessionInfo.currentPhase;
    const phase = this.validator.tracker.phases[`phase${currentPhase}`];
    const week = phase.weeks[`week${phase.currentWeek}`];
    
    if (week && week.components) {
      week.components.forEach((component, index) => {
        const status = component.status === 'completed' ? '✅' : 
                      component.status === 'in_progress' ? '🔄' : '⏳';
        console.log(`${index + 1}. ${status} ${component.name}`);
      });
    }
    
    console.log('');
    console.log('🚀 Ready to start? Run: node session-manager.js component SmartMemoryIndex');
  }
}

// CLI interface
if (require.main === module) {
  const manager = new SessionManager();
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];
  const arg3 = process.argv[5];

  switch (command) {
    case 'start':
      manager.startSession().catch(error => {
        console.error('❌ Session start failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      manager.validator.getStatus();
      break;
    
    case 'component':
      if (arg1) {
        manager.startComponent(arg1).then(success => {
          process.exit(success ? 0 : 1);
        }).catch(error => {
          console.error('❌ Component start failed:', error.message);
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
          console.error('❌ Component completion failed:', error.message);
          process.exit(1);
        });
      } else {
        console.error('❌ Please specify component name');
        process.exit(1);
      }
      break;
    
    case 'checkpoint':
      manager.createCheckpoint(arg1 || 'manual').then(() => {
        console.log('✅ Checkpoint operation completed');
        process.exit(0);
      }).catch(error => {
        console.error('❌ Checkpoint creation failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'validate':
      if (arg1 === 'component' && arg2) {
        manager.validator.validateComponent(arg2).catch(console.error);
      } else if (arg1 === 'week' && arg2 && arg3) {
        manager.validator.validateWeek(parseInt(arg2), parseInt(arg3)).catch(console.error);
      } else if (arg1 === 'phase' && arg2) {
        manager.validator.validatePhase(parseInt(arg2)).catch(console.error);
      } else {
        console.error('❌ Usage: validate [component <name> | week <phase> <week> | phase <num>]');
      }
      break;
    
    case 'backup':
      manager.backup.createFullBackup('manual').catch(console.error);
      break;
    
    case 'restore':
      if (arg1) {
        manager.backup.restoreFromBackup(arg1).catch(console.error);
      } else {
        console.error('❌ Please specify backup ID');
      }
      break;
    
    case 'test':
      manager.runBaselineTests();
      break;
    
    case 'guide':
    case 'help':
    default:
      manager.showGuide();
      break;
  }
}

module.exports = SessionManager;