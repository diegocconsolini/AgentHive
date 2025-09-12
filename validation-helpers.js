#!/usr/bin/env node
/**
 * Validation Helpers - Schema validation and auto-repair for AgentHive
 * Provides validation and repair functions for tracker and component data
 */

const fs = require('fs');
const path = require('path');

class ValidationHelpers {
  constructor() {
    this.schemas = this.loadSchemas();
  }

  /**
   * Load validation schemas
   */
  loadSchemas() {
    return {
      tracker: {
        required: ['sessionInfo', 'baselineStatus', 'phases'],
        sessionInfo: {
          required: ['sessionId', 'currentPhase', 'currentWeek', 'lastUpdate'],
          types: {
            sessionId: 'string',
            currentPhase: 'number',
            currentWeek: 'number',
            lastUpdate: 'string'
          }
        },
        baselineStatus: {
          required: ['phase1Complete', 'testsPassingBaseline', 'agentsLoaded'],
          types: {
            phase1Complete: 'boolean',
            testsPassingBaseline: 'string',
            agentsLoaded: 'number'
          }
        },
        phases: {
          required: true,
          type: 'object'
        }
      },
      component: {
        required: ['name', 'status'],
        types: {
          name: 'string',
          status: ['planned', 'in_progress', 'completed'],
          files: 'array',
          dependencies: 'array',
          testFiles: 'array'
        }
      },
      backup: {
        required: ['id', 'timestamp', 'phase', 'week'],
        types: {
          id: 'string',
          timestamp: 'string',
          phase: 'number',
          week: 'number'
        }
      }
    };
  }

  /**
   * Validate and repair tracker structure
   */
  validateTrackerSchema(tracker, autoRepair = true) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      repaired: false,
      data: tracker
    };

    if (!tracker || typeof tracker !== 'object') {
      result.valid = false;
      result.errors.push('Tracker is null or not an object');
      
      if (autoRepair) {
        result.data = this.createDefaultTracker();
        result.repaired = true;
        result.warnings.push('Created default tracker structure');
      }
      return result;
    }

    const schema = this.schemas.tracker;
    
    // Check required top-level properties
    for (const prop of schema.required) {
      if (!tracker[prop]) {
        result.valid = false;
        result.errors.push(`Missing required property: ${prop}`);
        
        if (autoRepair) {
          tracker[prop] = this.getDefaultValue(prop);
          result.repaired = true;
          result.warnings.push(`Auto-repaired missing property: ${prop}`);
        }
      }
    }

    // Validate sessionInfo
    if (tracker.sessionInfo) {
      const sessionResult = this.validateObject(tracker.sessionInfo, schema.sessionInfo, 'sessionInfo');
      result.errors.push(...sessionResult.errors);
      result.warnings.push(...sessionResult.warnings);
      if (sessionResult.repaired) {
        result.repaired = true;
      }
    }

    // Validate baselineStatus
    if (tracker.baselineStatus) {
      const baselineResult = this.validateObject(tracker.baselineStatus, schema.baselineStatus, 'baselineStatus');
      result.errors.push(...baselineResult.errors);
      result.warnings.push(...baselineResult.warnings);
      if (baselineResult.repaired) {
        result.repaired = true;
      }
    }

    // Validate phases structure
    if (tracker.phases) {
      const phasesResult = this.validatePhasesStructure(tracker.phases, autoRepair);
      result.errors.push(...phasesResult.errors);
      result.warnings.push(...phasesResult.warnings);
      if (phasesResult.repaired) {
        result.repaired = true;
      }
    }

    // Update last validation timestamp
    if (autoRepair && result.repaired) {
      if (!tracker.sessionInfo) {
        tracker.sessionInfo = {};
      }
      tracker.sessionInfo.lastUpdate = new Date().toISOString();
    }

    result.data = tracker;
    return result;
  }

  /**
   * Validate phases structure
   */
  validatePhasesStructure(phases, autoRepair = true) {
    const result = {
      errors: [],
      warnings: [],
      repaired: false
    };

    if (typeof phases !== 'object') {
      result.errors.push('Phases must be an object');
      return result;
    }

    // Check each phase
    for (const [phaseKey, phase] of Object.entries(phases)) {
      if (!phase || typeof phase !== 'object') {
        result.errors.push(`Phase ${phaseKey} is invalid`);
        if (autoRepair) {
          phases[phaseKey] = this.createDefaultPhase();
          result.repaired = true;
          result.warnings.push(`Auto-repaired phase ${phaseKey}`);
        }
        continue;
      }

      // Validate phase properties
      const requiredPhaseProps = ['status', 'title'];
      for (const prop of requiredPhaseProps) {
        if (!phase[prop]) {
          result.errors.push(`Phase ${phaseKey} missing property: ${prop}`);
          if (autoRepair) {
            phase[prop] = this.getDefaultPhaseValue(prop);
            result.repaired = true;
            result.warnings.push(`Auto-repaired phase ${phaseKey}.${prop}`);
          }
        }
      }

      // Validate weeks structure
      if (phase.weeks) {
        const weeksResult = this.validateWeeksStructure(phase.weeks, phaseKey, autoRepair);
        result.errors.push(...weeksResult.errors);
        result.warnings.push(...weeksResult.warnings);
        if (weeksResult.repaired) {
          result.repaired = true;
        }
      }
    }

    return result;
  }

  /**
   * Validate weeks structure within a phase
   */
  validateWeeksStructure(weeks, phaseKey, autoRepair = true) {
    const result = {
      errors: [],
      warnings: [],
      repaired: false
    };

    if (typeof weeks !== 'object') {
      result.errors.push(`Phase ${phaseKey} weeks must be an object`);
      return result;
    }

    // Check each week
    for (const [weekKey, week] of Object.entries(weeks)) {
      if (!week || typeof week !== 'object') {
        result.errors.push(`Phase ${phaseKey} week ${weekKey} is invalid`);
        if (autoRepair) {
          weeks[weekKey] = this.createDefaultWeek();
          result.repaired = true;
          result.warnings.push(`Auto-repaired ${phaseKey}.${weekKey}`);
        }
        continue;
      }

      // Validate week properties
      const requiredWeekProps = ['title', 'status'];
      for (const prop of requiredWeekProps) {
        if (!week[prop]) {
          result.errors.push(`${phaseKey}.${weekKey} missing property: ${prop}`);
          if (autoRepair) {
            week[prop] = this.getDefaultWeekValue(prop);
            result.repaired = true;
            result.warnings.push(`Auto-repaired ${phaseKey}.${weekKey}.${prop}`);
          }
        }
      }

      // Validate components
      if (week.components) {
        const componentsResult = this.validateComponentsArray(week.components, `${phaseKey}.${weekKey}`, autoRepair);
        result.errors.push(...componentsResult.errors);
        result.warnings.push(...componentsResult.warnings);
        if (componentsResult.repaired) {
          result.repaired = true;
        }
      }
    }

    return result;
  }

  /**
   * Validate components array
   */
  validateComponentsArray(components, context, autoRepair = true) {
    const result = {
      errors: [],
      warnings: [],
      repaired: false
    };

    if (!Array.isArray(components)) {
      result.errors.push(`${context} components must be an array`);
      if (autoRepair) {
        // Convert object to array if possible
        if (typeof components === 'object') {
          const componentArray = Object.values(components);
          result.repaired = true;
          result.warnings.push(`Converted ${context} components from object to array`);
          return { ...result, data: componentArray };
        }
      }
      return result;
    }

    // Validate each component
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const componentResult = this.validateComponent(component, `${context}.components[${i}]`, autoRepair);
      
      if (!componentResult.valid) {
        result.errors.push(...componentResult.errors);
      }
      result.warnings.push(...componentResult.warnings);
      
      if (componentResult.repaired) {
        components[i] = componentResult.data;
        result.repaired = true;
      }
    }

    return result;
  }

  /**
   * Validate individual component
   */
  validateComponent(component, context = 'component', autoRepair = true) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      repaired: false,
      data: component
    };

    if (!component || typeof component !== 'object') {
      result.valid = false;
      result.errors.push(`${context} is not a valid object`);
      
      if (autoRepair) {
        result.data = this.createDefaultComponent();
        result.repaired = true;
        result.warnings.push(`Created default component for ${context}`);
      }
      return result;
    }

    const schema = this.schemas.component;

    // Check required properties
    for (const prop of schema.required) {
      if (!component[prop]) {
        result.valid = false;
        result.errors.push(`${context} missing required property: ${prop}`);
        
        if (autoRepair) {
          component[prop] = this.getDefaultComponentValue(prop);
          result.repaired = true;
          result.warnings.push(`Auto-repaired ${context}.${prop}`);
        }
      }
    }

    // Validate property types
    for (const [prop, expectedType] of Object.entries(schema.types)) {
      if (component[prop] !== undefined) {
        const isValid = this.validatePropertyType(component[prop], expectedType);
        if (!isValid) {
          result.errors.push(`${context}.${prop} has invalid type`);
          
          if (autoRepair) {
            component[prop] = this.getDefaultComponentValue(prop);
            result.repaired = true;
            result.warnings.push(`Auto-repaired ${context}.${prop} type`);
          }
        }
      }
    }

    result.data = component;
    return result;
  }

  /**
   * Validate backup structure
   */
  validateBackup(backup, autoRepair = true) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      repaired: false,
      data: backup
    };

    if (!backup || typeof backup !== 'object') {
      result.valid = false;
      result.errors.push('Backup is not a valid object');
      return result;
    }

    const schema = this.schemas.backup;

    // Check required properties
    for (const prop of schema.required) {
      if (!backup[prop]) {
        result.valid = false;
        result.errors.push(`Backup missing required property: ${prop}`);
        
        if (autoRepair) {
          backup[prop] = this.getDefaultBackupValue(prop);
          result.repaired = true;
          result.warnings.push(`Auto-repaired backup.${prop}`);
        }
      }
    }

    // Validate property types
    for (const [prop, expectedType] of Object.entries(schema.types)) {
      if (backup[prop] !== undefined) {
        const isValid = this.validatePropertyType(backup[prop], expectedType);
        if (!isValid) {
          result.errors.push(`Backup.${prop} has invalid type`);
          
          if (autoRepair) {
            backup[prop] = this.getDefaultBackupValue(prop);
            result.repaired = true;
            result.warnings.push(`Auto-repaired backup.${prop} type`);
          }
        }
      }
    }

    result.data = backup;
    return result;
  }

  /**
   * Validate property type
   */
  validatePropertyType(value, expectedType) {
    if (Array.isArray(expectedType)) {
      // Enum validation
      return expectedType.includes(value);
    }
    
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null;
      default:
        return false;
    }
  }

  /**
   * Validate object against schema
   */
  validateObject(obj, schema, context) {
    const result = {
      errors: [],
      warnings: [],
      repaired: false
    };

    if (schema.required) {
      for (const prop of schema.required) {
        if (!obj[prop]) {
          result.errors.push(`${context}.${prop} is required`);
          
          obj[prop] = this.getDefaultValue(prop);
          result.repaired = true;
          result.warnings.push(`Auto-repaired ${context}.${prop}`);
        }
      }
    }

    if (schema.types) {
      for (const [prop, expectedType] of Object.entries(schema.types)) {
        if (obj[prop] !== undefined) {
          const isValid = this.validatePropertyType(obj[prop], expectedType);
          if (!isValid) {
            result.errors.push(`${context}.${prop} has invalid type`);
            
            obj[prop] = this.getDefaultValue(prop);
            result.repaired = true;
            result.warnings.push(`Auto-repaired ${context}.${prop} type`);
          }
        }
      }
    }

    return result;
  }

  /**
   * Create default tracker structure
   */
  createDefaultTracker() {
    return {
      sessionInfo: {
        sessionId: `agenthive-${Date.now()}`,
        startDate: new Date().toISOString().split('T')[0],
        currentPhase: 2,
        currentWeek: 1,
        currentDay: 1,
        lastUpdate: new Date().toISOString(),
        totalSessions: 1
      },
      baselineStatus: {
        phase1Complete: true,
        meshComponents: 9,
        testsPassingBaseline: "9/9",
        aiIntegration: "Local LM Studio working",
        agentsLoaded: 88,
        database: "SQLite with migrations",
        lastValidated: new Date().toISOString()
      },
      phases: {
        phase2: this.createDefaultPhase()
      },
      backupStrategy: {
        frequency: "daily",
        retentionDays: 30,
        restorePoints: []
      }
    };
  }

  /**
   * Create default phase structure
   */
  createDefaultPhase() {
    return {
      status: "planned",
      title: "Default Phase",
      estimatedDuration: "2 weeks",
      currentWeek: 1,
      weeks: {
        week1: this.createDefaultWeek()
      },
      qualityGates: {}
    };
  }

  /**
   * Create default week structure
   */
  createDefaultWeek() {
    return {
      title: "Default Week",
      status: "planned",
      components: []
    };
  }

  /**
   * Create default component structure
   */
  createDefaultComponent() {
    return {
      name: "DefaultComponent",
      status: "planned",
      files: [],
      dependencies: [],
      testFiles: [],
      qualityGates: {}
    };
  }

  /**
   * Get default values for various properties
   */
  getDefaultValue(property) {
    const defaults = {
      sessionId: `agenthive-${Date.now()}`,
      currentPhase: 2,
      currentWeek: 1,
      currentDay: 1,
      lastUpdate: new Date().toISOString(),
      totalSessions: 1,
      phase1Complete: true,
      testsPassingBaseline: "0/0",
      agentsLoaded: 0,
      sessionInfo: {},
      baselineStatus: {},
      phases: {}
    };
    
    return defaults[property] || null;
  }

  getDefaultPhaseValue(property) {
    const defaults = {
      status: "planned",
      title: "Default Phase",
      estimatedDuration: "2 weeks",
      currentWeek: 1
    };
    
    return defaults[property] || null;
  }

  getDefaultWeekValue(property) {
    const defaults = {
      title: "Default Week",
      status: "planned",
      components: []
    };
    
    return defaults[property] || null;
  }

  getDefaultComponentValue(property) {
    const defaults = {
      name: "DefaultComponent",
      status: "planned",
      files: [],
      dependencies: [],
      testFiles: []
    };
    
    return defaults[property] || null;
  }

  getDefaultBackupValue(property) {
    const defaults = {
      id: `backup-${Date.now()}`,
      timestamp: new Date().toISOString(),
      phase: 2,
      week: 1
    };
    
    return defaults[property] || null;
  }

  /**
   * Repair corrupted tracker
   */
  repairTracker(trackerPath) {
    console.log(`🔧 Attempting to repair tracker: ${trackerPath}`);
    
    try {
      // Try to read the file
      let tracker = null;
      
      if (fs.existsSync(trackerPath)) {
        const content = fs.readFileSync(trackerPath, 'utf8');
        
        try {
          tracker = JSON.parse(content);
        } catch (parseError) {
          console.warn(`⚠️  JSON parse error: ${parseError.message}`);
          
          // Try to fix common JSON issues
          const fixedContent = this.fixCommonJsonIssues(content);
          try {
            tracker = JSON.parse(fixedContent);
            console.log('✅ Fixed JSON parse issues');
          } catch (stillBroken) {
            console.warn('⚠️  Could not fix JSON, creating new tracker');
            tracker = null;
          }
        }
      }
      
      // Validate and repair the tracker
      const validationResult = this.validateTrackerSchema(tracker, true);
      
      if (validationResult.repaired) {
        console.log('🔧 Tracker structure repaired');
        validationResult.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
      }
      
      if (validationResult.errors.length > 0) {
        console.log('❌ Validation errors found:');
        validationResult.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      return {
        success: true,
        tracker: validationResult.data,
        repaired: validationResult.repaired,
        errors: validationResult.errors,
        warnings: validationResult.warnings
      };
      
    } catch (error) {
      console.error(`❌ Failed to repair tracker: ${error.message}`);
      return {
        success: false,
        error: error.message,
        tracker: this.createDefaultTracker()
      };
    }
  }

  /**
   * Fix common JSON formatting issues
   */
  fixCommonJsonIssues(content) {
    // Remove trailing commas
    content = content.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unquoted property names
    content = content.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Fix single quotes to double quotes
    content = content.replace(/'/g, '"');
    
    // Remove comments (// and /* */)
    content = content.replace(/\/\/.*$/gm, '');
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return content;
  }
}

// Create singleton instance
const validationHelpers = new ValidationHelpers();

// Export individual functions
module.exports = {
  validateTrackerSchema: (tracker, autoRepair) => validationHelpers.validateTrackerSchema(tracker, autoRepair),
  validateComponent: (component, context, autoRepair) => validationHelpers.validateComponent(component, context, autoRepair),
  validateBackup: (backup, autoRepair) => validationHelpers.validateBackup(backup, autoRepair),
  repairTracker: (trackerPath) => validationHelpers.repairTracker(trackerPath),
  createDefaultTracker: () => validationHelpers.createDefaultTracker(),
  
  // Export class for advanced usage
  ValidationHelpers
};

// CLI interface for standalone usage
if (require.main === module) {
  const command = process.argv[2];
  const arg1 = process.argv[3];

  switch (command) {
    case 'repair':
      if (arg1) {
        const result = validationHelpers.repairTracker(arg1);
        if (result.success) {
          console.log('✅ Repair completed');
          if (result.repaired) {
            // Write repaired tracker back to file
            const safeOps = require('./safe-file-operations');
            try {
              safeOps.atomicWrite(arg1, JSON.stringify(result.tracker, null, 2));
              console.log('💾 Repaired tracker saved');
            } catch (writeError) {
              console.error(`❌ Failed to save repaired tracker: ${writeError.message}`);
            }
          }
        } else {
          console.error('❌ Repair failed:', result.error);
        }
      } else {
        console.error('❌ Please specify tracker file path');
      }
      break;

    case 'validate':
      if (arg1) {
        try {
          const content = fs.readFileSync(arg1, 'utf8');
          const tracker = JSON.parse(content);
          const result = validationHelpers.validateTrackerSchema(tracker, false);
          
          console.log(`📊 Validation Results for ${arg1}:`);
          console.log(`  Valid: ${result.valid ? '✅' : '❌'}`);
          console.log(`  Errors: ${result.errors.length}`);
          console.log(`  Warnings: ${result.warnings.length}`);
          
          if (result.errors.length > 0) {
            console.log('\n❌ Errors:');
            result.errors.forEach(error => console.log(`  - ${error}`));
          }
          
          if (result.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            result.warnings.forEach(warning => console.log(`  - ${warning}`));
          }
        } catch (error) {
          console.error(`❌ Failed to validate ${arg1}: ${error.message}`);
        }
      } else {
        console.error('❌ Please specify file path');
      }
      break;

    case 'create-default':
      if (arg1) {
        const defaultTracker = validationHelpers.createDefaultTracker();
        try {
          const safeOps = require('./safe-file-operations');
          safeOps.atomicWrite(arg1, JSON.stringify(defaultTracker, null, 2));
          console.log(`✅ Created default tracker: ${arg1}`);
        } catch (error) {
          console.error(`❌ Failed to create default tracker: ${error.message}`);
        }
      } else {
        console.error('❌ Please specify output file path');
      }
      break;

    case 'help':
    default:
      console.log(`
🔧 Validation Helpers CLI

Usage:
  node validation-helpers.js repair <tracker-file>        Repair corrupted tracker
  node validation-helpers.js validate <tracker-file>      Validate tracker structure
  node validation-helpers.js create-default <file>        Create default tracker
  node validation-helpers.js help                         Show this help

Examples:
  node validation-helpers.js repair phase-tracker.json
  node validation-helpers.js validate phase-tracker.json
  node validation-helpers.js create-default new-tracker.json
      `);
      break;
  }
}