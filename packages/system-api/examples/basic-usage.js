#!/usr/bin/env node

/**
 * Basic usage example for the Memory Manager Storage System
 * Demonstrates core functionality and API usage
 */

const StorageManager = require('../src/storage/StorageManager');
const path = require('path');

async function basicUsageDemo() {
  console.log('🚀 Memory Manager Storage System Demo\n');

  // Initialize storage manager
  const storage = new StorageManager({
    baseDir: path.join(__dirname, '.demo-storage'),
    syncEnabled: true
  });

  try {
    // Initialize the storage system
    console.log('📁 Initializing storage system...');
    await storage.initialize();
    console.log('✅ Storage system initialized\n');

    // Health check
    const health = await storage.healthCheck();
    console.log('🏥 Health check:', health, '\n');

    // Create a sample project context
    console.log('📝 Creating sample contexts...');
    
    const projectContext = {
      id: 'project-demo-001',
      type: 'project',
      hierarchy: ['demo-project'],
      importance: 90,
      content: 'This is a demo project for testing the memory manager storage system.',
      metadata: {
        agent_id: 'demo-agent',
        tags: ['demo', 'testing', 'storage'],
        dependencies: [],
        retention_policy: 'long-term'
      },
      relationships: {
        parent: null,
        children: [],
        references: []
      }
    };

    const createdProject = await storage.create(projectContext);
    console.log('✅ Created project context:', createdProject.id);

    // Create an epic context
    const epicContext = {
      id: 'epic-demo-001',
      type: 'epic',
      hierarchy: ['demo-project', 'storage-engine'],
      importance: 85,
      content: 'Epic for implementing the storage engine with filesystem and database components.',
      metadata: {
        agent_id: 'demo-agent',
        tags: ['epic', 'storage', 'filesystem', 'database'],
        dependencies: [],
        retention_policy: 'default'
      },
      relationships: {
        parent: 'project-demo-001',
        children: [],
        references: []
      }
    };

    const createdEpic = await storage.create(epicContext);
    console.log('✅ Created epic context:', createdEpic.id);

    // Create a task context
    const taskContext = {
      id: 'task-demo-001',
      type: 'task',
      hierarchy: ['demo-project', 'storage-engine', 'filesystem'],
      importance: 75,
      content: 'Task to implement filesystem storage with hierarchical organization and file locking.',
      metadata: {
        agent_id: 'file-agent',
        tags: ['task', 'filesystem', 'implementation'],
        dependencies: [],
        retention_policy: 'default'
      },
      relationships: {
        parent: 'epic-demo-001',
        children: [],
        references: []
      }
    };

    const createdTask = await storage.create(taskContext);
    console.log('✅ Created task context:', createdTask.id, '\n');

    // Read contexts back
    console.log('📖 Reading contexts...');
    const readProject = await storage.read('project-demo-001');
    console.log('✅ Read project:', readProject?.type, '-', readProject?.hierarchy.join('/'));

    const readEpic = await storage.read('epic-demo-001');
    console.log('✅ Read epic:', readEpic?.type, '-', readEpic?.hierarchy.join('/'));

    const readTask = await storage.read('task-demo-001');
    console.log('✅ Read task:', readTask?.type, '-', readTask?.hierarchy.join('/'), '\n');

    // List contexts
    console.log('📋 Listing contexts...');
    const allContexts = await storage.list({ limit: 10 });
    console.log(`✅ Found ${allContexts.length} contexts:`);
    allContexts.forEach(ctx => {
      console.log(`   - ${ctx.id} (${ctx.type}) - ${ctx.hierarchy.join('/')}`);
    });
    console.log();

    // Search contexts
    console.log('🔍 Searching for "storage"...');
    const searchResults = await storage.search('storage', { limit: 5 });
    console.log(`✅ Found ${searchResults.length} matching contexts:`);
    searchResults.forEach(ctx => {
      console.log(`   - ${ctx.id} (${ctx.type}) - importance: ${ctx.importance}`);
    });
    console.log();

    // Get by hierarchy
    console.log('🌳 Getting contexts by hierarchy...');
    const hierarchyResults = await storage.getByHierarchy(['demo-project'], true);
    console.log(`✅ Found ${hierarchyResults.length} contexts in demo-project hierarchy:`);
    hierarchyResults.forEach(ctx => {
      console.log(`   - ${ctx.id} (${ctx.type}) - ${ctx.hierarchy.join('/')}`);
    });
    console.log();

    // Update a context
    console.log('✏️ Updating task context...');
    const updatedTask = await storage.update('task-demo-001', {
      importance: 80,
      content: 'Updated task: Filesystem storage implementation with enhanced file locking and concurrent access safety.',
      metadata: {
        ...taskContext.metadata,
        tags: [...taskContext.metadata.tags, 'updated', 'concurrent-access']
      }
    });
    console.log('✅ Updated task:', updatedTask.id, '- new importance:', updatedTask.importance);
    console.log();

    // Get storage statistics
    console.log('📊 Storage statistics...');
    const stats = await storage.getStats();
    console.log('✅ Storage stats:', JSON.stringify(stats, null, 2));
    console.log();

    // Get analytics (if database is enabled)
    if (stats.sync.enabled) {
      console.log('📈 Analytics data...');
      const analytics = await storage.getAnalytics();
      console.log('✅ Analytics:', JSON.stringify(analytics, null, 2));
      console.log();
    }

    // Clean up - delete contexts
    console.log('🗑️ Cleaning up demo contexts...');
    await storage.delete('task-demo-001');
    console.log('✅ Deleted task context');
    
    await storage.delete('epic-demo-001');
    console.log('✅ Deleted epic context');
    
    await storage.delete('project-demo-001');
    console.log('✅ Deleted project context');
    console.log();

    // Final health check
    const finalHealth = await storage.healthCheck();
    console.log('🏥 Final health check:', finalHealth);

    // Close storage
    await storage.close();
    console.log('✅ Storage system closed');

    console.log('\n🎉 Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
  }
}

// Run the demo
if (require.main === module) {
  basicUsageDemo().catch(console.error);
}

module.exports = { basicUsageDemo };