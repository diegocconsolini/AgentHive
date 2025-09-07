import { useState, useEffect, useCallback } from 'react';
import { sspService, SSPAnalytics, SSPPattern, SSPPredictionRequest, SSPPrediction } from '../services/sspService';

export interface UseSSPPatternsResult {
  patterns: SSPPattern[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseSSPAnalyticsResult {
  analytics: SSPAnalytics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseSSPSystemOverviewResult {
  overview: {
    totalExecutions: number;
    totalAgents: number;
    overallSuccessRate: number;
    avgExecutionTime: number;
    activeAgents: number;
  } | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseSSPAllAnalyticsResult {
  allAnalytics: SSPAnalytics[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSSPPatterns(agentId: string, autoRefresh = true): UseSSPPatternsResult {
  const [patterns, setPatterns] = useState<SSPPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = useCallback(async () => {
    if (!agentId) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await sspService.getPatterns(agentId);
      setPatterns(result.patterns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patterns');
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  useEffect(() => {
    if (!autoRefresh || !agentId) return;

    const interval = setInterval(fetchPatterns, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchPatterns, autoRefresh, agentId]);

  return { patterns, loading, error, refetch: fetchPatterns };
}

export function useSSPAnalytics(agentId: string, autoRefresh = true): UseSSPAnalyticsResult {
  const [analytics, setAnalytics] = useState<SSPAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!agentId) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await sspService.getAnalytics(agentId);
      setAnalytics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!autoRefresh || !agentId) return;

    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAnalytics, autoRefresh, agentId]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

export function useSSPSystemOverview(autoRefresh = true): UseSSPSystemOverviewResult {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await sspService.getSystemOverview();
      setOverview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system overview');
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchOverview, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchOverview, autoRefresh]);

  return { overview, loading, error, refetch: fetchOverview };
}

export function useSSPAllAnalytics(autoRefresh = true): UseSSPAllAnalyticsResult {
  const [allAnalytics, setAllAnalytics] = useState<SSPAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await sspService.getAllAgentAnalytics();
      setAllAnalytics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch all analytics');
      setAllAnalytics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAllAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAllAnalytics, autoRefresh]);

  return { allAnalytics, loading, error, refetch: fetchAllAnalytics };
}

export function useSSPPrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predict = useCallback(async (request: SSPPredictionRequest): Promise<SSPPrediction | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await sspService.predictSuccess(request);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to predict success');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { predict, loading, error };
}