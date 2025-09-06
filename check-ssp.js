#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'packages/system-api/.agent-memory/memories.db');

console.log('🔍 Checking SSP Database:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SSP database');
});

// Check if procedure_executions table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='procedure_executions'", (err, row) => {
  if (err) {
    console.error('❌ Error checking table:', err.message);
    db.close();
    return;
  }
  
  if (!row) {
    console.log('❌ procedure_executions table does not exist');
    db.close();
    return;
  }
  
  console.log('✅ procedure_executions table exists');
  
  // Count total executions
  db.get("SELECT COUNT(*) as count FROM procedure_executions", (err, row) => {
    if (err) {
      console.error('❌ Error counting executions:', err.message);
      db.close();
      return;
    }
    
    console.log(`📊 Total procedure executions: ${row.count}`);
    
    if (row.count > 0) {
      // Show recent executions
      db.all(`
        SELECT id, context_id, agent_id, session_id, success, execution_time, created_at
        FROM procedure_executions 
        ORDER BY created_at DESC 
        LIMIT 10
      `, (err, rows) => {
        if (err) {
          console.error('❌ Error fetching executions:', err.message);
        } else {
          console.log('\n📋 Recent executions:');
          rows.forEach(row => {
            console.log(`  • ${row.id}: agent=${row.agent_id}, success=${row.success}, time=${row.execution_time}ms, at=${new Date(row.created_at)}`);
          });
        }
        db.close();
      });
    } else {
      console.log('⚠️  No executions recorded yet');
      db.close();
    }
  });
});