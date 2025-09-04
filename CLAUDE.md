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

### Key Algorithms - WORKING
- **Specialization Scoring**: Prevents SEO agents for dev tasks (Frontend=1.0, SEO=0.0) ✅
- **Weight Distribution**: `specializationMatch: 35%`, `capabilityMatch: 20%` ✅
- **Task Requirements**: Match agent capabilities (avoid over-restrictive requirements) ✅

## Testing

**CRITICAL**: Always test actual system behavior, not just code analysis
- Use test-runner agent for comprehensive test execution
- Runtime validation required - code review ≠ runtime reality  
- Test with real data (88 agents from JSON)
- Validate integration points between components
- `npm test` or direct Node.js execution when Jest unavailable

## Code Style

Follow existing patterns in the codebase:
- Arrays for capabilities storage (not Sets - compatibility issue)
- Configuration-driven behavior (no hardcoded values)
- Proper error handling with graceful degradation
- Memory management with resource cleanup
