#!/usr/bin/env node
/**
 * AgentHive Session Manager
 * Easy-to-use interface for session-resilient development
 */

const PhaseGateValidator = require('./packages/system-api/phase-gate-validator');
const BackupSystem = require('./backup-system');

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
    try {
      const { execSync } = require('child_process');
      console.log('Running mesh integration tests...');
      
      const testResult = execSync('cd packages/system-api/src/mesh && node test-mesh-integration.js', { 
        encoding: 'utf8',
        timeout: 30000
      });
      
      if (testResult.includes('✅') || testResult.includes('SUCCESS')) {
        console.log('✅ Baseline tests passing');
        return true;
      } else {
        console.log('❌ Baseline tests failed');
        console.log(testResult);
        return false;
      }
    } catch (error) {
      console.log('⚠️  Could not run baseline tests:', error.message);
      return false;
    }
  }

  /**
   * Create development checkpoint
   */
  async createCheckpoint(name) {
    console.log(`📍 Creating checkpoint: ${name}`);
    
    // Validate current component first
    const currentPhase = this.validator.tracker.sessionInfo.currentPhase;
    const phase = this.validator.tracker.phases[`phase${currentPhase}`];
    const week = phase.weeks[`week${phase.currentWeek}`];
    
    if (week && week.components) {
      const inProgressComponent = week.components.find(c => c.status === 'in_progress');
      if (inProgressComponent) {
        console.log(`🔍 Validating current component: ${inProgressComponent.name}`);
        await this.validator.validateComponent(inProgressComponent.name);
      }
    }
    
    // Create backup
    await this.backup.createFullBackup(name);
    
    // Create phase checkpoint
    this.validator.createCheckpoint(name);
    
    console.log('✅ Checkpoint created successfully');
  }

  /**
   * Component development workflow
   */
  async startComponent(componentName) {
    console.log(`🔄 Starting component: ${componentName}`);
    
    // Update tracker
    const currentPhase = this.validator.tracker.sessionInfo.currentPhase;
    const phase = this.validator.tracker.phases[`phase${currentPhase}`];
    const week = phase.weeks[`week${phase.currentWeek}`];
    
    if (week && week.components) {
      const component = week.components.find(c => c.name === componentName);
      if (component) {
        component.status = 'in_progress';
        this.validator.updateLastUpdate();
        this.validator.saveTracker();
        
        console.log(`📋 Component ${componentName} marked as in-progress`);
        
        // Show what needs to be implemented
        console.log('\n🎯 Implementation Checklist:');
        if (component.files) {
          console.log('📁 Files to create/update:');
          component.files.forEach(file => console.log(`  - ${file}`));
        }
        
        if (component.dependencies) {
          console.log('🔗 Dependencies:');
          component.dependencies.forEach(dep => console.log(`  - ${dep}`));
        }
        
        if (component.testFiles) {
          console.log('🧪 Test files needed:');
          component.testFiles.forEach(test => console.log(`  - ${test}`));
        }
        
        console.log('\n✅ When ready, run: node session-manager.js validate component ' + componentName);
      } else {
        console.log(`❌ Component ${componentName} not found in current week`);
      }
    }
  }

  /**
   * Complete component workflow
   */
  async completeComponent(componentName) {
    console.log(`🎯 Completing component: ${componentName}`);
    
    // Validate component
    const success = await this.validator.validateComponent(componentName);
    
    if (success) {
      console.log(`✅ Component ${componentName} completed successfully!`);
      
      // Create checkpoint
      await this.createCheckpoint(`${componentName}-complete`);
      
      // Check if week is complete
      const currentPhase = this.validator.tracker.sessionInfo.currentPhase;
      const phase = this.validator.tracker.phases[`phase${currentPhase}`];
      const week = phase.weeks[`week${phase.currentWeek}`];
      
      if (week && week.components) {
        const allComplete = week.components.every(c => c.status === 'completed');
        if (allComplete) {
          console.log('🎉 All components in this week are complete!');
          console.log('Run: node session-manager.js validate week ' + currentPhase + ' ' + phase.currentWeek);
        } else {
          const remaining = week.components.filter(c => c.status !== 'completed');
          console.log(`📋 Remaining components: ${remaining.map(c => c.name).join(', ')}`);
        }
      }
    } else {
      console.log(`❌ Component ${componentName} validation failed`);
      console.log('Please fix the issues and try again');
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
      manager.startSession().catch(console.error);
      break;
    
    case 'status':
      manager.validator.getStatus();
      break;
    
    case 'component':
      if (arg1) {
        manager.startComponent(arg1);
      } else {
        console.error('❌ Please specify component name');
      }
      break;
    
    case 'complete':
      if (arg1) {
        manager.completeComponent(arg1).catch(console.error);
      } else {
        console.error('❌ Please specify component name');
      }
      break;
    
    case 'checkpoint':
      manager.createCheckpoint(arg1 || 'manual').catch(console.error);
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