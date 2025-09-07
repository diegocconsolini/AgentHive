const EventEmitter = require('events');

/**
 * ResultAggregator combines outputs from multiple agents using various strategies
 * Handles conflict resolution, quality scoring, and output formatting
 */
class ResultAggregator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Aggregation strategies configuration
        this.strategies = {
            consensus: {
                enabled: true,
                minAgreement: options.consensusThreshold || 0.7,
                conflictResolution: 'majority'
            },
            voting: {
                enabled: true,
                weightByQuality: options.weightByQuality !== false,
                weightBySpecialization: options.weightBySpecialization !== false
            },
            synthesis: {
                enabled: true,
                combineStrategy: options.combineStrategy || 'merge',
                preserveIndividual: options.preserveIndividual !== false
            },
            sequential: {
                enabled: true,
                preserveOrder: true,
                allowOverrides: options.allowOverrides !== false
            }
        };
        
        // Quality scoring weights
        this.qualityWeights = {
            completeness: 0.3,
            accuracy: 0.25,
            relevance: 0.2,
            coherence: 0.15,
            efficiency: 0.1
        };
        
        // Result cache for optimization
        this.resultCache = new Map();
        this.maxCacheSize = options.maxCacheSize || 1000;
        
        console.log('ResultAggregator initialized with strategies:', Object.keys(this.strategies));
    }
    
    /**
     * Main aggregation method - determines best strategy and executes
     */
    async aggregateResults(results, context = {}) {
        if (!results || results.length === 0) {
            throw new Error('No results provided for aggregation');
        }
        
        if (results.length === 1) {
            return this.formatSingleResult(results[0], context);
        }
        
        console.log(`Aggregating ${results.length} results using context:`, {
            strategy: context.strategy,
            taskType: context.taskType,
            requireConsensus: context.requireConsensus
        });
        
        // Validate and prepare results
        const validResults = await this.validateResults(results);
        if (validResults.length === 0) {
            throw new Error('No valid results after validation');
        }
        
        // Calculate quality scores for all results
        const scoredResults = await this.scoreResults(validResults, context);
        
        // Determine optimal aggregation strategy
        const strategy = this.determineStrategy(scoredResults, context);
        
        // Execute aggregation
        const aggregatedResult = await this.executeStrategy(strategy, scoredResults, context);
        
        // Cache result for potential reuse
        this.cacheResult(scoredResults, aggregatedResult, context);
        
        this.emit('results-aggregated', {
            inputCount: results.length,
            validCount: validResults.length,
            strategy: strategy,
            finalResult: aggregatedResult
        });
        
        return aggregatedResult;
    }
    
    /**
     * Validate results structure and content
     */
    async validateResults(results) {
        const validResults = [];
        
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const validation = this.validateSingleResult(result);
            
            if (validation.isValid) {
                validResults.push({
                    ...result,
                    index: i,
                    validation
                });
            } else {
                console.warn(`Result ${i} failed validation:`, validation.errors);
            }
        }
        
        return validResults;
    }
    
    /**
     * Validate a single result structure
     */
    validateSingleResult(result) {
        const errors = [];
        
        // Required fields
        if (!result.agentId) errors.push('Missing agentId');
        if (!result.content && !result.data) errors.push('Missing content or data');
        
        // Type validation
        if (result.timestamp && !Date.parse(result.timestamp)) {
            errors.push('Invalid timestamp format');
        }
        
        if (result.confidence && (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1)) {
            errors.push('Confidence must be number between 0 and 1');
        }
        
        // Content validation
        if (result.content) {
            if (typeof result.content === 'string' && result.content.trim().length === 0) {
                errors.push('Empty content string');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            score: Math.max(0, 1 - (errors.length * 0.2))
        };
    }
    
    /**
     * Calculate quality scores for results
     */
    async scoreResults(results, context) {
        const scoredResults = [];
        
        for (const result of results) {
            const qualityScore = await this.calculateQualityScore(result, context);
            const relevanceScore = this.calculateRelevanceScore(result, context);
            const specializationScore = this.calculateSpecializationScore(result, context);
            
            const compositeScore = (
                qualityScore * 0.5 +
                relevanceScore * 0.3 +
                specializationScore * 0.2
            );
            
            scoredResults.push({
                ...result,
                scores: {
                    quality: qualityScore,
                    relevance: relevanceScore,
                    specialization: specializationScore,
                    composite: compositeScore
                }
            });
        }
        
        // Sort by composite score (highest first)
        scoredResults.sort((a, b) => b.scores.composite - a.scores.composite);
        
        return scoredResults;
    }
    
    /**
     * Calculate quality score based on multiple factors
     */
    async calculateQualityScore(result, context) {
        let score = 0;
        const weights = this.qualityWeights;
        
        // Completeness: Does the result address all aspects?
        const completenessScore = this.assessCompleteness(result, context);
        score += completenessScore * weights.completeness;
        
        // Accuracy: Is the result technically correct?
        const accuracyScore = this.assessAccuracy(result, context);
        score += accuracyScore * weights.accuracy;
        
        // Relevance: How relevant is it to the task?
        const relevanceScore = this.calculateRelevanceScore(result, context);
        score += relevanceScore * weights.relevance;
        
        // Coherence: Is the result well-structured?
        const coherenceScore = this.assessCoherence(result);
        score += coherenceScore * weights.coherence;
        
        // Efficiency: Resource usage and response time
        const efficiencyScore = this.assessEfficiency(result);
        score += efficiencyScore * weights.efficiency;
        
        return Math.min(1.0, Math.max(0.0, score));
    }
    
    /**
     * Assess completeness of a result
     */
    assessCompleteness(result, context) {
        let score = 0.5; // Base score
        
        // Check for comprehensive content
        if (result.content) {
            const contentLength = typeof result.content === 'string' 
                ? result.content.length 
                : JSON.stringify(result.content).length;
            
            score += Math.min(0.3, contentLength / 1000); // Up to 0.3 for content length
        }
        
        // Check for metadata and context
        if (result.metadata) score += 0.1;
        if (result.reasoning) score += 0.1;
        if (result.confidence) score += 0.05;
        if (result.sources) score += 0.05;
        
        return Math.min(1.0, score);
    }
    
    /**
     * Assess technical accuracy
     */
    assessAccuracy(result, context) {
        let score = 0.7; // Base assumption of accuracy
        
        // Confidence level affects accuracy assessment
        if (result.confidence) {
            score = (score + result.confidence) / 2;
        }
        
        // Check for error indicators
        if (result.errors && result.errors.length > 0) {
            score *= 0.5; // Significant penalty for errors
        }
        
        // Success indicators
        if (result.success === true) score += 0.1;
        if (result.success === false) score *= 0.6;
        
        return Math.min(1.0, Math.max(0.0, score));
    }
    
    /**
     * Calculate relevance to the task
     */
    calculateRelevanceScore(result, context) {
        let score = 0.5; // Base relevance
        
        // Task type matching
        if (context.taskType && result.taskType) {
            if (result.taskType === context.taskType) {
                score += 0.3;
            } else if (result.taskType.includes(context.taskType)) {
                score += 0.2;
            }
        }
        
        // Keywords matching
        if (context.keywords && result.content) {
            const content = typeof result.content === 'string' 
                ? result.content.toLowerCase()
                : JSON.stringify(result.content).toLowerCase();
            
            const matchedKeywords = context.keywords.filter(keyword => 
                content.includes(keyword.toLowerCase())
            ).length;
            
            const keywordScore = matchedKeywords / context.keywords.length;
            score += keywordScore * 0.2;
        }
        
        return Math.min(1.0, score);
    }
    
    /**
     * Calculate specialization score based on agent capability
     */
    calculateSpecializationScore(result, context) {
        let score = 0.5;
        
        // Agent specialization matching
        if (result.agentType && context.preferredAgentTypes) {
            if (context.preferredAgentTypes.includes(result.agentType)) {
                score += 0.3;
            }
        }
        
        // Capability matching
        if (result.capabilities && context.requiredCapabilities) {
            const matchedCaps = context.requiredCapabilities.filter(cap =>
                result.capabilities.includes(cap)
            ).length;
            
            const capScore = matchedCaps / context.requiredCapabilities.length;
            score += capScore * 0.2;
        }
        
        return Math.min(1.0, score);
    }
    
    /**
     * Assess result coherence and structure
     */
    assessCoherence(result) {
        let score = 0.5;
        
        // Structure coherence
        if (result.content) {
            if (typeof result.content === 'object') {
                score += 0.2; // Structured data gets bonus
            }
            
            if (result.reasoning) {
                score += 0.15; // Reasoning provided
            }
            
            if (result.steps && Array.isArray(result.steps)) {
                score += 0.15; // Step-by-step approach
            }
        }
        
        return Math.min(1.0, score);
    }
    
    /**
     * Assess efficiency metrics
     */
    assessEfficiency(result) {
        let score = 0.5;
        
        if (result.duration) {
            // Faster is better, but not at the cost of quality
            if (result.duration < 5000) score += 0.2; // Under 5 seconds
            else if (result.duration < 15000) score += 0.1; // Under 15 seconds
        }
        
        if (result.tokensUsed) {
            // Lower token usage is more efficient
            if (result.tokensUsed < 1000) score += 0.15;
            else if (result.tokensUsed < 5000) score += 0.1;
            else if (result.tokensUsed > 10000) score -= 0.1;
        }
        
        return Math.min(1.0, Math.max(0.0, score));
    }
    
    /**
     * Determine optimal aggregation strategy
     */
    determineStrategy(scoredResults, context) {
        // Forced strategy
        if (context.strategy && this.strategies[context.strategy]) {
            return context.strategy;
        }
        
        // Consensus for high agreement
        if (this.hasHighAgreement(scoredResults, context)) {
            return 'consensus';
        }
        
        // Voting for mixed quality results
        if (this.hasVariedQuality(scoredResults)) {
            return 'voting';
        }
        
        // Synthesis for complementary results
        if (this.hasComplementaryResults(scoredResults)) {
            return 'synthesis';
        }
        
        // Sequential as fallback
        return 'sequential';
    }
    
    /**
     * Check if results have high agreement
     */
    hasHighAgreement(results, context) {
        if (results.length < 2) return false;
        
        const threshold = context.consensusThreshold || this.strategies.consensus.minAgreement;
        const topScore = results[0].scores.composite;
        const agreementCount = results.filter(r => 
            Math.abs(r.scores.composite - topScore) < 0.1
        ).length;
        
        return (agreementCount / results.length) >= threshold;
    }
    
    /**
     * Check if results have varied quality
     */
    hasVariedQuality(results) {
        if (results.length < 2) return false;
        
        const scores = results.map(r => r.scores.composite);
        const max = Math.max(...scores);
        const min = Math.min(...scores);
        
        return (max - min) > 0.3; // Significant quality variance
    }
    
    /**
     * Check if results are complementary
     */
    hasComplementaryResults(results) {
        if (results.length < 2) return false;
        
        // Check if results address different aspects
        const contentTypes = new Set();
        for (const result of results) {
            if (result.metadata && result.metadata.aspectsCovered) {
                result.metadata.aspectsCovered.forEach(aspect => 
                    contentTypes.add(aspect)
                );
            }
        }
        
        return contentTypes.size >= results.length * 0.7;
    }
    
    /**
     * Execute the chosen aggregation strategy
     */
    async executeStrategy(strategy, scoredResults, context) {
        console.log(`Executing ${strategy} aggregation strategy`);
        
        switch (strategy) {
            case 'consensus':
                return await this.executeConsensusStrategy(scoredResults, context);
            
            case 'voting':
                return await this.executeVotingStrategy(scoredResults, context);
            
            case 'synthesis':
                return await this.executeSynthesisStrategy(scoredResults, context);
            
            case 'sequential':
                return await this.executeSequentialStrategy(scoredResults, context);
            
            default:
                throw new Error(`Unknown aggregation strategy: ${strategy}`);
        }
    }
    
    /**
     * Execute consensus-based aggregation
     */
    async executeConsensusStrategy(results, context) {
        const consensusResults = results.filter(r => 
            r.scores.composite >= results[0].scores.composite * 0.9
        );
        
        if (consensusResults.length === 0) {
            return this.formatSingleResult(results[0], context);
        }
        
        return {
            strategy: 'consensus',
            confidence: this.calculateAverageConfidence(consensusResults),
            content: this.mergeConsensusContent(consensusResults),
            metadata: {
                agreementLevel: consensusResults.length / results.length,
                participatingAgents: consensusResults.map(r => r.agentId),
                consensusScore: results[0].scores.composite
            },
            sources: consensusResults,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Execute voting-based aggregation
     */
    async executeVotingStrategy(results, context) {
        const weightedResults = results.map(result => ({
            ...result,
            weight: this.calculateVotingWeight(result, context)
        }));
        
        const totalWeight = weightedResults.reduce((sum, r) => sum + r.weight, 0);
        const normalizedResults = weightedResults.map(r => ({
            ...r,
            normalizedWeight: r.weight / totalWeight
        }));
        
        return {
            strategy: 'voting',
            confidence: this.calculateWeightedConfidence(normalizedResults),
            content: this.mergeVotedContent(normalizedResults),
            metadata: {
                votingWeights: normalizedResults.map(r => ({
                    agentId: r.agentId,
                    weight: r.normalizedWeight,
                    score: r.scores.composite
                })),
                totalParticipants: results.length
            },
            sources: results,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Execute synthesis-based aggregation
     */
    async executeSynthesisStrategy(results, context) {
        return {
            strategy: 'synthesis',
            confidence: this.calculateSynthesisConfidence(results),
            content: this.synthesizeContent(results, context),
            metadata: {
                synthesizedFrom: results.length,
                aspectsCovered: this.extractAspectsCovered(results),
                qualityDistribution: this.getQualityDistribution(results)
            },
            sources: results,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Execute sequential aggregation (preserving order)
     */
    async executeSequentialStrategy(results, context) {
        const orderedResults = context.preserveOriginalOrder 
            ? results.sort((a, b) => a.index - b.index)
            : results; // Already sorted by quality
        
        return {
            strategy: 'sequential',
            confidence: orderedResults[0].confidence || 0.8,
            content: this.combineSequentialContent(orderedResults),
            metadata: {
                executionOrder: orderedResults.map((r, idx) => ({
                    position: idx,
                    agentId: r.agentId,
                    score: r.scores.composite
                })),
                primaryResult: orderedResults[0].agentId
            },
            sources: orderedResults,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Helper methods for content aggregation
     */
    
    mergeConsensusContent(results) {
        if (results.length === 1) return results[0].content;
        
        // For text content, merge similar sections
        if (results.every(r => typeof r.content === 'string')) {
            return this.mergeTextContent(results.map(r => r.content));
        }
        
        // For object content, merge properties
        if (results.every(r => typeof r.content === 'object')) {
            return this.mergeObjectContent(results.map(r => r.content));
        }
        
        return results[0].content; // Fallback
    }
    
    mergeVotedContent(results) {
        // Weight content by voting weight
        const highestWeight = Math.max(...results.map(r => r.normalizedWeight));
        const primaryResult = results.find(r => r.normalizedWeight === highestWeight);
        
        return primaryResult.content;
    }
    
    synthesizeContent(results, context) {
        // Combine different aspects from different results
        const synthesis = {
            primary: results[0].content,
            alternatives: results.slice(1, 3).map(r => ({
                agentId: r.agentId,
                content: r.content,
                score: r.scores.composite
            })),
            combined: this.intelligentContentMerge(results)
        };
        
        return synthesis;
    }
    
    combineSequentialContent(results) {
        return {
            sequence: results.map((r, idx) => ({
                step: idx + 1,
                agentId: r.agentId,
                content: r.content,
                score: r.scores.composite
            })),
            final: results[0].content
        };
    }
    
    mergeTextContent(textArray) {
        // Simple text merging - in production, could use NLP for better merging
        const uniqueLines = new Set();
        textArray.forEach(text => {
            text.split('\n').forEach(line => {
                if (line.trim()) uniqueLines.add(line.trim());
            });
        });
        
        return Array.from(uniqueLines).join('\n');
    }
    
    mergeObjectContent(objArray) {
        // Deep merge objects
        const merged = {};
        objArray.forEach(obj => {
            this.deepMerge(merged, obj);
        });
        return merged;
    }
    
    deepMerge(target, source) {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        });
    }
    
    intelligentContentMerge(results) {
        // Placeholder for advanced content merging logic
        // In production, could use AI for semantic merging
        return {
            merged: true,
            sources: results.length,
            content: results[0].content // Simplified
        };
    }
    
    /**
     * Calculate various confidence and weight metrics
     */
    
    calculateAverageConfidence(results) {
        const confidences = results
            .map(r => r.confidence || 0.5)
            .filter(c => c > 0);
        
        if (confidences.length === 0) return 0.5;
        
        return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    }
    
    calculateVotingWeight(result, context) {
        let weight = result.scores.composite;
        
        if (this.strategies.voting.weightByQuality) {
            weight *= result.scores.quality;
        }
        
        if (this.strategies.voting.weightBySpecialization) {
            weight *= result.scores.specialization;
        }
        
        return weight;
    }
    
    calculateWeightedConfidence(results) {
        let weightedSum = 0;
        let totalWeight = 0;
        
        results.forEach(r => {
            const confidence = r.confidence || 0.5;
            weightedSum += confidence * r.normalizedWeight;
            totalWeight += r.normalizedWeight;
        });
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    }
    
    calculateSynthesisConfidence(results) {
        // Synthesis confidence based on agreement and quality
        const qualityScores = results.map(r => r.scores.quality);
        const avgQuality = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length;
        
        const variance = qualityScores.reduce((sum, q) => sum + Math.pow(q - avgQuality, 2), 0) / qualityScores.length;
        const agreementFactor = 1 - Math.sqrt(variance);
        
        return Math.min(0.95, avgQuality * agreementFactor);
    }
    
    /**
     * Utility methods
     */
    
    extractAspectsCovered(results) {
        const aspects = new Set();
        results.forEach(r => {
            if (r.metadata && r.metadata.aspectsCovered) {
                r.metadata.aspectsCovered.forEach(aspect => aspects.add(aspect));
            }
        });
        return Array.from(aspects);
    }
    
    getQualityDistribution(results) {
        return {
            high: results.filter(r => r.scores.quality >= 0.8).length,
            medium: results.filter(r => r.scores.quality >= 0.5 && r.scores.quality < 0.8).length,
            low: results.filter(r => r.scores.quality < 0.5).length
        };
    }
    
    formatSingleResult(result, context) {
        return {
            strategy: 'single',
            confidence: result.confidence || 0.8,
            content: result.content,
            metadata: {
                singleAgent: result.agentId,
                score: result.scores ? result.scores.composite : 1.0
            },
            sources: [result],
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Caching and cleanup
     */
    
    cacheResult(inputs, result, context) {
        if (this.resultCache.size >= this.maxCacheSize) {
            // Remove oldest entry
            const firstKey = this.resultCache.keys().next().value;
            this.resultCache.delete(firstKey);
        }
        
        const cacheKey = this.generateCacheKey(inputs, context);
        this.resultCache.set(cacheKey, {
            result,
            timestamp: Date.now(),
            context
        });
    }
    
    generateCacheKey(inputs, context) {
        // Simple cache key generation
        const inputHashes = inputs.map(i => 
            `${i.agentId}-${i.scores ? i.scores.composite : 0}`
        ).join('|');
        
        return `${context.strategy || 'auto'}-${inputHashes}`;
    }
    
    /**
     * Get aggregation statistics
     */
    getAggregationStats() {
        return {
            cacheSize: this.resultCache.size,
            strategies: this.strategies,
            qualityWeights: this.qualityWeights
        };
    }
}

module.exports = ResultAggregator;