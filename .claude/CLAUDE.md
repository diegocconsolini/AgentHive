# CLAUDE.md

> Think carefully and implement the most concise solution that changes as little code as possible.

## USE SUB-AGENTS FOR CONTEXT OPTIMIZATION

### 1. Always use the file-analyzer sub-agent when asked to read files.
The file-analyzer agent is an expert in extracting and summarizing critical information from files, particularly log files and verbose outputs. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 2. Always use the code-analyzer sub-agent when asked to search code, analyze code, research bugs, or trace logic flow.

The code-analyzer agent is an expert in code analysis, logic tracing, and vulnerability detection. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 3. Always use the test-runner sub-agent to run tests and analyze the test results.

Using the test-runner agent ensures:

- Full test output is captured for debugging
- Main conversation stays clean and focused
- Context usage is optimized
- All issues are properly surfaced
- No approval dialogs interrupt the workflow

## Philosophy

### Error Handling

- **Fail fast** for critical configuration (missing text model)
- **Log and continue** for optional features (extraction model)
- **Graceful degradation** when external services unavailable
- **User-friendly messages** through resilience layer

### Testing

- Always use the test-runner agent to execute tests.
- Do not use mock services for anything ever.
- Do not move on to the next test until the current test is complete.
- If the test fails, consider checking if the test is structured correctly before deciding we need to refactor the codebase.
- Tests to be verbose so we can use them for debugging.
- **CRITICAL**: Always test actual system behavior, not just code analysis. Code review != runtime validation.

### System Validation

- **Runtime Testing Required**: Never claim "100% sure" based on code analysis alone
- **Integration Testing**: Components that work individually may fail when integrated
- **Data Structure Validation**: Ensure data types match between components (Arrays vs Sets)
- **Actual Execution**: Use Node.js direct execution for validation when Jest unavailable
- **Real Data Testing**: Test with actual production data (88 agents from JSON)


## Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
- Please tell me if there is a better approach than the one I am taking.
- Please tell me if there is a relevant standard or convention that I appear to be unaware of.
- Be skeptical.
- Be concise.
- Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
- Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
- Occasional pleasantries are fine.
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## ABSOLUTE RULES:

- NO PARTIAL IMPLEMENTATION
- NO SIMPLIFICATION : no "//This is simplified stuff for now, complete implementation would blablabla"
- NO CODE DUPLICATION : check existing codebase to reuse functions and constants Read files before writing new functions. Use common sense function name to find them easily.
- NO DEAD CODE : either use or delete from codebase completely
- IMPLEMENT TEST FOR EVERY FUNCTIONS
- NO CHEATER TESTS : test must be accurate, reflect real usage and be designed to reveal flaws. No useless tests! Design tests to be verbose so we can use them for debuging.
- NO INCONSISTENT NAMING - read existing codebase naming patterns.
- NO OVER-ENGINEERING - Don't add unnecessary abstractions, factory patterns, or middleware when simple functions would work. Don't think "enterprise" when you need "working"
- NO MIXED CONCERNS - Don't put validation logic inside API handlers, database queries inside UI components, etc. instead of proper separation
- NO RESOURCE LEAKS - Don't forget to close database connections, clear timeouts, remove event listeners, or clean up file handles

## VALIDATED ARCHITECTURE PATTERNS

### Agent Selection Algorithm - WORKING
- **Specialization Weight**: 35% (increased from 20%) ensures specialists beat generics
- **Capability Match**: 20% (reduced from 25%) prevents over-penalizing specialists
- **Key Insight**: Task requirements must match agent capabilities (don't require architecture-design for frontend tasks)

### Data Loading - VALIDATED  
- **Agent Registry**: Loads all 88 agents from `/agents-data.json` ✅
- **Capability Storage**: Arrays, not Sets (compatibility with CapabilityMatcher) ✅
- **Path Resolution**: `../../../../agents-data.json` from `src/agents/` directory ✅

### Configuration System - OPERATIONAL
- **AgentConfig**: Centralized configuration eliminates hardcoded values ✅  
- **Runtime Updates**: Supports configuration changes without restart ✅
- **Environment Overrides**: ENV vars > config file > defaults ✅

### Memory Architecture - IMPLEMENTED
- **AgentMemory**: Core memory model with interactions/knowledge ✅
- **StorageManager**: Hybrid filesystem + SQLite persistence ✅
- **MemoryManager**: Cross-agent knowledge sharing with LRU cache ✅
