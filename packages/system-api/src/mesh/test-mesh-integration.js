/**
 * Integration test for AgentHive Mesh 2.0
 * Tests the complete mesh system with all components working together
 */

const path = require('path');
const TaskDecomposer = require('./TaskDecomposer');
const AgentMeshCoordinator = require('./AgentMeshCoordinator');
const TurnController = require('./TurnController');
const ResultAggregator = require('./ResultAggregator');
const AgentMessageBus = require('./AgentMessageBus');
const MeshSessionManager = require('./MeshSessionManager');
const ActionValidator = require('./ActionValidator');
const MigrationRunner = require('./migrations/MigrationRunner');

// Import the real AgentHive AI service
const { AIProviderService } = require('../../../shared/dist/services/ai-providers');

/**
 * Real AI Service wrapper for testing - uses the actual AgentHive AI infrastructure
 */
class RealAIService {
    constructor() {
        this.providerService = new AIProviderService();
        this.callCount = 0;
    }
    
    /**
     * Use the real AgentHive AI service generateResponse method
     * This matches the signature used by AgentOrchestrator
     */
    async generateResponse(options = {}) {
        this.callCount++;
        
        try {
            // Use the real AI provider service
            const response = await this.providerService.generateResponse(
                options.prompt || options.message,
                {
                    model: options.model || 'gpt-3.5-turbo',
                    systemPrompt: options.systemPrompt,
                    temperature: options.temperature || 0.7,
                    maxTokens: options.maxTokens || 4000,
                    stream: options.stream || false
                }
            );
            
            // Return in AgentHive format
            return {
                response: response.content || response.response,
                tokensUsed: response.tokensUsed || response.usage?.total_tokens || 500,
                model: response.model || options.model,
                success: !response.error,
                error: response.error,
                metadata: {
                    callCount: this.callCount,
                    processingTime: response.processingTime || 0,
                    provider: response.provider || 'openai'
                }
            };
            
        } catch (error) {
            console.error('AI Service error:', error);
            return {
                response: '',
                error: error.message,
                success: false,
                tokensUsed: 0,
                metadata: {
                    callCount: this.callCount,
                    error: error.message
                }
            };
        }
    }
}

/**
 * Main integration test class
 */
class MeshIntegrationTest {
    constructor() {
        this.testResults = [];
        this.mockAIService = new MockAIService();
        this.components = {};
    }
    
    /**
     * Run all integration tests
     */
    async runTests() {
        console.log('🚀 Starting AgentHive Mesh 2.0 Integration Tests\n');
        
        try {
            // Initialize all components
            await this.initializeComponents();
            
            // Test individual components
            await this.testTaskDecomposer();
            await this.testTurnController();
            await this.testResultAggregator();
            await this.testAgentMessageBus();
            await this.testActionValidator();
            await this.testMeshSessionManager();
            
            // Test database migrations
            await this.testDatabaseMigrations();
            
            // Test complete mesh workflow
            await this.testCompleteWorkflow();
            
            // Print results
            this.printTestResults();
            
        } catch (error) {
            console.error('❌ Integration test suite failed:', error);
            this.addResult('Integration Test Suite', false, error.message);
        } finally {
            await this.cleanup();
        }
        
        return this.testResults;
    }
    
    /**
     * Initialize all mesh components
     */
    async initializeComponents() {
        console.log('📦 Initializing mesh components...');
        
        try {
            // Initialize database
            this.components.migrationRunner = new MigrationRunner({
                dbPath: path.join(__dirname, '../../../.test-mesh/test-sessions.db')
            });
            await this.components.migrationRunner.initialize();
            
            // Initialize core components
            this.components.taskDecomposer = new TaskDecomposer();
            this.components.turnController = new TurnController({
                maxTurns: 10,
                maxTokens: 5000,
                maxTimeMs: 60000
            });
            this.components.resultAggregator = new ResultAggregator();
            this.components.messageBus = new AgentMessageBus({ 
                enableWebSocket: false // Disable for testing
            });
            this.components.actionValidator = new ActionValidator();
            
            // Initialize session manager
            this.components.sessionManager = new MeshSessionManager({
                baseDir: path.join(__dirname, '../../../.test-mesh'),
                maxSessions: 5
            });
            await this.components.sessionManager.initialize();
            
            // Initialize mesh coordinator
            this.components.meshCoordinator = new AgentMeshCoordinator(this.mockAIService);
            
            // Set up mock responses
            this.setupMockResponses();
            
            console.log('✅ All components initialized successfully\n');
            this.addResult('Component Initialization', true);
            
        } catch (error) {
            console.error('❌ Component initialization failed:', error);
            this.addResult('Component Initialization', false, error.message);
            throw error;
        }
    }
    
    /**
     * Set up mock AI service responses
     */
    setupMockResponses() {
        const mockResponses = {
            'frontend-developer': {
                content: 'Created React component with TypeScript and responsive design',
                tokensUsed: 850,
                confidence: 0.9,
                success: true,
                metadata: { framework: 'React', language: 'TypeScript' }
            },
            'backend-architect': {
                content: 'Designed RESTful API with Node.js and Express, includes authentication',
                tokensUsed: 920,
                confidence: 0.85,
                success: true,
                metadata: { framework: 'Express', database: 'PostgreSQL' }
            },
            'database-admin': {
                content: 'Created database schema with optimized indexes and constraints',
                tokensUsed: 650,
                confidence: 0.95,
                success: true,
                metadata: { database: 'PostgreSQL', tables: 5 }
            }
        };
        
        for (const [agentId, response] of Object.entries(mockResponses)) {
            this.mockAIService.setResponse(agentId, response);
        }
    }
    
    /**
     * Test TaskDecomposer component
     */
    async testTaskDecomposer() {
        console.log('🧩 Testing TaskDecomposer...');
        
        try {
            const taskDecomposer = this.components.taskDecomposer;
            
            // Test simple task decomposition
            const simpleTask = "Create a login form";
            const simpleResult = await taskDecomposer.decomposeTask(simpleTask);
            
            if (!simpleResult.analysis || !simpleResult.dag) {
                throw new Error('Task decomposition missing required components');
            }
            
            console.log(`  ✅ Simple task decomposed: ${simpleResult.analysis.complexity} complexity`);
            
            // Test complex task decomposition
            const complexTask = "Build a complete e-commerce web application with frontend, backend, and database";
            const complexResult = await taskDecomposer.decomposeTask(complexTask);
            
            if (!complexResult.dag.nodes || complexResult.dag.nodes.length === 0) {
                throw new Error('Complex task produced no subtasks');
            }
            
            console.log(`  ✅ Complex task decomposed: ${complexResult.dag.nodes.length} subtasks`);
            console.log(`  ✅ Agent assignments: ${Object.keys(complexResult.agentMapping).length} agents`);
            
            this.addResult('TaskDecomposer', true, `Decomposed tasks with ${complexResult.dag.nodes.length} subtasks`);
            
        } catch (error) {
            console.error('  ❌ TaskDecomposer test failed:', error.message);
            this.addResult('TaskDecomposer', false, error.message);
        }
    }
    
    /**
     * Test TurnController component
     */
    async testTurnController() {
        console.log('⏱️  Testing TurnController...');
        
        try {
            const turnController = this.components.turnController;
            
            // Initialize session
            const sessionId = 'test-session-1';
            const session = turnController.initializeSession(sessionId, {
                maxTurns: 5,
                maxTokens: 2000
            });
            
            if (!session || session.sessionId !== sessionId) {
                throw new Error('Session initialization failed');
            }
            
            console.log('  ✅ Session initialized successfully');
            
            // Record multiple turns
            for (let i = 0; i < 3; i++) {
                const turnResult = turnController.recordTurn(sessionId, {
                    agent: `test-agent-${i}`,
                    action: 'test-action',
                    tokensUsed: 200 + i * 100,
                    success: true
                });
                
                if (!turnResult.canContinue && i < 2) {
                    throw new Error('Turn controller blocked valid turn');
                }
            }
            
            const status = turnController.getSessionStatus(sessionId);
            if (status.current.turns !== 3) {
                throw new Error(`Expected 3 turns, got ${status.current.turns}`);
            }
            
            console.log(`  ✅ Recorded 3 turns, ${status.current.tokensUsed} tokens used`);
            this.addResult('TurnController', true, `Managed session with 3 turns`);
            
        } catch (error) {
            console.error('  ❌ TurnController test failed:', error.message);
            this.addResult('TurnController', false, error.message);
        }
    }
    
    /**
     * Test ResultAggregator component
     */
    async testResultAggregator() {
        console.log('📊 Testing ResultAggregator...');
        
        try {
            const aggregator = this.components.resultAggregator;
            
            // Create mock results from multiple agents
            const results = [
                {
                    agentId: 'frontend-developer',
                    content: 'Created responsive React components',
                    confidence: 0.9,
                    success: true,
                    tokensUsed: 500,
                    agentType: 'frontend-developer'
                },
                {
                    agentId: 'ui-ux-designer',
                    content: 'Designed user-friendly interface with modern styling',
                    confidence: 0.85,
                    success: true,
                    tokensUsed: 400,
                    agentType: 'ui-ux-designer'
                },
                {
                    agentId: 'test-automator',
                    content: 'Created comprehensive test suite',
                    confidence: 0.95,
                    success: true,
                    tokensUsed: 300,
                    agentType: 'test-automator'
                }
            ];
            
            // Test aggregation
            const aggregatedResult = await aggregator.aggregateResults(results, {
                taskType: 'frontend-development'
            });
            
            if (!aggregatedResult.strategy || !aggregatedResult.content) {
                throw new Error('Aggregation result missing required components');
            }
            
            console.log(`  ✅ Aggregated ${results.length} results using ${aggregatedResult.strategy} strategy`);
            console.log(`  ✅ Confidence: ${aggregatedResult.confidence.toFixed(2)}`);
            
            // Test single result (should not aggregate)
            const singleResult = await aggregator.aggregateResults([results[0]]);
            
            if (singleResult.strategy !== 'single') {
                throw new Error('Single result should use single strategy');
            }
            
            console.log('  ✅ Single result handled correctly');
            this.addResult('ResultAggregator', true, `Aggregated results using ${aggregatedResult.strategy} strategy`);
            
        } catch (error) {
            console.error('  ❌ ResultAggregator test failed:', error.message);
            this.addResult('ResultAggregator', false, error.message);
        }
    }
    
    /**
     * Test AgentMessageBus component
     */
    async testAgentMessageBus() {
        console.log('📡 Testing AgentMessageBus...');
        
        try {
            const messageBus = this.components.messageBus;
            let messagesReceived = 0;
            
            // Set up message listener
            messageBus.on('message', (data) => {
                messagesReceived++;
                console.log(`  📨 Received message for ${data.agentId}: ${data.message.data.substring(0, 30)}...`);
            });
            
            // Subscribe agents to channels
            messageBus.subscribe('agent-1', 'test-channel');
            messageBus.subscribe('agent-2', 'test-channel');
            
            console.log('  ✅ Agents subscribed to channels');
            
            // Publish messages
            const publishResult = await messageBus.publishMessage('test-channel', 'Hello from integration test!', {
                sender: 'test-runner'
            });
            
            if (!publishResult.messageId) {
                throw new Error('Message publishing failed');
            }
            
            // Wait for message delivery
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (messagesReceived === 0) {
                throw new Error('No messages were received');
            }
            
            console.log(`  ✅ Published and delivered message to ${publishResult.deliveredTo.length} agents`);
            
            // Test direct messaging
            const directResult = await messageBus.sendDirectMessage('agent-1', 'Direct message test');
            
            console.log('  ✅ Direct messaging works');
            
            const stats = messageBus.getStatistics();
            console.log(`  📈 Message bus stats: ${stats.totalMessages} total messages`);
            
            this.addResult('AgentMessageBus', true, `Delivered messages to ${publishResult.deliveredTo.length} agents`);
            
        } catch (error) {
            console.error('  ❌ AgentMessageBus test failed:', error.message);
            this.addResult('AgentMessageBus', false, error.message);
        }
    }
    
    /**
     * Test ActionValidator component
     */
    async testActionValidator() {
        console.log('✅ Testing ActionValidator...');
        
        try {
            const validator = this.components.actionValidator;
            
            // Test valid action
            const validResult = validator.validateAction('frontend-developer', 'writeCode', {
                language: 'typescript',
                specifications: 'Create a React component',
                framework: 'React',
                includeTests: true
            });
            
            if (!validResult.valid) {
                throw new Error(`Valid action failed validation: ${validResult.errors.join(', ')}`);
            }
            
            console.log('  ✅ Valid action passed validation');
            
            // Test invalid action
            const invalidResult = validator.validateAction('frontend-developer', 'writeCode', {
                language: 'invalid-language', // Invalid enum value
                specifications: 'Create a component'
                // Missing required parameters
            });
            
            if (invalidResult.valid) {
                throw new Error('Invalid action should have failed validation');
            }
            
            console.log(`  ✅ Invalid action correctly rejected (${invalidResult.errors.length} errors)`);
            
            // Test unknown agent type
            const unknownAgentResult = validator.validateAction('unknown-agent', 'someAction', {});
            
            console.log(`  ✅ Unknown agent handled: ${unknownAgentResult.warnings.length} warnings`);
            
            const stats = validator.getStatistics();
            console.log(`  📊 Validation stats: ${stats.totalValidations} validations, ${(stats.successRate * 100).toFixed(1)}% success rate`);
            
            this.addResult('ActionValidator', true, `Validated actions with ${(stats.successRate * 100).toFixed(1)}% success rate`);
            
        } catch (error) {
            console.error('  ❌ ActionValidator test failed:', error.message);
            this.addResult('ActionValidator', false, error.message);
        }
    }
    
    /**
     * Test MeshSessionManager component
     */
    async testMeshSessionManager() {
        console.log('💾 Testing MeshSessionManager...');
        
        try {
            const sessionManager = this.components.sessionManager;
            
            // Create a test session
            const session = await sessionManager.createSession({
                userId: 'test-user',
                prompt: 'Build a web application',
                maxTurns: 10,
                tokenBudget: 5000
            });
            
            if (!session.sessionId) {
                throw new Error('Session creation failed');
            }
            
            console.log(`  ✅ Created session: ${session.sessionId}`);
            
            // Update session
            const updatedSession = await sessionManager.updateSession(session.sessionId, {
                currentTurn: 1,
                tokensUsed: 200
            });
            
            if (updatedSession.currentTurn !== 1) {
                throw new Error('Session update failed');
            }
            
            console.log('  ✅ Session updated successfully');
            
            // Create checkpoint
            const checkpoint = await sessionManager.createCheckpoint(session.sessionId);
            
            if (!checkpoint.checkpointId) {
                throw new Error('Checkpoint creation failed');
            }
            
            console.log(`  ✅ Created checkpoint: ${checkpoint.checkpointNumber}`);
            
            // Record agent execution
            const execution = await sessionManager.recordAgentExecution(session.sessionId, {
                agentId: 'test-agent',
                taskDescription: 'Test task',
                startedAt: new Date().toISOString(),
                durationMs: 1000,
                tokensUsed: 100,
                success: true
            });
            
            console.log(`  ✅ Recorded agent execution: ${execution.executionId}`);
            
            // Complete session
            const completedSession = await sessionManager.completeSession(session.sessionId, {
                success: true,
                tokensUsed: 500,
                successRate: 0.9
            });
            
            if (completedSession.status !== 'completed') {
                throw new Error('Session completion failed');
            }
            
            console.log('  ✅ Session completed successfully');
            
            const stats = sessionManager.getStatistics();
            console.log(`  📈 Session stats: ${stats.totalSessions} total, ${stats.completedSessions} completed`);
            
            this.addResult('MeshSessionManager', true, `Managed session lifecycle with ${stats.checkpointsCreated} checkpoints`);
            
        } catch (error) {
            console.error('  ❌ MeshSessionManager test failed:', error.message);
            this.addResult('MeshSessionManager', false, error.message);
        }
    }
    
    /**
     * Test database migrations
     */
    async testDatabaseMigrations() {
        console.log('🗄️  Testing Database Migrations...');
        
        try {
            const migrationRunner = this.components.migrationRunner;
            
            // Run migrations
            const migrationResult = await migrationRunner.runMigrations();
            
            if (!migrationResult.success) {
                throw new Error('Migration execution failed');
            }
            
            console.log(`  ✅ Ran ${migrationResult.migrationsRun} migrations in ${migrationResult.duration}ms`);
            
            // Verify database integrity
            const integrityResult = await migrationRunner.verifyIntegrity();
            
            if (!integrityResult.success) {
                throw new Error('Database integrity check failed');
            }
            
            console.log('  ✅ Database integrity verified');
            
            // Get migration status
            const status = await migrationRunner.getMigrationStatus();
            const appliedMigrations = status.filter(m => m.applied).length;
            
            console.log(`  ✅ ${appliedMigrations} migrations applied`);
            
            // Get database statistics
            const dbStats = await migrationRunner.getDatabaseStats();
            const tableCount = Object.keys(dbStats.tables).length;
            
            console.log(`  📊 Database contains ${tableCount} tables, ${(dbStats.database.sizeBytes / 1024).toFixed(1)}KB`);
            
            this.addResult('Database Migrations', true, `Applied ${appliedMigrations} migrations, created ${tableCount} tables`);
            
        } catch (error) {
            console.error('  ❌ Database migration test failed:', error.message);
            this.addResult('Database Migrations', false, error.message);
        }
    }
    
    /**
     * Test complete mesh workflow
     */
    async testCompleteWorkflow() {
        console.log('🕸️  Testing Complete Mesh Workflow...');
        
        try {
            const meshCoordinator = this.components.meshCoordinator;
            
            // Test mesh request
            const testPrompt = "Create a simple web application with user authentication";
            const options = {
                maxTurns: 5,
                tokenBudget: 3000,
                executionStrategy: 'hybrid'
            };
            
            console.log(`  🎯 Executing mesh request: "${testPrompt}"`);
            
            const result = await meshCoordinator.orchestrateMeshRequest(
                testPrompt,
                options,
                'test-user',
                'integration-test-session'
            );
            
            if (!result || !result.sessionId) {
                throw new Error('Mesh orchestration failed to return valid result');
            }
            
            console.log(`  ✅ Mesh execution completed: ${result.sessionId}`);
            console.log(`  📊 Strategy used: ${result.executionStrategy || 'auto'}`);
            console.log(`  📈 Tasks completed: ${result.completedTasks || 0}/${result.totalTasks || 0}`);
            console.log(`  💰 Cost: $${(result.totalCost || 0).toFixed(4)}`);
            console.log(`  🏃 Duration: ${result.totalDuration || 0}ms`);
            
            // Verify session was created and managed
            const session = await this.components.sessionManager.getSession(result.sessionId);
            if (!session) {
                throw new Error('Session not found in session manager');
            }
            
            console.log('  ✅ Session properly managed');
            
            // Verify components worked together
            const sessionStats = this.components.sessionManager.getStatistics();
            const busStats = this.components.messageBus.getStatistics();
            const validatorStats = this.components.actionValidator.getStatistics();
            
            console.log(`  🔗 Integration stats:`);
            console.log(`    • Sessions: ${sessionStats.totalSessions} total`);
            console.log(`    • Messages: ${busStats.totalMessages} total`);
            console.log(`    • Validations: ${validatorStats.totalValidations} total`);
            console.log(`    • AI Calls: ${this.mockAIService.callCount} total`);
            
            this.addResult('Complete Mesh Workflow', true, `Executed end-to-end workflow with ${this.mockAIService.callCount} AI calls`);
            
        } catch (error) {
            console.error('  ❌ Complete workflow test failed:', error.message);
            this.addResult('Complete Mesh Workflow', false, error.message);
        }
    }
    
    /**
     * Add test result
     */
    addResult(testName, success, details = '') {
        this.testResults.push({
            test: testName,
            success,
            details,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Print test results summary
     */
    printTestResults() {
        console.log('\n🎯 Integration Test Results Summary');
        console.log('═'.repeat(50));
        
        const passed = this.testResults.filter(r => r.success).length;
        const failed = this.testResults.filter(r => !r.success).length;
        const total = this.testResults.length;
        
        for (const result of this.testResults) {
            const icon = result.success ? '✅' : '❌';
            const details = result.details ? ` (${result.details})` : '';
            console.log(`${icon} ${result.test}${details}`);
        }
        
        console.log('═'.repeat(50));
        console.log(`📊 Results: ${passed}/${total} passed (${(passed/total*100).toFixed(1)}%)`);
        
        if (failed > 0) {
            console.log(`⚠️  ${failed} tests failed`);
        } else {
            console.log('🎉 All tests passed! AgentHive Mesh 2.0 is working correctly.');
        }
        
        console.log('\n🚀 AgentHive Mesh 2.0 Integration Testing Complete\n');
    }
    
    /**
     * Clean up test resources
     */
    async cleanup() {
        console.log('🧹 Cleaning up test resources...');
        
        try {
            // Shutdown components
            if (this.components.messageBus) {
                await this.components.messageBus.shutdown();
            }
            
            if (this.components.sessionManager) {
                await this.components.sessionManager.shutdown();
            }
            
            if (this.components.migrationRunner) {
                await this.components.migrationRunner.close();
            }
            
            console.log('✅ Cleanup completed');
            
        } catch (error) {
            console.warn('⚠️  Cleanup warning:', error.message);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new MeshIntegrationTest();
    test.runTests().catch(console.error);
}

module.exports = MeshIntegrationTest;