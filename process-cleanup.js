#!/usr/bin/env node
/**
 * Process Cleanup Utilities - Ensures proper cleanup before exit
 */

const safeFileOps = require('./safe-file-operations');

class ProcessCleanup {
  constructor() {
    this.cleanup = [];
    this.setupSignalHandlers();
  }

  /**
   * Register cleanup function
   */
  onExit(fn) {
    if (typeof fn === 'function') {
      this.cleanup.push(fn);
    }
  }

  /**
   * Safe exit with cleanup
   */
  safeExit(code = 0) {
    try {
      // Run all cleanup functions
      for (const fn of this.cleanup) {
        try {
          fn();
        } catch (error) {
          console.warn(`⚠️  Cleanup warning: ${error.message}`);
        }
      }

      // Release common locks
      try {
        safeFileOps.releaseLock('session-manager');
        safeFileOps.releaseLock('backup-system');
        safeFileOps.releaseLock('phase-validator');
      } catch (error) {
        // Ignore lock release errors on exit
      }

      // Clean up temp files
      try {
        safeFileOps.cleanupOldBackups(0); // Clean all temp backups on exit
      } catch (error) {
        // Ignore cleanup errors on exit
      }

    } catch (error) {
      console.warn(`⚠️  Final cleanup error: ${error.message}`);
    }

    process.exit(code);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  setupSignalHandlers() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR1', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        console.log(`\n📡 Received ${signal}, performing cleanup...`);
        this.safeExit(signal === 'SIGINT' ? 130 : 1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error.message);
      this.safeExit(1);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      this.safeExit(1);
    });
  }
}

// Create singleton
const processCleanup = new ProcessCleanup();

module.exports = {
  onExit: (fn) => processCleanup.onExit(fn),
  safeExit: (code) => processCleanup.safeExit(code),
  ProcessCleanup
};