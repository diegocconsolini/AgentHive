#!/usr/bin/env node
/**
 * Safe File Operations - Atomic writes, locking, and data integrity
 * Provides resilient file operations for the AgentHive platform
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SafeFileOperations {
  constructor() {
    this.lockDir = '/tmp/agenthive-locks';
    this.backupDir = '/tmp/agenthive-backups';
    this.ensureLockDirectories();
  }

  ensureLockDirectories() {
    [this.lockDir, this.backupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch (error) {
          console.warn(`⚠️  Could not create directory ${dir}: ${error.message}`);
        }
      }
    });
  }

  /**
   * Atomic write operation using temp file + rename
   */
  atomicWrite(filePath, content) {
    const tempPath = `${filePath}.tmp.${Date.now()}.${process.pid}`;
    const backupPath = this.createBackupPath(filePath);
    
    try {
      // Create backup of existing file
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath);
      }

      // Write to temporary file
      fs.writeFileSync(tempPath, content, { encoding: 'utf8' });

      // Verify write succeeded
      const written = fs.readFileSync(tempPath, 'utf8');
      if (written !== content) {
        throw new Error('Content verification failed after write');
      }

      // Atomic rename
      fs.renameSync(tempPath, filePath);

      // Clean up backup on success
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }

      return true;
    } catch (error) {
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Restore from backup if write failed
      if (fs.existsSync(backupPath) && !fs.existsSync(filePath)) {
        try {
          fs.copyFileSync(backupPath, filePath);
          console.warn(`⚠️  Restored ${filePath} from backup after write failure`);
        } catch (restoreError) {
          console.error(`❌ Failed to restore from backup: ${restoreError.message}`);
        }
      }

      throw new Error(`Atomic write failed for ${filePath}: ${error.message}`);
    }
  }

  /**
   * Safe JSON read with validation and fallback
   */
  safeJsonRead(filePath, defaultValue = null, validator = null) {
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File ${filePath} does not exist, using default value`);
        return defaultValue;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      
      if (!content.trim()) {
        console.warn(`⚠️  File ${filePath} is empty, using default value`);
        return defaultValue;
      }

      const data = JSON.parse(content);

      // Run validator if provided
      if (validator && typeof validator === 'function') {
        const validationResult = validator(data);
        if (!validationResult.valid) {
          console.warn(`⚠️  Validation failed for ${filePath}: ${validationResult.error}`);
          
          // Try to auto-repair if repair function provided
          if (validationResult.repair && typeof validationResult.repair === 'function') {
            const repaired = validationResult.repair(data);
            console.log(`🔧 Auto-repaired ${filePath}`);
            return repaired;
          }
          
          return defaultValue;
        }
      }

      return data;
    } catch (error) {
      console.error(`❌ Failed to read JSON from ${filePath}: ${error.message}`);
      
      // Try to read backup if it exists
      const backupPath = this.createBackupPath(filePath);
      if (fs.existsSync(backupPath)) {
        try {
          console.log(`📦 Attempting to restore from backup: ${backupPath}`);
          const backupContent = fs.readFileSync(backupPath, 'utf8');
          const backupData = JSON.parse(backupContent);
          
          // Copy backup to main file
          fs.copyFileSync(backupPath, filePath);
          console.log(`✅ Restored ${filePath} from backup`);
          
          return backupData;
        } catch (backupError) {
          console.error(`❌ Backup recovery also failed: ${backupError.message}`);
        }
      }
      
      return defaultValue;
    }
  }

  /**
   * File-based locking mechanism
   */
  acquireLock(identifier, timeout = 5000) {
    const lockPath = path.join(this.lockDir, `${identifier}.lock`);
    const start = Date.now();
    const lockContent = {
      pid: process.pid,
      timestamp: new Date().toISOString(),
      identifier
    };

    while (fs.existsSync(lockPath)) {
      if (Date.now() - start > timeout) {
        // Check if lock is stale (process no longer exists)
        try {
          const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
          const lockAge = Date.now() - new Date(lockData.timestamp).getTime();
          
          if (lockAge > 30000) { // 30 seconds = stale lock
            console.warn(`⚠️  Removing stale lock for ${identifier} (${lockAge}ms old)`);
            fs.unlinkSync(lockPath);
            break;
          }
        } catch (e) {
          // Corrupted lock file, remove it
          console.warn(`⚠️  Removing corrupted lock file for ${identifier}`);
          fs.unlinkSync(lockPath);
          break;
        }
        
        throw new Error(`Lock timeout for ${identifier} after ${timeout}ms`);
      }
      
      // Wait 50ms and retry
      require('child_process').execSync('sleep 0.05');
    }

    try {
      fs.writeFileSync(lockPath, JSON.stringify(lockContent, null, 2));
      return lockPath;
    } catch (error) {
      throw new Error(`Failed to acquire lock for ${identifier}: ${error.message}`);
    }
  }

  /**
   * Release file lock
   */
  releaseLock(identifier) {
    const lockPath = path.join(this.lockDir, `${identifier}.lock`);
    
    try {
      if (fs.existsSync(lockPath)) {
        // Verify we own this lock
        const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        if (lockData.pid !== process.pid) {
          console.warn(`⚠️  Attempted to release lock owned by PID ${lockData.pid}`);
          return false;
        }
        
        fs.unlinkSync(lockPath);
        return true;
      }
    } catch (error) {
      console.error(`❌ Failed to release lock for ${identifier}: ${error.message}`);
      return false;
    }
    
    return true;
  }

  /**
   * Create timestamped backup of file
   */
  backupFile(filePath, label = 'auto') {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = path.basename(filePath);
    const backupFileName = `${fileName}.${label}.${timestamp}.bak`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      fs.copyFileSync(filePath, backupPath);
      return backupPath;
    } catch (error) {
      console.error(`❌ Failed to create backup of ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Verify file integrity with checksum
   */
  verifyChecksum(filePath, expectedChecksum = null) {
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File does not exist' };
    }

    try {
      const content = fs.readFileSync(filePath);
      const actualChecksum = crypto.createHash('sha256').update(content).digest('hex');
      
      if (expectedChecksum) {
        return {
          valid: actualChecksum === expectedChecksum,
          checksum: actualChecksum,
          expected: expectedChecksum
        };
      }
      
      return {
        valid: true,
        checksum: actualChecksum
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up old backup files
   */
  cleanupOldBackups(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    try {
      const files = fs.readdirSync(this.backupDir);
      let cleaned = 0;

      files.forEach(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const age = Date.now() - stats.mtime.getTime();

        if (age > maxAge) {
          try {
            fs.unlinkSync(filePath);
            cleaned++;
          } catch (error) {
            console.warn(`⚠️  Could not delete old backup ${file}: ${error.message}`);
          }
        }
      });

      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} old backup files`);
      }

      return cleaned;
    } catch (error) {
      console.error(`❌ Failed to cleanup old backups: ${error.message}`);
      return 0;
    }
  }

  /**
   * Helper to create consistent backup file paths
   */
  createBackupPath(filePath) {
    const fileName = path.basename(filePath);
    const timestamp = Date.now();
    return path.join(this.backupDir, `${fileName}.${timestamp}.bak`);
  }

  /**
   * Get lock status information
   */
  getLockInfo(identifier) {
    const lockPath = path.join(this.lockDir, `${identifier}.lock`);
    
    if (!fs.existsSync(lockPath)) {
      return { locked: false };
    }

    try {
      const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      const age = Date.now() - new Date(lockData.timestamp).getTime();
      
      return {
        locked: true,
        pid: lockData.pid,
        timestamp: lockData.timestamp,
        age: age,
        stale: age > 30000
      };
    } catch (error) {
      return {
        locked: true,
        corrupted: true,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const safeFileOps = new SafeFileOperations();

// Export individual functions for easy use
module.exports = {
  atomicWrite: (filePath, content) => safeFileOps.atomicWrite(filePath, content),
  safeJsonRead: (filePath, defaultValue, validator) => safeFileOps.safeJsonRead(filePath, defaultValue, validator),
  acquireLock: (identifier, timeout) => safeFileOps.acquireLock(identifier, timeout),
  releaseLock: (identifier) => safeFileOps.releaseLock(identifier),
  backupFile: (filePath, label) => safeFileOps.backupFile(filePath, label),
  verifyChecksum: (filePath, expectedChecksum) => safeFileOps.verifyChecksum(filePath, expectedChecksum),
  cleanupOldBackups: (maxAge) => safeFileOps.cleanupOldBackups(maxAge),
  getLockInfo: (identifier) => safeFileOps.getLockInfo(identifier),
  
  // Export class for advanced usage
  SafeFileOperations
};

// CLI interface for standalone usage
if (require.main === module) {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  switch (command) {
    case 'backup':
      if (arg1) {
        const backupPath = safeFileOps.backupFile(arg1, arg2 || 'manual');
        console.log(backupPath ? `✅ Backup created: ${backupPath}` : '❌ Backup failed');
      } else {
        console.error('❌ Please specify file path');
      }
      break;
    
    case 'cleanup':
      const maxAge = arg1 ? parseInt(arg1) * 24 * 60 * 60 * 1000 : undefined;
      const cleaned = safeFileOps.cleanupOldBackups(maxAge);
      console.log(`🧹 Cleaned ${cleaned} old backups`);
      break;
    
    case 'locks':
      console.log('🔒 Lock Directory:', safeFileOps.lockDir);
      try {
        const locks = fs.readdirSync(safeFileOps.lockDir);
        if (locks.length === 0) {
          console.log('No active locks');
        } else {
          locks.forEach(lock => {
            const identifier = lock.replace('.lock', '');
            const info = safeFileOps.getLockInfo(identifier);
            console.log(`  ${identifier}: ${info.stale ? 'STALE' : 'ACTIVE'} (PID: ${info.pid}, Age: ${info.age}ms)`);
          });
        }
      } catch (error) {
        console.error('❌ Could not read locks:', error.message);
      }
      break;
    
    case 'checksum':
      if (arg1) {
        const result = safeFileOps.verifyChecksum(arg1);
        if (result.valid) {
          console.log(`✅ ${arg1}: ${result.checksum}`);
        } else {
          console.log(`❌ ${arg1}: ${result.error}`);
        }
      } else {
        console.error('❌ Please specify file path');
      }
      break;
    
    case 'help':
    default:
      console.log(`
🛠️  Safe File Operations CLI

Usage:
  node safe-file-operations.js backup <file> [label]    Create backup
  node safe-file-operations.js cleanup [days]          Clean old backups (default: 7)
  node safe-file-operations.js locks                   Show active locks
  node safe-file-operations.js checksum <file>         Show file checksum
  node safe-file-operations.js help                    Show this help

Examples:
  node safe-file-operations.js backup phase-tracker.json session-start
  node safe-file-operations.js cleanup 3
  node safe-file-operations.js locks
      `);
      break;
  }
}