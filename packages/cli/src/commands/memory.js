#!/usr/bin/env node

/**
 * AgentHive CLI - Memory Management Commands
 * Provides command-line interface for Smart Memory Index operations
 */

const { Command } = require('commander');
const chalk = require('chalk');
const Table = require('cli-table3');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:4001',
  timeout: 30000,
  defaultLimit: 10,
  defaultThreshold: 0.3,
};

class MemoryCommand {
  constructor() {
    this.config = DEFAULT_CONFIG;
    this.program = new Command();
    this.setupCommands();
  }

  setupCommands() {
    this.program
      .name('memory')
      .description('AgentHive Smart Memory Index management')
      .version('2.0.0');

    // List memories command
    this.program
      .command('list')
      .description('List agent memories')
      .option('-a, --agent <agentId>', 'Filter by agent ID')
      .option('-u, --user <userId>', 'Filter by user ID') 
      .option('-l, --limit <number>', 'Limit results', '10')
      .option('-f, --format <type>', 'Output format (table|json)', 'table')
      .action(this.listMemories.bind(this));

    // Search memories command
    this.program
      .command('search <query>')
      .description('Search memories using semantic similarity')
      .option('-l, --limit <number>', 'Limit results', '10')
      .option('-t, --threshold <number>', 'Similarity threshold (0-1)', '0.3')
      .option('-a, --agent <agentId>', 'Filter by agent ID')
      .option('-c, --category <category>', 'Filter by category')
      .option('-r, --related', 'Include related memories')
      .option('-f, --format <type>', 'Output format (table|json)', 'table')
      .action(this.searchMemories.bind(this));

    // Get memory details command
    this.program
      .command('get <memoryId>')
      .description('Get detailed memory information')
      .option('-f, --format <type>', 'Output format (json|yaml)', 'json')
      .action(this.getMemory.bind(this));

    // Analytics command
    this.program
      .command('analytics')
      .description('Show memory system analytics')
      .option('-f, --format <type>', 'Output format (table|json)', 'table')
      .action(this.showAnalytics.bind(this));

    // Health check command
    this.program
      .command('health')
      .description('Check memory system health')
      .action(this.checkHealth.bind(this));

    // Export memories command
    this.program
      .command('export')
      .description('Export agent memories')
      .option('-a, --agent <agentId>', 'Export specific agent memories')
      .option('-o, --output <file>', 'Output file path', 'memories-export.json')
      .option('-f, --format <type>', 'Export format (json|csv)', 'json')
      .action(this.exportMemories.bind(this));

    // Import memories command
    this.program
      .command('import <file>')
      .description('Import agent memories from file')
      .option('-f, --format <type>', 'Import format (json|csv)', 'json')
      .option('--dry-run', 'Show what would be imported without actually importing')
      .action(this.importMemories.bind(this));

    // Clear memories command
    this.program
      .command('clear')
      .description('Clear agent memories (use with caution)')
      .option('-a, --agent <agentId>', 'Clear specific agent memories only')
      .option('-u, --user <userId>', 'Clear specific user memories only')
      .option('--confirm', 'Skip confirmation prompt')
      .action(this.clearMemories.bind(this));
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.config.apiUrl}${endpoint}`;
    const requestOptions = {
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to AgentHive API at ${this.config.apiUrl}. Make sure the system is running.`);
      }
      throw error;
    }
  }

  async listMemories(options) {
    try {
      console.log(chalk.blue('🔍 Fetching agent memories...'));

      const params = new URLSearchParams();
      if (options.agent) params.append('agentId', options.agent);
      if (options.user) params.append('userId', options.user);
      if (options.limit) params.append('limit', options.limit);

      const endpoint = `/api/memory${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.makeRequest(endpoint);

      if (options.format === 'json') {
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      // Table format
      if (!response.memories || response.memories.length === 0) {
        console.log(chalk.yellow('📭 No memories found'));
        return;
      }

      const table = new Table({
        head: [
          chalk.cyan('ID'),
          chalk.cyan('Agent'),
          chalk.cyan('User'),
          chalk.cyan('Success Rate'),
          chalk.cyan('Interactions'),
          chalk.cyan('Last Updated'),
        ],
        colWidths: [12, 15, 15, 12, 12, 20],
      });

      response.memories.forEach(memory => {
        const successRate = `${Math.round(memory.performance.successRate * 100)}%`;
        const lastUpdated = new Date(memory.updated).toLocaleDateString();
        
        table.push([
          memory.id.substring(0, 8) + '...',
          memory.agentId,
          memory.userId.substring(0, 8) + '...',
          successRate,
          memory.performance.totalInteractions.toString(),
          lastUpdated,
        ]);
      });

      console.log(table.toString());
      console.log(chalk.green(`\n✅ Found ${response.memories.length} memories`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to list memories:'), error.message);
      process.exit(1);
    }
  }

  async searchMemories(query, options) {
    try {
      console.log(chalk.blue(`🔎 Searching memories for: "${query}"`));

      const searchData = {
        query,
        limit: parseInt(options.limit),
        threshold: parseFloat(options.threshold),
        agentId: options.agent || undefined,
        category: options.category || undefined,
        includeRelated: options.related || false,
      };

      const response = await this.makeRequest('/api/memory/search', {
        method: 'POST',
        body: JSON.stringify(searchData),
      });

      if (options.format === 'json') {
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      // Table format
      if (!response.results || response.results.length === 0) {
        console.log(chalk.yellow('🔍 No matching memories found'));
        return;
      }

      const table = new Table({
        head: [
          chalk.cyan('Agent'),
          chalk.cyan('Similarity'),
          chalk.cyan('Category'),
          chalk.cyan('Success Rate'),
          chalk.cyan('Concepts'),
        ],
        colWidths: [15, 10, 12, 12, 40],
      });

      response.results.forEach(result => {
        const similarity = `${Math.round(result.similarity * 100)}%`;
        const successRate = `${Math.round(result.memory.performance.successRate * 100)}%`;
        const concepts = result.memory.knowledge.concepts.slice(0, 3).join(', ');
        const conceptsDisplay = concepts.length > 35 ? concepts.substring(0, 32) + '...' : concepts;
        
        table.push([
          result.memory.agentId,
          similarity,
          result.category,
          successRate,
          conceptsDisplay,
        ]);
      });

      console.log(table.toString());
      console.log(chalk.green(`\n✅ Found ${response.results.length} matching memories`));

    } catch (error) {
      console.error(chalk.red('❌ Search failed:'), error.message);
      process.exit(1);
    }
  }

  async getMemory(memoryId, options) {
    try {
      console.log(chalk.blue(`📋 Fetching memory: ${memoryId}`));

      const response = await this.makeRequest(`/api/memory/${memoryId}`);

      if (options.format === 'yaml') {
        // Simple YAML-like output
        console.log(chalk.cyan('Memory Details:'));
        console.log(`  ID: ${response.id}`);
        console.log(`  Agent: ${response.agentId}`);
        console.log(`  User: ${response.userId}`);
        console.log(`  Created: ${new Date(response.created).toLocaleString()}`);
        console.log(`  Updated: ${new Date(response.updated).toLocaleString()}`);
        console.log(`  Performance:`);
        console.log(`    Success Rate: ${Math.round(response.performance.successRate * 100)}%`);
        console.log(`    Total Interactions: ${response.performance.totalInteractions}`);
        console.log(`    Average Time: ${response.performance.averageTime}ms`);
        console.log(`  Knowledge:`);
        console.log(`    Concepts: [${response.knowledge.concepts.join(', ')}]`);
        console.log(`    Confidence: ${Math.round(response.knowledge.confidence * 100)}%`);
      } else {
        console.log(JSON.stringify(response, null, 2));
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to get memory:'), error.message);
      process.exit(1);
    }
  }

  async showAnalytics(options) {
    try {
      console.log(chalk.blue('📊 Fetching memory system analytics...'));

      const response = await this.makeRequest('/api/memory/analytics');

      if (options.format === 'json') {
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      // Table format
      console.log(chalk.cyan('\n📈 Memory System Analytics'));
      console.log('='.repeat(50));
      
      console.log(chalk.white(`Total Memories: ${chalk.green(response.totalMemories)}`));
      console.log(chalk.white(`Average Relationships: ${chalk.green(response.averageRelationships.toFixed(1))}`));
      
      // Health metrics
      console.log(chalk.cyan('\n🏥 System Health'));
      console.log('-'.repeat(30));
      const health = response.memoryHealth;
      console.log(`Overall Health: ${this.formatHealthScore(health.overallHealth)}`);
      console.log(`Indexing Health: ${this.formatHealthScore(health.indexingHealth)}`);
      console.log(`Categorization Health: ${this.formatHealthScore(health.categorizationHealth)}`);
      console.log(`Relationship Health: ${this.formatHealthScore(health.relationshipHealth)}`);

      // Category distribution
      if (response.categoryDistribution.length > 0) {
        console.log(chalk.cyan('\n📂 Category Distribution'));
        console.log('-'.repeat(30));
        const categoryTable = new Table({
          head: [chalk.cyan('Category'), chalk.cyan('Count')],
          colWidths: [20, 10],
        });

        response.categoryDistribution.forEach(item => {
          categoryTable.push([item.category, item.count.toString()]);
        });

        console.log(categoryTable.toString());
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to get analytics:'), error.message);
      process.exit(1);
    }
  }

  async checkHealth() {
    try {
      console.log(chalk.blue('🏥 Checking memory system health...'));

      const response = await this.makeRequest('/api/memory/analytics');
      const health = response.memoryHealth;

      console.log(chalk.cyan('\nSmart Memory Index Health Check'));
      console.log('='.repeat(40));

      const overallHealthScore = health.overallHealth * 100;
      let healthStatus, healthColor;

      if (overallHealthScore >= 80) {
        healthStatus = 'HEALTHY';
        healthColor = chalk.green;
      } else if (overallHealthScore >= 60) {
        healthStatus = 'WARNING';
        healthColor = chalk.yellow;
      } else {
        healthStatus = 'CRITICAL';
        healthColor = chalk.red;
      }

      console.log(`Status: ${healthColor(healthStatus)} (${Math.round(overallHealthScore)}%)`);
      console.log(`Total Memories: ${response.totalMemories}`);
      console.log(`Average Relationships: ${response.averageRelationships.toFixed(1)}`);
      
      console.log('\nComponent Health:');
      console.log(`  Indexing: ${this.formatHealthScore(health.indexingHealth)}`);
      console.log(`  Categorization: ${this.formatHealthScore(health.categorizationHealth)}`);
      console.log(`  Relationships: ${this.formatHealthScore(health.relationshipHealth)}`);

      if (overallHealthScore < 80) {
        console.log(chalk.yellow('\n⚠️  Recommendations:'));
        if (health.indexingHealth < 0.8) {
          console.log('  - Check AI provider connectivity for embedding generation');
        }
        if (health.categorizationHealth < 0.8) {
          console.log('  - Review memory categorization accuracy');
        }
        if (health.relationshipHealth < 0.8) {
          console.log('  - Optimize memory relationship detection');
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ Health check failed:'), error.message);
      process.exit(1);
    }
  }

  async exportMemories(options) {
    try {
      console.log(chalk.blue('📤 Exporting memories...'));

      const params = new URLSearchParams();
      if (options.agent) {
        params.append('agentId', options.agent);
        console.log(chalk.gray(`  Filtering by agent: ${options.agent}`));
      }

      const endpoint = `/api/memory${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.makeRequest(endpoint);

      if (!response.memories || response.memories.length === 0) {
        console.log(chalk.yellow('📭 No memories to export'));
        return;
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        totalMemories: response.memories.length,
        memories: response.memories,
      };

      if (options.format === 'csv') {
        // Simple CSV export
        const csvHeader = 'ID,Agent,User,Success Rate,Total Interactions,Created,Updated\n';
        const csvRows = response.memories.map(memory => 
          `${memory.id},${memory.agentId},${memory.userId},${memory.performance.successRate},${memory.performance.totalInteractions},${memory.created},${memory.updated}`
        ).join('\n');
        
        await fs.writeFile(options.output, csvHeader + csvRows);
      } else {
        await fs.writeFile(options.output, JSON.stringify(exportData, null, 2));
      }

      console.log(chalk.green(`✅ Exported ${response.memories.length} memories to ${options.output}`));

    } catch (error) {
      console.error(chalk.red('❌ Export failed:'), error.message);
      process.exit(1);
    }
  }

  async importMemories(file, options) {
    try {
      console.log(chalk.blue(`📥 Importing memories from: ${file}`));

      // Check if file exists
      try {
        await fs.access(file);
      } catch {
        throw new Error(`File not found: ${file}`);
      }

      const fileContent = await fs.readFile(file, 'utf8');
      let importData;

      if (options.format === 'csv') {
        // Simple CSV parsing (basic implementation)
        const lines = fileContent.split('\n');
        const headers = lines[0].split(',');
        
        importData = {
          memories: lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
              obj[header] = values[index];
              return obj;
            }, {});
          })
        };
      } else {
        importData = JSON.parse(fileContent);
      }

      if (!importData.memories || !Array.isArray(importData.memories)) {
        throw new Error('Invalid import format: missing memories array');
      }

      if (options.dryRun) {
        console.log(chalk.yellow(`🔍 Dry run: Would import ${importData.memories.length} memories`));
        
        // Show sample of what would be imported
        const sample = importData.memories.slice(0, 5);
        const table = new Table({
          head: [chalk.cyan('Agent'), chalk.cyan('User'), chalk.cyan('Interactions')],
        });

        sample.forEach(memory => {
          table.push([
            memory.agentId || 'N/A',
            (memory.userId || 'N/A').substring(0, 8) + '...',
            memory.performance?.totalInteractions || 0,
          ]);
        });

        console.log(table.toString());
        if (importData.memories.length > 5) {
          console.log(chalk.gray(`... and ${importData.memories.length - 5} more`));
        }
        return;
      }

      // Perform actual import
      const response = await this.makeRequest('/api/memory/import', {
        method: 'POST',
        body: JSON.stringify(importData),
      });

      console.log(chalk.green(`✅ Successfully imported ${response.imported} memories`));
      if (response.errors > 0) {
        console.log(chalk.yellow(`⚠️  ${response.errors} errors occurred during import`));
      }

    } catch (error) {
      console.error(chalk.red('❌ Import failed:'), error.message);
      process.exit(1);
    }
  }

  async clearMemories(options) {
    try {
      if (!options.confirm) {
        console.log(chalk.yellow('⚠️  This will permanently delete agent memories!'));
        console.log(chalk.gray('   Use --confirm to skip this warning'));
        
        // In a real CLI, you'd use a prompt library here
        console.log(chalk.red('   Operation cancelled for safety'));
        return;
      }

      console.log(chalk.blue('🗑️  Clearing memories...'));

      const params = new URLSearchParams();
      if (options.agent) {
        params.append('agentId', options.agent);
        console.log(chalk.gray(`  Targeting agent: ${options.agent}`));
      }
      if (options.user) {
        params.append('userId', options.user);
        console.log(chalk.gray(`  Targeting user: ${options.user}`));
      }

      const endpoint = `/api/memory/clear${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.makeRequest(endpoint, { method: 'DELETE' });

      console.log(chalk.green(`✅ Cleared ${response.deletedCount} memories`));

    } catch (error) {
      console.error(chalk.red('❌ Clear operation failed:'), error.message);
      process.exit(1);
    }
  }

  formatHealthScore(score) {
    const percentage = Math.round(score * 100);
    if (percentage >= 80) return chalk.green(`${percentage}%`);
    if (percentage >= 60) return chalk.yellow(`${percentage}%`);
    return chalk.red(`${percentage}%`);
  }

  run() {
    this.program.parse(process.argv);

    // Show help if no command provided
    if (!process.argv.slice(2).length) {
      this.program.outputHelp();
    }
  }
}

// Export for use in other modules
module.exports = MemoryCommand;

// Run directly if called as script
if (require.main === module) {
  const memoryCommand = new MemoryCommand();
  memoryCommand.run();
}