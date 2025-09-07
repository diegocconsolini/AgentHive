# CLAUDE.md - AgentHive Platform

> Think carefully and implement the most concise solution that changes as little code as possible.

## Project Overview

**AgentHive** is an AI agent orchestration platform managing **88 specialized agents** for comprehensive task automation. The system features intelligent agent selection, persistent memory, and configuration-driven behavior.

## System Architecture Status ✅

### Core Components - VALIDATED
- **Agent Registry**: Loads all 88 agents from `agents-data.json` ✅
- **Agent Selection**: Specialization-weighted algorithm (35% specialization weight) ✅  
- **Configuration System**: Centralized config eliminates hardcoded values ✅
- **Memory Architecture**: Persistent agent memory with cross-agent knowledge sharing ✅
- **Capability Matching**: Array-based compatibility with comprehensive scoring ✅
- **SSP System**: Stable Success Patterns tracking and learning from executions ✅
- **Frontend Integration**: Real-time SSP visibility across dashboard, analytics, and agent management ✅

### Key Algorithms - WORKING
- **Specialization Scoring**: Prevents SEO agents for dev tasks (Frontend=1.0, SEO=0.0) ✅
- **Weight Distribution**: `specializationMatch: 35%`, `capabilityMatch: 20%` ✅
- **Task Requirements**: Match agent capabilities (avoid over-restrictive requirements) ✅
- **SSP Pattern Recognition**: AI identifies successful execution sequences and shares across agents ✅
- **Real-time Analytics**: Live data integration with 30-second refresh intervals ✅

## Testing

**CRITICAL**: Always test actual system behavior, not just code analysis
- Use test-runner agent for comprehensive test execution
- Runtime validation required - code review ≠ runtime reality  
- Test with real data (88 agents from JSON)
- Validate integration points between components
- `npm test` or direct Node.js execution when Jest unavailable

## SSP (Stable Success Patterns) System ✅

### Current Status - PRODUCTION READY
- **Database**: SQLite with `procedure_executions` table recording real agent executions ✅
- **API Endpoints**: 3 SSP endpoints (`/api/ssp/*`) operational with live data ✅
- **Auto-tracking**: Every agent execution automatically recorded in real-time ✅
- **Pattern Recognition**: AI identifies successful sequences and shares across agents ✅
- **Frontend Visibility**: Complete UI integration across dashboard, analytics, and agent management ✅

### Live Data (Verified)
```bash
📊 Current executions: 2+ and growing
• frontend-developer: 1 execution, 26.9s, success=true
• python-pro: 1 execution, 3.6s, success=true
```

### Frontend Integration Points
- **Dashboard**: SSP metrics card with real-time data and click-through navigation
- **Analytics Page**: Dedicated "Success Patterns" tab with comprehensive agent breakdown
- **Agent Management**: Performance badges on agent cards showing success rates and timing
- **Auto-refresh**: 30-second intervals maintain live data across all components

### Configuration
- **SYSTEM_API_URL**: `http://localhost:4001` (configured in shared/env.ts)
- **API Base**: `${SYSTEM_API_URL}/api/ssp` for all SSP endpoints
- **Authentication**: Uses existing localStorage auth tokens
- **Error Handling**: Graceful degradation with fallback states

## Starting the Application

**IMPORTANT**: Always use the root-level npm script, not individual service scripts.

```bash
# CORRECT: Start all services together
npm run dev

# WRONG: Starting individual services manually
cd packages/system-api && node server.js  # ❌ Don't do this
cd packages/user-api && npm run dev       # ❌ Don't do this
```

### Service Startup Verification
When properly started with `npm run dev`, you should see:
- ✅ **System API (port 4001)**: 88 agents loaded, AI orchestration ready
- ✅ **User API (port 4000)**: GraphQL server with SQLite database
- ✅ **Web Dashboard (port 3000)**: Vite React app ready
- ✅ **SSP System**: Analytics endpoints active with real-time data

### Access Points
- **Web Dashboard**: http://localhost:3000 (Main UI)
- **GraphQL Playground**: http://localhost:4000/graphql (User API)
- **Health Checks**: 
  - User API: http://localhost:4000/health
  - System API: http://localhost:4001/health
- **System Status**: http://localhost:4001/api/status

## Code Style

Follow existing patterns in the codebase:
- Arrays for capabilities storage (not Sets - compatibility issue)
- Configuration-driven behavior (no hardcoded values)
- Proper error handling with graceful degradation
- Memory management with resource cleanup
- **SSP Integration**: Use existing hooks and services for real-time data fetching
