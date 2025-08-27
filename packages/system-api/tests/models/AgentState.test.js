const AgentState = require('../../src/models/AgentState');

describe('AgentState Model', () => {
  let agentState;
  
  beforeEach(() => {
    agentState = new AgentState();
  });

  describe('Constructor and Defaults', () => {
    test('should create agent with default values', () => {
      expect(agentState.agent_id).toBeDefined();
      expect(agentState.type).toBe(AgentState.TYPE.BACKEND_DEVELOPER);
      expect(agentState.status).toBe(AgentState.STATUS.IDLE);
      expect(agentState.created).toBeDefined();
      expect(agentState.updated).toBeDefined();
    });

    test('should accept custom initialization data', () => {
      const customData = {
        type: AgentState.TYPE.BACKEND_ARCHITECT,
        status: AgentState.STATUS.ACTIVE,
        capabilities: ['api-design', 'scalability-planning']
      };
      
      const customAgent = new AgentState(customData);
      expect(customAgent.type).toBe(AgentState.TYPE.BACKEND_ARCHITECT);
      expect(customAgent.status).toBe(AgentState.STATUS.ACTIVE);
      expect(customAgent.capabilities).toEqual(customData.capabilities);
    });

    test('should initialize performance metrics with defaults', () => {
      expect(agentState.performance_metrics.success_rate).toBe(0.0);
      expect(agentState.performance_metrics.avg_completion_time).toBe(0.0);
      expect(agentState.performance_metrics.context_efficiency).toBe(0.0);
      expect(agentState.performance_metrics.total_tasks_completed).toBe(0);
      expect(agentState.performance_metrics.total_tasks_failed).toBe(0);
    });

    test('should initialize memory usage with defaults', () => {
      expect(agentState.memory_usage.contexts_active).toBe(0);
      expect(agentState.memory_usage.memory_size).toBe(0.0);
      expect(agentState.memory_usage.peak_memory_size).toBe(0.0);
      expect(agentState.memory_usage.cleanup_frequency).toBe(3600000);
    });
  });

  describe('Default Capabilities by Type', () => {
    test('should assign backend-architect capabilities', () => {
      const architect = new AgentState({ type: AgentState.TYPE.BACKEND_ARCHITECT });
      expect(architect.capabilities).toContain('api-design');
      expect(architect.capabilities).toContain('service-architecture');
      expect(architect.capabilities).toContain('database-design');
      expect(architect.capabilities).toContain('scalability-planning');
    });

    test('should assign backend-developer capabilities', () => {
      const developer = new AgentState({ type: AgentState.TYPE.BACKEND_DEVELOPER });
      expect(developer.capabilities).toContain('code-implementation');
      expect(developer.capabilities).toContain('unit-testing');
      expect(developer.capabilities).toContain('debugging');
      expect(developer.capabilities).toContain('refactoring');
    });

    test('should assign database-optimizer capabilities', () => {
      const optimizer = new AgentState({ type: AgentState.TYPE.DATABASE_OPTIMIZER });
      expect(optimizer.capabilities).toContain('schema-design');
      expect(optimizer.capabilities).toContain('index-optimization');
      expect(optimizer.capabilities).toContain('query-tuning');
    });

    test('should assign file-analyzer capabilities', () => {
      const analyzer = new AgentState({ type: AgentState.TYPE.FILE_ANALYZER });
      expect(analyzer.capabilities).toContain('file-summarization');
      expect(analyzer.capabilities).toContain('log-analysis');
      expect(analyzer.capabilities).toContain('content-extraction');
    });
  });

  describe('Validation', () => {
    test('should validate valid agent state', () => {
      const result = agentState.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid agent type', () => {
      agentState.type = 'invalid-type';
      const result = agentState.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid agent type: invalid-type');
    });

    test('should reject invalid status', () => {
      agentState.status = 'invalid-status';
      const result = agentState.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid agent status: invalid-status');
    });

    test('should reject invalid success rate', () => {
      agentState.performance_metrics.success_rate = 1.5;
      const result = agentState.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('success_rate must be a number between 0 and 1');
    });

    test('should reject negative completion time', () => {
      agentState.performance_metrics.avg_completion_time = -100;
      const result = agentState.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('avg_completion_time must be a non-negative number');
    });

    test('should reject negative memory size', () => {
      agentState.memory_usage.memory_size = -10;
      const result = agentState.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('memory_size must be a non-negative number');
    });

    test('should reject non-array capabilities', () => {
      agentState.capabilities = 'not-an-array';
      const result = agentState.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('capabilities must be an array');
    });
  });

  describe('Task Management', () => {
    test('should start task and update status', () => {
      const taskInfo = {
        task_id: 'task-123',
        issue_number: 456,
        stream: 'stream-A',
        estimated_duration: 30
      };

      const result = agentState.startTask(taskInfo);
      
      expect(result).toBe(agentState); // Returns this for chaining
      expect(agentState.status).toBe(AgentState.STATUS.BUSY);
      expect(agentState.current_task.task_id).toBe('task-123');
      expect(agentState.current_task.issue_number).toBe(456);
      expect(agentState.current_task.stream).toBe('stream-A');
      expect(agentState.current_task.started_at).toBeDefined();
      expect(agentState.current_task.estimated_completion).toBeDefined();
    });

    test('should complete task successfully and update metrics', () => {
      // Start a task first
      agentState.startTask({
        task_id: 'task-123',
        estimated_duration: 10
      });

      const executionTime = 600000; // 10 minutes in ms
      const result = agentState.completeTask(true, { execution_time: executionTime });
      
      expect(result).toBe(agentState);
      expect(agentState.status).toBe(AgentState.STATUS.ACTIVE);
      expect(agentState.performance_metrics.total_tasks_completed).toBe(1);
      expect(agentState.performance_metrics.total_tasks_failed).toBe(0);
      expect(agentState.performance_metrics.success_rate).toBe(1.0);
      expect(agentState.performance_metrics.avg_completion_time).toBe(executionTime);
      expect(agentState.performance_metrics.total_execution_time).toBe(executionTime);
      
      // Task should be cleared
      expect(agentState.current_task.task_id).toBeNull();
      expect(agentState.current_task.issue_number).toBeNull();
    });

    test('should handle failed task and update metrics', () => {
      agentState.startTask({ task_id: 'task-123' });
      
      const result = agentState.completeTask(false);
      
      expect(result).toBe(agentState);
      expect(agentState.status).toBe(AgentState.STATUS.ERROR);
      expect(agentState.performance_metrics.total_tasks_completed).toBe(0);
      expect(agentState.performance_metrics.total_tasks_failed).toBe(1);
      expect(agentState.performance_metrics.success_rate).toBe(0.0);
    });

    test('should calculate success rate correctly with mixed results', () => {
      // Complete 2 successful tasks
      agentState.startTask({ task_id: 'task-1' });
      agentState.completeTask(true, { execution_time: 300000 });
      
      agentState.startTask({ task_id: 'task-2' });
      agentState.completeTask(true, { execution_time: 600000 });
      
      // Complete 1 failed task
      agentState.startTask({ task_id: 'task-3' });
      agentState.completeTask(false);
      
      expect(agentState.performance_metrics.total_tasks_completed).toBe(2);
      expect(agentState.performance_metrics.total_tasks_failed).toBe(1);
      expect(agentState.performance_metrics.success_rate).toBeCloseTo(0.667, 3);
      expect(agentState.performance_metrics.avg_completion_time).toBe(450000); // (300000 + 600000) / 2
    });
  });

  describe('Memory Management', () => {
    test('should update memory usage', () => {
      const usage = {
        contexts_active: 10,
        memory_size: 25.5
      };
      
      const result = agentState.updateMemoryUsage(usage);
      
      expect(result).toBe(agentState);
      expect(agentState.memory_usage.contexts_active).toBe(10);
      expect(agentState.memory_usage.memory_size).toBe(25.5);
      expect(agentState.memory_usage.peak_memory_size).toBe(25.5);
      expect(agentState.performance_metrics.context_efficiency).toBeCloseTo(0.392, 3); // 10/25.5
    });

    test('should track peak memory usage', () => {
      agentState.updateMemoryUsage({ memory_size: 20 });
      agentState.updateMemoryUsage({ memory_size: 35 });
      agentState.updateMemoryUsage({ memory_size: 15 });
      
      expect(agentState.memory_usage.memory_size).toBe(15);
      expect(agentState.memory_usage.peak_memory_size).toBe(35);
    });

    test('should perform cleanup and update statistics', () => {
      // Set initial memory usage
      agentState.updateMemoryUsage({
        contexts_active: 20,
        memory_size: 50
      });
      
      const cleanupResults = {
        contexts_freed: 5,
        memory_freed: 15
      };
      
      const result = agentState.performCleanup(cleanupResults);
      
      expect(result).toBe(agentState);
      expect(agentState.memory_usage.contexts_active).toBe(15);
      expect(agentState.memory_usage.memory_size).toBe(35);
      expect(agentState.memory_usage.last_cleanup).toBeDefined();
      expect(agentState.performance_metrics.context_efficiency).toBeCloseTo(0.429, 3); // 15/35
    });

    test('should prevent negative values after cleanup', () => {
      agentState.updateMemoryUsage({
        contexts_active: 5,
        memory_size: 10
      });
      
      // Cleanup more than available
      agentState.performCleanup({
        contexts_freed: 10,
        memory_freed: 20
      });
      
      expect(agentState.memory_usage.contexts_active).toBe(0);
      expect(agentState.memory_usage.memory_size).toBe(0);
      expect(agentState.performance_metrics.context_efficiency).toBe(0);
    });

    test('should detect when cleanup is needed', () => {
      expect(agentState.needsCleanup()).toBe(false);
      
      // Set last cleanup to 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 7200000).toISOString();
      agentState.memory_usage.last_cleanup = twoHoursAgo;
      
      expect(agentState.needsCleanup()).toBe(true);
    });
  });

  describe('Capability Management', () => {
    test('should add new capabilities', () => {
      const result = agentState.addCapability('new-capability');
      
      expect(result).toBe(agentState);
      expect(agentState.capabilities).toContain('new-capability');
    });

    test('should not add duplicate capabilities', () => {
      const initialLength = agentState.capabilities.length;
      const existingCapability = agentState.capabilities[0];
      
      agentState.addCapability(existingCapability);
      
      expect(agentState.capabilities.length).toBe(initialLength);
    });

    test('should remove capabilities', () => {
      const capabilityToRemove = agentState.capabilities[0];
      const result = agentState.removeCapability(capabilityToRemove);
      
      expect(result).toBe(agentState);
      expect(agentState.capabilities).not.toContain(capabilityToRemove);
    });

    test('should check if agent has capability', () => {
      const existingCapability = agentState.capabilities[0];
      expect(agentState.hasCapability(existingCapability)).toBe(true);
      expect(agentState.hasCapability('non-existent-capability')).toBe(false);
    });
  });

  describe('Workload Calculation', () => {
    test('should return 0% for idle agents', () => {
      agentState.status = AgentState.STATUS.IDLE;
      expect(agentState.getWorkloadPercentage()).toBe(0);
    });

    test('should return 100% for error status', () => {
      agentState.status = AgentState.STATUS.ERROR;
      expect(agentState.getWorkloadPercentage()).toBe(100);
    });

    test('should return 50% for active status', () => {
      agentState.status = AgentState.STATUS.ACTIVE;
      expect(agentState.getWorkloadPercentage()).toBe(50);
    });

    test('should calculate workload based on task progress when busy', () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1800000); // 30 minutes ago
      const endTime = new Date(now.getTime() + 1800000);   // 30 minutes from now
      
      agentState.status = AgentState.STATUS.BUSY;
      agentState.current_task.started_at = startTime.toISOString();
      agentState.current_task.estimated_completion = endTime.toISOString();
      
      const workload = agentState.getWorkloadPercentage();
      expect(workload).toBeCloseTo(50, 5); // Should be around 50% complete
    });
  });

  describe('Performance Summary', () => {
    test('should generate performance summary', () => {
      agentState.performance_metrics.success_rate = 0.85;
      agentState.performance_metrics.avg_completion_time = 900000; // 15 minutes
      agentState.performance_metrics.context_efficiency = 2.5;
      agentState.performance_metrics.total_tasks_completed = 8;
      agentState.performance_metrics.total_tasks_failed = 2;
      agentState.memory_usage.memory_size = 42.3;
      agentState.memory_usage.contexts_active = 15;
      
      const summary = agentState.getPerformanceSummary();
      
      expect(summary.success_rate).toBe('85.0%');
      expect(summary.avg_completion_time).toBe('15.0m');
      expect(summary.context_efficiency).toBe('2.50');
      expect(summary.total_tasks).toBe(10);
      expect(summary.memory_usage).toBe('42.3MB (15 contexts)');
    });
  });

  describe('Serialization', () => {
    test('should convert to object', () => {
      const obj = agentState.toObject();
      
      expect(obj).toHaveProperty('agent_id');
      expect(obj).toHaveProperty('type');
      expect(obj).toHaveProperty('status');
      expect(obj).toHaveProperty('current_task');
      expect(obj).toHaveProperty('capabilities');
      expect(obj).toHaveProperty('performance_metrics');
      expect(obj).toHaveProperty('memory_usage');
      expect(obj).toHaveProperty('created');
      expect(obj).toHaveProperty('updated');
    });

    test('should serialize to JSON string', () => {
      const jsonString = agentState.serialize();
      expect(typeof jsonString).toBe('string');
      
      const parsed = JSON.parse(jsonString);
      expect(parsed.agent_id).toBe(agentState.agent_id);
      expect(parsed.type).toBe(agentState.type);
    });

    test('should deserialize from JSON string', () => {
      const jsonString = agentState.serialize();
      const deserialized = AgentState.deserialize(jsonString);
      
      expect(deserialized.agent_id).toBe(agentState.agent_id);
      expect(deserialized.type).toBe(agentState.type);
      expect(deserialized.status).toBe(agentState.status);
      expect(deserialized).toBeInstanceOf(AgentState);
    });

    test('should handle invalid JSON in deserialize', () => {
      expect(() => {
        AgentState.deserialize('invalid json');
      }).toThrow('Failed to deserialize agent state');
    });

    test('should create from object with validation', () => {
      const validData = agentState.toObject();
      const newAgent = AgentState.fromObject(validData);
      
      expect(newAgent).toBeInstanceOf(AgentState);
      expect(newAgent.agent_id).toBe(validData.agent_id);
    });

    test('should reject invalid data in fromObject', () => {
      const invalidData = {
        type: 'invalid-type',
        status: 'invalid-status'
      };
      
      expect(() => {
        AgentState.fromObject(invalidData);
      }).toThrow('Invalid agent state data');
    });
  });

  describe('Update Method', () => {
    test('should update properties and timestamp', () => {
      const originalUpdated = agentState.updated;
      
      // Wait a small amount to ensure timestamp difference
      setTimeout(() => {
        const updates = {
          status: AgentState.STATUS.ACTIVE,
          capabilities: ['new-capability']
        };
        
        const result = agentState.update(updates);
        
        expect(result).toBe(agentState);
        expect(agentState.status).toBe(AgentState.STATUS.ACTIVE);
        expect(agentState.capabilities).toContain('new-capability');
        expect(agentState.updated).not.toBe(originalUpdated);
      }, 1);
    });

    test('should merge object properties', () => {
      const originalMemory = agentState.memory_usage.contexts_active;
      
      agentState.update({
        memory_usage: {
          memory_size: 100
        }
      });
      
      expect(agentState.memory_usage.contexts_active).toBe(originalMemory);
      expect(agentState.memory_usage.memory_size).toBe(100);
    });

    test('should not update protected properties', () => {
      const originalId = agentState.agent_id;
      const originalCreated = agentState.created;
      
      agentState.update({
        agent_id: 'new-id',
        created: 'new-created'
      });
      
      expect(agentState.agent_id).toBe(originalId);
      expect(agentState.created).toBe(originalCreated);
    });
  });

  describe('Clone Method', () => {
    test('should clone agent with new ID', () => {
      const clone = agentState.clone();
      
      expect(clone).toBeInstanceOf(AgentState);
      expect(clone.agent_id).not.toBe(agentState.agent_id);
      expect(clone.type).toBe(agentState.type);
      expect(clone.status).toBe(agentState.status);
    });

    test('should apply overrides during cloning', () => {
      const clone = agentState.clone({
        type: AgentState.TYPE.BACKEND_ARCHITECT,
        status: AgentState.STATUS.BUSY
      });
      
      expect(clone.type).toBe(AgentState.TYPE.BACKEND_ARCHITECT);
      expect(clone.status).toBe(AgentState.STATUS.BUSY);
    });
  });

  describe('Summary Method', () => {
    test('should generate human-readable summary', () => {
      const summary = agentState.getSummary();
      
      expect(summary).toContain(agentState.agent_id.substring(0, 8));
      expect(summary).toContain(agentState.type);
      expect(summary).toContain(agentState.status);
      expect(summary).toContain('Workload:');
      expect(summary).toContain('Success:');
      expect(summary).toContain('Memory:');
      expect(summary).toContain('Tasks:');
    });
  });
});