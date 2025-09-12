#!/usr/bin/env node

/**
 * Memory Migration Script
 * One-time migration of existing AgentMemoryManager data to SmartMemoryIndex
 * 
 * Usage:
 *   node scripts/migrate-memories.js [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run    Show what would be migrated without actually migrating
 *   --verbose    Show detailed migration progress
 */

const path = require('path');
const { performance } = require('perf_hooks');

// Add project root to require path
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

const AgentMemoryManager = require('../src/agents/AgentMemoryManager');
const SmartMemoryIndex = require('../src/memory/SmartMemoryIndex');
const MemoryTransformer = require('../src/memory/MemoryTransformer');

class MemoryMigrator {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      batchSize: options.batchSize || 10
    };
    
    this.stats = {
      totalFound: 0,
      migrated: 0,
      failed: 0,
      skipped: 0,
      startTime: null,
      endTime: null
    };
  }

  async migrate() {
    console.log('🚀 Starting Memory Migration to SmartMemoryIndex');
    console.log(`Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    console.log('─'.repeat(60));

    this.stats.startTime = performance.now();

    try {
      // Initialize systems
      await this.initializeSystems();
      
      // Get existing memories
      const existingMemories = await this.getExistingMemories();
      this.stats.totalFound = existingMemories.length;
      
      if (existingMemories.length === 0) {
        console.log('ℹ️  No existing memories found to migrate');
        return this.stats;
      }

      console.log(`📊 Found ${existingMemories.length} existing memories`);
      
      if (this.options.dryRun) {
        await this.performDryRun(existingMemories);
      } else {
        await this.performMigration(existingMemories);
      }

      this.stats.endTime = performance.now();
      this.printSummary();
      
      return this.stats;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async initializeSystems() {
    console.log('🔧 Initializing systems...');
    
    // Initialize AgentMemoryManager
    this.memoryManager = new AgentMemoryManager();
    await this.memoryManager.initialize();
    
    if (!this.options.dryRun) {
      // Initialize SmartMemoryIndex for live migration
      this.smartMemoryIndex = new SmartMemoryIndex();
      await this.smartMemoryIndex.initialize();
    }
    
    console.log('✅ Systems initialized');
  }

  async getExistingMemories() {
    console.log('🔍 Scanning for existing memories...');
    
    const allMemories = await this.memoryManager.storageManager.search({ 
      type: 'agent-memory' 
    });
    
    // Filter out invalid or empty memories
    const validMemories = allMemories.filter(memory => {
      try {
        const content = JSON.parse(memory.content);
        return content && content.agentId && content.interactions;
      } catch {
        this.stats.skipped++;
        return false;
      }
    });

    return validMemories;
  }

  async performDryRun(memories) {
    console.log('\n📋 DRY RUN - Analyzing memories for migration:');
    console.log('─'.repeat(40));

    const analysis = {
      byAgent: new Map(),
      byUser: new Map(),
      concepts: new Map(),
      totalInteractions: 0,
      avgResponseTime: 0,
      successRate: 0
    };

    for (const memoryData of memories) {
      try {
        const content = JSON.parse(memoryData.content);
        const transformedMemory = MemoryTransformer.agentMemoryToSmartMemoryIndex(content);
        
        // Analyze agent distribution
        const count = analysis.byAgent.get(content.agentId) || 0;
        analysis.byAgent.set(content.agentId, count + 1);
        
        // Analyze user distribution
        if (content.userId) {
          const userCount = analysis.byUser.get(content.userId) || 0;
          analysis.byUser.set(content.userId, userCount + 1);
        }
        
        // Analyze concepts
        if (transformedMemory.knowledge?.concepts) {
          transformedMemory.knowledge.concepts.forEach(concept => {
            const conceptCount = analysis.concepts.get(concept) || 0;
            analysis.concepts.set(concept, conceptCount + 1);
          });
        }
        
        // Analyze interactions
        analysis.totalInteractions += (content.interactions || []).length;
        
        if (this.options.verbose) {
          console.log(`  📝 ${content.agentId}: ${(content.interactions || []).length} interactions`);
        }
        
        this.stats.migrated++;
        
      } catch (error) {
        if (this.options.verbose) {
          console.log(`  ❌ Failed to analyze ${memoryData.id}: ${error.message}`);
        }
        this.stats.failed++;
      }
    }

    this.printDryRunAnalysis(analysis);
  }

  printDryRunAnalysis(analysis) {
    console.log('\n📊 Migration Analysis:');
    console.log('─'.repeat(30));
    
    console.log(`Total Memories: ${this.stats.migrated}`);
    console.log(`Total Interactions: ${analysis.totalInteractions}`);
    console.log(`Unique Agents: ${analysis.byAgent.size}`);
    console.log(`Unique Users: ${analysis.byUser.size}`);
    
    console.log('\n🤖 Top Agents:');
    const topAgents = Array.from(analysis.byAgent.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    topAgents.forEach(([agent, count]) => {
      console.log(`  ${agent}: ${count} memories`);
    });
    
    console.log('\n🧠 Top Concepts:');
    const topConcepts = Array.from(analysis.concepts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    topConcepts.forEach(([concept, count]) => {
      console.log(`  ${concept}: ${count} occurrences`);
    });
  }

  async performMigration(memories) {
    console.log('\n🔄 Starting live migration...');
    console.log('─'.repeat(30));

    const batches = this.createBatches(memories, this.options.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} memories)`);
      
      await this.migrateBatch(batch);
      
      // Progress indicator
      const progress = Math.round(((i + 1) / batches.length) * 100);
      console.log(`Progress: ${progress}% complete`);
    }
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async migrateBatch(batch) {
    const promises = batch.map(async (memoryData) => {
      try {
        // Parse stored memory content
        const agentMemoryContent = JSON.parse(memoryData.content);
        
        // Transform to SmartMemoryIndex format
        const transformedMemory = MemoryTransformer.agentMemoryToSmartMemoryIndex(agentMemoryContent);
        
        // Add to SmartMemoryIndex
        const memoryId = await this.smartMemoryIndex.addMemory(transformedMemory);
        
        if (this.options.verbose) {
          console.log(`  ✅ Migrated ${agentMemoryContent.agentId} → ${memoryId.substring(0, 8)}`);
        }
        
        this.stats.migrated++;
        
      } catch (error) {
        if (this.options.verbose) {
          console.log(`  ❌ Failed ${memoryData.id}: ${error.message}`);
        }
        this.stats.failed++;
      }
    });

    await Promise.all(promises);
  }

  printSummary() {
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    
    console.log('\n' + '═'.repeat(60));
    console.log('📋 MIGRATION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total Found:    ${this.stats.totalFound}`);
    console.log(`Migrated:       ${this.stats.migrated}`);
    console.log(`Failed:         ${this.stats.failed}`);
    console.log(`Skipped:        ${this.stats.skipped}`);
    console.log(`Duration:       ${duration.toFixed(2)}s`);
    
    if (this.stats.migrated > 0) {
      const rate = (this.stats.migrated / duration).toFixed(1);
      console.log(`Rate:           ${rate} memories/second`);
    }
    
    const successRate = this.stats.totalFound > 0 ? 
      ((this.stats.migrated / this.stats.totalFound) * 100).toFixed(1) : 0;
    console.log(`Success Rate:   ${successRate}%`);
    
    console.log('═'.repeat(60));
    
    if (this.options.dryRun) {
      console.log('ℹ️  This was a dry run. No actual migration performed.');
      console.log('ℹ️  Run without --dry-run to perform the migration.');
    } else {
      console.log('✅ Migration complete! SmartMemoryIndex now contains historical data.');
      console.log('🚀 Future agent interactions will be automatically bridged.');
    }
  }

  async cleanup() {
    try {
      if (this.memoryManager) {
        await this.memoryManager.close();
      }
      
      if (this.smartMemoryIndex && !this.options.dryRun) {
        // SmartMemoryIndex doesn't have a close method, but we could add cleanup here
        console.log('🧹 Cleanup completed');
      }
    } catch (error) {
      console.error('Warning: Cleanup failed:', error.message);
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Memory Migration Script - Migrate AgentMemoryManager data to SmartMemoryIndex

Usage:
  node scripts/migrate-memories.js [options]

Options:
  --dry-run    Show what would be migrated without actually migrating
  --verbose    Show detailed migration progress  
  --help, -h   Show this help message

Examples:
  node scripts/migrate-memories.js --dry-run
  node scripts/migrate-memories.js --verbose
  node scripts/migrate-memories.js
    `);
    process.exit(0);
  }

  try {
    const migrator = new MemoryMigrator(options);
    const stats = await migrator.migrate();
    
    // Exit with error code if migration had significant failures
    const failureRate = stats.totalFound > 0 ? (stats.failed / stats.totalFound) : 0;
    if (failureRate > 0.1) { // More than 10% failure rate
      console.error(`⚠️  High failure rate: ${(failureRate * 100).toFixed(1)}%`);
      process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MemoryMigrator;