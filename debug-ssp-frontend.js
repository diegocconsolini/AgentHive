#!/usr/bin/env node

/**
 * Debug SSP Frontend API calls
 */

const fetch = require('node-fetch');

async function testSSPService() {
  console.log('🔍 Debugging SSP Frontend Service');
  console.log('====================================\n');

  // Test what the frontend service would do
  const SYSTEM_API_URL = process.env.SYSTEM_API_URL || 'http://localhost:4001';
  const SSP_API_BASE = `${SYSTEM_API_URL}/api/ssp`;
  
  console.log('Configuration:');
  console.log(`- SYSTEM_API_URL: ${SYSTEM_API_URL}`);
  console.log(`- SSP_API_BASE: ${SSP_API_BASE}\n`);

  // Test individual agent analytics
  console.log('Testing individual agent analytics:');
  const agents = ['frontend-developer', 'python-pro'];
  
  for (const agentId of agents) {
    const url = `${SSP_API_BASE}/analytics/${agentId}?userId=web-user&sessionId=web-session-${Date.now()}`;
    console.log(`GET ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${agentId}: ${data.totalExecutions} executions, ${Math.round(data.successRate * 100)}% success\n`);
      } else {
        console.log(`❌ ${agentId}: ${response.status} ${response.statusText}\n`);
      }
    } catch (error) {
      console.log(`❌ ${agentId}: ${error.message}\n`);
    }
  }

  // Test system overview simulation
  console.log('Testing system overview simulation:');
  try {
    const analyticsPromises = agents.map(async (agentId) => {
      try {
        const url = `${SSP_API_BASE}/analytics/${agentId}?userId=web-user&sessionId=web-session-${Date.now()}`;
        const response = await fetch(url);
        if (response.ok) {
          return await response.json();
        } else {
          return {
            agentId,
            totalExecutions: 0,
            successfulExecutions: 0,
            successRate: 0,
            avgExecutionTime: 0,
            uniqueSessions: 0,
            uniqueProcedures: 0,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.log(`Error fetching ${agentId}:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(analyticsPromises);
    const validResults = results.filter(r => r !== null);
    
    const totalExecutions = validResults.reduce((sum, a) => sum + a.totalExecutions, 0);
    const totalSuccessful = validResults.reduce((sum, a) => sum + a.successfulExecutions, 0);
    const weightedExecutionTime = validResults.reduce((sum, a) => sum + (a.avgExecutionTime * a.totalExecutions), 0);
    const activeAgents = validResults.filter(a => a.totalExecutions > 0).length;
    
    const overview = {
      totalExecutions,
      totalAgents: validResults.length,
      overallSuccessRate: totalExecutions > 0 ? totalSuccessful / totalExecutions : 0,
      avgExecutionTime: totalExecutions > 0 ? weightedExecutionTime / totalExecutions : 0,
      activeAgents,
    };

    console.log('System Overview Result:');
    console.log(`- Total Executions: ${overview.totalExecutions}`);
    console.log(`- Total Agents: ${overview.totalAgents}`);
    console.log(`- Success Rate: ${Math.round(overview.overallSuccessRate * 100)}%`);
    console.log(`- Avg Execution Time: ${Math.round(overview.avgExecutionTime)}ms`);
    console.log(`- Active Agents: ${overview.activeAgents}`);

    if (overview.totalExecutions === 0) {
      console.log('\n❌ ISSUE: System overview shows 0 executions');
      console.log('This explains why the dashboard shows all zeros');
    } else {
      console.log('\n✅ System overview looks correct');
    }

  } catch (error) {
    console.log(`❌ System overview failed: ${error.message}`);
  }
}

testSSPService().catch(console.error);