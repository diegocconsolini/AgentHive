import { EnvUtils } from '@memory-manager/shared';

const config = EnvUtils.getConfig();
const SSP_API_BASE = `${config.SYSTEM_API_URL}/api/ssp`;

export interface SSPPattern {
  id: string;
  sequence: string[];
  successCount: number;
  avgExecutionTime: number;
  lastUsed: string;
}

export interface SSPAnalytics {
  agentId: string;
  totalExecutions: number;
  successfulExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  uniqueSessions: number;
  uniqueProcedures: number;
  timestamp: string;
}

export interface SSPPrediction {
  probability: number;
  confidence: number;
  similarPatterns: number;
  expectedDuration: number;
}

export interface SSPPredictionRequest {
  contextId: string;
  agentId: string;
  procedure: string;
}

class SSPService {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth-token');
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`SSP API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getPatterns(agentId: string): Promise<{ agentId: string; patterns: SSPPattern[]; timestamp: string }> {
    const url = `${SSP_API_BASE}/patterns/${agentId}?userId=web-user&sessionId=web-session-${Date.now()}`;
    return this.makeRequest<{ agentId: string; patterns: SSPPattern[]; timestamp: string }>(url);
  }

  async getAnalytics(agentId: string): Promise<SSPAnalytics> {
    const url = `${SSP_API_BASE}/analytics/${agentId}?userId=web-user&sessionId=web-session-${Date.now()}`;
    return this.makeRequest<SSPAnalytics>(url);
  }

  async predictSuccess(request: SSPPredictionRequest): Promise<SSPPrediction> {
    const url = `${SSP_API_BASE}/predict`;
    return this.makeRequest<SSPPrediction>(url, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAllAgentAnalytics(): Promise<SSPAnalytics[]> {
    // Get analytics for common agents based on our known data
    const knownAgents = ['frontend-developer', 'python-pro', 'backend-architect', 'security-auditor'];
    
    const analyticsPromises = knownAgents.map(async (agentId) => {
      try {
        return await this.getAnalytics(agentId);
      } catch (error) {
        // Return zero analytics if agent has no data
        return {
          agentId,
          totalExecutions: 0,
          successfulExecutions: 0,
          successRate: 0,
          avgExecutionTime: 0,
          uniqueSessions: 0,
          uniqueProcedures: 0,
          timestamp: new Date().toISOString(),
        };
      }
    });

    const results = await Promise.all(analyticsPromises);
    // Filter out agents with no executions for cleaner display
    return results.filter(analytics => analytics.totalExecutions > 0);
  }

  async getSystemOverview(): Promise<{
    totalExecutions: number;
    totalAgents: number;
    overallSuccessRate: number;
    avgExecutionTime: number;
    activeAgents: number;
  }> {
    const allAnalytics = await this.getAllAgentAnalytics();
    
    const totalExecutions = allAnalytics.reduce((sum, a) => sum + a.totalExecutions, 0);
    const totalSuccessful = allAnalytics.reduce((sum, a) => sum + a.successfulExecutions, 0);
    const weightedExecutionTime = allAnalytics.reduce((sum, a) => sum + (a.avgExecutionTime * a.totalExecutions), 0);
    
    return {
      totalExecutions,
      totalAgents: allAnalytics.length,
      overallSuccessRate: totalExecutions > 0 ? totalSuccessful / totalExecutions : 0,
      avgExecutionTime: totalExecutions > 0 ? weightedExecutionTime / totalExecutions : 0,
      activeAgents: allAnalytics.filter(a => a.totalExecutions > 0).length,
    };
  }
}

export const sspService = new SSPService();