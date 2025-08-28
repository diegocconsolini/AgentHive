#!/usr/bin/env node

const fs = require('fs');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { agents } = require('./src/db/schema.js');
const { eq } = require('drizzle-orm');

const sqlite = new Database('./memory-manager.db');
const db = drizzle(sqlite);

async function seedAgents() {
  try {
    // Read the parsed agents data
    const agentsData = JSON.parse(fs.readFileSync('../../agents-data.json', 'utf-8'));
    
    console.log(`Loading ${agentsData.length} agents into database...`);
    
    // Clear existing agents (optional - comment out if you want to keep existing)
    // await db.delete(agents);
    // console.log('Cleared existing agents');
    
    let inserted = 0;
    let updated = 0;
    
    for (const agent of agentsData) {
      try {
        // Check if agent already exists
        const existing = await db.select().from(agents).where(eq(agents.name, agent.name));
        
        const agentData = {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          version: agent.version,
          category: agent.category,
          model: agent.model,
          tags: JSON.stringify(agent.tags),
          capabilities: JSON.stringify(agent.capabilities),
          dependencies: JSON.stringify(agent.dependencies),
          config: JSON.stringify(agent.config),
          status: agent.status,
          popularity: agent.popularity.toString(),
          rating: agent.rating,
          systemPrompt: agent.systemPrompt,
          isPublic: agent.isPublic ? 'true' : 'false',
          authorId: agent.authorId || 'admin',
          createdAt: agent.createdAt || new Date().toISOString(),
          updatedAt: agent.updatedAt || new Date().toISOString()
        };
        
        if (existing.length > 0) {
          // Update existing agent
          await db.update(agents)
            .set(agentData)
            .where(eq(agents.id, existing[0].id));
          updated++;
        } else {
          // Insert new agent
          await db.insert(agents).values(agentData);
          inserted++;
        }
        
      } catch (error) {
        console.error(`Error processing agent ${agent.name}:`, error.message);
      }
    }
    
    console.log(`\n✅ Agent seeding completed!`);
    console.log(`📦 Inserted: ${inserted} new agents`);
    console.log(`🔄 Updated: ${updated} existing agents`);
    console.log(`📊 Total agents in database: ${inserted + updated}`);
    
    // Print summary by category
    const summary = agentsData.reduce((acc, agent) => {
      acc[agent.category] = (acc[agent.category] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\n📋 Agents by category:`);
    Object.entries(summary).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} agents`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding agents:', error.message);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

seedAgents();