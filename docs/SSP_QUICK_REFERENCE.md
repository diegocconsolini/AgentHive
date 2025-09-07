# SSP (Stable Success Patterns) Quick Reference

## Overview
SSP automatically tracks every agent execution to learn successful patterns and optimize future performance.

## Key Concepts
- **Procedure Execution** - Any agent task (create component, debug code, analyze data)
- **Success Pattern** - Sequence of successful procedures that can be repeated  
- **Context** - User session, agent type, and execution environment
- **Pattern Recognition** - AI identifies what makes procedures successful

## API Endpoints

### Get Agent Patterns
```http
GET /api/ssp/patterns/{agentId}
```
Returns successful patterns for a specific agent.

### Get Performance Analytics  
```http
GET /api/ssp/analytics/{agentId}
```
Returns execution statistics and performance metrics.

### Predict Success
```http
POST /api/ssp/predict
Content-Type: application/json

{
  "contextId": "user-session-123",
  "agentId": "frontend-developer", 
  "procedure": "component-creation"
}
```

## Usage Examples

### Check System Status
```bash
# View all recorded executions
node check-ssp.js

# Check specific agent patterns
curl "http://localhost:4001/api/ssp/patterns/frontend-developer" | jq

# Get performance analytics  
curl "http://localhost:4001/api/ssp/analytics/python-pro" | jq
```

### Execute Agent (Auto-tracked)
```bash
curl -X POST "http://localhost:4001/api/agents/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a React button component",
    "agentId": "frontend-developer",
    "userId": "developer-123",
    "sessionId": "coding-session-456"
  }'
```
☝️ **This execution is automatically tracked by SSP**

## Frontend Integration

### JavaScript/TypeScript
```typescript
// Get agent analytics
async function getAgentAnalytics(agentId: string) {
  const response = await fetch(`/api/ssp/analytics/${agentId}`);
  return response.json();
}

// Predict success probability
async function predictSuccess(contextId: string, agentId: string, procedure: string) {
  const response = await fetch('/api/ssp/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contextId, agentId, procedure })
  });
  return response.json();
}

// Execute agent with tracking
async function executeAgent(prompt: string, agentId: string, userId: string) {
  const response = await fetch('/api/agents/execute', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      prompt, 
      agentId, 
      userId, 
      sessionId: `session-${Date.now()}` 
    })
  });
  // SSP automatically tracks this execution
  return response.json();
}
```

### React Components
```tsx
import React, { useState, useEffect } from 'react';

function AgentAnalytics({ agentId }: { agentId: string }) {
  const [analytics, setAnalytics] = useState(null);
  
  useEffect(() => {
    async function loadAnalytics() {
      const data = await fetch(`/api/ssp/analytics/${agentId}`);
      setAnalytics(await data.json());
    }
    loadAnalytics();
  }, [agentId]);

  return (
    <div className="agent-analytics">
      <h3>📊 {agentId} Performance</h3>
      {analytics && (
        <div>
          <p>Success Rate: {analytics.successRate}%</p>
          <p>Avg Duration: {analytics.avgDuration}ms</p>
          <p>Total Executions: {analytics.totalExecutions}</p>
        </div>
      )}
    </div>
  );
}

function AgentExecutor() {
  const [result, setResult] = useState(null);
  
  async function handleExecute(prompt: string, agentId: string) {
    // This execution will be automatically tracked by SSP
    const response = await fetch('/api/agents/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        agentId, 
        userId: 'current-user',
        sessionId: `session-${Date.now()}`
      })
    });
    
    const data = await response.json();
    setResult(data);
    
    // SSP has now recorded this execution for future optimization
    console.log('✅ Execution tracked by SSP automatically');
  }

  return (
    <div>
      <button onClick={() => handleExecute('Create navbar', 'frontend-developer')}>
        Execute Frontend Agent
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

## Database Schema
```sql
CREATE TABLE procedure_executions (
  id TEXT PRIMARY KEY,
  context_id TEXT NOT NULL,
  agent_id TEXT,
  session_id TEXT, 
  success INTEGER NOT NULL,
  execution_time INTEGER,
  pattern_id TEXT,
  created_at INTEGER NOT NULL
);
```

## Monitoring & Logs
SSP operations appear in server logs with these prefixes:
- `🔍 SSP Check:` - Service initialization check
- `✅ SSP Service initialized` - On-demand service setup  
- `🔍 SSP Recording:` - Recording execution data
- `✅ SSP recorded successfully` - Database storage complete

## Benefits for Frontend Development
- **Automatic optimization** - No manual tracking required
- **Performance insights** - See which components/patterns work best  
- **Predictive success** - Know likelihood of success before execution
- **Cross-team learning** - Learn from successful patterns by other developers
- **Real-time analytics** - Monitor agent performance in dashboards

## Current Status ✅
- **Database**: Live with real execution data
- **Auto-tracking**: Every agent execution recorded
- **APIs**: All endpoints operational  
- **Learning**: Pattern recognition active
- **Performance**: Real-time analytics available

SSP runs transparently in the background, making AgentHive smarter with every execution.