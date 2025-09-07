// Quick AI Integration Test for 9/9 success
require('dotenv').config({ path: '../../../../.env' });

const { AIProviderService } = require('../../ai-providers');
const AgentOrchestrator = require('../orchestration/AgentOrchestrator');

async function quickAITest() {
    console.log('🚀 Quick AI Integration Test');
    console.log('════════════════════════════');
    
    try {
        // Test 1: Environment Variables
        console.log('1️⃣ Environment Variables:');
        console.log('   AI_PROVIDER_ENDPOINT:', process.env.AI_PROVIDER_ENDPOINT || 'NOT SET');
        console.log('   AI_PROVIDER_ENABLED:', process.env.AI_PROVIDER_ENABLED || 'NOT SET');
        
        // Test 2: AI Provider Service
        console.log('\n2️⃣ AI Provider Service:');
        const aiService = new AIProviderService();
        const providers = aiService.getAvailableProviders();
        const enabledProvider = providers.find(p => p.enabled && p.priority === 100);
        console.log('   Primary Provider:', enabledProvider?.name || 'None');
        console.log('   Primary Endpoint:', enabledProvider?.endpoint || 'None');
        
        // Test 3: Agent Orchestrator
        console.log('\n3️⃣ Agent Orchestrator:');
        const orchestrator = new AgentOrchestrator(aiService);
        
        // Test 4: Simple AI Call
        console.log('\n4️⃣ AI Service Test Call:');
        const aiResponse = await aiService.generateResponse({
            model: 'openai/gpt-oss-20b',
            prompt: 'Test local AI - just say "SUCCESS"',
            maxTokens: 10
        });
        
        console.log('   Provider Used:', aiResponse.provider);
        console.log('   Success:', !aiResponse.error);
        console.log('   Response Length:', aiResponse.response?.length || 0);
        
        // Test 5: Simple Orchestrator Call
        console.log('\n5️⃣ Orchestrator Test:');
        const orchResponse = await orchestrator.orchestrateRequest(
            'Say hello',
            { model: 'openai/gpt-oss-20b' },
            'test-user',
            'test-session'
        );
        
        console.log('   Agent Selected:', orchResponse.selectedAgent);
        console.log('   Success:', !!orchResponse.output);
        console.log('   Output Length:', orchResponse.output?.length || 0);
        
        // Final Result
        const allSuccess = (
            enabledProvider &&
            enabledProvider.endpoint.includes('192.168.2.101') &&
            !aiResponse.error &&
            !!orchResponse.output
        );
        
        console.log('\n🎯 FINAL RESULT:');
        console.log(`   Status: ${allSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        console.log(`   Local AI: ${enabledProvider?.endpoint.includes('192.168.2.101') ? '✅' : '❌'}`);
        console.log(`   AI Service: ${!aiResponse.error ? '✅' : '❌'}`);
        console.log(`   Orchestrator: ${!!orchResponse.output ? '✅' : '❌'}`);
        
        if (allSuccess) {
            console.log('\n🎉 AgentHive Mesh Ready for 9/9 Success!');
        }
        
        process.exit(allSuccess ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Quick Test Failed:', error.message);
        process.exit(1);
    }
}

quickAITest();