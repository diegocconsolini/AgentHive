const EventEmitter = require('events');
const WebSocket = require('ws');

/**
 * AgentMessageBus provides pub/sub messaging between agents in the mesh
 * Handles real-time communication, persistence, and delivery guarantees
 */
class AgentMessageBus extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Message routing and delivery configuration
        this.config = {
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            messageTimeout: options.messageTimeout || 30000,
            persistMessages: options.persistMessages !== false,
            enableWebSocket: options.enableWebSocket !== false,
            deadLetterQueue: options.deadLetterQueue !== false,
            maxQueueSize: options.maxQueueSize || 10000
        };
        
        // Message channels and subscriptions
        this.channels = new Map();
        this.subscriptions = new Map(); // agentId -> Set of channels
        this.messageQueue = new Map(); // channel -> Queue of messages
        this.pendingMessages = new Map(); // messageId -> message with retry info
        this.deadLetterQueue = [];
        
        // WebSocket server for real-time updates
        this.wsServer = null;
        this.wsClients = new Map(); // agentId -> WebSocket connection
        
        // Message persistence store (in-memory for now, could be Redis/DB)
        this.messageStore = new Map();
        this.messageHistory = new Map(); // channel -> array of messages
        
        // Performance metrics
        this.metrics = {
            totalMessages: 0,
            deliveredMessages: 0,
            failedMessages: 0,
            retriedMessages: 0,
            deadLetterMessages: 0,
            averageDeliveryTime: 0
        };
        
        // Initialize WebSocket server if enabled
        if (this.config.enableWebSocket) {
            this.initializeWebSocketServer(options.wsPort);
        }
        
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredMessages();
        }, 60000); // Every minute
        
        console.log('AgentMessageBus initialized:', this.config);
    }
    
    /**
     * Initialize WebSocket server for real-time communication
     */
    initializeWebSocketServer(port = 8080) {
        try {
            this.wsServer = new WebSocket.Server({ 
                port: port,
                perMessageDeflate: false 
            });
            
            this.wsServer.on('connection', (ws, req) => {
                console.log('WebSocket client connected:', req.url);
                
                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data);
                        this.handleWebSocketMessage(ws, message);
                    } catch (error) {
                        console.error('Invalid WebSocket message:', error);
                        ws.send(JSON.stringify({ error: 'Invalid message format' }));
                    }
                });
                
                ws.on('close', () => {
                    // Remove client from active connections
                    for (const [agentId, client] of this.wsClients.entries()) {
                        if (client === ws) {
                            this.wsClients.delete(agentId);
                            console.log(`WebSocket client disconnected: ${agentId}`);
                            break;
                        }
                    }
                });
                
                ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                });
            });
            
            console.log(`WebSocket server started on port ${port}`);
        } catch (error) {
            console.error('Failed to initialize WebSocket server:', error);
            this.config.enableWebSocket = false;
        }
    }
    
    /**
     * Handle incoming WebSocket messages
     */
    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'register':
                this.registerWebSocketClient(ws, message.agentId);
                break;
                
            case 'publish':
                this.publishMessage(message.channel, message.data, message.options);
                break;
                
            case 'subscribe':
                this.subscribe(message.agentId, message.channel);
                break;
                
            case 'unsubscribe':
                this.unsubscribe(message.agentId, message.channel);
                break;
                
            default:
                ws.send(JSON.stringify({ 
                    error: `Unknown message type: ${message.type}` 
                }));
        }
    }
    
    /**
     * Register a WebSocket client for an agent
     */
    registerWebSocketClient(ws, agentId) {
        if (!agentId) {
            ws.send(JSON.stringify({ error: 'Agent ID required for registration' }));
            return;
        }
        
        this.wsClients.set(agentId, ws);
        ws.send(JSON.stringify({ 
            type: 'registered', 
            agentId: agentId,
            timestamp: new Date().toISOString()
        }));
        
        console.log(`Agent ${agentId} registered for WebSocket communication`);
        this.emit('agent-connected', { agentId, transport: 'websocket' });
    }
    
    /**
     * Subscribe an agent to a message channel
     */
    subscribe(agentId, channel) {
        if (!agentId || !channel) {
            throw new Error('AgentId and channel are required for subscription');
        }
        
        // Initialize channel if it doesn't exist
        if (!this.channels.has(channel)) {
            this.channels.set(channel, new Set());
            this.messageQueue.set(channel, []);
            this.messageHistory.set(channel, []);
        }
        
        // Add agent to channel
        this.channels.get(channel).add(agentId);
        
        // Track agent subscriptions
        if (!this.subscriptions.has(agentId)) {
            this.subscriptions.set(agentId, new Set());
        }
        this.subscriptions.get(agentId).add(channel);
        
        console.log(`Agent ${agentId} subscribed to channel: ${channel}`);
        this.emit('agent-subscribed', { agentId, channel });
        
        // Send any queued messages for this channel
        this.deliverQueuedMessages(channel, agentId);
        
        return true;
    }
    
    /**
     * Unsubscribe an agent from a message channel
     */
    unsubscribe(agentId, channel) {
        if (!agentId || !channel) {
            return false;
        }
        
        // Remove from channel
        if (this.channels.has(channel)) {
            this.channels.get(channel).delete(agentId);
            
            // Clean up empty channel
            if (this.channels.get(channel).size === 0) {
                this.channels.delete(channel);
                this.messageQueue.delete(channel);
            }
        }
        
        // Remove from agent subscriptions
        if (this.subscriptions.has(agentId)) {
            this.subscriptions.get(agentId).delete(channel);
            
            // Clean up empty subscription
            if (this.subscriptions.get(agentId).size === 0) {
                this.subscriptions.delete(agentId);
            }
        }
        
        console.log(`Agent ${agentId} unsubscribed from channel: ${channel}`);
        this.emit('agent-unsubscribed', { agentId, channel });
        
        return true;
    }
    
    /**
     * Publish a message to a channel
     */
    async publishMessage(channel, data, options = {}) {
        const messageId = this.generateMessageId();
        const timestamp = new Date().toISOString();
        
        const message = {
            id: messageId,
            channel: channel,
            data: data,
            sender: options.sender || 'system',
            timestamp: timestamp,
            ttl: options.ttl || this.config.messageTimeout,
            priority: options.priority || 'normal',
            deliveryMode: options.deliveryMode || 'broadcast', // broadcast, direct, anycast
            targetAgent: options.targetAgent,
            requireAck: options.requireAck || false,
            retryCount: 0,
            metadata: options.metadata || {}
        };
        
        // Store message for persistence
        if (this.config.persistMessages) {
            this.messageStore.set(messageId, message);
            
            // Add to history
            if (this.messageHistory.has(channel)) {
                const history = this.messageHistory.get(channel);
                history.push(message);
                
                // Keep history limited
                if (history.length > 1000) {
                    history.splice(0, history.length - 1000);
                }
            }
        }
        
        console.log(`Publishing message ${messageId} to channel: ${channel}`);
        this.metrics.totalMessages++;
        
        // Deliver message immediately
        const deliveryResult = await this.deliverMessage(message);
        
        this.emit('message-published', { 
            messageId, 
            channel, 
            deliveredTo: deliveryResult.deliveredAgents 
        });
        
        return {
            messageId,
            deliveredTo: deliveryResult.deliveredAgents,
            queuedFor: deliveryResult.queuedAgents,
            failed: deliveryResult.failedAgents
        };
    }
    
    /**
     * Deliver a message to subscribed agents
     */
    async deliverMessage(message) {
        const startTime = Date.now();
        const channel = message.channel;
        const deliveredAgents = [];
        const queuedAgents = [];
        const failedAgents = [];
        
        if (!this.channels.has(channel)) {
            console.warn(`No subscribers for channel: ${channel}`);
            return { deliveredAgents, queuedAgents, failedAgents };
        }
        
        const subscribers = Array.from(this.channels.get(channel));
        
        // Filter subscribers based on delivery mode
        let targetAgents = subscribers;
        if (message.deliveryMode === 'direct' && message.targetAgent) {
            targetAgents = subscribers.filter(agent => agent === message.targetAgent);
        } else if (message.deliveryMode === 'anycast') {
            // Deliver to any one available agent
            targetAgents = subscribers.slice(0, 1);
        }
        
        // Deliver to each target agent
        for (const agentId of targetAgents) {
            try {
                const delivered = await this.deliverToAgent(agentId, message);
                if (delivered) {
                    deliveredAgents.push(agentId);
                } else {
                    queuedAgents.push(agentId);
                }
            } catch (error) {
                console.error(`Failed to deliver message ${message.id} to agent ${agentId}:`, error);
                failedAgents.push(agentId);
            }
        }
        
        // Update metrics
        if (deliveredAgents.length > 0) {
            this.metrics.deliveredMessages++;
            const deliveryTime = Date.now() - startTime;
            this.updateAverageDeliveryTime(deliveryTime);
        }
        
        if (failedAgents.length > 0) {
            this.metrics.failedMessages++;
            // Queue for retry if configured
            if (message.retryCount < this.config.maxRetries) {
                this.scheduleRetry(message, failedAgents);
            } else {
                this.moveToDeadLetter(message, failedAgents);
            }
        }
        
        return { deliveredAgents, queuedAgents, failedAgents };
    }
    
    /**
     * Deliver message to a specific agent
     */
    async deliverToAgent(agentId, message) {
        // Try WebSocket delivery first if available
        if (this.wsClients.has(agentId)) {
            return this.deliverViaWebSocket(agentId, message);
        }
        
        // Try event-based delivery
        return this.deliverViaEvents(agentId, message);
    }
    
    /**
     * Deliver message via WebSocket
     */
    deliverViaWebSocket(agentId, message) {
        const ws = this.wsClients.get(agentId);
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            return false;
        }
        
        try {
            ws.send(JSON.stringify({
                type: 'message',
                ...message
            }));
            
            console.log(`Message ${message.id} delivered to ${agentId} via WebSocket`);
            return true;
        } catch (error) {
            console.error(`WebSocket delivery failed for ${agentId}:`, error);
            return false;
        }
    }
    
    /**
     * Deliver message via event emission
     */
    deliverViaEvents(agentId, message) {
        try {
            this.emit('message', {
                agentId: agentId,
                message: message
            });
            
            this.emit(`message:${agentId}`, message);
            this.emit(`channel:${message.channel}`, message);
            
            console.log(`Message ${message.id} delivered to ${agentId} via events`);
            return true;
        } catch (error) {
            console.error(`Event delivery failed for ${agentId}:`, error);
            return false;
        }
    }
    
    /**
     * Deliver queued messages to an agent
     */
    deliverQueuedMessages(channel, agentId) {
        if (!this.messageQueue.has(channel)) {
            return;
        }
        
        const queue = this.messageQueue.get(channel);
        const deliveredMessages = [];
        
        for (let i = queue.length - 1; i >= 0; i--) {
            const message = queue[i];
            
            // Check if message is expired
            if (this.isMessageExpired(message)) {
                queue.splice(i, 1);
                continue;
            }
            
            // Try to deliver
            this.deliverToAgent(agentId, message).then(delivered => {
                if (delivered) {
                    queue.splice(i, 1);
                    deliveredMessages.push(message.id);
                }
            });
        }
        
        if (deliveredMessages.length > 0) {
            console.log(`Delivered ${deliveredMessages.length} queued messages to ${agentId}`);
        }
    }
    
    /**
     * Schedule message retry
     */
    scheduleRetry(message, failedAgents) {
        message.retryCount++;
        message.lastRetryAt = new Date().toISOString();
        
        const retryDelay = this.config.retryDelay * Math.pow(2, message.retryCount - 1); // Exponential backoff
        
        this.pendingMessages.set(message.id, {
            message,
            failedAgents,
            retryAt: Date.now() + retryDelay
        });
        
        setTimeout(() => {
            this.retryMessage(message.id);
        }, retryDelay);
        
        this.metrics.retriedMessages++;
        console.log(`Scheduled retry ${message.retryCount} for message ${message.id} in ${retryDelay}ms`);
    }
    
    /**
     * Retry message delivery
     */
    async retryMessage(messageId) {
        const pendingMessage = this.pendingMessages.get(messageId);
        if (!pendingMessage) {
            return;
        }
        
        console.log(`Retrying message ${messageId} (attempt ${pendingMessage.message.retryCount})`);
        
        const deliveryResult = await this.deliverMessage(pendingMessage.message);
        
        if (deliveryResult.deliveredAgents.length > 0 || deliveryResult.queuedAgents.length > 0) {
            // Success or partial success
            this.pendingMessages.delete(messageId);
        } else if (pendingMessage.message.retryCount >= this.config.maxRetries) {
            // Max retries reached
            this.moveToDeadLetter(pendingMessage.message, pendingMessage.failedAgents);
            this.pendingMessages.delete(messageId);
        }
    }
    
    /**
     * Move message to dead letter queue
     */
    moveToDeadLetter(message, failedAgents) {
        if (!this.config.deadLetterQueue) {
            return;
        }
        
        const deadLetterMessage = {
            ...message,
            failedAgents,
            deadLetterAt: new Date().toISOString(),
            reason: 'max_retries_exceeded'
        };
        
        this.deadLetterQueue.push(deadLetterMessage);
        this.metrics.deadLetterMessages++;
        
        console.warn(`Message ${message.id} moved to dead letter queue after ${message.retryCount} retries`);
        this.emit('message-dead-letter', deadLetterMessage);
        
        // Keep dead letter queue limited
        if (this.deadLetterQueue.length > this.config.maxQueueSize) {
            this.deadLetterQueue.splice(0, this.deadLetterQueue.length - this.config.maxQueueSize);
        }
    }
    
    /**
     * Send direct message to specific agent
     */
    async sendDirectMessage(targetAgent, data, options = {}) {
        return this.publishMessage(`direct:${targetAgent}`, data, {
            ...options,
            deliveryMode: 'direct',
            targetAgent: targetAgent
        });
    }
    
    /**
     * Request-response pattern
     */
    async sendRequest(targetAgent, data, timeout = 30000) {
        const requestId = this.generateMessageId();
        const responseChannel = `response:${requestId}`;
        
        return new Promise((resolve, reject) => {
            // Set up response listener
            const responseTimeout = setTimeout(() => {
                this.removeAllListeners(`channel:${responseChannel}`);
                reject(new Error(`Request ${requestId} timed out after ${timeout}ms`));
            }, timeout);
            
            this.once(`channel:${responseChannel}`, (message) => {
                clearTimeout(responseTimeout);
                resolve(message.data);
            });
            
            // Send request
            this.sendDirectMessage(targetAgent, {
                ...data,
                requestId: requestId,
                responseChannel: responseChannel
            }, {
                metadata: { 
                    type: 'request',
                    expectResponse: true 
                }
            });
        });
    }
    
    /**
     * Send response to a request
     */
    async sendResponse(requestId, responseData, options = {}) {
        const responseChannel = `response:${requestId}`;
        
        return this.publishMessage(responseChannel, responseData, {
            ...options,
            metadata: { 
                type: 'response',
                requestId: requestId 
            }
        });
    }
    
    /**
     * Utility methods
     */
    
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    isMessageExpired(message) {
        const expiryTime = new Date(message.timestamp).getTime() + message.ttl;
        return Date.now() > expiryTime;
    }
    
    updateAverageDeliveryTime(deliveryTime) {
        if (this.metrics.averageDeliveryTime === 0) {
            this.metrics.averageDeliveryTime = deliveryTime;
        } else {
            this.metrics.averageDeliveryTime = (this.metrics.averageDeliveryTime + deliveryTime) / 2;
        }
    }
    
    /**
     * Cleanup expired messages
     */
    cleanupExpiredMessages() {
        let cleanedCount = 0;
        
        // Clean message store
        for (const [messageId, message] of this.messageStore.entries()) {
            if (this.isMessageExpired(message)) {
                this.messageStore.delete(messageId);
                cleanedCount++;
            }
        }
        
        // Clean message queues
        for (const [channel, queue] of this.messageQueue.entries()) {
            const originalLength = queue.length;
            for (let i = queue.length - 1; i >= 0; i--) {
                if (this.isMessageExpired(queue[i])) {
                    queue.splice(i, 1);
                }
            }
            cleanedCount += originalLength - queue.length;
        }
        
        // Clean pending messages
        for (const [messageId, pending] of this.pendingMessages.entries()) {
            if (this.isMessageExpired(pending.message)) {
                this.pendingMessages.delete(messageId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`Cleaned up ${cleanedCount} expired messages`);
        }
    }
    
    /**
     * Get message bus statistics
     */
    getStatistics() {
        return {
            ...this.metrics,
            channels: this.channels.size,
            subscriptions: this.subscriptions.size,
            queuedMessages: Array.from(this.messageQueue.values())
                .reduce((sum, queue) => sum + queue.length, 0),
            pendingMessages: this.pendingMessages.size,
            deadLetterMessages: this.deadLetterQueue.length,
            connectedWebSockets: this.wsClients.size,
            storedMessages: this.messageStore.size
        };
    }
    
    /**
     * Get channel information
     */
    getChannelInfo(channel) {
        if (!this.channels.has(channel)) {
            return null;
        }
        
        return {
            channel: channel,
            subscribers: Array.from(this.channels.get(channel)),
            queuedMessages: this.messageQueue.get(channel)?.length || 0,
            messageHistory: this.messageHistory.get(channel)?.length || 0
        };
    }
    
    /**
     * Get agent subscriptions
     */
    getAgentSubscriptions(agentId) {
        if (!this.subscriptions.has(agentId)) {
            return [];
        }
        
        return Array.from(this.subscriptions.get(agentId));
    }
    
    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        console.log('Shutting down AgentMessageBus...');
        
        // Clear intervals
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // Close WebSocket server
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        // Close all WebSocket clients
        for (const ws of this.wsClients.values()) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }
        
        // Clear all data structures
        this.channels.clear();
        this.subscriptions.clear();
        this.messageQueue.clear();
        this.pendingMessages.clear();
        this.messageStore.clear();
        this.messageHistory.clear();
        this.wsClients.clear();
        
        this.emit('shutdown');
        console.log('AgentMessageBus shutdown complete');
    }
}

module.exports = AgentMessageBus;