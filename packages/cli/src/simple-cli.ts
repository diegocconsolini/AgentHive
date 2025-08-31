#!/usr/bin/env node

/**
 * AgentHive CLI - Simple Version
 * Command your AI agent swarm 🐝
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fetch from 'node-fetch';

const program = new Command();

interface OrchestrationResponse {
  success: boolean;
  result?: {
    output: string;
    selectedAgent: string;
    agentName: string;
    routingReason: string;
    provider: string;
    model: string;
    duration: number;
    cost: number;
  };
  error?: string;
}

// Configuration
const DEFAULT_SYSTEM_API = 'http://localhost:4001';
const DEFAULT_USER_API = 'http://localhost:4000';

async function orchestrateRequest(prompt: string, options: any = {}) {
  try {
    const systemApiUrl = options.systemApi || DEFAULT_SYSTEM_API;
    const response = await fetch(`${systemApiUrl}/api/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        options: {
          routingStrategy: options.strategy || 'balanced',
          priority: options.priority || 'normal'
        },
        userId: options.userId || 'cli-user',
        sessionId: options.sessionId || 'cli-session'
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as OrchestrationResponse;
    return result;

  } catch (error) {
    throw new Error(`Failed to connect to AgentHive: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getSystemStatus(systemApiUrl: string = DEFAULT_SYSTEM_API) {
  try {
    const response = await fetch(`${systemApiUrl}/api/status`);
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Cannot connect to system API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

program
  .name('hive')
  .description('AgentHive CLI - Command your AI agent swarm')
  .version('1.0.3');

program
  .command('ask <prompt>')
  .description('Ask the AI agent swarm to help you')
  .option('-s, --strategy <strategy>', 'Routing strategy (balanced, performance, speed)', 'balanced')
  .option('-p, --priority <priority>', 'Request priority (low, normal, high)', 'normal')
  .option('--user-id <userId>', 'User identifier', 'cli-user')
  .option('--session-id <sessionId>', 'Session identifier', 'cli-session')
  .action(async (prompt, options) => {
    console.log('Processing request...');
    console.log(`Prompt: ${prompt}`);
    
    try {
      const result = await orchestrateRequest(prompt, options);
      
      if (result.success && result.result) {
        console.log('\n' + chalk.green('✅ Success!'));
        console.log(chalk.yellow(`🤖 Selected Agent: ${result.result.agentName} (${result.result.selectedAgent})`));
        console.log(chalk.gray(`📍 Routing: ${result.result.routingReason}`));
        console.log(chalk.gray(`⚡ Provider: ${result.result.provider} (${result.result.model})`));
        console.log(chalk.gray(`⏱️  Duration: ${result.result.duration}ms | Cost: $${result.result.cost.toFixed(4)}`));
        console.log('\n' + chalk.white('📝 Response:'));
        console.log(chalk.cyan(result.result.output));
      } else {
        console.log('\n' + chalk.red('❌ Error:'));
        console.log(chalk.red(result.error || 'Unknown error occurred'));
      }
    } catch (error) {
      console.log('\n' + chalk.red('❌ Failed to process request:'));
      console.log(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check AgentHive system status')
  .action(async () => {
    console.log('Checking system status...');
    
    try {
      const status = await getSystemStatus();
      console.log('\n' + chalk.green('✅ System Status: Operational'));
      console.log(chalk.gray(`🖥️  System API: ${DEFAULT_SYSTEM_API}`));
      console.log(chalk.gray(`👤 User API: ${DEFAULT_USER_API}`));
      console.log(chalk.gray(`📊 Services: All running`));
      
      if (status.providers) {
        console.log(chalk.yellow('\n🤖 AI Providers:'));
        status.providers.forEach((provider: any) => {
          console.log(chalk.gray(`  - ${provider.name}: ${provider.status}`));
        });
      }
    } catch (error) {
      console.log('\n' + chalk.red('❌ System Status: Unavailable'));
      console.log(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      console.log('\n' + chalk.yellow('💡 Make sure AgentHive services are running:'));
      console.log(chalk.gray('   npm run dev'));
      process.exit(1);
    }
  });

program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log('AgentHive CLI Examples:');
    console.log('');
    console.log('Basic Usage:');
    console.log('  hive ask "Help me optimize a Python function for large datasets"');
    console.log('  hive ask "Review this React component for security issues"');
    console.log('  hive ask "Design a REST API for user management"');
    console.log('');
    console.log('With Options:');
    console.log('  hive ask "Debug this performance issue" --strategy performance');
    console.log('  hive ask "Urgent: Fix production error" --priority high');
    console.log('');
    console.log('System Commands:');
    console.log('  hive status          # Check system health');
    console.log('  hive examples        # Show these examples');
    console.log('');
    console.log('Tips:');
    console.log('  - Be specific in your requests for better agent routing');
    console.log('  - Use --strategy performance for complex technical tasks');
    console.log('  - Use --priority high for urgent requests');
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red('❌ Invalid command: %s\n'), program.args.join(' '));
  console.log(chalk.yellow('💡 Run "hive --help" to see available commands'));
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}