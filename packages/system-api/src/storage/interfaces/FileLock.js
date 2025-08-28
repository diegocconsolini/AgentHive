const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * File locking utility for concurrent access safety
 */
class FileLock {
  constructor(lockDir = '.locks') {
    this.lockDir = lockDir;
    this.activeLocks = new Map(); // In-memory tracking of active locks
  }

  /**
   * Initialize lock directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.lockDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Generate lock file path for a given resource
   * @param {string} resourceId - Unique resource identifier
   * @returns {string} Lock file path
   */
  getLockPath(resourceId) {
    // Create hash to handle long or invalid filename characters
    const hash = crypto.createHash('md5').update(resourceId).digest('hex');
    return path.join(this.lockDir, `${hash}.lock`);
  }

  /**
   * Acquire a lock for a resource
   * @param {string} resourceId - Resource to lock
   * @param {Object} options - Lock options
   * @param {number} options.timeout - Timeout in milliseconds (default: 5000)
   * @param {number} options.retryInterval - Retry interval in ms (default: 100)
   * @returns {Promise<string>} Lock token
   */
  async acquire(resourceId, options = {}) {
    const { timeout = 5000, retryInterval = 100 } = options;
    const lockPath = this.getLockPath(resourceId);
    const lockToken = crypto.randomUUID();
    const startTime = Date.now();

    // Check if we already have this lock in memory (for same process)
    if (this.activeLocks.has(resourceId)) {
      throw new Error(`Lock already held for resource: ${resourceId}`);
    }

    while (Date.now() - startTime < timeout) {
      try {
        // Try to create lock file exclusively (atomic operation)
        await fs.writeFile(lockPath, JSON.stringify({
          token: lockToken,
          pid: process.pid,
          timestamp: new Date().toISOString(),
          resourceId
        }), { flag: 'wx' }); // 'wx' = create exclusively, fail if exists

        // Success - track the lock
        this.activeLocks.set(resourceId, {
          token: lockToken,
          path: lockPath,
          acquired: Date.now()
        });

        return lockToken;

      } catch (error) {
        if (error.code === 'EEXIST') {
          // Lock file exists, check if it's stale
          await this.cleanupStaleLock(lockPath, resourceId);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryInterval));
          continue;
        }
        
        // Other error
        throw error;
      }
    }

    throw new Error(`Failed to acquire lock for resource: ${resourceId} (timeout after ${timeout}ms)`);
  }

  /**
   * Release a lock
   * @param {string} resourceId - Resource to unlock
   * @param {string} lockToken - Lock token from acquire()
   * @returns {Promise<boolean>} True if released, false if not found
   */
  async release(resourceId, lockToken) {
    const lockInfo = this.activeLocks.get(resourceId);
    
    if (!lockInfo) {
      return false; // Lock not held by this process
    }

    if (lockInfo.token !== lockToken) {
      throw new Error(`Invalid lock token for resource: ${resourceId}`);
    }

    try {
      // Verify the lock file still contains our token
      const lockData = JSON.parse(await fs.readFile(lockInfo.path, 'utf8'));
      
      if (lockData.token !== lockToken) {
        throw new Error(`Lock token mismatch for resource: ${resourceId}`);
      }

      // Remove lock file
      await fs.unlink(lockInfo.path);
      
      // Remove from memory
      this.activeLocks.delete(resourceId);
      
      return true;

    } catch (error) {
      if (error.code === 'ENOENT') {
        // Lock file already removed
        this.activeLocks.delete(resourceId);
        return true;
      }
      
      throw error;
    }
  }

  /**
   * Check if a lock is currently held
   * @param {string} resourceId - Resource to check
   * @returns {Promise<boolean>} True if locked
   */
  async isLocked(resourceId) {
    // Check memory first
    if (this.activeLocks.has(resourceId)) {
      return true;
    }

    // Check file system
    const lockPath = this.getLockPath(resourceId);
    
    try {
      await fs.access(lockPath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Clean up stale lock (process no longer running)
   * @param {string} lockPath - Path to lock file
   * @param {string} resourceId - Resource ID for logging
   */
  async cleanupStaleLock(lockPath, resourceId) {
    try {
      const lockData = JSON.parse(await fs.readFile(lockPath, 'utf8'));
      const lockAge = Date.now() - new Date(lockData.timestamp).getTime();
      
      // Consider locks older than 30 seconds as potentially stale
      if (lockAge > 30000) {
        try {
          // Check if process is still running (Unix/Linux only)
          if (process.platform !== 'win32') {
            process.kill(lockData.pid, 0); // Signal 0 just checks if process exists
            // If we reach here, process exists, lock is not stale
            return;
          }
        } catch (error) {
          // Process doesn't exist or we can't signal it - lock is stale
          console.warn(`Cleaning up stale lock for resource: ${resourceId} (PID: ${lockData.pid})`);
          await fs.unlink(lockPath);
        }
      }

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error checking stale lock for ${resourceId}:`, error.message);
      }
    }
  }

  /**
   * Execute a function with a lock held
   * @param {string} resourceId - Resource to lock
   * @param {Function} fn - Function to execute
   * @param {Object} options - Lock options
   * @returns {Promise<any>} Result of the function
   */
  async withLock(resourceId, fn, options = {}) {
    let lockToken;
    
    try {
      lockToken = await this.acquire(resourceId, options);
      return await fn();
    } finally {
      if (lockToken) {
        await this.release(resourceId, lockToken);
      }
    }
  }

  /**
   * Get information about all active locks
   * @returns {Array<Object>} Active lock information
   */
  getActiveLocks() {
    const locks = [];
    
    for (const [resourceId, lockInfo] of this.activeLocks.entries()) {
      locks.push({
        resourceId,
        token: lockInfo.token,
        acquired: new Date(lockInfo.acquired).toISOString(),
        duration: Date.now() - lockInfo.acquired
      });
    }
    
    return locks;
  }

  /**
   * Release all locks held by this instance
   */
  async releaseAll() {
    const releasePromises = [];
    
    for (const [resourceId, lockInfo] of this.activeLocks.entries()) {
      releasePromises.push(
        this.release(resourceId, lockInfo.token).catch(error => {
          console.error(`Error releasing lock for ${resourceId}:`, error.message);
        })
      );
    }
    
    await Promise.all(releasePromises);
  }

  /**
   * Cleanup on process exit
   */
  async cleanup() {
    await this.releaseAll();
  }
}

module.exports = FileLock;