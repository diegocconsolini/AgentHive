# SSP (Stable Success Patterns) System Documentation

## Overview
The SSP System is AgentHive's advanced procedural memory and pattern recognition engine that automatically tracks, analyzes, and shares successful execution patterns across all 88 specialized agents.

## Key Features
- **🔄 Real-time Tracking**: Automatic recording of every agent execution
- **📊 Pattern Recognition**: Identifies successful procedure sequences  
- **🤝 Cross-agent Learning**: Shares patterns across all agents
- **⚡ Performance Analytics**: Tracks execution times and success rates
- **💾 Persistent Storage**: SQLite database for reliable data persistence
- **🔮 Success Prediction**: Predicts likelihood of procedure success

## System Architecture

### Core Components
1. **SSPService** (`/src/services/SSPService.js`) - Main service handling pattern detection
2. **Context Extensions** (`/src/models/Context.js`) - Procedure tracking metadata
3. **Database Schema** (`procedure_executions` table) - Persistent storage
4. **API Endpoints** (`/api/ssp/*`) - External access to SSP data

### Database Schema
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

## API Endpoints

### Get Agent Patterns
```http
GET /api/ssp/patterns/{agentId}
```
Returns successful patterns for a specific agent.

**Example:**
```bash
curl "http://localhost:4001/api/ssp/patterns/frontend-developer" | jq
```

### Predict Success
```http
POST /api/ssp/predict
```
Predicts success probability for a given context and procedure.

**Body:**
```json
{
  "contextId": "user-123",
  "agentId": "frontend-developer",
  "procedure": "create-component"
}
```

### Get Analytics
```http
GET /api/ssp/analytics/{agentId}
```
Returns performance analytics for an agent.

## Usage Examples

### Automatic Tracking
SSP automatically tracks every agent execution:

```bash
# Execute any agent - SSP tracks automatically
curl -X POST "http://localhost:4001/api/agents/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a React component", 
    "agentId": "frontend-developer",
    "userId": "user-123",
    "sessionId": "session-456"
  }'
```

### Check Recorded Data
```bash
# View all recorded executions
node check-ssp.js
```

### Query Patterns
```bash
# Get patterns for a specific agent
curl "http://localhost:4001/api/ssp/patterns/frontend-developer"

# Get performance analytics
curl "http://localhost:4001/api/ssp/analytics/frontend-developer"

# Predict success for a procedure
curl -X POST "http://localhost:4001/api/ssp/predict" \
  -H "Content-Type: application/json" \
  -d '{"contextId": "ctx-123", "agentId": "python-pro", "procedure": "code-generation"}'
```

## Implementation Details

### Execution Flow
1. **Agent Request** → `/api/agents/execute` 
2. **Execution** → `server.js.executeAgentViaProviders()`
3. **SSP Initialization** → On-demand service setup
4. **Recording** → `sspService.recordProcedureExecution()`
5. **Storage** → SQLite database persistence

### Key Files Modified
- `server.js` - Added SSP tracking in execution flow
- `src/services/SSPService.js` - Complete SSP service implementation  
- `src/models/Context.js` - Extended with SSP metadata
- `src/storage/database/SQLiteStorage.js` - Added procedure_executions table
- `src/orchestration/AgentOrchestrator.js` - SSP service initialization

### Monitoring & Logs
SSP operations are logged with distinct prefixes:
- `🔍 SSP Check:` - Service availability verification
- `✅ SSP Service initialized` - On-demand initialization
- `🔍 SSP Recording:` - Recording procedure execution  
- `✅ SSP recorded successfully` - Successful database storage

## Benefits

### For Developers
- **Automatic optimization**: System learns from successful patterns
- **Performance insights**: Execution time trends and bottlenecks
- **Reliability prediction**: Success probability for procedures

### For Agents  
- **Shared intelligence**: Learn from other agents' successful patterns
- **Contextual optimization**: Better performance based on similar contexts
- **Continuous improvement**: Self-optimizing execution strategies

### For Users
- **Better results**: Improved success rates from learned patterns
- **Faster responses**: Optimized execution based on historical data
- **Predictable performance**: Success likelihood estimation

## Current Status ✅
- **Database**: 2+ executions recorded and growing
- **Tracking**: All agent executions automatically captured
- **APIs**: All endpoints operational and tested
- **Performance**: Real-time pattern detection working
- **Cross-agent Learning**: Patterns shared across agent ecosystem

## Verification Commands
```bash
# Check system status
curl "http://localhost:4001/api/status" | jq

# View recorded executions  
node check-ssp.js

# Test agent execution with SSP tracking
curl -X POST "http://localhost:4001/api/agents/execute" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test", "agentId": "frontend-developer", "userId": "test"}'

# Verify SSP APIs
curl "http://localhost:4001/api/ssp/patterns/frontend-developer" | jq
curl "http://localhost:4001/api/ssp/analytics/frontend-developer" | jq
```

The SSP system represents a significant advancement in AI agent orchestration, providing automated learning and optimization capabilities that improve over time through real usage patterns.