#!/usr/bin/env node

import { Command } from 'commander';
import { AuthCommand } from './commands/auth.js';
import { MemoryCommand } from './commands/memory.js';
import { ConfigCommand } from './commands/config.js';
import { SystemCommand } from './commands/system.js';
import { CompletionCommand } from './commands/completion.js';
import { AgentCommand } from './commands/agent/index.js';
import { ContextCommand } from './commands/context/index.js';
import { EnhancedMemoryCommand } from './commands/memory/index.js';
import { PerformanceCommand, MonitoringCommand } from './commands/performance/index.js';
import { DevCommand } from './commands/dev/index.js';
import { EnhancedConfigCommand, EnvironmentCommand } from './commands/config/index.js';

const program = new Command();

program
  .name('memory')
  .description('Memory Manager CLI - Comprehensive agent and memory management platform')
  .version('1.0.0')
  .addHelpText('after', `
Examples:
  # Authentication
  $ memory auth login                         # Authenticate with the service
  $ memory auth whoami                        # Show current user

  # Agent Management  
  $ memory agent create my-agent              # Create a new agent
  $ memory agent list --format=table         # List all agents
  $ memory agent run agent-id "Hello"        # Run an agent
  $ memory agent benchmark agent-id          # Benchmark agent performance

  # Context Management
  $ memory context create "Project Context"  # Create a new context
  $ memory context analyze ctx-id             # Analyze context patterns
  $ memory context merge source target        # Merge two contexts

  # Enhanced Memory Management
  $ memory memory search "AI agents"         # Search memories with filters
  $ memory memory cluster --method=semantic  # Cluster memories by similarity
  $ memory memory graph --output=svg         # Generate memory relationship graph

  # Performance & Monitoring
  $ memory perf analyze --duration=24h       # Analyze system performance
  $ memory monitor status --detailed         # Check detailed system status
  $ memory perf benchmark --suite=full       # Run comprehensive benchmarks

  # Development Tools
  $ memory dev scaffold agent my-bot         # Generate agent template
  $ memory dev test --type=unit --coverage   # Run tests with coverage
  $ memory dev backup --compress             # Create compressed backup

  # Configuration & Environments
  $ memory config get api.url                # Get configuration value
  $ memory config set api.url <url>          # Set configuration value
  $ memory env create development             # Create development environment
  $ memory env switch production             # Switch to production environment

For more information on a specific command:
  $ memory <command> --help
  $ memory <command> <subcommand> --help
`);

// Add all comprehensive commands
program.addCommand(new AuthCommand().getCommand());
program.addCommand(new AgentCommand().getCommand());
program.addCommand(new ContextCommand().getCommand());
program.addCommand(new EnhancedMemoryCommand().getCommand());
program.addCommand(new PerformanceCommand().getCommand());
program.addCommand(new MonitoringCommand().getCommand());
program.addCommand(new DevCommand().getCommand());
program.addCommand(new EnhancedConfigCommand().getCommand());
program.addCommand(new EnvironmentCommand().getCommand());
program.addCommand(new SystemCommand().getCommand());
program.addCommand(new CompletionCommand().getCommand());

// Keep original commands for backward compatibility
program.addCommand(new MemoryCommand().getCommand());
program.addCommand(new ConfigCommand().getCommand());

// Global options
program
  .option('-v, --verbose', 'verbose output')
  .option('--api-url <url>', 'override API URL')
  .option('--json', 'output in JSON format')
  .option('--no-colors', 'disable colored output')
  .option('--debug', 'enable debug mode')
  .option('--timeout <seconds>', 'request timeout in seconds')
  .option('--config <path>', 'configuration file path');

// Error handling for uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Parse CLI arguments
program.parse();