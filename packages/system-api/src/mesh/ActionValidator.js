const EventEmitter = require('events');

/**
 * ActionValidator provides structured action schemas and validation for all agent types
 * Ensures action consistency, parameter validation, and error reporting
 */
class ActionValidator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Validation configuration
        this.config = {
            strictMode: options.strictMode !== false,
            allowCustomActions: options.allowCustomActions !== false,
            maxParameterDepth: options.maxParameterDepth || 5,
            maxArrayLength: options.maxArrayLength || 1000,
            maxStringLength: options.maxStringLength || 100000
        };
        
        // Action schemas by agent type
        this.actionSchemas = new Map();
        
        // Common parameter types
        this.commonTypes = {
            string: { type: 'string', required: false },
            requiredString: { type: 'string', required: true },
            number: { type: 'number', required: false },
            requiredNumber: { type: 'number', required: true },
            boolean: { type: 'boolean', required: false },
            array: { type: 'array', required: false },
            object: { type: 'object', required: false },
            email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, required: false },
            url: { type: 'string', pattern: /^https?:\/\/.+/, required: false },
            path: { type: 'string', pattern: /^\/.*/, required: false },
            filename: { type: 'string', pattern: /^[^\/\\:*?"<>|]+$/, required: false }
        };
        
        // Validation statistics
        this.stats = {
            totalValidations: 0,
            successfulValidations: 0,
            failedValidations: 0,
            errorsByType: new Map(),
            actionUsage: new Map()
        };
        
        // Initialize default schemas
        this.initializeDefaultSchemas();
        
        console.log('ActionValidator initialized with schemas for agent types:', 
                   Array.from(this.actionSchemas.keys()).length);
    }
    
    /**
     * Initialize default action schemas for all agent types
     */
    initializeDefaultSchemas() {
        // Generic actions available to all agents
        this.registerGenericSchemas();
        
        // Development-focused agents
        this.registerDevelopmentSchemas();
        
        // Content and marketing agents
        this.registerContentSchemas();
        
        // Data and analysis agents
        this.registerAnalysisSchemas();
        
        // Infrastructure and deployment agents
        this.registerInfrastructureSchemas();
        
        // Business and strategy agents
        this.registerBusinessSchemas();
        
        // Specialized domain agents
        this.registerSpecializedSchemas();
    }
    
    /**
     * Register generic action schemas
     */
    registerGenericSchemas() {
        const genericActions = {
            analyze: {
                description: 'Analyze input data or content',
                parameters: {
                    content: this.commonTypes.requiredString,
                    analysisType: {
                        type: 'string',
                        enum: ['technical', 'business', 'security', 'performance', 'quality'],
                        required: true
                    },
                    depth: {
                        type: 'string',
                        enum: ['surface', 'detailed', 'comprehensive'],
                        default: 'detailed'
                    },
                    format: {
                        type: 'string',
                        enum: ['summary', 'detailed', 'structured'],
                        default: 'structured'
                    }
                }
            },
            
            review: {
                description: 'Review and provide feedback on content',
                parameters: {
                    content: this.commonTypes.requiredString,
                    reviewType: {
                        type: 'string',
                        enum: ['code', 'content', 'design', 'strategy', 'technical'],
                        required: true
                    },
                    criteria: this.commonTypes.array,
                    feedback: {
                        type: 'string',
                        enum: ['constructive', 'critical', 'suggestions'],
                        default: 'constructive'
                    }
                }
            },
            
            generate: {
                description: 'Generate content based on requirements',
                parameters: {
                    type: {
                        type: 'string',
                        enum: ['code', 'documentation', 'content', 'design', 'strategy'],
                        required: true
                    },
                    requirements: this.commonTypes.requiredString,
                    format: this.commonTypes.string,
                    length: this.commonTypes.number,
                    style: this.commonTypes.string
                }
            },
            
            optimize: {
                description: 'Optimize existing content or code',
                parameters: {
                    content: this.commonTypes.requiredString,
                    optimizationType: {
                        type: 'string',
                        enum: ['performance', 'readability', 'maintainability', 'security', 'seo'],
                        required: true
                    },
                    constraints: this.commonTypes.array,
                    metrics: this.commonTypes.array
                }
            },
            
            validate: {
                description: 'Validate content against criteria',
                parameters: {
                    content: this.commonTypes.requiredString,
                    validationType: {
                        type: 'string',
                        enum: ['syntax', 'semantic', 'compliance', 'security', 'performance'],
                        required: true
                    },
                    standards: this.commonTypes.array,
                    severity: {
                        type: 'string',
                        enum: ['error', 'warning', 'info'],
                        default: 'warning'
                    }
                }
            }
        };
        
        // Apply generic actions to all agent types that don't have specific overrides
        const agentTypes = [
            'general-purpose', 'code-analyzer', 'debugger', 'test-automator',
            'security-auditor', 'performance-engineer', 'data-scientist'
        ];
        
        agentTypes.forEach(agentType => {
            this.actionSchemas.set(agentType, genericActions);
        });
    }
    
    /**
     * Register development-focused action schemas
     */
    registerDevelopmentSchemas() {
        const developmentActions = {
            // Code generation and modification
            writeCode: {
                description: 'Write new code based on specifications',
                parameters: {
                    language: {
                        type: 'string',
                        enum: ['javascript', 'typescript', 'python', 'java', 'c++', 'rust', 'go'],
                        required: true
                    },
                    specifications: this.commonTypes.requiredString,
                    framework: this.commonTypes.string,
                    style: {
                        type: 'string',
                        enum: ['functional', 'object-oriented', 'procedural'],
                        default: 'object-oriented'
                    },
                    includeTests: {
                        type: 'boolean',
                        default: true
                    }
                }
            },
            
            refactor: {
                description: 'Refactor existing code for better quality',
                parameters: {
                    code: this.commonTypes.requiredString,
                    language: this.commonTypes.requiredString,
                    refactorType: {
                        type: 'string',
                        enum: ['extract-method', 'extract-class', 'rename', 'simplify', 'optimize'],
                        required: true
                    },
                    preserveInterface: {
                        type: 'boolean',
                        default: true
                    }
                }
            },
            
            fixBug: {
                description: 'Fix identified bugs in code',
                parameters: {
                    code: this.commonTypes.requiredString,
                    bugDescription: this.commonTypes.requiredString,
                    language: this.commonTypes.requiredString,
                    stackTrace: this.commonTypes.string,
                    testCase: this.commonTypes.string
                }
            },
            
            createTest: {
                description: 'Create unit tests for code',
                parameters: {
                    code: this.commonTypes.requiredString,
                    testFramework: {
                        type: 'string',
                        enum: ['jest', 'mocha', 'pytest', 'junit', 'gtest'],
                        required: true
                    },
                    testType: {
                        type: 'string',
                        enum: ['unit', 'integration', 'e2e'],
                        default: 'unit'
                    },
                    coverage: {
                        type: 'number',
                        min: 0,
                        max: 100,
                        default: 80
                    }
                }
            },
            
            setupProject: {
                description: 'Set up a new project structure',
                parameters: {
                    projectType: {
                        type: 'string',
                        enum: ['web', 'api', 'mobile', 'desktop', 'library'],
                        required: true
                    },
                    language: this.commonTypes.requiredString,
                    framework: this.commonTypes.string,
                    includeCI: {
                        type: 'boolean',
                        default: true
                    },
                    includeDocker: {
                        type: 'boolean',
                        default: false
                    }
                }
            }
        };
        
        const devAgents = [
            'frontend-developer', 'backend-architect', 'javascript-pro', 'python-pro',
            'typescript-pro', 'java-pro', 'cpp-pro', 'rust-pro', 'golang-pro',
            'mobile-developer', 'flutter-expert', 'ios-developer', 'android-developer'
        ];
        
        devAgents.forEach(agentType => {
            this.actionSchemas.set(agentType, {
                ...this.actionSchemas.get('general-purpose') || {},
                ...developmentActions
            });
        });
    }
    
    /**
     * Register content and marketing action schemas
     */
    registerContentSchemas() {
        const contentActions = {
            writeContent: {
                description: 'Write marketing or educational content',
                parameters: {
                    contentType: {
                        type: 'string',
                        enum: ['blog', 'social', 'email', 'documentation', 'marketing'],
                        required: true
                    },
                    topic: this.commonTypes.requiredString,
                    audience: {
                        type: 'string',
                        enum: ['beginner', 'intermediate', 'expert', 'general'],
                        required: true
                    },
                    tone: {
                        type: 'string',
                        enum: ['professional', 'casual', 'technical', 'friendly'],
                        default: 'professional'
                    },
                    wordCount: {
                        type: 'number',
                        min: 50,
                        max: 10000
                    }
                }
            },
            
            optimizeSEO: {
                description: 'Optimize content for search engines',
                parameters: {
                    content: this.commonTypes.requiredString,
                    primaryKeyword: this.commonTypes.requiredString,
                    secondaryKeywords: this.commonTypes.array,
                    targetAudience: this.commonTypes.string,
                    contentType: {
                        type: 'string',
                        enum: ['webpage', 'blog', 'product', 'landing'],
                        required: true
                    }
                }
            },
            
            createCampaign: {
                description: 'Create marketing campaign materials',
                parameters: {
                    campaignType: {
                        type: 'string',
                        enum: ['email', 'social', 'content', 'ppc', 'influencer'],
                        required: true
                    },
                    objective: {
                        type: 'string',
                        enum: ['awareness', 'engagement', 'conversion', 'retention'],
                        required: true
                    },
                    budget: this.commonTypes.number,
                    duration: this.commonTypes.number,
                    channels: this.commonTypes.array
                }
            }
        };
        
        const contentAgents = [
            'content-marketer', 'seo-meta-optimizer', 'seo-content-optimizer',
            'seo-keyword-strategist', 'seo-local-optimizer', 'technical-writer'
        ];
        
        contentAgents.forEach(agentType => {
            this.actionSchemas.set(agentType, {
                ...this.actionSchemas.get('general-purpose') || {},
                ...contentActions
            });
        });
    }
    
    /**
     * Register analysis and data action schemas
     */
    registerAnalysisSchemas() {
        const analysisActions = {
            analyzeData: {
                description: 'Perform data analysis and visualization',
                parameters: {
                    data: this.commonTypes.requiredString,
                    analysisType: {
                        type: 'string',
                        enum: ['descriptive', 'predictive', 'prescriptive', 'diagnostic'],
                        required: true
                    },
                    visualizations: this.commonTypes.array,
                    statisticalTests: this.commonTypes.array,
                    confidenceLevel: {
                        type: 'number',
                        min: 0.8,
                        max: 0.99,
                        default: 0.95
                    }
                }
            },
            
            buildModel: {
                description: 'Build machine learning model',
                parameters: {
                    modelType: {
                        type: 'string',
                        enum: ['classification', 'regression', 'clustering', 'recommendation'],
                        required: true
                    },
                    algorithm: this.commonTypes.string,
                    features: this.commonTypes.array,
                    targetVariable: this.commonTypes.requiredString,
                    validationMethod: {
                        type: 'string',
                        enum: ['cross-validation', 'holdout', 'bootstrap'],
                        default: 'cross-validation'
                    }
                }
            },
            
            generateReport: {
                description: 'Generate analytical report',
                parameters: {
                    reportType: {
                        type: 'string',
                        enum: ['summary', 'detailed', 'executive', 'technical'],
                        required: true
                    },
                    data: this.commonTypes.requiredString,
                    insights: this.commonTypes.array,
                    recommendations: this.commonTypes.array,
                    format: {
                        type: 'string',
                        enum: ['pdf', 'html', 'markdown', 'json'],
                        default: 'markdown'
                    }
                }
            }
        };
        
        const analysisAgents = [
            'data-scientist', 'ml-engineer', 'ai-engineer', 'quant-analyst',
            'business-analyst', 'risk-manager'
        ];
        
        analysisAgents.forEach(agentType => {
            this.actionSchemas.set(agentType, {
                ...this.actionSchemas.get('general-purpose') || {},
                ...analysisActions
            });
        });
    }
    
    /**
     * Register infrastructure and deployment schemas
     */
    registerInfrastructureSchemas() {
        const infraActions = {
            deployApplication: {
                description: 'Deploy application to target environment',
                parameters: {
                    environment: {
                        type: 'string',
                        enum: ['development', 'staging', 'production'],
                        required: true
                    },
                    platform: {
                        type: 'string',
                        enum: ['aws', 'azure', 'gcp', 'docker', 'kubernetes'],
                        required: true
                    },
                    configuration: this.commonTypes.object,
                    healthChecks: this.commonTypes.array,
                    rollbackStrategy: {
                        type: 'string',
                        enum: ['immediate', 'gradual', 'manual'],
                        default: 'gradual'
                    }
                }
            },
            
            configureInfrastructure: {
                description: 'Configure infrastructure components',
                parameters: {
                    component: {
                        type: 'string',
                        enum: ['server', 'database', 'network', 'storage', 'security'],
                        required: true
                    },
                    specifications: this.commonTypes.requiredObject,
                    environment: this.commonTypes.requiredString,
                    scalingPolicy: this.commonTypes.object,
                    monitoring: {
                        type: 'boolean',
                        default: true
                    }
                }
            },
            
            createPipeline: {
                description: 'Create CI/CD pipeline',
                parameters: {
                    pipelineType: {
                        type: 'string',
                        enum: ['build', 'test', 'deploy', 'full'],
                        required: true
                    },
                    platform: {
                        type: 'string',
                        enum: ['github-actions', 'gitlab-ci', 'jenkins', 'azure-devops'],
                        required: true
                    },
                    stages: this.commonTypes.array,
                    triggers: this.commonTypes.array,
                    notifications: this.commonTypes.array
                }
            }
        };
        
        const infraAgents = [
            'deployment-engineer', 'cloud-architect', 'terraform-specialist',
            'network-engineer', 'devops-troubleshooter'
        ];
        
        infraAgents.forEach(agentType => {
            this.actionSchemas.set(agentType, {
                ...this.actionSchemas.get('general-purpose') || {},
                ...infraActions
            });
        });
    }
    
    /**
     * Register business and strategy schemas
     */
    registerBusinessSchemas() {
        const businessActions = {
            createStrategy: {
                description: 'Create business or product strategy',
                parameters: {
                    strategyType: {
                        type: 'string',
                        enum: ['business', 'product', 'marketing', 'growth', 'competitive'],
                        required: true
                    },
                    timeframe: {
                        type: 'string',
                        enum: ['quarterly', 'annual', 'long-term'],
                        required: true
                    },
                    objectives: this.commonTypes.array,
                    constraints: this.commonTypes.array,
                    kpis: this.commonTypes.array
                }
            },
            
            analyzeMarket: {
                description: 'Analyze market conditions and opportunities',
                parameters: {
                    market: this.commonTypes.requiredString,
                    analysisType: {
                        type: 'string',
                        enum: ['competitive', 'trend', 'opportunity', 'risk'],
                        required: true
                    },
                    timeHorizon: {
                        type: 'string',
                        enum: ['short-term', 'medium-term', 'long-term'],
                        default: 'medium-term'
                    },
                    dataSource: this.commonTypes.array
                }
            },
            
            createBusinessPlan: {
                description: 'Create comprehensive business plan',
                parameters: {
                    planType: {
                        type: 'string',
                        enum: ['startup', 'expansion', 'pivot', 'acquisition'],
                        required: true
                    },
                    industry: this.commonTypes.requiredString,
                    targetMarket: this.commonTypes.requiredString,
                    fundingNeeds: this.commonTypes.number,
                    timeline: this.commonTypes.requiredString
                }
            }
        };
        
        const businessAgents = [
            'startup-advisor', 'product-manager', 'business-analyst',
            'sales-automator', 'customer-support'
        ];
        
        businessAgents.forEach(agentType => {
            this.actionSchemas.set(agentType, {
                ...this.actionSchemas.get('general-purpose') || {},
                ...businessActions
            });
        });
    }
    
    /**
     * Register specialized domain schemas
     */
    registerSpecializedSchemas() {
        // Legal domain
        this.actionSchemas.set('legal-advisor', {
            ...this.actionSchemas.get('general-purpose') || {},
            draftLegalDocument: {
                description: 'Draft legal documents and contracts',
                parameters: {
                    documentType: {
                        type: 'string',
                        enum: ['contract', 'policy', 'terms', 'agreement', 'license'],
                        required: true
                    },
                    jurisdiction: this.commonTypes.string,
                    parties: this.commonTypes.array,
                    requirements: this.commonTypes.requiredString
                }
            }
        });
        
        // Design domain
        this.actionSchemas.set('ui-ux-designer', {
            ...this.actionSchemas.get('general-purpose') || {},
            createDesign: {
                description: 'Create UI/UX designs and prototypes',
                parameters: {
                    designType: {
                        type: 'string',
                        enum: ['wireframe', 'mockup', 'prototype', 'component'],
                        required: true
                    },
                    platform: {
                        type: 'string',
                        enum: ['web', 'mobile', 'desktop', 'tablet'],
                        required: true
                    },
                    userStories: this.commonTypes.array,
                    brandGuidelines: this.commonTypes.object
                }
            }
        });
        
        // Gaming domain
        this.actionSchemas.set('minecraft-bukkit-pro', {
            ...this.actionSchemas.get('general-purpose') || {},
            createPlugin: {
                description: 'Create Minecraft Bukkit/Spigot plugin',
                parameters: {
                    pluginType: {
                        type: 'string',
                        enum: ['gameplay', 'utility', 'admin', 'cosmetic', 'economy'],
                        required: true
                    },
                    minecraftVersion: this.commonTypes.requiredString,
                    features: this.commonTypes.array,
                    permissions: this.commonTypes.array
                }
            }
        });
    }
    
    /**
     * Validate an action against its schema
     */
    validateAction(agentType, actionName, parameters = {}) {
        this.stats.totalValidations++;
        
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            agentType,
            actionName,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Check if agent type has schemas
            if (!this.actionSchemas.has(agentType)) {
                if (this.config.allowCustomActions) {
                    validation.warnings.push(`No schemas defined for agent type: ${agentType}`);
                } else {
                    validation.valid = false;
                    validation.errors.push(`Agent type not supported: ${agentType}`);
                    this.recordValidationFailure('unknown_agent_type');
                    return validation;
                }
            }
            
            const agentSchemas = this.actionSchemas.get(agentType) || {};
            
            // Check if action is defined for this agent type
            if (!agentSchemas[actionName]) {
                if (this.config.allowCustomActions) {
                    validation.warnings.push(`Action '${actionName}' not defined for agent '${agentType}'`);
                    this.recordValidationSuccess();
                    return validation;
                } else {
                    validation.valid = false;
                    validation.errors.push(`Action '${actionName}' not supported for agent type '${agentType}'`);
                    this.recordValidationFailure('unknown_action');
                    return validation;
                }
            }
            
            const actionSchema = agentSchemas[actionName];
            
            // Validate parameters against schema
            const paramValidation = this.validateParameters(parameters, actionSchema.parameters || {});
            
            validation.valid = paramValidation.valid;
            validation.errors = paramValidation.errors;
            validation.warnings = validation.warnings.concat(paramValidation.warnings);
            
            if (validation.valid) {
                this.recordValidationSuccess();
            } else {
                this.recordValidationFailure('parameter_validation');
            }
            
            // Record action usage
            this.recordActionUsage(agentType, actionName);
            
        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Validation error: ${error.message}`);
            this.recordValidationFailure('validation_error');
        }
        
        this.emit('action-validated', validation);
        return validation;
    }
    
    /**
     * Validate parameters against parameter schema
     */
    validateParameters(parameters, parameterSchema) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };
        
        // Check required parameters
        for (const [paramName, paramDef] of Object.entries(parameterSchema)) {
            if (paramDef.required && !(paramName in parameters)) {
                result.valid = false;
                result.errors.push(`Required parameter '${paramName}' is missing`);
                continue;
            }
            
            if (paramName in parameters) {
                const paramValidation = this.validateParameter(
                    parameters[paramName], 
                    paramDef, 
                    paramName
                );
                
                if (!paramValidation.valid) {
                    result.valid = false;
                    result.errors = result.errors.concat(paramValidation.errors);
                }
                
                result.warnings = result.warnings.concat(paramValidation.warnings);
            }
        }
        
        // Check for unknown parameters in strict mode
        if (this.config.strictMode) {
            for (const paramName of Object.keys(parameters)) {
                if (!(paramName in parameterSchema)) {
                    result.warnings.push(`Unknown parameter '${paramName}' provided`);
                }
            }
        }
        
        return result;
    }
    
    /**
     * Validate individual parameter
     */
    validateParameter(value, definition, paramName) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };
        
        // Type validation
        if (definition.type) {
            const typeValid = this.validateType(value, definition.type, paramName);
            if (!typeValid.valid) {
                result.valid = false;
                result.errors = result.errors.concat(typeValid.errors);
            }
        }
        
        // Enum validation
        if (definition.enum && !definition.enum.includes(value)) {
            result.valid = false;
            result.errors.push(
                `Parameter '${paramName}' must be one of: ${definition.enum.join(', ')}`
            );
        }
        
        // Pattern validation
        if (definition.pattern && typeof value === 'string') {
            if (!definition.pattern.test(value)) {
                result.valid = false;
                result.errors.push(`Parameter '${paramName}' does not match required pattern`);
            }
        }
        
        // Range validation for numbers
        if (typeof value === 'number') {
            if (definition.min !== undefined && value < definition.min) {
                result.valid = false;
                result.errors.push(`Parameter '${paramName}' must be >= ${definition.min}`);
            }
            
            if (definition.max !== undefined && value > definition.max) {
                result.valid = false;
                result.errors.push(`Parameter '${paramName}' must be <= ${definition.max}`);
            }
        }
        
        // Array length validation
        if (Array.isArray(value)) {
            if (value.length > this.config.maxArrayLength) {
                result.valid = false;
                result.errors.push(
                    `Parameter '${paramName}' array length exceeds maximum (${this.config.maxArrayLength})`
                );
            }
        }
        
        // String length validation
        if (typeof value === 'string') {
            if (value.length > this.config.maxStringLength) {
                result.valid = false;
                result.errors.push(
                    `Parameter '${paramName}' string length exceeds maximum (${this.config.maxStringLength})`
                );
            }
        }
        
        // Object depth validation
        if (typeof value === 'object' && value !== null) {
            const depth = this.getObjectDepth(value);
            if (depth > this.config.maxParameterDepth) {
                result.valid = false;
                result.errors.push(
                    `Parameter '${paramName}' object depth exceeds maximum (${this.config.maxParameterDepth})`
                );
            }
        }
        
        return result;
    }
    
    /**
     * Validate parameter type
     */
    validateType(value, expectedType, paramName) {
        const result = {
            valid: true,
            errors: []
        };
        
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        
        if (actualType !== expectedType) {
            // Special cases
            if (expectedType === 'number' && typeof value === 'string' && !isNaN(Number(value))) {
                // Allow string numbers
                result.warnings = [`Parameter '${paramName}' provided as string but converted to number`];
            } else {
                result.valid = false;
                result.errors.push(
                    `Parameter '${paramName}' expected type '${expectedType}' but got '${actualType}'`
                );
            }
        }
        
        return result;
    }
    
    /**
     * Get object nesting depth
     */
    getObjectDepth(obj, currentDepth = 0) {
        if (typeof obj !== 'object' || obj === null || currentDepth >= this.config.maxParameterDepth) {
            return currentDepth;
        }
        
        let maxDepth = currentDepth;
        
        for (const value of Object.values(obj)) {
            if (typeof value === 'object' && value !== null) {
                const depth = this.getObjectDepth(value, currentDepth + 1);
                maxDepth = Math.max(maxDepth, depth);
            }
        }
        
        return maxDepth;
    }
    
    /**
     * Add custom action schema
     */
    addActionSchema(agentType, actionName, schema) {
        if (!this.actionSchemas.has(agentType)) {
            this.actionSchemas.set(agentType, {});
        }
        
        const agentSchemas = this.actionSchemas.get(agentType);
        agentSchemas[actionName] = schema;
        
        console.log(`Added custom action schema: ${agentType}.${actionName}`);
        this.emit('schema-added', { agentType, actionName, schema });
    }
    
    /**
     * Get available actions for agent type
     */
    getAvailableActions(agentType) {
        const schemas = this.actionSchemas.get(agentType);
        if (!schemas) {
            return [];
        }
        
        return Object.keys(schemas);
    }
    
    /**
     * Get action schema for specific agent and action
     */
    getActionSchema(agentType, actionName) {
        const agentSchemas = this.actionSchemas.get(agentType);
        if (!agentSchemas || !agentSchemas[actionName]) {
            return null;
        }
        
        return agentSchemas[actionName];
    }
    
    /**
     * Get all registered agent types
     */
    getRegisteredAgentTypes() {
        return Array.from(this.actionSchemas.keys());
    }
    
    /**
     * Record validation statistics
     */
    recordValidationSuccess() {
        this.stats.successfulValidations++;
    }
    
    recordValidationFailure(errorType) {
        this.stats.failedValidations++;
        
        if (!this.stats.errorsByType.has(errorType)) {
            this.stats.errorsByType.set(errorType, 0);
        }
        this.stats.errorsByType.set(errorType, this.stats.errorsByType.get(errorType) + 1);
    }
    
    recordActionUsage(agentType, actionName) {
        const key = `${agentType}.${actionName}`;
        if (!this.stats.actionUsage.has(key)) {
            this.stats.actionUsage.set(key, 0);
        }
        this.stats.actionUsage.set(key, this.stats.actionUsage.get(key) + 1);
    }
    
    /**
     * Get validation statistics
     */
    getStatistics() {
        return {
            ...this.stats,
            errorsByType: Object.fromEntries(this.stats.errorsByType),
            actionUsage: Object.fromEntries(this.stats.actionUsage),
            totalAgentTypes: this.actionSchemas.size,
            totalActions: Array.from(this.actionSchemas.values())
                .reduce((sum, schemas) => sum + Object.keys(schemas).length, 0),
            successRate: this.stats.totalValidations > 0 
                ? this.stats.successfulValidations / this.stats.totalValidations 
                : 0
        };
    }
    
    /**
     * Get most used actions
     */
    getMostUsedActions(limit = 10) {
        return Array.from(this.stats.actionUsage.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([action, count]) => ({ action, count }));
    }
    
    /**
     * Get most common validation errors
     */
    getMostCommonErrors(limit = 10) {
        return Array.from(this.stats.errorsByType.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([errorType, count]) => ({ errorType, count }));
    }
    
    /**
     * Generate validation report
     */
    generateValidationReport() {
        const stats = this.getStatistics();
        
        return {
            summary: {
                totalValidations: stats.totalValidations,
                successRate: (stats.successRate * 100).toFixed(2) + '%',
                totalAgentTypes: stats.totalAgentTypes,
                totalActions: stats.totalActions
            },
            topActions: this.getMostUsedActions(5),
            commonErrors: this.getMostCommonErrors(5),
            config: this.config,
            generatedAt: new Date().toISOString()
        };
    }
}

module.exports = ActionValidator;