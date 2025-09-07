# AgentHive Epic Memory Enhancement Implementation Plan

> **Mission**: Integrate Epic Memory Manager's advanced features into AgentHive while maintaining zero breaking changes, complete test coverage, and production-ready implementation quality.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Multi-Session Implementation Tracker](#multi-session-implementation-tracker)
3. [Architecture & Design](#architecture--design)
4. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
5. [Testing & Validation Strategy](#testing--validation-strategy)
6. [Risk Management & Rollback Plans](#risk-management--rollback-plans)
7. [Monitoring & Success Metrics](#monitoring--success-metrics)

---

## Project Overview

### Goals
- **Primary**: Add advanced memory intelligence, multi-tenancy, and enterprise features
- **Secondary**: Enhance integration capabilities and extensibility framework
- **Constraints**: Zero breaking changes, 100% test coverage, production-ready only

### Success Criteria
- All existing tests pass throughout implementation
- New features have ≥95% test coverage
- Performance regression <5% for existing features
- Complete multi-session tracking with rollback capabilities
- Enterprise-grade security and audit compliance

---

## Multi-Session Implementation Tracker

### Session State Management

```typescript
// packages/system-api/src/tracking/ImplementationSession.ts
interface ImplementationSession {
  id: string;
  phase: ImplementationPhase;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed' | 'rolled_back';
  features: FeatureImplementation[];
  testResults: TestResult[];
  rollbackPlan: RollbackStep[];
  validationChecks: ValidationCheck[];
}

interface FeatureImplementation {
  name: string;
  status: 'planned' | 'in_progress' | 'testing' | 'completed' | 'failed';
  dependencies: string[];
  tests: TestSuite[];
  rollbackHash: string;
  validationsPassed: boolean;
}
```

### Session Tracking Database Schema

```sql
-- New table for implementation tracking
CREATE TABLE implementation_sessions (
  id TEXT PRIMARY KEY,
  phase TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  status TEXT NOT NULL DEFAULT 'active',
  metadata TEXT, -- JSON blob with session data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feature_implementations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  dependencies TEXT, -- JSON array
  test_results TEXT, -- JSON blob
  rollback_hash TEXT,
  validations_passed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES implementation_sessions(id)
);

CREATE TABLE validation_checkpoints (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  checkpoint_name TEXT NOT NULL,
  status TEXT NOT NULL,
  results TEXT, -- JSON blob with detailed results
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES implementation_sessions(id)
);
```

### CLI Session Management

```bash
# Session Management Commands
hive dev session create --phase=memory-intelligence
hive dev session list --active
hive dev session status <session-id>
hive dev session validate <session-id>
hive dev session rollback <session-id> --to-checkpoint=<name>
hive dev session complete <session-id>

# Feature Tracking Commands
hive dev feature start <feature-name> --session=<id>
hive dev feature test <feature-name> --coverage-threshold=95
hive dev feature validate <feature-name> --strict
hive dev feature complete <feature-name> --session=<id>

# Validation Commands
hive dev validate all --session=<id>
hive dev validate backwards-compatibility
hive dev validate performance --baseline=current
hive dev validate security --audit
```

---

## Architecture & Design

### Core Architecture Principles

1. **Zero Breaking Changes**: All new features are additive only
2. **Feature Flags**: All new features behind toggleable flags
3. **Database Migrations**: Reversible schema changes only
4. **API Versioning**: New endpoints, existing endpoints unchanged
5. **Graceful Degradation**: New features degrade gracefully if unavailable

### Feature Flag System

```typescript
// packages/shared/src/features/FeatureFlags.ts
export interface FeatureFlags {
  // Memory Intelligence Features
  SEMANTIC_MEMORY_CLUSTERING: boolean;
  KNOWLEDGE_GRAPH_VISUALIZATION: boolean;
  SMART_MEMORY_RECOMMENDATIONS: boolean;
  MEMORY_IMPORT_EXPORT: boolean;
  
  // Enterprise Features
  MULTI_TENANT_ARCHITECTURE: boolean;
  ENTERPRISE_SSO_INTEGRATION: boolean;
  ADVANCED_AUDIT_LOGGING: boolean;
  FINE_GRAINED_RBAC: boolean;
  
  // Integration Features
  WEBHOOK_SYSTEM: boolean;
  PLUGIN_ARCHITECTURE: boolean;
  ADVANCED_GRAPHQL_FEATURES: boolean;
}

// Environment-based feature flag configuration
export const getFeatureFlags = (): FeatureFlags => ({
  SEMANTIC_MEMORY_CLUSTERING: process.env.FEATURE_SEMANTIC_CLUSTERING === 'true',
  KNOWLEDGE_GRAPH_VISUALIZATION: process.env.FEATURE_KNOWLEDGE_GRAPH === 'true',
  // ... rest of feature flags
});
```

### Database Schema Extensions (Non-Breaking)

```sql
-- Memory Intelligence Tables (Phase 1)
CREATE TABLE IF NOT EXISTS memory_clusters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  algorithm TEXT NOT NULL, -- 'semantic', 'topic', 'temporal'
  config TEXT, -- JSON configuration
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS memory_cluster_assignments (
  id TEXT PRIMARY KEY,
  cluster_id TEXT NOT NULL,
  memory_id TEXT NOT NULL,
  confidence_score REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cluster_id) REFERENCES memory_clusters(id),
  FOREIGN KEY (memory_id) REFERENCES memories(id),
  UNIQUE(cluster_id, memory_id)
);

CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  node_type TEXT NOT NULL, -- 'concept', 'entity', 'relationship'
  properties TEXT, -- JSON blob
  embedding_vector TEXT, -- Serialized vector
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memory_id) REFERENCES memories(id)
);

CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id TEXT PRIMARY KEY,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  properties TEXT, -- JSON blob
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_node_id) REFERENCES knowledge_graph_nodes(id),
  FOREIGN KEY (target_node_id) REFERENCES knowledge_graph_nodes(id)
);

-- Multi-Tenancy Tables (Phase 2)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings TEXT, -- JSON blob
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'owner', 'admin', 'member', 'viewer'
  permissions TEXT, -- JSON array of permissions
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(organization_id, user_id)
);

-- Enterprise SSO Tables (Phase 2)
CREATE TABLE IF NOT EXISTS sso_providers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- 'saml', 'oidc', 'oauth2'
  name TEXT NOT NULL,
  config TEXT NOT NULL, -- JSON configuration
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS sso_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  session_data TEXT, -- JSON blob
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES sso_providers(id)
);

-- Audit Logging Tables (Phase 2)
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata TEXT, -- JSON blob with event details
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Webhooks Tables (Phase 3)
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT NOT NULL, -- JSON array of event types
  secret TEXT NOT NULL, -- For signature verification
  is_active BOOLEAN DEFAULT TRUE,
  retry_config TEXT, -- JSON configuration
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  delivered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id)
);

-- Plugin System Tables (Phase 3)
CREATE TABLE IF NOT EXISTS plugins (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  config_schema TEXT, -- JSON schema
  is_active BOOLEAN DEFAULT FALSE,
  installation_config TEXT, -- JSON configuration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

---

## Phase-by-Phase Implementation

### Phase 1: Advanced Memory Intelligence (Weeks 1-4)

#### 1.1 Semantic Memory Clustering

**Week 1: Foundation & Setup**

**Session Tracking:**
```bash
hive dev session create --phase=memory-intelligence
SESSION_ID=mem-intel-$(date +%s)
hive dev feature start semantic-clustering --session=$SESSION_ID
```

**Implementation Steps:**

1. **Vector Embedding Service**
```typescript
// packages/system-api/src/services/EmbeddingService.ts
export class EmbeddingService {
  private model: string;
  private cache: Map<string, number[]>;

  constructor(model: string = 'sentence-transformers/all-MiniLM-L6-v2') {
    this.model = model;
    this.cache = new Map();
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (this.cache.has(text)) {
      return this.cache.get(text)!;
    }

    // Use Transformers.js for local embedding generation
    const { pipeline } = await import('@xenova/transformers');
    const embedder = await pipeline('feature-extraction', this.model);
    
    const embedding = await embedder(text, { pooling: 'mean', normalize: true });
    const vector = Array.from(embedding.data);
    
    this.cache.set(text, vector);
    return vector;
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    // Cosine similarity
    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const norm1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
    const norm2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
    return dotProduct / (norm1 * norm2);
  }
}
```

2. **Memory Clustering Algorithm**
```typescript
// packages/system-api/src/services/MemoryClusteringService.ts
export class MemoryClusteringService {
  private embeddingService: EmbeddingService;

  constructor(embeddingService: EmbeddingService) {
    this.embeddingService = embeddingService;
  }

  async clusterMemories(
    memories: Memory[],
    algorithm: 'semantic' | 'topic' | 'temporal' = 'semantic',
    config: ClusteringConfig = {}
  ): Promise<MemoryCluster[]> {
    
    switch (algorithm) {
      case 'semantic':
        return this.semanticClustering(memories, config);
      case 'topic':
        return this.topicClustering(memories, config);
      case 'temporal':
        return this.temporalClustering(memories, config);
      default:
        throw new Error(`Unsupported clustering algorithm: ${algorithm}`);
    }
  }

  private async semanticClustering(
    memories: Memory[],
    config: ClusteringConfig
  ): Promise<MemoryCluster[]> {
    
    // Generate embeddings for all memories
    const embeddings = await Promise.all(
      memories.map(memory => this.embeddingService.generateEmbedding(
        `${memory.title} ${memory.content}`
      ))
    );

    // K-means clustering
    const numClusters = config.numClusters || Math.ceil(Math.sqrt(memories.length));
    const clusters = this.kMeansClustering(embeddings, numClusters);

    // Create cluster objects
    return clusters.map((cluster, index) => ({
      id: generateId(),
      name: `Semantic Cluster ${index + 1}`,
      description: this.generateClusterDescription(
        cluster.map(i => memories[i])
      ),
      algorithm: 'semantic',
      config: config,
      memories: cluster.map(i => memories[i]),
      confidence: cluster.length / memories.length
    }));
  }

  private kMeansClustering(embeddings: number[][], k: number): number[][] {
    // Implementation of K-means clustering algorithm
    // Returns array of clusters, each containing indices of embeddings
    
    const centroids = this.initializeCentroids(embeddings, k);
    let assignments = new Array(embeddings.length).fill(0);
    let hasChanged = true;
    let iterations = 0;
    const maxIterations = 100;

    while (hasChanged && iterations < maxIterations) {
      hasChanged = false;
      
      // Assign each point to nearest centroid
      for (let i = 0; i < embeddings.length; i++) {
        const newAssignment = this.findNearestCentroid(embeddings[i], centroids);
        if (newAssignment !== assignments[i]) {
          assignments[i] = newAssignment;
          hasChanged = true;
        }
      }

      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterPoints = embeddings.filter((_, i) => assignments[i] === j);
        if (clusterPoints.length > 0) {
          centroids[j] = this.calculateCentroid(clusterPoints);
        }
      }

      iterations++;
    }

    // Group indices by cluster
    const clusters: number[][] = Array.from({ length: k }, () => []);
    assignments.forEach((cluster, index) => {
      clusters[cluster].push(index);
    });

    return clusters.filter(cluster => cluster.length > 0);
  }

  private generateClusterDescription(memories: Memory[]): string {
    // Use AI to generate meaningful cluster descriptions
    const topics = memories.flatMap(m => m.tags || []);
    const uniqueTopics = [...new Set(topics)];
    
    if (uniqueTopics.length > 0) {
      return `Cluster focusing on: ${uniqueTopics.slice(0, 3).join(', ')}`;
    }
    
    // Fallback to content analysis
    const combinedContent = memories.map(m => m.title).join('. ');
    return `Cluster containing ${memories.length} related memories`;
  }
}
```

**Testing Strategy:**
```typescript
// packages/system-api/src/services/__tests__/MemoryClusteringService.test.ts
describe('MemoryClusteringService', () => {
  let service: MemoryClusteringService;
  let embeddingService: EmbeddingService;
  
  beforeEach(() => {
    embeddingService = new EmbeddingService();
    service = new MemoryClusteringService(embeddingService);
  });

  describe('semantic clustering', () => {
    it('should cluster semantically similar memories together', async () => {
      const memories = [
        { id: '1', title: 'React Hooks', content: 'useState and useEffect examples', tags: ['react'] },
        { id: '2', title: 'Vue Composition API', content: 'ref and reactive examples', tags: ['vue'] },
        { id: '3', title: 'React Components', content: 'Function components and props', tags: ['react'] },
        { id: '4', title: 'Database Design', content: 'SQL normalization principles', tags: ['database'] },
      ];

      const clusters = await service.clusterMemories(memories, 'semantic', { numClusters: 2 });
      
      expect(clusters).toHaveLength(2);
      expect(clusters[0].memories).toHaveLength(2);
      expect(clusters[1].memories).toHaveLength(2);
      
      // Verify React memories are clustered together
      const reactCluster = clusters.find(c => 
        c.memories.some(m => m.tags?.includes('react'))
      );
      expect(reactCluster).toBeDefined();
      expect(reactCluster!.memories.every(m => m.tags?.includes('react'))).toBeTruthy();
    });

    it('should handle empty memory list gracefully', async () => {
      const clusters = await service.clusterMemories([], 'semantic');
      expect(clusters).toHaveLength(0);
    });

    it('should validate clustering configuration', async () => {
      const memories = [
        { id: '1', title: 'Test', content: 'Test content', tags: [] }
      ];

      await expect(service.clusterMemories(memories, 'semantic', { 
        numClusters: -1 
      })).rejects.toThrow();
    });
  });

  describe('performance', () => {
    it('should cluster 1000 memories in under 10 seconds', async () => {
      const memories = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        title: `Memory ${i}`,
        content: `Content for memory ${i}`,
        tags: [`tag${i % 10}`]
      }));

      const startTime = Date.now();
      const clusters = await service.clusterMemories(memories, 'semantic');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000);
      expect(clusters.length).toBeGreaterThan(0);
    });
  });
});
```

**Validation Checkpoint:**
```bash
hive dev validate feature semantic-clustering --tests --performance --integration
hive dev checkpoint create semantic-clustering-complete --session=$SESSION_ID
```

#### 1.2 Knowledge Graph Visualization

**Week 2: Knowledge Graph Engine**

```typescript
// packages/system-api/src/services/KnowledgeGraphService.ts
export class KnowledgeGraphService {
  private embeddingService: EmbeddingService;
  private nlp: any; // Natural language processing service

  async generateKnowledgeGraph(memories: Memory[]): Promise<KnowledgeGraph> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Extract entities and concepts from memories
    for (const memory of memories) {
      const memoryNodes = await this.extractNodes(memory);
      nodes.push(...memoryNodes);
    }

    // Find relationships between nodes
    const relationships = await this.findRelationships(nodes);
    edges.push(...relationships);

    return {
      id: generateId(),
      nodes,
      edges,
      metadata: {
        generatedAt: new Date(),
        memoryCount: memories.length,
        nodeCount: nodes.length,
        edgeCount: edges.length
      }
    };
  }

  private async extractNodes(memory: Memory): Promise<GraphNode[]> {
    const nodes: GraphNode[] = [];

    // Create memory node
    const memoryNode: GraphNode = {
      id: `memory-${memory.id}`,
      type: 'memory',
      label: memory.title,
      properties: {
        id: memory.id,
        title: memory.title,
        content: memory.content.substring(0, 200),
        tags: memory.tags,
        createdAt: memory.createdAt
      },
      embedding: await this.embeddingService.generateEmbedding(
        `${memory.title} ${memory.content}`
      )
    };
    nodes.push(memoryNode);

    // Extract concept nodes
    const concepts = await this.extractConcepts(memory.content);
    for (const concept of concepts) {
      const conceptNode: GraphNode = {
        id: `concept-${concept.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'concept',
        label: concept,
        properties: { name: concept },
        embedding: await this.embeddingService.generateEmbedding(concept)
      };
      nodes.push(conceptNode);
    }

    // Extract entity nodes (people, organizations, etc.)
    const entities = await this.extractEntities(memory.content);
    for (const entity of entities) {
      const entityNode: GraphNode = {
        id: `entity-${entity.text.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'entity',
        label: entity.text,
        properties: { 
          name: entity.text, 
          type: entity.type,
          confidence: entity.confidence 
        },
        embedding: await this.embeddingService.generateEmbedding(entity.text)
      };
      nodes.push(entityNode);
    }

    return nodes;
  }

  private async findRelationships(nodes: GraphNode[]): Promise<GraphEdge[]> {
    const edges: GraphEdge[] = [];

    // Find semantic relationships based on embedding similarity
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const similarity = this.embeddingService.calculateSimilarity(
          nodes[i].embedding,
          nodes[j].embedding
        );

        if (similarity > 0.7) { // Threshold for relationship
          const edge: GraphEdge = {
            id: `edge-${nodes[i].id}-${nodes[j].id}`,
            sourceId: nodes[i].id,
            targetId: nodes[j].id,
            type: 'semantic_similarity',
            weight: similarity,
            properties: { similarity }
          };
          edges.push(edge);
        }
      }
    }

    return edges;
  }

  async exportGraph(
    graph: KnowledgeGraph, 
    format: 'json' | 'graphml' | 'cytoscape' | 'svg'
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(graph, null, 2);
      case 'graphml':
        return this.exportGraphML(graph);
      case 'cytoscape':
        return this.exportCytoscape(graph);
      case 'svg':
        return await this.generateSVG(graph);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportGraphML(graph: KnowledgeGraph): string {
    // Generate GraphML format for tools like Gephi
    let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="type" for="node" attr.name="type" attr.type="string"/>
  <key id="weight" for="edge" attr.name="weight" attr.type="double"/>
  <graph id="knowledge-graph" edgedefault="undirected">`;

    // Add nodes
    for (const node of graph.nodes) {
      graphml += `
    <node id="${node.id}">
      <data key="label">${node.label}</data>
      <data key="type">${node.type}</data>
    </node>`;
    }

    // Add edges
    for (const edge of graph.edges) {
      graphml += `
    <edge source="${edge.sourceId}" target="${edge.targetId}">
      <data key="weight">${edge.weight}</data>
    </edge>`;
    }

    graphml += `
  </graph>
</graphml>`;

    return graphml;
  }
}
```

**Frontend Integration:**
```typescript
// packages/web/src/components/knowledge-graph/KnowledgeGraphVisualization.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { KnowledgeGraph } from '@agenthive/shared';

interface KnowledgeGraphVisualizationProps {
  graph: KnowledgeGraph;
  width?: number;
  height?: number;
  interactive?: boolean;
}

export const KnowledgeGraphVisualization: React.FC<KnowledgeGraphVisualizationProps> = ({
  graph,
  width = 800,
  height = 600,
  interactive = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !graph) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create force simulation
    const simulation = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.edges).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(graph.edges)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.weight * 5));

    // Create nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(graph.nodes)
      .enter().append('circle')
      .attr('r', (d: any) => d.type === 'memory' ? 8 : 5)
      .attr('fill', (d: any) => {
        switch (d.type) {
          case 'memory': return '#ff6b6b';
          case 'concept': return '#4ecdc4';
          case 'entity': return '#45b7d1';
          default: return '#96ceb4';
        }
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Add labels
    const label = svg.append('g')
      .selectAll('text')
      .data(graph.nodes)
      .enter().append('text')
      .text((d: any) => d.label)
      .attr('font-size', '12px')
      .attr('dx', 15)
      .attr('dy', 4);

    // Handle node selection
    if (interactive) {
      node.on('click', (event, d: any) => {
        setSelectedNode(selectedNode === d.id ? null : d.id);
      });
    }

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [graph, width, height, interactive, selectedNode]);

  return (
    <div className="knowledge-graph-container">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="knowledge-graph-svg"
      />
      {selectedNode && (
        <div className="node-details">
          <NodeDetails nodeId={selectedNode} graph={graph} />
        </div>
      )}
    </div>
  );
};
```

**Testing:**
```bash
hive dev feature test knowledge-graph --coverage-threshold=95
hive dev validate performance --feature=knowledge-graph --max-nodes=10000
hive dev checkpoint create knowledge-graph-complete --session=$SESSION_ID
```

#### 1.3 Smart Memory Recommendations

**Week 3: AI-Powered Recommendations**

```typescript
// packages/system-api/src/services/MemoryRecommendationService.ts
export class MemoryRecommendationService {
  private embeddingService: EmbeddingService;
  private knowledgeGraphService: KnowledgeGraphService;
  private userBehaviorService: UserBehaviorService;

  async getRecommendations(
    userId: string, 
    contextMemoryId?: string,
    limit: number = 10
  ): Promise<MemoryRecommendation[]> {
    
    const userPreferences = await this.userBehaviorService.getUserPreferences(userId);
    const recommendations: MemoryRecommendation[] = [];

    // Collaborative filtering recommendations
    const collaborativeRecs = await this.getCollaborativeRecommendations(userId, limit / 3);
    recommendations.push(...collaborativeRecs);

    // Content-based recommendations
    const contentRecs = await this.getContentBasedRecommendations(
      userId, 
      contextMemoryId, 
      limit / 3
    );
    recommendations.push(...contentRecs);

    // Knowledge graph recommendations
    const graphRecs = await this.getKnowledgeGraphRecommendations(
      userId, 
      contextMemoryId, 
      limit / 3
    );
    recommendations.push(...graphRecs);

    // Score and rank all recommendations
    const scoredRecs = await this.scoreRecommendations(recommendations, userPreferences);
    
    return scoredRecs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async getCollaborativeRecommendations(
    userId: string, 
    limit: number
  ): Promise<MemoryRecommendation[]> {
    
    // Find users with similar interests
    const similarUsers = await this.findSimilarUsers(userId);
    const recommendations: MemoryRecommendation[] = [];

    for (const similarUser of similarUsers) {
      const theirMemories = await this.getRecentMemories(similarUser.id);
      
      for (const memory of theirMemories) {
        const hasUserSeenMemory = await this.hasUserInteracted(userId, memory.id);
        
        if (!hasUserSeenMemory) {
          recommendations.push({
            memory,
            type: 'collaborative',
            score: similarUser.similarity * 0.8,
            reason: `Users with similar interests also found this helpful`
          });
        }
      }
    }

    return recommendations.slice(0, limit);
  }

  private async getContentBasedRecommendations(
    userId: string, 
    contextMemoryId?: string,
    limit: number
  ): Promise<MemoryRecommendation[]> {
    
    let referenceMemories: Memory[];
    
    if (contextMemoryId) {
      // Use specific memory as context
      const contextMemory = await this.getMemory(contextMemoryId);
      referenceMemories = [contextMemory];
    } else {
      // Use user's recent memories as context
      referenceMemories = await this.getUserRecentMemories(userId, 10);
    }

    const recommendations: MemoryRecommendation[] = [];

    for (const refMemory of referenceMemories) {
      const refEmbedding = await this.embeddingService.generateEmbedding(
        `${refMemory.title} ${refMemory.content}`
      );

      // Find similar memories
      const allMemories = await this.getAllAccessibleMemories(userId);
      const similarities = await Promise.all(
        allMemories.map(async (memory) => {
          const memoryEmbedding = await this.embeddingService.generateEmbedding(
            `${memory.title} ${memory.content}`
          );
          const similarity = this.embeddingService.calculateSimilarity(
            refEmbedding, 
            memoryEmbedding
          );
          
          return { memory, similarity };
        })
      );

      // Add high-similarity memories as recommendations
      const highSimilarity = similarities
        .filter(({ similarity }) => similarity > 0.7)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      for (const { memory, similarity } of highSimilarity) {
        recommendations.push({
          memory,
          type: 'content-based',
          score: similarity,
          reason: `Similar to "${refMemory.title}"`
        });
      }
    }

    return recommendations.slice(0, limit);
  }

  private async getKnowledgeGraphRecommendations(
    userId: string, 
    contextMemoryId?: string,
    limit: number
  ): Promise<MemoryRecommendation[]> {
    
    const userMemories = await this.getUserMemories(userId);
    const knowledgeGraph = await this.knowledgeGraphService.generateKnowledgeGraph(userMemories);
    
    if (!contextMemoryId) {
      // Use most connected memories as recommendations
      const nodeConnections = new Map<string, number>();
      
      for (const edge of knowledgeGraph.edges) {
        nodeConnections.set(
          edge.sourceId, 
          (nodeConnections.get(edge.sourceId) || 0) + 1
        );
        nodeConnections.set(
          edge.targetId, 
          (nodeConnections.get(edge.targetId) || 0) + 1
        );
      }

      const recommendations: MemoryRecommendation[] = [];
      const sortedNodes = Array.from(nodeConnections.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      for (const [nodeId, connections] of sortedNodes) {
        const memory = this.findMemoryByNodeId(userMemories, nodeId);
        if (memory) {
          recommendations.push({
            memory,
            type: 'knowledge-graph',
            score: connections / knowledgeGraph.edges.length,
            reason: `Central to your knowledge network (${connections} connections)`
          });
        }
      }

      return recommendations;
    }

    // Context-specific graph recommendations
    const contextNodeId = `memory-${contextMemoryId}`;
    const relatedNodes = knowledgeGraph.edges
      .filter(edge => edge.sourceId === contextNodeId || edge.targetId === contextNodeId)
      .map(edge => edge.sourceId === contextNodeId ? edge.targetId : edge.sourceId);

    const recommendations: MemoryRecommendation[] = [];
    for (const nodeId of relatedNodes) {
      const memory = this.findMemoryByNodeId(userMemories, nodeId);
      if (memory && memory.id !== contextMemoryId) {
        const edge = knowledgeGraph.edges.find(e => 
          (e.sourceId === contextNodeId && e.targetId === nodeId) ||
          (e.targetId === contextNodeId && e.sourceId === nodeId)
        );
        
        recommendations.push({
          memory,
          type: 'knowledge-graph',
          score: edge?.weight || 0.5,
          reason: `Connected in your knowledge graph`
        });
      }
    }

    return recommendations.slice(0, limit);
  }

  private async scoreRecommendations(
    recommendations: MemoryRecommendation[], 
    userPreferences: UserPreferences
  ): Promise<MemoryRecommendation[]> {
    
    return recommendations.map(rec => {
      let adjustedScore = rec.score;

      // Adjust based on user preferences
      if (rec.memory.tags) {
        const preferredTags = rec.memory.tags.filter(tag => 
          userPreferences.preferredTags.includes(tag)
        );
        adjustedScore += preferredTags.length * 0.1;
      }

      // Boost recent memories slightly
      const daysSinceCreated = (Date.now() - new Date(rec.memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 7) {
        adjustedScore += 0.05;
      }

      // Penalize memories user has already interacted with recently
      if (rec.memory.lastAccessedAt && 
          Date.now() - new Date(rec.memory.lastAccessedAt).getTime() < 24 * 60 * 60 * 1000) {
        adjustedScore -= 0.2;
      }

      return {
        ...rec,
        score: Math.max(0, Math.min(1, adjustedScore))
      };
    });
  }
}
```

**API Integration:**
```typescript
// packages/user-api/src/resolvers/memory.ts
export const memoryResolvers = {
  Query: {
    // Existing resolvers...
    
    memoryRecommendations: async (
      _: any, 
      { contextMemoryId, limit = 10 }: { contextMemoryId?: string; limit?: number },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const recommendationService = new MemoryRecommendationService(
        context.embeddingService,
        context.knowledgeGraphService,
        context.userBehaviorService
      );

      return recommendationService.getRecommendations(
        context.user.id, 
        contextMemoryId, 
        limit
      );
    }
  }
};
```

**Testing:**
```bash
hive dev feature test memory-recommendations --integration --performance
hive dev validate accuracy memory-recommendations --test-dataset=samples/memory-recs.json
hive dev checkpoint create memory-recommendations-complete --session=$SESSION_ID
```

#### 1.4 Memory Import/Export System

**Week 4: Integration & Import/Export**

```typescript
// packages/system-api/src/services/MemoryImportExportService.ts
export class MemoryImportExportService {
  private parseService: ContentParseService;
  private embeddingService: EmbeddingService;

  async importMemories(
    userId: string, 
    source: 'notion' | 'obsidian' | 'roam' | 'markdown' | 'json',
    data: Buffer | string
  ): Promise<ImportResult> {
    
    let memories: Partial<Memory>[];

    switch (source) {
      case 'notion':
        memories = await this.parseNotionExport(data);
        break;
      case 'obsidian':
        memories = await this.parseObsidianVault(data);
        break;
      case 'roam':
        memories = await this.parseRoamExport(data);
        break;
      case 'markdown':
        memories = await this.parseMarkdownFiles(data);
        break;
      case 'json':
        memories = await this.parseJSONExport(data);
        break;
      default:
        throw new Error(`Unsupported import source: ${source}`);
    }

    // Validate and clean memories
    const validatedMemories = await this.validateMemories(memories);
    
    // Import in batches to avoid overwhelming the system
    const batchSize = 50;
    const results: ImportBatch[] = [];

    for (let i = 0; i < validatedMemories.length; i += batchSize) {
      const batch = validatedMemories.slice(i, i + batchSize);
      const batchResult = await this.importBatch(userId, batch);
      results.push(batchResult);
    }

    return {
      totalMemories: validatedMemories.length,
      successfulImports: results.reduce((sum, batch) => sum + batch.successful, 0),
      failedImports: results.reduce((sum, batch) => sum + batch.failed, 0),
      batches: results,
      importedAt: new Date()
    };
  }

  private async parseNotionExport(data: Buffer | string): Promise<Partial<Memory>[]> {
    // Parse Notion export format (HTML + CSV)
    const memories: Partial<Memory>[] = [];
    
    if (Buffer.isBuffer(data)) {
      // Handle ZIP file from Notion export
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(data);

      // Find and parse HTML files
      for (const filename of Object.keys(zip.files)) {
        if (filename.endsWith('.html') && !filename.includes('index.html')) {
          const content = await zip.files[filename].async('text');
          const memory = await this.parseNotionPage(content, filename);
          if (memory) memories.push(memory);
        }
      }

      // Parse CSV exports if present
      const csvFile = zip.files['All Pages.csv'];
      if (csvFile) {
        const csvContent = await csvFile.async('text');
        const csvMemories = await this.parseNotionCSV(csvContent);
        memories.push(...csvMemories);
      }
    }

    return memories;
  }

  private async parseNotionPage(htmlContent: string, filename: string): Promise<Partial<Memory> | null> {
    const cheerio = (await import('cheerio')).default;
    const $ = cheerio.load(htmlContent);

    const title = $('h1').first().text().trim() || 
                 filename.replace(/\.html$/, '').replace(/_/g, ' ');
    
    // Remove Notion-specific elements
    $('.notion-header').remove();
    $('.notion-page-controls').remove();
    
    const content = $('article, .notion-page-content, body').first().text().trim();
    
    if (!content || content.length < 10) return null;

    // Extract tags from properties or hashtags
    const tags: string[] = [];
    
    // Look for Notion properties
    $('.property-value').each((_, el) => {
      const tag = $(el).text().trim();
      if (tag) tags.push(tag);
    });

    // Look for hashtags in content
    const hashtagMatches = content.match(/#[\w-]+/g);
    if (hashtagMatches) {
      tags.push(...hashtagMatches.map(tag => tag.substring(1)));
    }

    return {
      title,
      content,
      tags: [...new Set(tags)],
      source: 'notion-import',
      originalId: filename
    };
  }

  private async parseObsidianVault(data: Buffer | string): Promise<Partial<Memory>[]> {
    const memories: Partial<Memory>[] = [];
    
    if (Buffer.isBuffer(data)) {
      // Handle ZIP file from Obsidian vault
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(data);

      for (const filename of Object.keys(zip.files)) {
        if (filename.endsWith('.md') && !zip.files[filename].dir) {
          const content = await zip.files[filename].async('text');
          const memory = this.parseMarkdownFile(content, filename);
          if (memory) memories.push(memory);
        }
      }
    }

    return memories;
  }

  private parseMarkdownFile(content: string, filename: string): Partial<Memory> | null {
    if (!content.trim()) return null;

    // Parse YAML frontmatter
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const frontmatterMatch = content.match(frontmatterRegex);
    
    let metadata: any = {};
    let markdownContent = content;

    if (frontmatterMatch) {
      try {
        const yaml = (await import('js-yaml')).default;
        metadata = yaml.load(frontmatterMatch[1]) || {};
        markdownContent = content.replace(frontmatterRegex, '');
      } catch (error) {
        // Ignore YAML parsing errors
      }
    }

    // Extract title (first heading or from metadata or filename)
    const title = metadata.title || 
                 markdownContent.match(/^#\s+(.+)$/m)?.[1] ||
                 filename.replace(/\.md$/, '').replace(/_/g, ' ');

    // Parse tags
    const tags: string[] = [];
    if (metadata.tags) {
      if (Array.isArray(metadata.tags)) {
        tags.push(...metadata.tags);
      } else if (typeof metadata.tags === 'string') {
        tags.push(...metadata.tags.split(',').map(t => t.trim()));
      }
    }

    // Extract hashtags from content
    const hashtagMatches = markdownContent.match(/#[\w-]+/g);
    if (hashtagMatches) {
      tags.push(...hashtagMatches.map(tag => tag.substring(1)));
    }

    // Convert Obsidian links [[Link]] to regular format
    const cleanedContent = markdownContent
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/^\s*#+\s+/gm, '') // Remove markdown headers for content
      .trim();

    return {
      title,
      content: cleanedContent,
      tags: [...new Set(tags)],
      source: 'obsidian-import',
      originalId: filename,
      createdAt: metadata.created || new Date(),
      updatedAt: metadata.modified || new Date()
    };
  }

  async exportMemories(
    userId: string, 
    format: 'json' | 'markdown' | 'csv' | 'pdf',
    filters?: MemoryFilter
  ): Promise<Buffer> {
    
    const memories = await this.getFilteredMemories(userId, filters);

    switch (format) {
      case 'json':
        return this.exportToJSON(memories);
      case 'markdown':
        return this.exportToMarkdown(memories);
      case 'csv':
        return this.exportToCSV(memories);
      case 'pdf':
        return await this.exportToPDF(memories);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async exportToMarkdown(memories: Memory[]): Promise<Buffer> {
    let markdown = `# Memory Export\n\nExported on: ${new Date().toISOString()}\n\nTotal memories: ${memories.length}\n\n---\n\n`;

    for (const memory of memories) {
      markdown += `## ${memory.title}\n\n`;
      markdown += `**Created:** ${new Date(memory.createdAt).toLocaleDateString()}\n\n`;
      
      if (memory.tags && memory.tags.length > 0) {
        markdown += `**Tags:** ${memory.tags.map(tag => `#${tag}`).join(' ')}\n\n`;
      }

      markdown += `${memory.content}\n\n---\n\n`;
    }

    return Buffer.from(markdown, 'utf-8');
  }

  private async exportToPDF(memories: Memory[]): Promise<Buffer> {
    const puppeteer = (await import('puppeteer')).default;
    
    // Generate HTML content
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Memory Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; border-bottom: 2px solid #333; }
          h2 { color: #666; margin-top: 30px; }
          .metadata { color: #888; font-size: 12px; margin-bottom: 10px; }
          .tags { margin: 10px 0; }
          .tag { background: #e1f5fe; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 5px; }
          .content { line-height: 1.6; margin: 20px 0; }
          .divider { border-top: 1px solid #ddd; margin: 30px 0; }
        </style>
      </head>
      <body>
        <h1>Memory Export</h1>
        <div class="metadata">Exported on: ${new Date().toLocaleString()}</div>
        <div class="metadata">Total memories: ${memories.length}</div>
    `;

    for (const memory of memories) {
      html += `
        <div class="divider"></div>
        <h2>${memory.title}</h2>
        <div class="metadata">Created: ${new Date(memory.createdAt).toLocaleDateString()}</div>
        ${memory.tags?.length ? `
          <div class="tags">
            ${memory.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
        <div class="content">${memory.content.replace(/\n/g, '<br>')}</div>
      `;
    }

    html += `
      </body>
      </html>
    `;

    // Generate PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    await browser.close();
    return pdfBuffer;
  }
}
```

**CLI Integration:**
```typescript
// packages/cli/src/commands/memory/import.ts
export class MemoryImportCommand extends Command {
  static description = 'Import memories from external sources';

  static examples = [
    'hive memory import --source=notion --file=notion-export.zip',
    'hive memory import --source=obsidian --file=vault.zip --tags=imported',
    'hive memory import --source=markdown --file=notes/ --recursive'
  ];

  static flags = {
    source: Flags.string({
      description: 'Import source type',
      options: ['notion', 'obsidian', 'roam', 'markdown', 'json'],
      required: true
    }),
    file: Flags.string({
      description: 'File or directory to import',
      required: true
    }),
    tags: Flags.string({
      description: 'Additional tags to add to imported memories'
    }),
    'dry-run': Flags.boolean({
      description: 'Preview import without creating memories',
      default: false
    }),
    recursive: Flags.boolean({
      description: 'Import files recursively from directories',
      default: false
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(MemoryImportCommand);
    
    try {
      // Read file data
      const data = await this.readImportData(flags.file, flags.recursive);
      
      if (flags['dry-run']) {
        const preview = await this.previewImport(flags.source, data);
        this.displayImportPreview(preview);
        return;
      }

      // Show progress spinner
      const spinner = ora('Importing memories...').start();

      const result = await this.api.importMemories({
        source: flags.source,
        data: data.toString('base64'),
        additionalTags: flags.tags?.split(',').map(t => t.trim())
      });

      spinner.succeed(`Import completed: ${result.successfulImports} imported, ${result.failedImports} failed`);

      if (result.failedImports > 0) {
        console.log(chalk.yellow('\nFailed imports:'));
        result.batches.forEach((batch, index) => {
          if (batch.errors.length > 0) {
            console.log(`Batch ${index + 1}: ${batch.errors.join(', ')}`);
          }
        });
      }

    } catch (error) {
      this.error(`Import failed: ${error.message}`);
    }
  }
}
```

**Phase 1 Validation:**
```bash
hive dev session validate memory-intelligence --comprehensive
hive dev test all --phase=memory-intelligence --coverage-threshold=95
hive dev performance baseline --feature=memory-intelligence
hive dev checkpoint create phase-1-complete --session=$SESSION_ID
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create comprehensive implementation plan structure", "status": "completed", "activeForm": "Creating comprehensive implementation plan structure"}, {"content": "Design multi-session implementation tracking system", "status": "completed", "activeForm": "Designing multi-session implementation tracking system"}, {"content": "Plan advanced memory intelligence features implementation", "status": "completed", "activeForm": "Planning advanced memory intelligence features implementation"}, {"content": "Design enterprise-grade features architecture", "status": "in_progress", "activeForm": "Designing enterprise-grade features architecture"}, {"content": "Create integration and extensibility framework", "status": "pending", "activeForm": "Creating integration and extensibility framework"}, {"content": "Write detailed testing and validation strategies", "status": "pending", "activeForm": "Writing detailed testing and validation strategies"}, {"content": "Generate complete implementation document", "status": "pending", "activeForm": "Generating complete implementation document"}]